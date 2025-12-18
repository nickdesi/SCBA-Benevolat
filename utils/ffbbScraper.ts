/**
 * FFBB Scraper - Fetches match data from FFBB competition pages
 * Uses a CORS proxy to bypass browser same-origin policy
 * 
 * Note: FFBB site is a Next.js app with server-side rendering.
 * We parse the embedded JSON data from script tags.
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

    if (month < currentMonth - 1) {
        return currentYear + 1;
    }
    return currentYear;
}

/**
 * Get visible text from HTML, excluding script content
 */
function getVisibleText(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove all script and style elements
    doc.querySelectorAll('script, style, noscript').forEach(el => el.remove());

    // Get text content from body
    return doc.body?.textContent?.replace(/\s+/g, ' ') || '';
}

/**
 * Extract match info from embedded JSON in page (Next.js RSC format)
 */
function extractFromNextJsData(html: string): {
    opponent?: string;
    isHome?: boolean;
    venue?: string;
    date?: string;
    time?: string;
} | null {
    try {
        // Look for match title in meta description
        const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
        if (metaMatch) {
            const description = metaMatch[1];
            // Format: "13 sept. 2025 20h00 - Nationale Masculine 3 : Team A - Team B : horaires..."
            const parts = description.match(/(\d{1,2}\s+\w+\.?\s*\d{4})\s+(\d{1,2}h\d{2})\s*-\s*[^:]+:\s*(.+?)\s*:\s*horaires/i);
            if (parts) {
                return {
                    date: parts[1],
                    time: parts[2].replace(':', 'H'),
                };
            }
        }

        // Look for salle/venue info
        const salleMatch = html.match(/"type":"salle"[^}]*"informations":\[([^\]]+)\]/i);
        if (salleMatch) {
            const infoStr = salleMatch[1];
            const nameMatch = infoStr.match(/"label":"Nom"[^}]*"value":"([^"]+)"/);
            const addrMatch = infoStr.match(/"label":"Adresse"[^}]*"value":"([^"]+)"/);
            if (nameMatch || addrMatch) {
                return {
                    venue: [nameMatch?.[1], addrMatch?.[1]].filter(Boolean).join(', ')
                };
            }
        }
    } catch (e) {
        console.error('Failed to parse Next.js data:', e);
    }
    return null;
}

/**
 * Fetch and parse a single match detail page
 */
async function fetchMatchDetails(matchUrl: string): Promise<Partial<ParsedMatch> | null> {
    try {
        const html = await fetchWithProxy(matchUrl);
        const result: Partial<ParsedMatch> = {};

        // Get clean visible text (no scripts)
        const visibleText = getVisibleText(html);

        // Try to extract from Next.js embedded data first
        const nextData = extractFromNextJsData(html);
        if (nextData?.venue) {
            result.location = nextData.venue;
        }

        // 1. Parse date/time from meta og:description or visible text
        // Look for date pattern like "13 sept. 2025 20h00" or "Samedi 13 septembre 2025"
        const datePatterns = [
            /(\d{1,2})\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|janv\.?|févr\.?|mars|avr\.?|mai|juin|juil\.?|août|sept\.?|oct\.?|nov\.?|déc\.?)\s*(\d{4})?\s*(?:à\s*)?(\d{1,2})h(\d{2})/gi
        ];

        for (const pattern of datePatterns) {
            const match = visibleText.match(pattern);
            if (match) {
                // Parse the first match
                const fullMatch = match[0];
                const parts = fullMatch.match(/(\d{1,2})\s*(\w+)\.?\s*(\d{4})?\s*(?:à\s*)?(\d{1,2})h(\d{2})/i);
                if (parts) {
                    const day = parseInt(parts[1]);
                    const monthStr = parts[2].toLowerCase().replace('.', '');
                    const monthNum = MONTHS[monthStr] || 1;
                    const year = parts[3] ? parseInt(parts[3]) : inferYear(monthNum);
                    const hour = parseInt(parts[4]);
                    const minute = parseInt(parts[5]);

                    result.dateISO = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    result.time = `${String(hour).padStart(2, '0')}H${String(minute).padStart(2, '0')}`;

                    // Format display date
                    const dateObj = new Date(year, monthNum - 1, day);
                    const dayOfWeek = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
                    const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'long' });
                    result.date = `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)} ${day} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
                    break;
                }
            }
        }

        // 2. Parse teams from page title (in og:title or regular title)
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i) ||
            html.match(/og:title[^>]*content="([^"]+)"/i);
        if (titleMatch) {
            const title = titleMatch[1];
            // Format: "Match - NM3 : Team A - Team B | FFBB"
            const teamsMatch = title.match(/:\s*(.+?)\s*-\s*(.+?)\s*\|/i) ||
                title.match(/:\s*(.+?)\s*-\s*(.+?)$/i);
            if (teamsMatch) {
                const team1 = teamsMatch[1].trim();
                const team2 = teamsMatch[2].trim();

                // Check which is our team
                if (team1.match(/stade clermontois|scba/i)) {
                    result.isHome = true;
                    result.opponent = team2.replace(/\s*\|\s*FFBB$/i, '').trim();
                } else if (team2.match(/stade clermontois|scba/i)) {
                    result.isHome = false;
                    result.opponent = team1.trim();
                }
            }
        }

        // 3. Parse venue from embedded JSON (salle section)
        if (!result.location) {
            const salleMatch = html.match(/"label":"Nom","value":"([^"]+)"/);
            const addrMatch = html.match(/"label":"Adresse","value":"([^"]+)"/);
            if (salleMatch || addrMatch) {
                result.location = [salleMatch?.[1], addrMatch?.[1]].filter(Boolean).join(', ');
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
        for (let i = 0; i < matchLinks.length; i++) {
            onProgress?.(i + 1, matchLinks.length);

            const matchData = await fetchMatchDetails(matchLinks[i]);

            // Require at least date to consider it valid
            if (matchData && matchData.date) {
                result.success.push({
                    date: matchData.date,
                    dateISO: matchData.dateISO || '',
                    time: matchData.time || '20H00',
                    team: defaultTeam,
                    opponent: matchData.opponent || 'Adversaire',
                    location: matchData.location || (matchData.isHome ? 'Domicile' : 'Extérieur'),
                    isHome: matchData.isHome ?? false
                });
            }

            // Delay between requests
            await new Promise(r => setTimeout(r, 400));
        }

        if (result.success.length === 0) {
            result.errors.push(`0 matchs parsés sur ${matchLinks.length} liens. Essayez le mode copier-coller.`);
        }

    } catch (err) {
        result.errors.push(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }

    return result;
}

/**
 * Validate if a URL is a valid FFBB URL
 */
export function isValidFFBBUrl(url: string): boolean {
    return url.includes('competitions.ffbb.com') || url.includes('ffbb.com/competitions');
}
