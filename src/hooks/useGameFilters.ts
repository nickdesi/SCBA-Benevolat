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

    // 1-4. Extract unique teams, locations, and opponents in a single O(N) pass
    const { allTeams, uniqueLocations, uniqueOpponents } = useMemo(() => {
        const teamSet = new Set<string>();
        const locationSet = new Set<string>();
        const opponentSet = new Set<string>();

        // ⚡ Bolt: Single pass iteration over games to avoid multiple O(N) map and Set creations
        for (let i = 0; i < games.length; i++) {
            const g = games[i];
            if (g.team) teamSet.add(g.team);
            if (g.location) locationSet.add(g.location);
            if (g.opponent) opponentSet.add(g.opponent);
        }

        return {
            allTeams: sortTeamNames(Array.from(teamSet)),
            uniqueLocations: Array.from(locationSet).filter(Boolean).sort(),
            uniqueOpponents: Array.from(opponentSet).filter(Boolean).sort()
        };
    }, [games]);

    // 5. Extract unique teams for dropdown (restricted to favorites if set)
    const teams = useMemo(() => {
        if (favoriteTeams && favoriteTeams.length > 0) {
            return sortTeamNames([...favoriteTeams]);
        }
        return allTeams;
    }, [allTeams, favoriteTeams]);

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
