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
 * Domicile
 * (empty)
 * Adversaire
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
                // If we already had a match in progress but it wasn't finished, ignore it (or error?)
                // Actually start a new match
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

            // 3. Try to find Location (Domicile/Extérieur)
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
            }

            // 4. Try to find Opponent (Anything else that's not a score or empty)
            // It MUST come after we found date and location keywords
            if (currentMatch.date && typeof currentMatch.isHome !== 'undefined' && !currentMatch.opponent) {
                // Ignore scores "0" or "-"
                if (line === '0' || line === '-') continue;

                // If line is not a number, it's the opponent
                if (!line.match(/^\d+$/)) {
                    currentMatch.opponent = line;

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

            // Try to adapt to standard format with selectedTeam fallback
            let dateStr = '', timeStr = '', homeTeam = '', awayTeam = '', location = '';

            // Find explicit date format
            const dateIdx = parts.findIndex(p => p.match(/\d{2}\/\d{2}/) || p.match(/\d{1,2}\s+[a-zéû]+/i));

            if (dateIdx !== -1 && parts.length >= dateIdx + 2) {
                dateStr = parts[dateIdx];
                // Check if time is in same part or next
                if (parts[dateIdx].match(/\d{2}:\d{2}/)) {
                    timeStr = parts[dateIdx].split(' ')[1] || '00:00';
                } else {
                    timeStr = parts[dateIdx + 1];
                }

                // If standard line format (Dom/Vis)
                if (parts.length >= dateIdx + 4) {
                    homeTeam = parts[dateIdx + 2];
                    awayTeam = parts[dateIdx + 3];
                    location = parts[dateIdx + 4] || '';
                } else {
                    // Incomplete line
                    continue;
                }
            } else {
                if (line.length > 5) // Ignore very short lines
                    result.errors.push({ line: i + 1, content: line, error: "Date introuvable" });
                continue;
            }

            const parsedDate = parseDate(dateStr);
            if (!parsedDate) continue;

            const isHome = isSCBATeam(homeTeam);
            let finalTeam = isHome ? homeTeam : awayTeam;
            let finalOpponent = isHome ? awayTeam : homeTeam;
            let finalIsHome = isHome;

            // If SCBA not detected (e.g. web copy where user's team is implicit), use defaultTeam
            if (!isSCBATeam(homeTeam) && !isSCBATeam(awayTeam)) {
                // Check if we can infer from location
                if (location.toLowerCase().includes('maison des sports') || location.toLowerCase().includes('clermont') || location.toLowerCase().includes('fleury')) {
                    finalIsHome = true;
                    finalTeam = defaultTeam;
                    finalOpponent = awayTeam;
                } else {
                    // Heuristic: Check if defaultTeam parts are in home/away
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
                        // Default fallback: Assuming standard "Dom vs Vis".
                        // If user selected "My Team", we assume the import is for "My Team".
                        // We can't know for sure without location or team name match.
                        // Let's assume standard FFBB column order: Home matches have user's team in col 1?
                        // No, FFBB tables vary.

                        result.errors.push({ line: i + 1, content: line, error: "Impossible de déterminer Domicile/Extérieur (SCBA non détecté)" });
                        continue;
                    }
                }
            }

            // Define default home location based on team
            const normalizedTeam = normalizeTeamName(finalTeam);
            const defaultHomeLocation = normalizedTeam === 'SENIOR M1' ? 'Gymnase Fleury' : 'Maison des Sports';

            result.success.push({
                date: parsedDate.display,
                dateISO: parsedDate.iso,
                time: parseTime(timeStr),
                team: normalizedTeam,
                opponent: finalOpponent,
                location: location || (finalIsHome ? defaultHomeLocation : 'Extérieur'),
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
