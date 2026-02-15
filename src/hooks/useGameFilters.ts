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
        const now = new Date();

        // First: Filter out past matches (matches that have already started)
        let result = games.filter(game => {
            try {
                // Combine dateISO (YYYY-MM-DD) with time (HHhMM or HH:MM) to get exact match start
                const timeParts = game.time.replace('h', ':').split(':');
                const hours = parseInt(timeParts[0], 10) || 0;
                const minutes = parseInt(timeParts[1], 10) || 0;

                const gameDateTime = new Date(game.dateISO);
                gameDateTime.setHours(hours, minutes, 0, 0);

                return gameDateTime > now; // Only show games that haven't started yet
            } catch {
                return true; // Keep games with invalid dates (fallback)
            }
        });

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
    }, [games, selectedTeam, currentView, userRegistrations]);

    return {
        teams,
        allTeams,
        uniqueLocations,
        uniqueOpponents,
        filteredGames
    };
};
