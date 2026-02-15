import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../utils/userStore';

// Singleton state to share avatars across all components
let globalAvatars: Record<string, string> = {};
let listeners: ((avatars: Record<string, string>) => void)[] = [];
let unsubscribeFirestore: (() => void) | null = null;

const subscribeToFirestore = () => {
    if (unsubscribeFirestore) return; // Already subscribed

    const q = query(collection(db, 'users'));
    unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const newAvatars: Record<string, string> = {};
        snapshot.forEach((doc) => {
            const data = doc.data() as UserProfile;
            if (data.displayName && data.photoURL) {
                newAvatars[data.displayName] = data.photoURL;
            }
        });
        globalAvatars = newAvatars;
        // Notify all active listeners
        listeners.forEach(listener => listener(globalAvatars));
    });
};

const unsubscribeFromFirestore = () => {
    if (listeners.length === 0 && unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
    }
};

export const useAvatars = () => {
    const [avatars, setAvatars] = useState<Record<string, string>>(globalAvatars);

    useEffect(() => {
        // Register listener for this component
        const listener = (newAvatars: Record<string, string>) => {
            setAvatars(newAvatars);
        };
        listeners.push(listener);

        // Ensure Firestore connection is active
        if (!unsubscribeFirestore) {
            subscribeToFirestore();
        } else {
            // Immediate update in case we missed one
            setAvatars(globalAvatars);
        }

        return () => {
            // Unregister listener
            listeners = listeners.filter(l => l !== listener);

            // Clean up Firestore connection if no more components are interested
            // Optional: Debounce this to avoid rapid connect/disconnect
            if (listeners.length === 0) {
                unsubscribeFromFirestore();
            }
        };
    }, []);

    const getAvatar = (name: string): string | undefined => {
        return avatars[name];
    };

    return { getAvatar };
};
