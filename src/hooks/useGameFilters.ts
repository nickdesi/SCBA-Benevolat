import { useMemo } from 'react';
import { auth } from '../firebase';
import type { Game, UserRegistration } from '../types';
import { getStoredName } from '../utils/storage';

interface UseGameFiltersProps {
    games: Game[]; // Should be sorted games
    selectedTeam: string | null;
    currentView: 'home' | 'planning' | 'calendar';
    favoriteTeams: string[];
    userRegistrations: UserRegistration[];
}

// Pure helpers — defined at module level so they are never recreated on render
import { sortTeamNames } from '../utils/gameUtils';

export const useGameFilters = ({
    games,
    selectedTeam,
    currentView,
    favoriteTeams,
    userRegistrations
}: UseGameFiltersProps) => {

    // 1. Extract unique teams for dropdown (restricted to favorites if set)
    const teams = useMemo(() => {
        if (favoriteTeams && favoriteTeams.length > 0) {
            return sortTeamNames([...favoriteTeams]);
        }
        const uniqueTeams = new Set(games.map(g => g.team));
        return sortTeamNames(Array.from(uniqueTeams));
    }, [games, favoriteTeams]);

    // 2. Full list of teams regardless of favorites (for ProfileModal)
    const allTeams = useMemo(() => {
        const uniqueAll = new Set(games.map(g => g.team));
        return sortTeamNames(Array.from(uniqueAll));
    }, [games]);

    // 3. Extract unique locations
    const uniqueLocations = useMemo(() => {
        const locations = new Set(games.map(g => g.location));
        return Array.from(locations).filter(Boolean).sort();
    }, [games]);

    // 4. Extract unique opponents
    const uniqueOpponents = useMemo(() => {
        const opponents = new Set(games.map(g => g.opponent));
        return Array.from(opponents).filter(Boolean).sort();
    }, [games]);

    // 5. Filtered games logic (Team Filter + Dashboard Views)
    const filteredGames = useMemo(() => {
        const now = new Date();

        // First: Filter out past matches (matches that have already started)
        // Optimization: Use string comparison instead of expensive Date object instantiation in loops
        const nowIso = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')
        ].join('-');
        const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

        // Optimization: Single pass filter for O(N) instead of multiple chained O(N) filters
        const myName = !auth.currentUser && currentView === 'planning' ? getStoredName()?.toLowerCase() : null;
        const myGameIds = auth.currentUser && currentView === 'planning'
            ? new Set(userRegistrations.map(r => r.gameId))
            : null;

        if (currentView === 'planning' && !auth.currentUser && !myName) {
            return [];
        }

        return games.filter(game => {
            // 1. Time Filter
            try {
                if (game.dateISO) {
                    if (game.dateISO < nowIso) return false; // Past day
                    if (game.dateISO === nowIso) {
                        const timeParts = game.time.split(/[h:]/i);
                        const h = (timeParts[0] || '0').padStart(2, '0');
                        const m = (timeParts[1] || '0').padStart(2, '0');
                        if (`${h}${m}` <= nowTimeStr) return false; // Started or past time
                    }
                }
            } catch {
                // Keep games with invalid dates (fallback)
            }

            // 2. Team Filter
            if (selectedTeam && game.team !== selectedTeam) {
                return false;
            }

            // 3. Planning View Filter
            if (currentView === 'planning') {
                if (auth.currentUser) {
                    if (!myGameIds?.has(game.id)) return false;
                } else if (myName) {
                    const isVolunteer = game.roles.some(role =>
                        role.volunteers.some(v => v.toLowerCase() === myName)
                    );
                    const isCarpool = game.carpool?.some(entry =>
                        entry.name.toLowerCase() === myName
                    );
                    if (!isVolunteer && !isCarpool) return false;
                }
            }

            return true;
        });
    }, [games, selectedTeam, currentView, userRegistrations]);

    return {
        teams,
        allTeams,
        uniqueLocations,
        uniqueOpponents,
        filteredGames
    };
};
