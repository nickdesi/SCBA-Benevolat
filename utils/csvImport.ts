/**
 * CSV Import Utility for FFBB match schedules
 * 
 * Expected CSV format (copy-paste from FFBB website):
 * Date;Heure;Domicile;Visiteur;Salle
 * 
 * Example:
 * 14/12/2024;15:00;SCBA U11-1;ROYAT;Maison des Sports
 */

import type { GameFormData } from '../types';
import { DEFAULT_ROLES } from '../constants';

export interface ParsedMatch {
    date: string;           // Display format: "Samedi 14 Décembre 2024"
    dateISO: string;        // ISO format: "2024-12-14"
    time: string;           // "15H00"
    team: string;           // "U11 - Équipe 1"
    opponent: string;       // "Royat"
    location: string;       // "Maison des Sports"
    isHome: boolean;        // true if SCBA is home team
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
 * Parse a date string in DD/MM/YYYY format to display and ISO formats
 */
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
        // Season starts in Sept (Month 8). 
        // If current date is Oct 2024, and parsed month is Sept -> 2024
        // If parsed month is Jan -> 2025
        const now = new Date();
        let year = now.getFullYear();

        // If we are currently in late year (Aug-Dec), dates like Jan/Feb/Mar are typically for NEXT year
        if (now.getMonth() >= 7 && monthIndex < 7) {
            year += 1;
        }
        // If we are currently in early year (Jan-Jul), dates like Sept/Oct/Nov are typically for PREVIOUS year (last season part) 
        // BUT usually we import future games. So if current is Jan 2025, and input is Dec -> Dec 2024? Or Dec 2025?
        // Let's assume matches are for the CURRENT/COMING season.
        // If importing in May 2025, and input is Sept -> Sept 2025 (next season start)

        // Simplification for basketball season (Sept YYYY -> June YYYY+1)
        // If Month is Sept-Dec (8-11), it uses the "Season Start Year"
        // If Month is Jan-July (0-6), it uses "Season Start Year + 1"

        // Current logic: Detect "current season start year"
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
 */
export const parseCSV = (csvContent: string): ImportResult => {
    const lines = csvContent.trim().split('\n').filter(line => line.trim());
    const result: ImportResult = { success: [], errors: [] };

    // Skip header line if detected (looks for "Date" or "Rencontre")
    const headerLine = lines[0]?.toLowerCase();
    const startIndex = (headerLine.includes('date') || headerLine.includes('rencontre')) ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
            // Support ;, , and Tab (\t) as separators
            // Tab is common when copying tables from websites
            let separator = ';';
            if (line.includes('\t')) separator = '\t';
            else if (line.includes(',')) separator = ',';

            // Remove multiple spaces/tabs if using spaces as potential separator (unreliable, so we focus on explicit separators)
            const parts = line.split(separator).map(p => p.trim()).filter(p => p !== ''); // Filter empty parts for tab-separated which might have double tabs

            // If we have less than 4 parts, it might be a weird copy-paste.
            // FFBB web format usually has: Match | Date | Heure | Domicile | Visiteur | Resultat | ...
            // Or: Date | Heure | Domicile | Score | Visiteur | Lieu

            // Let's try to identify columns by content type rather than fixed index

            let dateStr = '', timeStr = '', homeTeam = '', awayTeam = '', location = '';

            // Strategy 1: Standard CSV (Date;Heure;Dom;Vis;Lieu)
            if (parts.length >= 4 && parts[0].match(/\d{2}\/\d{2}/)) {
                dateStr = parts[0];
                timeStr = parts[1];
                homeTeam = parts[2];
                awayTeam = parts[3];
                location = parts[4] || '';
            }
            // Strategy 2: Web Copy Paste (might have index or day name first)
            // Example: "1	Dim 14/12/2024	15:00	SCBA...	ROYAT..."
            else {
                // Find date-like part
                const dateIdx = parts.findIndex(p => p.match(/\d{2}\/\d{2}/));
                if (dateIdx !== -1 && parts.length >= dateIdx + 4) {
                    dateStr = parts[dateIdx];
                    timeStr = parts[dateIdx + 1];
                    homeTeam = parts[dateIdx + 2];
                    awayTeam = parts[dateIdx + 3];

                    // Sometimes score is between teams if match is played
                    // Check if homeTeam or awayTeam looks like a score "64 - 55"
                    if (homeTeam.match(/^\d+/) || awayTeam.match(/^\d+/)) {
                        // Shift for score columns? This is tricky.
                        // For future matches (what we care about), there is no score.
                    }

                    location = parts[dateIdx + 4] || '';
                } else {
                    throw new Error("Impossible d'identifier les colonnes (Date introuvable)");
                }
            }

            // Parse date
            const parsedDate = parseDate(dateStr);
            if (!parsedDate) {
                result.errors.push({
                    line: i + 1,
                    content: line,
                    error: `Date invalide: "${dateStr}" (format attendu: JJ/MM/AAAA)`
                });
                continue;
            }

            // Determine if SCBA is home or away
            const isHome = isSCBATeam(homeTeam);
            const scbaTeam = isHome ? homeTeam : awayTeam;
            const opponent = isHome ? awayTeam : homeTeam;

            result.success.push({
                date: parsedDate.display,
                dateISO: parsedDate.iso,
                time: parseTime(timeStr),
                team: normalizeTeamName(scbaTeam),
                opponent: opponent,
                location: location || (isHome ? 'Maison des Sports' : 'Extérieur'),
                isHome
            });
        } catch (err) {
            result.errors.push({
                line: i + 1,
                content: line,
                error: `Erreur de parsing: ${err}`
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
