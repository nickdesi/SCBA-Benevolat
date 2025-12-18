/**
 * FFBB Scraper - Fetches match data from FFBB competition pages
 * Uses a CORS proxy to bypass browser same-origin policy
 */

import type { ParsedMatch } from './csvImport';

const CORS_PROXY = 'https://corsproxy.io/?';

/**
 * Extract match links from a team's competition page
 */
async function fetchTeamPage(teamUrl: string): Promise<string> {
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(teamUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch team page: ${response.status}`);
    }
    return response.text();
}

/**
 * Parse match links from team page HTML
 * Returns array of match detail URLs
 */
function extractMatchLinks(html: string, baseUrl: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const links: string[] = [];

    // Find all "VS" links that go to match pages
    // Pattern: /competitions/{competition}/match/{matchId}
    const allLinks = doc.querySelectorAll('a[href*="/match/"]');

    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('/match/')) {
            // Convert relative URL to absolute
            const fullUrl = href.startsWith('http') ? href : `https://competitions.ffbb.com${href}`;
            if (!links.includes(fullUrl)) {
                links.push(fullUrl);
            }
        }
    });

    return links;
}

/**
 * Fetch and parse a single match detail page
 */
async function fetchMatchDetails(matchUrl: string): Promise<Partial<ParsedMatch> | null> {
    try {
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(matchUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) return null;

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract match info from the page
        // The page structure may vary, we need to find:
        // - Date and time
        // - Home team / Away team
        // - Venue (Salle section)

        const result: Partial<ParsedMatch> = {};

        // Find date/time - usually in a prominent header or info section
        const dateElements = doc.querySelectorAll('[class*="date"], [class*="Date"], time');
        const textContent = doc.body?.textContent || '';

        // Try to find date pattern like "17 janv. 20h00" or "Samedi 17 janvier 2025 20:00"
        const dateMatch = textContent.match(/(\d{1,2})\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|janv\.?|févr\.?|mars|avr\.?|mai|juin|juil\.?|août|sept\.?|oct\.?|nov\.?|déc\.?)\s*(\d{4})?\s*[àa]?\s*(\d{1,2})[h:](\d{2})/i);

        if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            const monthStr = dateMatch[2].toLowerCase();
            const year = dateMatch[3] || new Date().getFullYear().toString();
            const hour = dateMatch[4].padStart(2, '0');
            const minute = dateMatch[5];

            // Month mapping
            const months: Record<string, string> = {
                'janvier': '01', 'janv': '01', 'janv.': '01',
                'février': '02', 'févr': '02', 'févr.': '02',
                'mars': '03',
                'avril': '04', 'avr': '04', 'avr.': '04',
                'mai': '05',
                'juin': '06',
                'juillet': '07', 'juil': '07', 'juil.': '07',
                'août': '08',
                'septembre': '09', 'sept': '09', 'sept.': '09',
                'octobre': '10', 'oct': '10', 'oct.': '10',
                'novembre': '11', 'nov': '11', 'nov.': '11',
                'décembre': '12', 'déc': '12', 'déc.': '12'
            };

            const month = months[monthStr.replace('.', '')] || '01';
            result.dateISO = `${year}-${month}-${day}`;
            result.time = `${hour}H${minute}`;

            // Format display date
            const dayOfWeek = new Date(`${year}-${month}-${day}`).toLocaleDateString('fr-FR', { weekday: 'long' });
            const monthFull = new Date(`${year}-${month}-${day}`).toLocaleDateString('fr-FR', { month: 'long' });
            result.date = `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)} ${parseInt(day)} ${monthFull.charAt(0).toUpperCase() + monthFull.slice(1)} ${year}`;
        }

        // Find teams - look for team names in the page
        // Usually structured as "Team A vs Team B" or separate elements
        const h1 = doc.querySelector('h1, [class*="title"], [class*="Title"]');
        if (h1) {
            const titleText = h1.textContent || '';
            // Try to parse "TEAM A - TEAM B" or "TEAM A vs TEAM B"
            const teamsMatch = titleText.match(/(.+?)\s*[-–]\s*(.+)/);
            if (teamsMatch) {
                const team1 = teamsMatch[1].trim();
                const team2 = teamsMatch[2].trim();

                // Determine which is our team (contains "CLERMONT" or "STADE")
                if (team1.match(/clermont|stade/i)) {
                    result.isHome = true;
                    result.opponent = team2;
                } else if (team2.match(/clermont|stade/i)) {
                    result.isHome = false;
                    result.opponent = team1;
                }
            }
        }

        // Find venue (Salle section)
        // Look for "Salle" label followed by name and address
        const salleSection = textContent.match(/Salle[\s\S]*?Nom[:\s]*([^\n]+)[\s\S]*?Adresse[:\s]*([^\n]+)/i);
        if (salleSection) {
            const venueName = salleSection[1].trim();
            const venueAddress = salleSection[2].trim();
            result.location = `${venueName}, ${venueAddress}`;
        } else {
            // Fallback: Try to find any address-like pattern
            const addressMatch = textContent.match(/(\d+[,\s]+[\w\s]+,?\s*\d{5}\s+[\w\s-]+)/);
            if (addressMatch) {
                result.location = addressMatch[1].trim();
            }
        }

        // Set default team name
        result.team = 'SENIOR M1'; // Will be overridden by team selection

        return result;

    } catch (err) {
        console.error(`Failed to fetch match details from ${matchUrl}:`, err);
        return null;
    }
}

/**
 * Main function: Parse all matches from a FFBB team competition page
 */
export async function parseFFBBTeamPage(
    teamUrl: string,
    defaultTeam: string = 'SENIOR M1',
    onProgress?: (current: number, total: number) => void
): Promise<{ success: ParsedMatch[]; errors: string[] }> {
    const result = {
        success: [] as ParsedMatch[],
        errors: [] as string[]
    };

    try {
        // Step 1: Fetch team page
        const teamHtml = await fetchTeamPage(teamUrl);

        // Step 2: Extract match links
        const matchLinks = extractMatchLinks(teamHtml, teamUrl);

        if (matchLinks.length === 0) {
            result.errors.push('Aucun match trouvé sur cette page');
            return result;
        }

        // Step 3: Fetch each match detail (with progress callback)
        for (let i = 0; i < matchLinks.length; i++) {
            onProgress?.(i + 1, matchLinks.length);

            const matchData = await fetchMatchDetails(matchLinks[i]);

            if (matchData && matchData.date && matchData.opponent) {
                result.success.push({
                    date: matchData.date || '',
                    dateISO: matchData.dateISO || '',
                    time: matchData.time || '20H00',
                    team: defaultTeam,
                    opponent: matchData.opponent || 'Adversaire',
                    location: matchData.location || (matchData.isHome ? 'Maison des Sports' : 'Extérieur'),
                    isHome: matchData.isHome ?? false
                });
            }

            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 500));
        }

    } catch (err) {
        result.errors.push(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }

    return result;
}

/**
 * Validate if a URL is a valid FFBB competition URL
 */
export function isValidFFBBUrl(url: string): boolean {
    return url.includes('competitions.ffbb.com') || url.includes('ffbb.com/competitions');
}
