import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch,
    query,
    where,
    orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_ROLES } from '../constants';
import type { Game, GameFormData, CarpoolEntry, UserRegistration } from '../types';
import { getTodayISO } from './dateUtils';
import { useVolunteers } from './useVolunteers';
import { useCarpool } from './useCarpool';
import { sortGames } from './gameUtils';
import { useGameFilters } from '../hooks/useGameFilters';

interface UseGamesReturn {
    games: Game[];
    sortedGames: Game[];
    filteredGames: Game[];
    loading: boolean;
    teams: string[];
    uniqueLocations: string[];
    uniqueOpponents: string[];
    allTeams: string[];
    // CRUD operations
    addGame: (gameData: GameFormData) => Promise<void>;
    updateGame: (updatedGame: Game) => Promise<void>;
    deleteGame: (gameId: string) => Promise<boolean>;
    importGames: (matchesData: (GameFormData & { id?: string })[]) => Promise<void>;
    // Volunteer operations
    handleVolunteer: (gameId: string, roleId: string, parentName: string | string[]) => Promise<void>;
    handleRemoveVolunteer: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    handleUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => Promise<void>;
    // Carpool operations
    handleAddCarpool: (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => Promise<void>;
    handleRemoveCarpool: (gameId: string, entryId: string) => Promise<void>;
    handleRequestSeat: (gameId: string, passengerId: string, driverId: string) => Promise<void>;
    handleAcceptPassenger: (gameId: string, driverId: string, passengerId: string) => Promise<void>;
    handleRejectPassenger: (gameId: string, driverId: string, passengerId: string) => Promise<void>;
    handleCancelRequest: (gameId: string, passengerId: string) => Promise<void>;
    userRegistrations: UserRegistration[];
    userRegistrationsMap: Map<string, string>;
}

interface UseGamesOptions {
    selectedTeam: string | null;
    currentView: 'home' | 'planning' | 'calendar';
    favoriteTeams: string[];
}

export const useGames = (options: UseGamesOptions): UseGamesReturn => {
    const { selectedTeam, currentView, favoriteTeams } = options;
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
        handleRemoveCarpool,
        handleRequestSeat,
        handleAcceptPassenger,
        handleRejectPassenger,
        handleCancelRequest
    } = useCarpool();

    // ---------------------------------------------------------------------------
    // Firestore Synchronization
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

    // ---------------------------------------------------------------------------
    // Sorting & Filtering (Refactored)
    // ---------------------------------------------------------------------------

    // Sort games using pure function
    const sortedGames = useMemo(() => sortGames(games), [games]);

    // Apply filters using custom hook
    const {
        teams,
        allTeams,
        uniqueLocations,
        uniqueOpponents,
        filteredGames
    } = useGameFilters({
        games: sortedGames,
        selectedTeam,
        currentView,
        favoriteTeams,
        userRegistrations
    });

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
        await deleteDoc(doc(db, "matches", gameId));
        return true;
    }, []);

    const importGames = useCallback(async (matchesData: (GameFormData & { id?: string })[]) => {
        try {
            const batch = writeBatch(db);

            for (const gameData of matchesData) {
                const cleanData = Object.fromEntries(
                    Object.entries(gameData).filter(([_, v]) => v !== undefined)
                ) as any;

                if (cleanData.id) {
                    const { id, ...data } = cleanData;
                    const docRef = doc(db, "matches", id);
                    batch.set(docRef, data, { merge: true });
                } else {
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
            throw error;
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
        allTeams,
        addGame,
        updateGame,
        deleteGame,
        importGames,
        handleVolunteer,
        handleRemoveVolunteer,
        handleUpdateVolunteer,
        handleAddCarpool,
        handleRemoveCarpool,
        handleRequestSeat,
        handleAcceptPassenger,
        handleRejectPassenger,
        handleCancelRequest,
        userRegistrations,
        userRegistrationsMap
    };
};
