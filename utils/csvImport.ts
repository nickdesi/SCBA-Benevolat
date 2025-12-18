/**
 * CSV Import Utility for FFBB match schedules
 * 
 * Expected CSV format (copy-paste from FFBB website):
 * - Standard: Date;Heure;Domicile;Visiteur;Salle
 * - Block: Multi-line text copy from FFBB "A Venir" table
 * 
 * Example Block:
 * #123
 * J14
 * 14 janv. 20:00
 * Domicile (or explicit location address)
 * (empty)
 * Adversaire
 */

import type { GameFormData } from '../types';

export interface ParsedMatch {
    date: string;           // Display format: "Samedi 14 Décembre 2024"
    dateISO: string;        // ISO format: "2024-12-14"
    time: string;           // "15H00"
    team: string;           // "U11 - Équipe 1"
    opponent: string;       // "Royat"
    location: string;       // "Maison des Sports" or "Extérieur (Ville)"
    isHome: boolean;        // true if SCBA is home team
    candidates?: string[];  // List of potential addresses found
}

interface ImportResult {
    success: ParsedMatch[];
    errors: { line: number; content: string; error: string }[];
}

// French weekday names
const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// French month names
const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

/**
 * Normalize team name from FFBB format to SCBA format
 * Example: "SCBA U11-1" -> "U11 M1", "STADE CLERMONT SM2" -> "SENIOR M2"
 */
const normalizeTeamName = (team: string): string => {
    const upperTeam = team.toUpperCase();

    // Senior teams
    if (upperTeam.includes('SENIOR') || upperTeam.includes('SM')) {
        const numMatch = upperTeam.match(/(\d)/);
        const num = numMatch ? numMatch[1] : '1';
        return `SENIOR M${num}`;
    }

    // Youth categories (U9, U11, U13, U15, U18)
    const categoryMatch = upperTeam.match(/U(\d+)[-\s]?M?(\d)?/i);
    if (categoryMatch) {
        const category = categoryMatch[1];
        const number = categoryMatch[2] || '1';
        return `U${category} M${number}`;
    }

    // Remove SCBA prefix if present and return cleaned name
    return team.replace(/SCBA|STADE CLERMONT/gi, '').trim();
};

/**
 * Extract likely City name from Opponent team name
 * Used to provide better "Extérieur" location context
 * Example: "RIORGES BC" -> "RIORGES"
 */
