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
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { INITIAL_GAMES, DEFAULT_ROLES } from '../constants';
import type { Game, GameFormData, CarpoolEntry } from '../types';
import { getGameDateValue, getTodayISO, parseFrenchDate, toISODateString } from './dateUtils';
import { getStoredName } from './storage';

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
}

interface UseGamesOptions {
    selectedTeam: string | null;
    currentView: 'home' | 'planning';
}

export const useGames = (options: UseGamesOptions): UseGamesReturn => {
    const { selectedTeam, currentView } = options;
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    // Check localStorage for migration (legacy support)
    const localGames = useMemo(() => {
        try {
            const stored = localStorage.getItem('scba-games');
            return stored ? JSON.parse(stored) : INITIAL_GAMES;
        } catch {
            return INITIAL_GAMES;
        }
    }, []);

    // ---------------------------------------------------------------------------
    // Firestore Synchronization with Query Optimization
    // ---------------------------------------------------------------------------
    useEffect(() => {
        // Optimized query: only fetch games from today onwards
        const todayISO = getTodayISO();

        // Note: We can't use Firestore range query directly on dateISO because 
        // legacy games might not have it. We'll filter client-side for safety.
        const unsubscribe = onSnapshot(collection(db, "matches"), (snapshot) => {
            const matchesData: Game[] = snapshot.docs
                .map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                } as Game))
                // Filter out past games (optimization)
                .filter(game => {
                    const gameDate = getGameDateValue(game);
                    return gameDate >= todayISO;
                });

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

    // Extract unique locations for suggestions
    const uniqueLocations = useMemo(() => {
        const locations = new Set(games.map(g => g.location));
        return Array.from(locations).filter(Boolean).sort();
    }, [games]);

    // Extract unique opponents for suggestions
    const uniqueOpponents = useMemo(() => {
        const opponents = new Set(games.map(g => g.opponent));
        return Array.from(opponents).filter(Boolean).sort();
    }, [games]);

    // Filtered games logic
    const filteredGames = useMemo(() => {
        let result = sortedGames;

        // 1. Filter by Team (Dropdown)
        if (selectedTeam) {
            result = result.filter(g => g.team === selectedTeam);
        }

        // 2. Filter by View (Home vs Planning)
        if (currentView === 'planning') {
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

        return result;
    }, [sortedGames, selectedTeam, currentView]);

    // ---------------------------------------------------------------------------
    // Data Seeding / Migration (Run once if Firestore is empty)
    // ---------------------------------------------------------------------------
    useEffect(() => {
        const seedFirestore = async () => {
            try {
                const metadataSnap = await getDocs(collection(db, "system"));
                if (!metadataSnap.empty) return;

                const colRef = collection(db, "matches");
                const snapshot = await getDocs(colRef);

                const setInitializedFlag = async () => {
                    const batch = writeBatch(db);
                    const metaRef = doc(db, "system", "metadata");
                    batch.set(metaRef, { initialized: true, date: new Date().toISOString() });
                    await batch.commit();
                };

                if (!snapshot.empty) {
                    await setInitializedFlag();
                    return;
                }

                if (snapshot.empty) {
                    const batch = writeBatch(db);
                    const gamesToImport = (localGames && localGames.length > 0) ? localGames : INITIAL_GAMES;

                    gamesToImport.forEach((game: Game) => {
                        const docRef = doc(db, "matches", game.id);
                        const cleanGame = JSON.parse(JSON.stringify(game));
                        batch.set(docRef, cleanGame);
                    });

                    const metaRef = doc(db, "system", "metadata");
                    batch.set(metaRef, { initialized: true, date: new Date().toISOString() });
                    await batch.commit();
                }
            } catch (err) {
                console.error("Error seeding database:", err);
            }
        };

        const timer = setTimeout(() => seedFirestore(), 1000);
        return () => clearTimeout(timer);
    }, [localGames]);

    // ---------------------------------------------------------------------------
    // Automatic Cleanup of Past Matches
    // ---------------------------------------------------------------------------
    useEffect(() => {
        const cleanupPastMatches = async () => {
            try {
                const todayISO = getTodayISO();
                const colRef = collection(db, "matches");
                const snapshot = await getDocs(colRef);

                const matchesToDelete: string[] = [];

                snapshot.docs.forEach(docSnap => {
                    const data = docSnap.data();
                    let matchDateISO = data.dateISO;

                    if (!matchDateISO && data.date) {
                        const parsed = parseFrenchDate(data.date);
                        if (parsed) {
                            matchDateISO = toISODateString(parsed);
                        }
                    }

                    if (matchDateISO && matchDateISO < todayISO) {
                        matchesToDelete.push(docSnap.id);
                    }
                });

                if (matchesToDelete.length > 0) {
                    const batch = writeBatch(db);
                    matchesToDelete.forEach(id => {
                        batch.delete(doc(db, "matches", id));
                    });
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
        const newGame = {
            ...gameData,
            roles: DEFAULT_ROLES.map((role, idx) => ({
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
        if (window.confirm('Voulez-vous vraiment supprimer ce match ?')) {
            await deleteDoc(doc(db, "matches", gameId));
            return true;
        }
        return false;
    }, []);

    const importGames = useCallback(async (matchesData: GameFormData[]) => {
        const batch = writeBatch(db);

        for (const gameData of matchesData) {
            const newGame = {
                ...gameData,
                roles: DEFAULT_ROLES.map((role, idx) => ({
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

    // ---------------------------------------------------------------------------
    // Volunteer Operations
    // ---------------------------------------------------------------------------

    const handleVolunteer = useCallback(async (gameId: string, roleId: string, parentName: string) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        const updatedRoles = game.roles.map(role => {
            if (role.id === roleId) {
                return { ...role, volunteers: [...role.volunteers, parentName] };
            }
            return role;
        });

        const gameRef = doc(db, "matches", gameId);
        await updateDoc(gameRef, { roles: updatedRoles });
    }, [games]);

    const handleRemoveVolunteer = useCallback(async (gameId: string, roleId: string, volunteerName: string) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        const updatedRoles = game.roles.map(role => {
            if (role.id === roleId) {
                return { ...role, volunteers: role.volunteers.filter(v => v !== volunteerName) };
            }
            return role;
        });

        const gameRef = doc(db, "matches", gameId);
        await updateDoc(gameRef, { roles: updatedRoles });
    }, [games]);

    const handleUpdateVolunteer = useCallback(async (gameId: string, roleId: string, oldName: string, newName: string) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        const updatedRoles = game.roles.map(role => {
            if (role.id === roleId) {
                return {
                    ...role,
                    volunteers: role.volunteers.map(v => v === oldName ? newName : v)
                };
            }
            return role;
        });

        const gameRef = doc(db, "matches", gameId);
        await updateDoc(gameRef, { roles: updatedRoles });
    }, [games]);

    // ---------------------------------------------------------------------------
    // Carpool Operations
    // ---------------------------------------------------------------------------

    const handleAddCarpool = useCallback(async (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        const newEntry: CarpoolEntry = {
            ...entry,
            id: crypto.randomUUID()
        };
        const updatedCarpool = [...(game.carpool || []), newEntry];

        const gameRef = doc(db, "matches", gameId);
        await updateDoc(gameRef, { carpool: updatedCarpool });
    }, [games]);

    const handleRemoveCarpool = useCallback(async (gameId: string, entryId: string) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        const updatedCarpool = (game.carpool || []).filter(e => e.id !== entryId);

        const gameRef = doc(db, "matches", gameId);
        await updateDoc(gameRef, { carpool: updatedCarpool });
    }, [games]);

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
    };
};
