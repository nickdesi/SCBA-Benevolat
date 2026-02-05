import type { Game } from '../types';
import { getGameDateValue } from './dateUtils';

/**
 * Normalizes time string (e.g., "9h00" -> "0900", "14:30" -> "1430")
 * for consistent string comparison.
 */
export const normalizeTime = (t: string): string => {
    if (!t) return '0000';
    // Split by 'h' or ':' case insensitive
    const parts = t.split(/[h:]/i);
    if (parts.length < 2) return t.padStart(4, '0'); // Fallback

    const [h, m] = parts;
    return `${h.padStart(2, '0')}${m.padStart(2, '0')}`;
};

/**
 * Pure function to sort games by Date then Time.
 * Uses getGameDateValue (ISO date) and normalizeTime for sorting.
 */
export const sortGames = (games: Game[]): Game[] => {
    return [...games].sort((a, b) => {
        // 1. Sort by Date
        const dateA = getGameDateValue(a);
        const dateB = getGameDateValue(b);
        const dateDiff = dateA.localeCompare(dateB);

        if (dateDiff !== 0) return dateDiff;

        // 2. Sort by Time (if dates are equal)
        const timeA = normalizeTime(a.time);
        const timeB = normalizeTime(b.time);

        return timeA.localeCompare(timeB);
    });
};
