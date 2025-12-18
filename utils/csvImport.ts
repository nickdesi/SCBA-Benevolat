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
const parseDate = (dateStr: string): { display: string; iso: string } | null => {
    const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!match) return null;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed
    const year = parseInt(match[3], 10);

    const date = new Date(year, month, day);
    const weekday = WEEKDAYS[date.getDay()];
    const monthName = MONTHS[month];

    return {
        display: `${weekday} ${day} ${monthName} ${year}`,
        iso: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    };
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

    // Skip header line if detected
    const startIndex = lines[0]?.toLowerCase().includes('date') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
            // Support both ; and , as separators
            const separator = line.includes(';') ? ';' : ',';
            const parts = line.split(separator).map(p => p.trim());

            if (parts.length < 4) {
                result.errors.push({
                    line: i + 1,
                    content: line,
                    error: 'Format invalide (attendu: Date;Heure;Domicile;Visiteur;Salle)'
                });
                continue;
            }

            const [dateStr, timeStr, homeTeam, awayTeam, location = ''] = parts;

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
