import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Announcement } from '../types';

export function useAnnouncements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Note: Cleanup of expired announcements is now handled server-side
        // by Cloud Functions (cleanupExpiredAnnouncements - runs daily at 2 AM)

        // Query active announcements that haven't expired
        // Note: In a real app with strict index requirements, we might need composite indexes.
        // For now, client-side filtering of expiration is safer if indexes aren't ready,
        // but let's try strict query first.

        const now = Timestamp.now();
        const q = query(
            collection(db, 'announcements'),
            where('active', '==', true),
            // where('expiresAt', '>', now), // Requires composite index usually
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
