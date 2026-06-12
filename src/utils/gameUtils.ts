import type { Game, Role, CarpoolEntry } from '../types';
import { getGameDateValue } from './dateUtils';

/**
 * Normalizes time string (e.g., "9h00" -> "0900", "14:30" -> "1430")
 * for consistent string comparison.
 */
const normalizeTime = (t: string): string => {
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
 *
 * ⚡ Bolt Optimization: Uses the Schwartzian transform (decorate-sort-undecorate)
 * to precompute expensive string parsing/normalization operations (getGameDateValue, normalizeTime)
 * in a single O(N) pass before running the O(N log N) sort operation, avoiding
 * redundant calculations inside the comparator function.
 */
export const sortGames = (games: Game[]): Game[] => {
    return games
        .map(game => ({
            game,
            dateVal: getGameDateValue(game),
            timeVal: normalizeTime(game.time)
        }))
        .sort((a, b) => {
            const dateDiff = a.dateVal.localeCompare(b.dateVal);
            if (dateDiff !== 0) return dateDiff;
            return a.timeVal.localeCompare(b.timeVal);
        })
        .map(item => item.game);
};

/**
 * Check if a role is considered "complete" based on its capacity.
 */
const isRoleComplete = (role: Role | { capacity: number; volunteers: string[] }): boolean => {
    const isUnlimited = role.capacity === Infinity || role.capacity === 0;
    if (isUnlimited) {
        return role.volunteers.length >= 2;
    }
    return role.volunteers.length >= role.capacity;
};

/**
 * Check if all roles in a game are complete.
 */
const isGameFullyStaffed = (game: Game): boolean => {
    return game.roles.every(isRoleComplete);
};

/**
 * Calculates filled slots, total capacity, staffing status, and missing roles
 * in a single pass over the game's roles array.
 *
 * ⚡ Bolt Optimization: Replaces multiple separate loops (reduce, every, filter)
 * with a single O(N) pass for better performance.
 */
export const getGameRoleStats = (game: Game) => {
    let filledSlots = 0;
    let totalCapacity = 0;
    let isFullyStaffed = true;
    const missingRoles: string[] = [];

    for (let i = 0; i < game.roles.length; i++) {
        const r = game.roles[i];
        const isUnlimited = r.capacity === Infinity || r.capacity === 0;
        const capacity = isUnlimited ? 2 : r.capacity;

        filledSlots += Math.min(r.volunteers.length, capacity);
        totalCapacity += capacity;

        const isComplete = isUnlimited ? r.volunteers.length >= 2 : r.volunteers.length >= r.capacity;
        if (!isComplete) {
            isFullyStaffed = false;
            missingRoles.push(r.name);
        }
    }

    return {
        filledSlots,
        totalCapacity,
        isFullyStaffed,
        missingRoles
    };
};

/**
 * Check if a game is urgent (< 48h and incomplete).
 */
export const isGameUrgent = (
    game: Game,
    now: Date | number = Date.now(),
    isFullyStaffedPrecomputed?: boolean
): boolean => {
    if (!game.isHome) return false;

    // ⚡ Bolt Optimization: Use precomputed complete status if provided to avoid redundant O(R) iteration over roles.
    const isComplete = isFullyStaffedPrecomputed !== undefined
        ? isFullyStaffedPrecomputed
        : isGameFullyStaffed(game);

    if (isComplete) return false;

    try {
        // ⚡ Bolt Optimization: Use Date.parse to avoid redundant object allocation for gameDate.
        const nowMs = typeof now === 'number' ? now : now.getTime();
        const gameDateMs = Date.parse(game.dateISO);
        if (isNaN(gameDateMs)) return false;

        const diffMs = gameDateMs - nowMs;
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours > 0 && diffHours < 48;
    } catch {
        return false;
    }
};

/**
 * Get internal priority for a team to maintain a consistent logical order (U9 < U11 < ... < Senior).
 */
const getTeamPriority = (team: string): number => {
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
 *
 * ⚡ Bolt Optimization: Uses the Schwartzian transform (decorate-sort-undecorate)
 * to precompute getTeamPriority in a single O(N) pass, preventing repeated string
 * allocations and lookups inside the O(N log N) .sort() callback.
 */
export const sortTeamNames = (teamList: string[]): string[] => {
    return teamList
        .map(team => ({ team, prio: getTeamPriority(team) }))
        .sort((a, b) => {
            if (a.prio !== b.prio) return a.prio - b.prio;
            return a.team.localeCompare(b.team);
        })
        .map(item => item.team);
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
