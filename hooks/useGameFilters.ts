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

export const useGameFilters = ({
    games,
    selectedTeam,
    currentView,
    favoriteTeams,
    userRegistrations
}: UseGameFiltersProps) => {

    // Apply primary filter: Favorite Teams (internal use for getting available teams if needed, 
    // but typically we restrict 'teams' list based on favorites, while showing all games if no filter picked)
    // Actually, in the original code, 'favoritedGames' was just an intermediate step for 'filteredGames'??
    // Let's re-read the original logic.
    // Original: 
    // favoritedGames = sortedGames.filter(g => favoriteTeams.includes(g.team)) // IF favorites exist
    // teams = favorites || uniqueTeams
    // filteredGames = sortedGames (base) -> filter by selectedTeam -> filter by Planning

    // WAIT: The original logic for 'filteredGames' started with "result = sortedGames".
    // It did NOT start with 'favoritedGames'.
    // 'favoritedGames' was ONLY used in the 'filteredGames' dependency array in the original code, BUT NOT IN THE BODY.
    // Logic check: "const filteredGames = useMemo(() => { let result = sortedGames; ... }, [sortedGames, favoritedGames, ...])"
    // So 'favoritedGames' was unused logic in the filtering chain itself, unless I missed something.
    // Ah, 'teams' list DID depend on favorites.

    // Let's Clean this up:

    // Helper for team sorting order
    const getTeamPriority = (team: string) => {
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

    const sortTeams = (teamList: string[]) => {
        return teamList.sort((a, b) => {
            const prioA = getTeamPriority(a);
            const prioB = getTeamPriority(b);
            if (prioA !== prioB) return prioA - prioB;
            return a.localeCompare(b);
        });
    };

    // 1. Extract unique teams for dropdown (restricted to favorites if set)
    const teams = useMemo(() => {
        if (favoriteTeams && favoriteTeams.length > 0) {
            return sortTeams([...favoriteTeams]);
        }
        const uniqueTeams = new Set(games.map(g => g.team));
        return sortTeams(Array.from(uniqueTeams));
    }, [games, favoriteTeams]);

    // 2. Full list of teams regardless of favorites (for ProfileModal)
    const allTeams = useMemo(() => {
        const uniqueAll = new Set(games.map(g => g.team));
        return sortTeams(Array.from(uniqueAll));
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
        let result = games; // Start with ALL sorted games

        // Apply Team Filter
        if (selectedTeam) {
            result = result.filter(g => g.team === selectedTeam);
        }

        // Apply Planning View Filter
        if (currentView === 'planning') {
            if (auth.currentUser) {
                // Connected User: Check registrations by Game ID
                const myGameIds = new Set(userRegistrations.map(r => r.gameId));
                result = result.filter(game => myGameIds.has(game.id));
            } else {
                // Public/Cookie User: Check name in volunteers or carpooling
                const myName = getStoredName()?.toLowerCase();
                if (!myName) return [];

                result = result.filter(game => {
                    const isVolunteer = game.roles.some(role =>
                        role.volunteers.some(v => v.toLowerCase() === myName)
                    );
                    const isCarpool = game.carpool?.some(entry =>
                        entry.name.toLowerCase() === myName
                    );
                    return isVolunteer || isCarpool;
                });
            }
        }

        return result;
    }, [games, selectedTeam, currentView, userRegistrations, favoriteTeams]); // favoriteTeams added if we ever decide to filter default view by favorites (not currently done in logic above, mimicking original)

    return {
        teams,
        allTeams,
        uniqueLocations,
        uniqueOpponents,
        filteredGames
    };
};
