/**
 * FFBB Scraper - Fetches match data from FFBB competition pages
 * Uses a CORS proxy to bypass browser same-origin policy
 */

import type { ParsedMatch } from './csvImport';

const CORS_PROXY = 'https://corsproxy.io/?';

/**
 * Fetch a page through CORS proxy
 */
async function fetchWithProxy(url: string): Promise<string> {
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
    }
    return response.text();
}

/**
 * Parse match links from team page HTML
 */
function extractMatchLinks(html: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links: string[] = [];

    doc.querySelectorAll('a[href*="/match/"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('/match/')) {
            const fullUrl = href.startsWith('http') ? href : `https://competitions.ffbb.com${href}`;
            if (!links.includes(fullUrl)) {
                links.push(fullUrl);
            }
        }
    });

    return links;
}

/**
 * Month name to number mapping (French)
 */
const MONTHS: Record<string, number> = {
    'janvier': 1, 'janv': 1, 'jan': 1,
    'février': 2, 'fevrier': 2, 'févr': 2, 'fevr': 2, 'fév': 2, 'fev': 2,
    'mars': 3, 'mar': 3,
    'avril': 4, 'avr': 4,
    'mai': 5,
    'juin': 6, 'jun': 6,
    'juillet': 7, 'juil': 7, 'jul': 7,
    'août': 8, 'aout': 8, 'aoû': 8,
    'septembre': 9, 'sept': 9, 'sep': 9,
    'octobre': 10, 'oct': 10,
    'novembre': 11, 'nov': 11,
    'décembre': 12, 'decembre': 12, 'déc': 12, 'dec': 12
};

/**
 * Infer year from month - if month is before current month, it's next year
 */
function inferYear(month: number): number {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // If the match month is before current month (e.g., January when we're in December),
    // the match is likely next year
    if (month < currentMonth - 1) {
        return currentYear + 1;
    }
    return currentYear;
}

/**
 * Parse a date string like "17 janv. 20h00" or "Samedi 10 janvier 2025 20:00"
 */