const inferCityFromTeam = (opponent: string): string => {
    // 0. Specific mappings for known complex cases
    const MAPPINGS: Record<string, string> = {
        'TAIN TOURNON': 'Tain-l\'Hermitage', // or Tournon-sur-Rhône, but search usually works better with Tain
        'GOLFE JUAN': 'Vallauris', // Golfe-Juan is a locality in Vallauris 
        'LYON SO': 'Lyon', // Lyon Sud Ouest
        'ROCHE VENDÉE': 'La Roche-sur-Yon',
    };

    // Check exact or partial matches in mappings
    const upperOpp = opponent.toUpperCase();
    for (const [key, value] of Object.entries(MAPPINGS)) {
        if (upperOpp.includes(key)) return value;
    }

    // 1. Remove common prefixes
    let cleanName = opponent.replace(/^(IE\s*[-]?\s*|CTC\s*[-]?\s*|ENTENTE\s*[-]?\s*|UNION\s*[-]?\s*)/i, '');

    // 2. Remove common suffixes/words
    const noiseWords = [
        'BASKET', 'BC', 'CLUB', 'CS', 'US', 'AL', 'AS', 'ES', 'BB',
        'SPORT', 'SPORTS', 'ASSOCIATION', 'AMICALE', 'UMS', 'U.M.S',
        'LOIRE', 'SUD', 'NORD', 'EST', 'OUEST',
        'AG' // Avant-Garde (often in Tain Tournon AG)
    ];

    cleanName = cleanName.replace(new RegExp(`\\b(${noiseWords.join('|')})\\b`, 'gi'), '');

    // 3. Remove trailing numbers/characters
    cleanName = cleanName.replace(/[-]?\s*\d+$/, '');

    // 4. Handle hyphenated names logic
    // If name contains hyphen but no spaces around, keep it (Saint-Etienne)
    // If name contains hyphen with spaces, replace with space (Saint - Etienne -> Saint Etienne)
    cleanName = cleanName.replace(/\s+-\s+/g, ' ');

    cleanName = cleanName.replace(/\s+/g, ' ').trim();

    // 5. Filter garbage
    const parts = cleanName.split(' ').filter(p => p.length > 2 || ['le', 'la', 'les', 'du', 'de', 'sur'].includes(p.toLowerCase()));

    return parts
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Parse a date string to display and ISO formats
 * Supports: 
 * - DD/MM/YYYY
 * - DD MMM (e.g. "13 sept.") -> infers year based on current season (Sep-Dec = current year, Jan-Jul = next year)
 */
const parseDate = (dateStr: string): { display: string; iso: string } | null => {
    // Try DD/MM/YYYY
    const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
        const day = parseInt(slashMatch[1], 10);
        const month = parseInt(slashMatch[2], 10) - 1; // 0-indexed
        const year = parseInt(slashMatch[3], 10);

        const date = new Date(year, month, day);
        const weekday = WEEKDAYS[date.getDay()];
        const monthName = MONTHS[month];

        return {
            display: `${weekday} ${day} ${monthName} ${year}`,
            iso: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        };
    }

    // Try text format (Web copy paste): "13 sept." or "13 sept"
    const textMatch = dateStr.toLowerCase().match(/(\d{1,2})\s+([a-zéû]+)/);
    if (textMatch) {
        const day = parseInt(textMatch[1], 10);
        const monthStr = textMatch[2].replace('.', ''); // remove dot if present

        // Find month index
        const monthIndex = MONTHS.findIndex(m => m.toLowerCase().startsWith(monthStr));
        if (monthIndex === -1) return null;

        // Infer year logic:
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const seasonStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;

        const targetYear = (monthIndex >= 7) ? seasonStartYear : seasonStartYear + 1;

        // Construct date
        const date = new Date(targetYear, monthIndex, day);
        const weekday = WEEKDAYS[date.getDay()];
        const monthName = MONTHS[monthIndex];

        return {
            display: `${weekday} ${day} ${monthName} ${targetYear}`,
            iso: `${targetYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        };
    }

    return null;
};

/**
 * Parse time string to display format
 * "15:00" -> "15H00"
 */
const parseTime = (timeStr: string): string => {
    return timeStr.replace(':', 'H');
};

/**
 * Detect if a team name belongs to SCBA
 */
const isSCBATeam = (team: string): boolean => {
    const scbaPatterns = ['SCBA', 'STADE CLERMONT', 'SC BASKET AUVERGNE'];
    return scbaPatterns.some(pattern => team.toUpperCase().includes(pattern));
};

/**
 * Parse CSV content to match data
 * Supports:
 * - Standard CSV (semicolon/comma separated)
 * - Tab-separated (Web copy paste)
 * - Multi-line Block Format (FFBB "A Venir" table copy)
 */
export const parseCSV = (csvContent: string, defaultTeam: string = 'SENIOR M1'): ImportResult => {
    const lines = csvContent.trim().split('\n').map(l => l.trim()).filter(l => l);
    const result: ImportResult = { success: [], errors: [] };

    // Detect format type
    // If lines look like blocks (contain "#123", "J12", then date, then "Domicile"...)
    const isBlockFormat = lines.some(l => l.startsWith('#') || l.match(/^J\d+/));

    if (isBlockFormat) {
        let currentMatch: Partial<ParsedMatch> = {};

        // We iterate line by line and build match objects
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 1. Skip match ID (#123) and Day (J13)
            if (line.startsWith('#') || line.match(/^J\d+$/)) continue;

            // 2. Try to find Date "10 janv. 20h00"
            const dateMatch = line.match(/(\d{1,2}\s+[a-zéû]+\.?)\s+(\d{1,2}[h:]\d{2})/i);
            if (dateMatch) {
                // Start a new match
                currentMatch = {};

                const dateStr = dateMatch[1];
                const timeStr = dateMatch[2];
                const parsedDate = parseDate(dateStr);

                if (parsedDate) {
                    currentMatch.date = parsedDate.display;
                    currentMatch.dateISO = parsedDate.iso;
                    currentMatch.time = parseTime(timeStr);
                    continue;
                }
            }

            // 3. Try to find Location (Domicile/Extérieur OR Explicit Address)
            if (line.toLowerCase() === 'domicile') {
                currentMatch.isHome = true;
                currentMatch.team = normalizeTeamName(defaultTeam);
                // Specific rule for SENIOR M1: Gymnase Fleury
                currentMatch.location = currentMatch.team === 'SENIOR M1' ? 'Gymnase Fleury' : 'Maison des Sports';
                continue;
            } else if (line.toLowerCase() === 'extérieur' || line.toLowerCase() === 'exterieur') {
                currentMatch.isHome = false;
                currentMatch.team = normalizeTeamName(defaultTeam);
                currentMatch.location = 'Extérieur';
                continue;
            } else if (line.match(/(gymnase|salle|complexe|stade|palais|centre sportif)/i) || line.match(/\d{5}/)) {
                // Explicit address detection (Gym type + zipcode usually)
                currentMatch.location = line;
                // If we found a specific address, we assume it's settled (could be home or away, but usually away if copying detail)
                continue;
            }

            // 4. Try to find Opponent (Anything else that's not a score or empty or explicit keywords)
            if (currentMatch.date && typeof currentMatch.isHome !== 'undefined' && !currentMatch.opponent) {
                // Ignore scores "0" or "-"
                if (line === '0' || line === '-') continue;

                // If line is not a number and not "Lieu", it's the opponent
                if (!line.match(/^\d+$/) && !line.match(/^Lieu$/i)) {
                    currentMatch.opponent = line;

                    // Enhancement: Infer location city from opponent name if location is generic "Extérieur"
                    if (!currentMatch.isHome && currentMatch.location === 'Extérieur') {
                        const city = inferCityFromTeam(line);
                        if (city.length > 2) { // Avoid garbage
                            currentMatch.location = `Extérieur (${city})`;
                        }
                    }

                    // Match is complete!
                    result.success.push(currentMatch as ParsedMatch);
                    currentMatch = {}; // Reset
                }
            }
        }

        return result;
    }

    // fallback to Line-by-Line CSV/TSV parser
    const headerLine = lines[0]?.toLowerCase();
    const startIndex = (headerLine.includes('date') || headerLine.includes('rencontre')) ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];

        try {
            let separator = ';';
            if (line.includes('\t')) separator = '\t';
            else if (line.includes(',')) separator = ',';

            const parts = line.split(separator).map(p => p.trim()).filter(p => p !== '');

            let dateStr = '', timeStr = '', homeTeam = '', awayTeam = '', location = '';

            // Find explicit date format
            const dateIdx = parts.findIndex(p => p.match(/\d{2}\/\d{2}/) || p.match(/\d{1,2}\s+[a-zéû]+/i));

            if (dateIdx !== -1 && parts.length >= dateIdx + 2) {
                dateStr = parts[dateIdx];
                if (parts[dateIdx].match(/\d{2}:\d{2}/)) {
                    timeStr = parts[dateIdx].split(' ')[1] || '00:00';
                } else {
                    timeStr = parts[dateIdx + 1];
                }

                if (parts.length >= dateIdx + 4) {
                    homeTeam = parts[dateIdx + 2];
                    awayTeam = parts[dateIdx + 3];
                    location = parts[dateIdx + 4] || '';
                } else {
                    continue;
                }
            } else {
                if (line.length > 5)
                    result.errors.push({ line: i + 1, content: line, error: "Date introuvable" });
                continue;
            }

            const parsedDate = parseDate(dateStr);
            if (!parsedDate) continue;

            const isHome = isSCBATeam(homeTeam);
            let finalTeam = isHome ? homeTeam : awayTeam;
            let finalOpponent = isHome ? awayTeam : homeTeam;
            let finalIsHome = isHome;

            // Fallback for detection
            if (!isSCBATeam(homeTeam) && !isSCBATeam(awayTeam)) {
                if (location.toLowerCase().includes('maison des sports') || location.toLowerCase().includes('clermont') || location.toLowerCase().includes('fleury')) {
                    finalIsHome = true;
                    finalTeam = defaultTeam;
                    finalOpponent = awayTeam;
                } else {
                    const teamParts = defaultTeam.split(' ');
                    const homeMatches = teamParts.some(p => homeTeam.toUpperCase().includes(p));
                    const awayMatches = teamParts.some(p => awayTeam.toUpperCase().includes(p));

                    if (homeMatches && !awayMatches) {
                        finalIsHome = true;
                        finalTeam = defaultTeam;
                        finalOpponent = awayTeam;
                    } else if (!homeMatches && awayMatches) {
                        finalIsHome = false;
                        finalTeam = defaultTeam;
                        finalOpponent = homeTeam;
                    } else {
                        result.errors.push({ line: i + 1, content: line, error: "Impossible de déterminer Domicile/Extérieur (SCBA non détecté)" });
                        continue;
                    }
                }
            }

            const normalizedTeam = normalizeTeamName(finalTeam);
            let finalLocation = location;

            // Location Logic
            if (finalIsHome) {
                // If location is missing or generic "Domicile", set default
                if (!finalLocation || finalLocation.toLowerCase() === 'domicile') {
                    finalLocation = normalizedTeam === 'SENIOR M1' ? 'Gymnase Fleury' : 'Maison des Sports';
                }
            } else {
                // If location is missing or generic "Extérieur", try to infer from Opponent
                if (!finalLocation || finalLocation.toLowerCase() === 'extérieur' || finalLocation.toLowerCase() === 'exterieur') {
                    const city = inferCityFromTeam(finalOpponent);
                    finalLocation = city.length > 2 ? `Extérieur (${city})` : 'Extérieur';
                }
            }

            result.success.push({
                date: parsedDate.display,
                dateISO: parsedDate.iso,
                time: parseTime(timeStr),
                team: normalizedTeam,
                opponent: finalOpponent,
                location: finalLocation,
                isHome: finalIsHome
            });

        } catch (err) {
            result.errors.push({
                line: i + 1,
                content: line,
                error: `Erreur: ${err}`
            });
        }
    }

    return result;
};

/**
 * Convert parsed matches to GameFormData for saving
 */
export const toGameFormData = (match: ParsedMatch): GameFormData => ({
    team: match.team,
    opponent: match.opponent,
    date: match.date,
    dateISO: match.dateISO,
    time: match.time,
    location: match.location,
    isHome: match.isHome
});

/**
 * Generate a sample CSV for testing
 */
export const getSampleCSV = (): string => {
    return `Date;Heure;Domicile;Visiteur;Salle
14/12/2024;15:00;SCBA U11 M1;ROYAT BC;Maison des Sports
14/12/2024;17:00;SCBA U13 M1;ASM BASKET;Gymnase Thévenet
21/12/2024;10:30;PONT DU CHATEAU;SCBA U11 M2;Gymnase PDC
21/12/2024;14:00;SCBA SENIOR M2;LEMPDES;Maison des Sports
21/12/2024;20:30;VEAUCHE;SCBA SENIOR M1;Gymnase Veauche`;
};
