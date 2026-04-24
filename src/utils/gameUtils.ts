import type { Game, Role, CarpoolEntry } from '../types';
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

/**
 * Check if a role is considered "complete" based on its capacity.
 */
export const isRoleComplete = (role: Role | { capacity: number; volunteers: string[] }): boolean => {
    const isUnlimited = role.capacity === Infinity || role.capacity === 0;
    if (isUnlimited) {
        return role.volunteers.length >= 2;
    }
    return role.volunteers.length >= role.capacity;
};

/**
 * Check if all roles in a game are complete.
 */
export const isGameFullyStaffed = (game: Game): boolean => {
    return game.roles.every(isRoleComplete);
};

/**
 * Get missing role names for a game.
 */
export const getMissingRoles = (game: Game): string[] => {
    return game.roles
        .filter(r => !isRoleComplete(r))
        .map(r => r.name);
};

/**
 * Calculate filled slots for a game, clamping to capacity for stats precision.
 * Unlimited roles are capped at 2 for progress calculation.
 */
export const getFilledSlotsCount = (game: Game): number => {
    return game.roles.reduce((sum, r) => {
        const isUnlimited = r.capacity === Infinity || r.capacity === 0;
        const capacity = isUnlimited ? 2 : r.capacity;
        return sum + Math.min(r.volunteers.length, capacity);
    }, 0);
};

/**
 * Calculate total capacity for a game.
 * Unlimited roles contribute 2 to the target capacity.
 */
export const getTotalCapacityCount = (game: Game): number => {
    return game.roles.reduce((sum, r) => {
        const isUnlimited = r.capacity === Infinity || r.capacity === 0;
        return sum + (isUnlimited ? 2 : r.capacity);
    }, 0);
};

/**
 * Check if a game is urgent (< 48h and incomplete).
 */
export const isGameUrgent = (game: Game, now: Date = new Date()): boolean => {
    if (!game.isHome) return false;
    if (isGameFullyStaffed(game)) return false;

    try {
        const gameDate = new Date(game.dateISO);
        const diffMs = gameDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours > 0 && diffHours < 48;
    } catch {
        return false;
    }
};

/**
 * Calculate hours remaining until the game.
 */
export const getHoursUntilGame = (dateISO: string, now: Date = new Date()): number => {
    try {
        const gameDate = new Date(dateISO);
        const diffMs = gameDate.getTime() - now.getTime();
        return diffMs / (1000 * 60 * 60);
    } catch {
        return Infinity;
    }
};

/**
 * Get internal priority for a team to maintain a consistent logical order (U9 < U11 < ... < Senior).
 */
export const getTeamPriority = (team: string): number => {
    const t = team.toUpperCase();
    if (t.includes('U9')) return 1;
    if (t.includes('U11')) return 2;
    if (t.includes('U13')) return 3;
    if (t.includes('U15')) return 4;
    if (t.includes('U18')) return 5;
    if (t.includes('SENIOR')) return 6;
    if (t.includes('VETERAN')) return 7;
    return 99;
};

/**
 * Sort a list of team names based on their category priority then alphabetical.
 */
export const sortTeamNames = (teamList: string[]): string[] => {
    return [...teamList].sort((a, b) => {
        const prioA = getTeamPriority(a);
        const prioB = getTeamPriority(b);
        if (prioA !== prioB) return prioA - prioB;
        return a.localeCompare(b);
    });
};

/**
 * Calculates carpool stats in a single pass over the carpool array.
 */
export const getCarpoolStats = (carpool: CarpoolEntry[] | undefined) => {
    let drivers = 0;
    let passengers = 0;
    let totalSeats = 0;

    if (!carpool) return { drivers, passengers, totalSeats };

    for (let i = 0; i < carpool.length; i++) {
        const entry = carpool[i];
        if (entry.type === 'driver') {
            drivers++;
            totalSeats += (entry.seats || 0);
        } else if (entry.type === 'passenger') {
            passengers++;
        }
    }

    return { drivers, passengers, totalSeats };
};

/**
 * Calculates home and away games count in a single pass over the games array.
 */
export const getHomeAwayCounts = (games: Game[]) => {
    let homeCount = 0;
    let awayCount = 0;
    for (let i = 0; i < games.length; i++) {
        if (games[i].isHome ?? true) {
            homeCount++;
        } else {
            awayCount++;
        }
    }
    return { homeCount, awayCount };
};
