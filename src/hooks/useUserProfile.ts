import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface UserProfile {
  favoriteTeams: string[];
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = () => {};
    // Incremented on every auth change so a pending getDoc/setDoc from a previous
    // user cannot attach a listener after sign-out (would trigger permission-denied).
    let authGeneration = 0;

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      unsubscribeSnapshot();
      unsubscribeSnapshot = () => {};
      const generation = ++authGeneration;

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const profileRef = doc(db, `users/${user.uid}/profile`, 'settings');

      try {
        // Explicitly create profile document if it doesn't exist to avoid empty states
        const docSnap = await getDoc(profileRef);
        if (!docSnap.exists()) {
          await setDoc(profileRef, { favoriteTeams: [] }, { merge: true });
        }
      } catch (error) {
        console.warn('[useUserProfile] Profile init error:', error);
      }

      if (generation !== authGeneration) return;

      unsubscribeSnapshot = onSnapshot(
        profileRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            setProfile({ favoriteTeams: [] });
          }
          setLoading(false);
        },
        (error) => {
          console.warn('[useUserProfile] Snapshot error:', error.code || error.message);
          setLoading(false);
        },
      );
    });

    return () => {
      authGeneration++;
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  const updateFavoriteTeams = useCallback(async (teams: string[]) => {
    if (!auth.currentUser) return;
    const profileRef = doc(db, `users/${auth.currentUser.uid}/profile`, 'settings');
    await setDoc(profileRef, { favoriteTeams: teams }, { merge: true });
  }, []);

  const toggleFavoriteTeam = useCallback(
    async (team: string) => {
      if (!auth.currentUser || !profile) return;

      const currentTeams = profile.favoriteTeams || [];
      const isFavorite = currentTeams.includes(team);

      const newTeams = isFavorite
        ? currentTeams.filter((t) => t !== team)
        : [...currentTeams, team];

      await updateFavoriteTeams(newTeams);
    },
    [profile, updateFavoriteTeams],
  );

  return {
    profile,
    loading,
    updateFavoriteTeams,
    toggleFavoriteTeam,
    favoriteTeams: profile?.favoriteTeams || [],
  };
};
