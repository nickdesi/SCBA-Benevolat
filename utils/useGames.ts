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
    setDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { DEFAULT_ROLES } from '../constants';
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
    userRegistrations: Map<string, string>;
}

interface UseGamesOptions {
    selectedTeam: string | null;
    currentView: 'home' | 'planning';
}

export const useGames = (options: UseGamesOptions): UseGamesReturn => {
    const { selectedTeam, currentView } = options;
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRegistrationMap, setUserRegistrationMap] = useState<Map<string, string>>(new Map());

    // Listen to User Registrations (for "My Planning" when logged in)
    useEffect(() => {
        let unsubscribe = () => { };

        const listenToUserRegistrations = async () => {
            // We need to wait for auth to be ready. 
            // Ideally we'd pass 'user' as prop, but we can listen here too.
            // Or simpler: just use onAuthStateChanged here again or rely on implicit auth.

            // Better: Subscribe to auth state inside this effect
            auth.onAuthStateChanged((user) => {
                if (user) {
                    const q = query(collection(db, `users/${user.uid}/registrations`));
                    unsubscribe = onSnapshot(q, (snapshot) => {
                        const map = new Map<string, string>();
                        snapshot.docs.forEach(d => {
                            const data = d.data();
                            // d.id is gameId_roleId
                            // data.volunteerName IS the name used. 
                            // If missing (legacy), try to fallback? 
                            map.set(d.id, data.volunteerName || "");
                        });
                        setUserRegistrationMap(map);
                    });
                } else {
                    setUserRegistrationMap(new Map());
                }
            });
        };

        listenToUserRegistrations();
        return () => unsubscribe();
    }, []);



    // ---------------------------------------------------------------------------
    // Firestore Synchronization with Query Optimization
    // ---------------------------------------------------------------------------
    useEffect(() => {
        // Optimized query: only fetch games from today onwards using Firestore query
        const todayISO = getTodayISO();

        // Use Firestore query to filter server-side
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
            // Priority: Cloud Auth > Local Storage
            if (auth.currentUser) {
                // Filter using Cloud Registrations
                result = result.filter(game => {
                    // Check if any role in this game is in our registration list
                    // The IDs in userRegistrationIds are "gameId_roleId"
                    const hasRole = game.roles.some(role =>
                        userRegistrationMap.has(`${game.id}_${role.id}`)
                    );
                    // Also check cloud carpools if we implement that later. For now, just roles.
                    // Or we can check if the game ID is present in the keys?
                    // Actually, let's keep it simple: if I have a registration token for this game.
                    return hasRole;
                });
            } else {
                // Fallback: Local Storage
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
    }, [sortedGames, selectedTeam, currentView]);



    // ---------------------------------------------------------------------------
    // Automatic Cleanup of Past Matches
    // ---------------------------------------------------------------------------
    useEffect(() => {
        const cleanupPastMatches = async () => {
            try {
                const todayISO = getTodayISO();
                const colRef = collection(db, "matches");
                // Optimized cleanup: only fetch past matches using Query
                const pastMatchesQuery = query(
                    colRef,
                    where("dateISO", "<", todayISO)
                );
                const snapshot = await getDocs(pastMatchesQuery);

                const matchesToDelete: string[] = [];

                // No need for client-side filtering anymore
                snapshot.docs.forEach(docSnap => {
                    matchesToDelete.push(docSnap.id);
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

        // Cloud Sync: If user is logged in, save to their profile
        if (auth.currentUser) {
            const userRegRef = doc(db, `users/${auth.currentUser.uid}/registrations`, `${gameId}_${roleId}`);
            await setDoc(userRegRef, {
                gameId,
                roleId,
                roleName: game.roles.find(r => r.id === roleId)?.name || 'Bénévole',
                gameDate: game.date, // Store formatted date for display
                gameDateISO: game.dateISO, // Store ISO date for sorting
                gameTime: game.time,
                location: game.location,
                team: game.team,
                opponent: game.opponent,
                createdAt: new Date().toISOString(),
                volunteerName: parentName // IMPORTANT: We perform the registration with this name
            });
        }
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

        // Cloud Sync: Only remove from profile if the name matches the user's registered name
        if (auth.currentUser) {
            const regKey = `${gameId}_${roleId}`;
            const registeredName = userRegistrationMap.get(regKey);

            if (registeredName === volunteerName) {
                const userRegRef = doc(db, `users/${auth.currentUser.uid}/registrations`, regKey);
                await deleteDoc(userRegRef);
            }
        }
    }, [games, userRegistrationMap]);

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

        // Cloud Sync: Update profile if the name matches
        if (auth.currentUser) {
            const regKey = `${gameId}_${roleId}`;
            const registeredName = userRegistrationMap.get(regKey);

            if (registeredName === oldName) {
                const userRegRef = doc(db, `users/${auth.currentUser.uid}/registrations`, regKey);
                await updateDoc(userRegRef, { volunteerName: newName });
            }
        }
    }, [games, userRegistrationMap]);

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
        userRegistrations: userRegistrationMap,
    };
};
