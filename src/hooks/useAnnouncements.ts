import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Announcement } from '../types';
import { cleanupExpiredAnnouncements } from '../utils/cleanupExpiredAnnouncements';

export function useAnnouncements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cleanupExpiredAnnouncements().catch((error) => {
            console.error('[useAnnouncements] Cleanup error:', error);
        });

        const q = query(
            collection(db, 'announcements'),
            where('active', '==', true),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Announcement[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data() as Omit<Announcement, 'id'>;
                // Client-side expiration check to be safe and avoid index issues for now
                if (data.expiresAt?.toMillis() > Date.now()) {
                    items.push({ id: doc.id, ...data });
                }
            });

            // Sort: Urgent first, then Warning, then Info
            items.sort((a, b) => {
                const priority = { urgent: 3, warning: 2, info: 1 };
                const diff = priority[b.type] - priority[a.type];
                if (diff !== 0) return diff;
                // If same priority, newest first (already sorted by query or fallback)
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            });

            setAnnouncements(items);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching announcements:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { announcements, loading };
}
