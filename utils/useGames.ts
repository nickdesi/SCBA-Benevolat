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
    setDoc,
    runTransaction
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { DEFAULT_ROLES } from '../constants';
import type { Game, GameFormData, CarpoolEntry, UserRegistration } from '../types';
import { getGameDateValue, getTodayISO } from './dateUtils';
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
    const [userRegistrations, setUserRegistrations] = useState<UserRegistration[]>([]);

    // Listen to User Registrations (for "My Planning" when logged in)
    useEffect(() => {
        let unsubscribe = () => { };

        const listenToUserRegistrations = async () => {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    const q = query(collection(db, `users/${user.uid}/registrations`));
                    unsubscribe = onSnapshot(q, (snapshot) => {
                        const regs: UserRegistration[] = [];
                        snapshot.docs.forEach(d => {
                            const data = d.data();
                            regs.push({
                                id: d.id,
                                gameId: data.gameId,
                                roleId: data.roleId,
                                roleName: data.roleName,
                                gameDate: data.gameDate,
                                gameDateISO: data.gameDateISO,
                                gameTime: data.gameTime,
                                location: data.location,
                                team: data.team,
                                opponent: data.opponent,
                                volunteerName: data.volunteerName,
                                isValid: true
                            } as UserRegistration);
                        });
                        setUserRegistrations(regs);
                    });
                } else {
                    setUserRegistrations([]);
                }
            });
        };

        listenToUserRegistrations();
        return () => unsubscribe();
    }, []);

    const userRegistrationsMap = useMemo(() => {
        const map = new Map<string, string>();
        userRegistrations.forEach(reg => {
            map.set(`${reg.gameId}_${reg.roleId}`, reg.volunteerName || "");
        });
        return map;
    }, [userRegistrations]);

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
        if (typeof window !== 'undefined' && window.confirm('Voulez-vous vraiment supprimer ce match ?')) {
            await deleteDoc(doc(db, "matches", gameId));
            return true;
        }
        return false;
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

    // ---------------------------------------------------------------------------
    // Volunteer Operations - TRANSACTIONAL
    // ---------------------------------------------------------------------------

    const handleVolunteer = useCallback(async (gameId: string, roleId: string, parentName: string) => {
        const gameRef = doc(db, "matches", gameId);

        try {
            await runTransaction(db, async (transaction) => {
                const gameDoc = await transaction.get(gameRef);
                if (!gameDoc.exists()) {
                    throw new Error("Game does not exist!");
                }
                const gameData = gameDoc.data() as Game;

                const updatedRoles = gameData.roles.map(role => {
                    if (role.id === roleId) {
                        return { ...role, volunteers: [...role.volunteers, parentName] };
                    }
                    return role;
                });

                transaction.update(gameRef, { roles: updatedRoles });

                if (auth.currentUser) {
                    const userRegRef = doc(db, `users/${auth.currentUser.uid}/registrations`, `${gameId}_${roleId}`);
                    transaction.set(userRegRef, {
                        gameId,
                        roleId,
                        roleName: gameData.roles.find(r => r.id === roleId)?.name || 'Bénévole',
                        gameDate: gameData.date,
                        gameDateISO: gameData.dateISO,
                        gameTime: gameData.time,
                        location: gameData.location,
                        team: gameData.team,
                        opponent: gameData.opponent,
                        createdAt: new Date().toISOString(),
                        volunteerName: parentName
                    });
                }
            });
        } catch (e) {
            console.error("Transaction failed: ", e);
            throw e;
        }
    }, []);

    const handleRemoveVolunteer = useCallback(async (gameId: string, roleId: string, volunteerName: string) => {
        const gameRef = doc(db, "matches", gameId);

        try {
            await runTransaction(db, async (transaction) => {
                const gameDoc = await transaction.get(gameRef);

                if (gameDoc.exists()) {
                    const gameData = gameDoc.data() as Game;
                    const updatedRoles = gameData.roles.map(role => {
                        if (role.id === roleId) {
                            return { ...role, volunteers: role.volunteers.filter(v => v !== volunteerName) };
                        }
                        return role;
                    });
                    transaction.update(gameRef, { roles: updatedRoles });
                }

                if (auth.currentUser) {
                    const regKey = `${gameId}_${roleId}`;
                    const userRegRef = doc(db, `users/${auth.currentUser.uid}/registrations`, regKey);
                    transaction.delete(userRegRef);
                }
            });
        } catch (e) {
            console.error("Remove Transaction failed: ", e);
            throw e;
        }
    }, []);

    const handleUpdateVolunteer = useCallback(async (gameId: string, roleId: string, oldName: string, newName: string) => {
        const gameRef = doc(db, "matches", gameId);

        try {
            await runTransaction(db, async (transaction) => {
                const gameDoc = await transaction.get(gameRef);
                if (!gameDoc.exists()) throw "Game missing";

                const gameData = gameDoc.data() as Game;
                const updatedRoles = gameData.roles.map(role => {
                    if (role.id === roleId) {
                        return {
                            ...role,
                            volunteers: role.volunteers.map(v => v === oldName ? newName : v)
                        };
                    }
                    return role;
                });

                transaction.update(gameRef, { roles: updatedRoles });

                if (auth.currentUser) {
                    const regKey = `${gameId}_${roleId}`;
                    const userRegRef = doc(db, `users/${auth.currentUser.uid}/registrations`, regKey);
                    transaction.update(userRegRef, { volunteerName: newName });
                }
            });
        } catch (e) {
            console.error("Update Transaction failed", e);
            throw e;
        }
    }, []);

    const handleAddCarpool = useCallback(async (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => {
        const gameRef = doc(db, "matches", gameId);
        await runTransaction(db, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw "Game missing";
            const gameData = gameDoc.data() as Game;

            const newEntry: CarpoolEntry = { ...entry, id: crypto.randomUUID() };
            const updatedCarpool = [...(gameData.carpool || []), newEntry];

            transaction.update(gameRef, { carpool: updatedCarpool });
        });
    }, []);

    const handleRemoveCarpool = useCallback(async (gameId: string, entryId: string) => {
        const gameRef = doc(db, "matches", gameId);
        await runTransaction(db, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw "Game missing";
            const gameData = gameDoc.data() as Game;

            const updatedCarpool = (gameData.carpool || []).filter(e => e.id !== entryId);

            transaction.update(gameRef, { carpool: updatedCarpool });
        });
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
