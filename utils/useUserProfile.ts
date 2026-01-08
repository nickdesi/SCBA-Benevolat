import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface UserProfile {
    favoriteTeams: string[];
}

export const useUserProfile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe = () => { };

        const listenToProfile = async () => {
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    const profileRef = doc(db, `users/${user.uid}/profile`, 'settings');

                    // Explicitly create profile document if it doesn't exist to avoid empty states
                    const docSnap = await getDoc(profileRef);
                    if (!docSnap.exists()) {
                        await setDoc(profileRef, { favoriteTeams: [] }, { merge: true });
                    }

                    unsubscribe = onSnapshot(profileRef, (snapshot) => {
                        if (snapshot.exists()) {
                            setProfile(snapshot.data() as UserProfile);
                        } else {
                            setProfile({ favoriteTeams: [] });
                        }
                        setLoading(false);
                    });
                } else {
                    setProfile(null);
                    setLoading(false);
                }
            });
        };

        listenToProfile();
        return () => unsubscribe();
    }, []);

    const updateFavoriteTeams = useCallback(async (teams: string[]) => {
        if (!auth.currentUser) return;
        const profileRef = doc(db, `users/${auth.currentUser.uid}/profile`, 'settings');
        await setDoc(profileRef, { favoriteTeams: teams }, { merge: true });
    }, []);

    const toggleFavoriteTeam = useCallback(async (team: string) => {
        if (!auth.currentUser || !profile) return;

        const currentTeams = profile.favoriteTeams || [];
        const isFavorite = currentTeams.includes(team);

        const newTeams = isFavorite
            ? currentTeams.filter(t => t !== team)
            : [...currentTeams, team];

        await updateFavoriteTeams(newTeams);
    }, [profile, updateFavoriteTeams]);

    return {
        profile,
        loading,
        updateFavoriteTeams,
        toggleFavoriteTeam,
        favoriteTeams: profile?.favoriteTeams || []
    };
};
