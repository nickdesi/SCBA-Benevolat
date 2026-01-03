import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    collection,
    query,
    onSnapshot,
    doc,
    runTransaction
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import type { Game, UserRegistration } from '../types';

/** Hook return type for better TypeScript inference */
interface UseVolunteersReturn {
    userRegistrations: UserRegistration[];
    userRegistrationsMap: Map<string, string>;
    handleVolunteer: (gameId: string, roleId: string, parentName: string) => Promise<void>;
    handleRemoveVolunteer: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    handleUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => Promise<void>;
}

export const useVolunteers = (): UseVolunteersReturn => {
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

    return {
        userRegistrations,
        userRegistrationsMap,
        handleVolunteer,
        handleRemoveVolunteer,
        handleUpdateVolunteer,
    };
}
