import type { Game } from '../types';
import { MONTH_MAP } from '../constants';

/**
 * Normalize a month string by removing diacritics for consistent matching
 */
const normalizeMonth = (str: string): string => {
    return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
};

/**
 * Parse a French date string like "Samedi 14 décembre 2024" or ISO format
 * Returns null if parsing fails
 */
export const parseFrenchDate = (dateStr: string, timeStr?: string): Date | null => {
    let day: number = 0, month: number = -1, year: number = new Date().getFullYear();
    let hours = 0, minutes = 0;

    // Format: ISO "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
    }
    // Format: "DD/MM/YYYY"
    else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10) || year;
    }
    // Format: French "Jour XX mois YYYY" (e.g., "Samedi 14 décembre 2024")
    else {
        const frenchMatch = dateStr.match(/(\d{1,2})\s+([a-zA-ZéèêëàâäùûüôöîïçÉÈÊËÀÂÄÙÛÜÔÖÎÏÇ]+)(?:\s+(\d{4}))?/i);
        if (frenchMatch) {
            day = parseInt(frenchMatch[1], 10);
            const monthStr = normalizeMonth(frenchMatch[2]);
            month = Object.entries(MONTH_MAP).find(([key]) =>
                normalizeMonth(key) === monthStr
            )?.[1] ?? -1;

            if (month === -1) return null;
            if (frenchMatch[3]) {
                year = parseInt(frenchMatch[3], 10);
            }
        } else {
            return null;
        }
    }

    // Parse time if provided
    if (timeStr) {
        const timeMatch = timeStr.match(/(\d{1,2})[hH:](\d{2})/);
        if (timeMatch) {
            hours = parseInt(timeMatch[1], 10);
            minutes = parseInt(timeMatch[2], 10);
        }
    }

    const date = new Date(year, month, day, hours, minutes);
    return isNaN(date.getTime()) ? null : date;
};

/**
 * Convert a Date to ISO date string "YYYY-MM-DD"
 */
export const toISODateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get today's date in ISO format (local timezone)
 */
export const getTodayISO = (): string => {
    const today = new Date();
    return toISODateString(today);
};

/**
 * Get a sortable date value from a Game object
 * Returns ISO string for comparison, or far future for unparseable dates
 */
export const getGameDateValue = (game: Game): string => {
    // Use dateISO if available (new format)
    if (game.dateISO) return game.dateISO;

    // Fallback: parse display date for legacy games
    const parsed = parseFrenchDate(game.date);
    if (parsed) {
        return toISODateString(parsed);
    }

    return '9999-12-31'; // Far future for unparseable dates
};

/**
 * Get the 7 days of the week (Monday to Sunday) for a given date
 */
export const getDaysOfWeek = (date: Date): Date[] => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    start.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
    }
    return days;
};
