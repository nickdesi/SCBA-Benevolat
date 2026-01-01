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
    importGames: (matchesData: GameFormData[]) => Promise<void>;
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
    currentView: 'home' | 'planning';
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

    // Sort games by date
    const sortedGames = useMemo(() => {
        return [...games].sort((a, b) => getGameDateValue(a).localeCompare(getGameDateValue(b)));
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
    // Automatic Cleanup of Past Matches
    // ---------------------------------------------------------------------------
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
                    console.log(`🧹 Nettoyage: ${matchesToDelete.length} match(s) passé(s) supprimé(s)`);
                }
            } catch (err) {
                console.error("Error cleaning up past matches:", err);
            }
        };

        const timer = setTimeout(() => cleanupPastMatches(), 2000);
        return () => clearTimeout(timer);
    }, []);

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

    const importGames = useCallback(async (matchesData: GameFormData[]) => {
        const batch = writeBatch(db);
        for (const gameData of matchesData) {
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
            const docRef = doc(collection(db, "matches"));
            batch.set(docRef, newGame);
        }
        await batch.commit();
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
