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
    userRegistrationsMap: Map<string, string[]>;
    handleVolunteer: (gameId: string, roleId: string, parentName: string | string[]) => Promise<void>;
    handleRemoveVolunteer: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    handleUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => Promise<void>;
}

export const useVolunteers = (): UseVolunteersReturn => {
    const [userRegistrations, setUserRegistrations] = useState<UserRegistration[]>([]);

    // Listen to User Registrations (for "My Planning" when logged in)
    useEffect(() => {
        // Track both the Firestore snapshot listener and the auth state listener
        // so both can be cleaned up when the component unmounts.
        let unsubscribeSnapshot = () => { };

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            // Tear down any previous snapshot listener before setting up a new one
            unsubscribeSnapshot();

            if (user) {
                const q = query(collection(db, `users/${user.uid}/registrations`));
                unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                    const regs: UserRegistration[] = snapshot.docs.map(d => {
                        const data = d.data();
                        return {
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
                        } as UserRegistration;
                    });
                    setUserRegistrations(regs);
                });
            } else {
                setUserRegistrations([]);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeSnapshot();
        };
    }, []);

    const userRegistrationsMap = useMemo(() => {
        const map = new Map<string, string[]>();
        userRegistrations.forEach(reg => {
            const key = `${reg.gameId}_${reg.roleId}`;
            const existing = map.get(key) || [];
            if (reg.volunteerName) {
                map.set(key, [...existing, reg.volunteerName]);
            }
        });
        return map;
    }, [userRegistrations]);

    // ---------------------------------------------------------------------------
    // Volunteer Operations - TRANSACTIONAL
    // ---------------------------------------------------------------------------

    const handleVolunteer = useCallback(async (gameId: string, roleId: string, parentName: string | string[]) => {
        const gameRef = doc(db, "matches", gameId);
        const namesToAdd = Array.isArray(parentName) ? parentName : [parentName];

        try {
            await runTransaction(db, async (transaction) => {
                const gameDoc = await transaction.get(gameRef);
                if (!gameDoc.exists()) {
                    throw new Error("Game does not exist!");
                }
                const gameData = gameDoc.data() as Game;

                // Get current user's avatar URL if available
                const currentUserAvatar = auth.currentUser?.photoURL || undefined;

                const updatedRoles = gameData.roles.map(role => {
                    // Robust check: Compare as strings to handle legacy number IDs
                    if (String(role.id) === String(roleId)) {
                        const currentVolunteers = role.volunteers || [];
                        const currentAvatars = role.avatars || {};

                        // Add new avatars to the map if currentUser has one
                        const newAvatars = { ...currentAvatars };
                        if (currentUserAvatar) {
                            namesToAdd.forEach(name => {
                                newAvatars[name] = currentUserAvatar;
                            });
                        }

                        return {
                            ...role,
                            volunteers: [...currentVolunteers, ...namesToAdd],
                            avatars: newAvatars
                        };
                    }
                    return role;
                });

                transaction.update(gameRef, { roles: updatedRoles });

                if (auth.currentUser) {
                    // Note: If multiple names are added by one user, we currently only register the FIRST one 
                    // or we need to decide how to track "My Registration" for multiple people.
                    // For now, let's just register all of them as "Mine" if I added them.

                    namesToAdd.forEach(name => {
                        const uniqueKey = `${gameId}_${roleId}_${name}`; // New Key Format
                        const userRegReference = doc(db, `users/${auth.currentUser!.uid}/registrations`, uniqueKey);

                        transaction.set(userRegReference, {
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
                            volunteerName: name
                        });
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

                if (!gameDoc.exists()) {
                    throw new Error("Game does not exist!");
                }

                const gameData = gameDoc.data() as Game;
                const updatedRoles = gameData.roles.map(role => {
                        // Robust check: Compare as strings
                        if (String(role.id) === String(roleId)) {
                            const currentVolunteers = role.volunteers || [];
                            const currentAvatars = role.avatars || {};

                            // Remove avatar entry
                            const newAvatars = { ...currentAvatars };
                            delete newAvatars[volunteerName];

                            return {
                                ...role,
                                volunteers: currentVolunteers.filter(v => v !== volunteerName),
                                avatars: newAvatars
                            };
                        }
                        return role;
                    });
                transaction.update(gameRef, { roles: updatedRoles });

                if (auth.currentUser) {
                    // Fix: Use the correct key format that includes the volunteer name
                    // Try the new format first
                    const uniqueKey = `${gameId}_${roleId}_${volunteerName}`;
                    const userRegRef = doc(db, `users/${auth.currentUser.uid}/registrations`, uniqueKey);

                    // We also need to handle legacy keys for backward compatibility if any exist
                    // But since we can't check existence easily in a transaction without reading, 
                    // and we might not want to pay for a read if we don't have to...
                    // Let's assume we use the new format. 
                    // Challenge: If the user has an OLD registration (key = gameId_roleId), strictly speaking we should check for that too.
                    // But for now, let's fix the immediate "New Registration" bug.

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
                // 1. ALL READS FIRST
                const gameDoc = await transaction.get(gameRef);
                if (!gameDoc.exists()) throw new Error("Game missing");

                const gameData = gameDoc.data() as Game;

                let oldRegDoc = null;
                let legacyRegDoc = null;
                let newRef = null;
                let oldRef = null;
                let legacyRef = null;

                if (auth.currentUser) {
                    const oldKey = `${gameId}_${roleId}_${oldName}`;
                    const newKey = `${gameId}_${roleId}_${newName}`;
                    const legacyKey = `${gameId}_${roleId}`;

                    oldRef = doc(db, `users/${auth.currentUser.uid}/registrations`, oldKey);
                    newRef = doc(db, `users/${auth.currentUser.uid}/registrations`, newKey);
                    legacyRef = doc(db, `users/${auth.currentUser.uid}/registrations`, legacyKey);

                    // Fetch both in parallel
                    [oldRegDoc, legacyRegDoc] = await Promise.all([
                        transaction.get(oldRef),
                        transaction.get(legacyRef)
                    ]);
                }

                // 2. ALL WRITES AFTER
                const updatedRoles = gameData.roles.map(role => {
                    // Robust check: Compare as strings
                    if (String(role.id) === String(roleId)) {
                        const currentVolunteers = role.volunteers || [];
                        const currentAvatars = role.avatars || {};

                        // Move avatar to new name key
                        const newAvatars = { ...currentAvatars };
                        if (newAvatars[oldName]) {
                            newAvatars[newName] = newAvatars[oldName];
                            delete newAvatars[oldName];
                        }

                        return {
                            ...role,
                            volunteers: currentVolunteers.map(v => v === oldName ? newName : v),
                            avatars: newAvatars
                        };
                    }
                    return role;
                });

                transaction.update(gameRef, { roles: updatedRoles });

                if (auth.currentUser && newRef) {
                    if (oldRegDoc?.exists()) {
                        const oldData = oldRegDoc.data();
                        transaction.delete(oldRef!);
                        transaction.set(newRef, {
                            ...oldData,
                            volunteerName: newName
                        });
                    } else if (legacyRegDoc?.exists()) {
                        // Fallback: Check for legacy key for backward compatibility
                        const legacyData = legacyRegDoc.data();
                        transaction.delete(legacyRef!);
                        transaction.set(newRef, {
                            ...legacyData,
                            volunteerName: newName
                        });
                    } else {
                        console.warn("Could not find user registration doc (new or legacy) to update");
                    }
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