function parseFrenchDate(text: string): { dateISO: string; time: string; displayDate: string } | null {
    // Clean the text
    const cleanText = text.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();

    // Try patterns
    // Pattern 1: "17 janv 20h00" (no year)
    // Pattern 2: "samedi 17 janvier 2025 20h00" (with year)
    // Pattern 3: "10/01/2025 20:00"

    let day = 0, monthNum = 0, year = 0, hour = 20, minute = 0;

    // Try to extract date from text
    const patterns = [
        // "17 janv 20h00" or "17 janvier 20h00"
        /(\d{1,2})\s*(janvier|janv|jan|février|fevrier|févr|fevr|fév|fev|mars|mar|avril|avr|mai|juin|jun|juillet|juil|jul|août|aout|aoû|septembre|sept|sep|octobre|oct|novembre|nov|décembre|decembre|déc|dec)\s*(?:(\d{4})\s*)?(\d{1,2})h(\d{2})/i,
        // "samedi 17 janvier 2025 20h00"
        /(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s*(\d{1,2})\s*(janvier|janv|jan|février|fevrier|févr|fevr|fév|fev|mars|mar|avril|avr|mai|juin|jun|juillet|juil|jul|août|aout|aoû|septembre|sept|sep|octobre|oct|novembre|nov|décembre|decembre|déc|dec)\s*(?:(\d{4})\s*)?(\d{1,2})h(\d{2})/i
    ];

    for (const pattern of patterns) {
        const match = cleanText.match(pattern);
        if (match) {
            day = parseInt(match[1]);
            const monthStr = match[2].replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a').replace(/[ûù]/g, 'u');
            monthNum = MONTHS[monthStr] || 0;
            year = match[3] ? parseInt(match[3]) : inferYear(monthNum);
            hour = parseInt(match[4]);
            minute = parseInt(match[5]);
            break;
        }
    }

    if (day === 0 || monthNum === 0) {
        return null;
    }

    const dateISO = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const time = `${String(hour).padStart(2, '0')}H${String(minute).padStart(2, '0')}`;

    // Format display date
    const dateObj = new Date(year, monthNum - 1, day);
    const dayOfWeek = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
    const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'long' });
    const displayDate = `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)} ${day} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

    return { dateISO, time, displayDate };
}

/**
 * Fetch and parse a single match detail page
 */
async function fetchMatchDetails(matchUrl: string): Promise<Partial<ParsedMatch> | null> {
    try {
        const html = await fetchWithProxy(matchUrl);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const textContent = doc.body?.textContent || '';

        const result: Partial<ParsedMatch> = {};

        // 1. Parse date and time from full text
        const dateInfo = parseFrenchDate(textContent);
        if (dateInfo) {
            result.dateISO = dateInfo.dateISO;
            result.time = dateInfo.time;
            result.date = dateInfo.displayDate;
        }

        // 2. Parse teams from title (usually in h1 or major heading)
        // Look for pattern like "TEAM A - TEAM B" in the page
        const titlePatterns = [
            /STADE CLERMONTOIS[^-]*-\s*([^\n]+)/i,
            /([^\n-]+)\s*-\s*STADE CLERMONTOIS/i,
            /SCBA[^-]*-\s*([^\n]+)/i,
            /([^\n-]+)\s*-\s*SCBA/i
        ];

        for (const pattern of titlePatterns) {
            const match = textContent.match(pattern);
            if (match) {
                const opponent = match[1].trim()
                    .replace(/\s*\d+\s*-\s*\d+\s*$/, '') // Remove score
                    .replace(/\s+/g, ' ')
                    .trim();

                if (opponent.length > 2 && opponent.length < 50) {
                    result.opponent = opponent;
                    // Determine home/away based on which team comes first
                    result.isHome = pattern.source.startsWith('STADE') || pattern.source.startsWith('SCBA');
                    break;
                }
            }
        }

        // 3. Parse venue from "Salle" section
        // The page has "Nom:" and "Adresse:" labels
        const nomMatch = textContent.match(/Nom\s*[:\s]+([^\n]+)/i);
        const adresseMatch = textContent.match(/Adresse\s*[:\s]+([^\n]+)/i);

        if (nomMatch && adresseMatch) {
            const venueName = nomMatch[1].trim().replace(/\s+/g, ' ');
            const venueAddress = adresseMatch[1].trim().replace(/\s+/g, ' ');
            result.location = `${venueName}, ${venueAddress}`;
        } else if (nomMatch) {
            result.location = nomMatch[1].trim();
        }

        // If we still don't have home/away, check for "Domicile" keyword
        if (typeof result.isHome === 'undefined') {
            if (textContent.includes('Domicile')) {
                result.isHome = true;
            } else if (textContent.includes('Extérieur')) {
                result.isHome = false;
            }
        }

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
        const teamHtml = await fetchWithProxy(teamUrl);

        // Step 2: Extract match links
        const matchLinks = extractMatchLinks(teamHtml);

        if (matchLinks.length === 0) {
            result.errors.push('Aucun match trouvé sur cette page');
            return result;
        }

        // Step 3: Fetch each match detail
        let successCount = 0;
        for (let i = 0; i < matchLinks.length; i++) {
            onProgress?.(i + 1, matchLinks.length);

            const matchData = await fetchMatchDetails(matchLinks[i]);

            // Require at least date to consider it valid
            if (matchData && matchData.date) {
                successCount++;
                result.success.push({
                    date: matchData.date,
                    dateISO: matchData.dateISO || '',
                    time: matchData.time || '20H00',
                    team: defaultTeam,
                    opponent: matchData.opponent || 'Adversaire inconnu',
                    location: matchData.location || (matchData.isHome ? 'Domicile' : 'Extérieur'),
                    isHome: matchData.isHome ?? false
                });
            }

            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 400));
        }

        if (successCount === 0) {
            result.errors.push(`0 matchs parsés sur ${matchLinks.length} liens trouvés. Le format de page a peut-être changé.`);
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
