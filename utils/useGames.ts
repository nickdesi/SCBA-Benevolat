import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch,
    getDocs,
    query,
    where,
    orderBy,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { DEFAULT_ROLES } from '../constants';
import type { Game, GameFormData, CarpoolEntry, UserRegistration } from '../types';
import { getGameDateValue, getTodayISO } from './dateUtils';
import { getStoredName } from './storage';
import { useVolunteers } from './useVolunteers';
import { useCarpool } from './useCarpool';

interface UseGamesReturn {
    games: Game[];
    sortedGames: Game[];
    filteredGames: Game[];
    loading: boolean;
    teams: string[];
    uniqueLocations: string[];
    uniqueOpponents: string[];
    // CRUD operations
    addGame: (gameData: GameFormData) => Promise<void>;
    updateGame: (updatedGame: Game) => Promise<void>;
    deleteGame: (gameId: string) => Promise<boolean>;
    importGames: (matchesData: (GameFormData & { id?: string })[]) => Promise<void>;
    // Volunteer operations
    handleVolunteer: (gameId: string, roleId: string, parentName: string) => Promise<void>;
    handleRemoveVolunteer: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    handleUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => Promise<void>;
    // Carpool operations
    handleAddCarpool: (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => Promise<void>;
    handleRemoveCarpool: (gameId: string, entryId: string) => Promise<void>;
    userRegistrations: UserRegistration[];
    userRegistrationsMap: Map<string, string>;
}

interface UseGamesOptions {
    selectedTeam: string | null;
    currentView: 'home' | 'planning' | 'calendar';
}

export const useGames = (options: UseGamesOptions): UseGamesReturn => {
    const { selectedTeam, currentView } = options;
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    // Use sub-hooks
    const {
        userRegistrations,
        userRegistrationsMap,
        handleVolunteer,
        handleRemoveVolunteer,
        handleUpdateVolunteer
    } = useVolunteers();

    const {
        handleAddCarpool,
        handleRemoveCarpool
    } = useCarpool();

    // ---------------------------------------------------------------------------
    // Firestore Synchronization with Query Optimization
    // ---------------------------------------------------------------------------
    useEffect(() => {
        const todayISO = getTodayISO();
        const matchesQuery = query(
            collection(db, "matches"),
            where("dateISO", ">=", todayISO),
            orderBy("dateISO", "asc")
        );

        const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
            const matchesData: Game[] = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as Game));

            setGames(matchesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Sort games by date AND time
    const sortedGames = useMemo(() => {
        return [...games].sort((a, b) => {
            const dateDiff = getGameDateValue(a).localeCompare(getGameDateValue(b));
            if (dateDiff !== 0) return dateDiff;

            // If dates are equal, sort by time (HHhMM format, e.g. "14h00", "09h30")
            // We pad single digit hours ("9h00" -> "09h00") for correct string comparison if needed
            // But relying on simple string compare "14h00" > "09h00" works correctly
            // "20h00" > "14h00" -> 1 (Correct)
            // "9h00" vs "14h00": "9" > "1" -> 1 (WRONG if 9h comes after 14h)
            // So we MUST normalize time to ensure HHhMM (2 digits for hour)

            const normalizeTime = (t: string) => {
                const [h, m] = t.split(/[h:]/i);
                return `${h.padStart(2, '0')}${m}`;
            };

            return normalizeTime(a.time).localeCompare(normalizeTime(b.time));
        });
    }, [games]);

    // Extract unique teams for filter
    const teams = useMemo(() => {
        const uniqueTeams = new Set(games.map(g => g.team));
        return Array.from(uniqueTeams).sort();
    }, [games]);

    // Extract unique locations
    const uniqueLocations = useMemo(() => {
        const locations = new Set(games.map(g => g.location));
        return Array.from(locations).filter(Boolean).sort();
    }, [games]);

    // Extract unique opponents
    const uniqueOpponents = useMemo(() => {
        const opponents = new Set(games.map(g => g.opponent));
        return Array.from(opponents).filter(Boolean).sort();
    }, [games]);

    // Filtered games logic
    const filteredGames = useMemo(() => {
        let result = sortedGames;

        if (selectedTeam) {
            result = result.filter(g => g.team === selectedTeam);
        }

        if (currentView === 'planning') {
            if (auth.currentUser) {
                const myGameIds = new Set(userRegistrations.map(r => r.gameId));
                result = result.filter(game => myGameIds.has(game.id));
            } else {
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
    }, [sortedGames, selectedTeam, currentView, userRegistrations]);

    // ---------------------------------------------------------------------------
    // Automatic Cleanup of Past Matches (DISABLED FOR PERFORMANCE)
    // ---------------------------------------------------------------------------
    /* 
    // Optimization: This should be a manual Admin action or Cloud Function, not run on client load.
    // Disabling to save read/write quotas and improve startup time.
    useEffect(() => {
        const cleanupPastMatches = async () => {
            try {
                const todayISO = getTodayISO();
                const colRef = collection(db, "matches");
                const pastMatchesQuery = query(
                    colRef,
                    where("dateISO", "<", todayISO)
                );
                const snapshot = await getDocs(pastMatchesQuery);
                const matchesToDelete: string[] = [];
                snapshot.docs.forEach(docSnap => matchesToDelete.push(docSnap.id));

                if (matchesToDelete.length > 0) {
                    const batch = writeBatch(db);
                    matchesToDelete.forEach(id => batch.delete(doc(db, "matches", id)));
                    await batch.commit();
                }
            } catch (err) {
                console.error("Error cleaning up past matches:", err);
            }
        };

        const timer = setTimeout(() => cleanupPastMatches(), 2000);
        return () => clearTimeout(timer);
    }, []);
    */

    // ---------------------------------------------------------------------------
    // CRUD Operations
    // ---------------------------------------------------------------------------
    const addGame = useCallback(async (gameData: GameFormData) => {
        const isSenior = ['SENIOR M1', 'SENIOR M2'].includes(gameData.team);
        const applicableRoles = DEFAULT_ROLES.filter(role =>
            !(role.name === 'Goûter' && isSenior)
        );

        const newGame = {
            ...gameData,
            roles: applicableRoles.map((role, idx) => ({
                id: String(idx + 1),
                name: role.name,
                capacity: role.capacity === 0 ? Infinity : role.capacity,
                volunteers: []
            }))
        };
        await addDoc(collection(db, "matches"), newGame);
    }, []);

    const updateGame = useCallback(async (updatedGame: Game) => {
        const gameRef = doc(db, "matches", updatedGame.id);
        const { id, ...data } = updatedGame;
        await updateDoc(gameRef, data);
    }, []);

    const deleteGame = useCallback(async (gameId: string): Promise<boolean> => {
        // Confirmation is now handled by ConfirmModal in GameCard
        await deleteDoc(doc(db, "matches", gameId));
        return true;
    }, []);

    const importGames = useCallback(async (matchesData: (GameFormData & { id?: string })[]) => {
        try {
            const batch = writeBatch(db);

            for (const gameData of matchesData) {
                // Sanitize data: remove undefined fields
                const cleanData = Object.fromEntries(
                    Object.entries(gameData).filter(([_, v]) => v !== undefined)
                ) as any;

                if (cleanData.id) {
                    // Update existing game (Upsert safe: creates if missing, updates if exists)
                    const { id, ...data } = cleanData;
                    const docRef = doc(db, "matches", id);
                    batch.set(docRef, data, { merge: true });
                } else {
                    // Create new game
                    // Use cleanData to ensure no undefined fields (like id: undefined)
                    const isSenior = ['SENIOR M1', 'SENIOR M2'].includes((cleanData.team as string) || '');
                    const applicableRoles = DEFAULT_ROLES.filter(role =>
                        !(role.name === 'Goûter' && isSenior)
                    );
                    const newGame = {
                        ...cleanData,
                        roles: applicableRoles.map((role, idx) => ({
                            id: String(idx + 1),
                            name: role.name,
                            capacity: role.capacity === 0 ? Infinity : role.capacity,
                            volunteers: []
                        }))
                    };
                    const docRef = doc(collection(db, "matches"));
                    batch.set(docRef, newGame);
                }
            }
            await batch.commit();
        } catch (error) {
            console.error("Detailed Import Error:", error);
            throw error; // Re-throw to be caught by UI
        }
    }, []);

    return {
        games,
        sortedGames,
        filteredGames,
        loading,
        teams,
        uniqueLocations,
        uniqueOpponents,
        addGame,
        updateGame,
        deleteGame,
        importGames,
        handleVolunteer,
        handleRemoveVolunteer,
        handleUpdateVolunteer,
        handleAddCarpool,
        handleRemoveCarpool,
        userRegistrations,
        userRegistrationsMap
    };
};
