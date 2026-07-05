import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Announcement } from '../types';

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Server-side expiration filter: only active announcements not yet expired.
    // The expired-announcements cleanup is handled by the Cloud Function cron
    // (cleanupExpiredAnnouncements), no need to run it client-side.
    const q = query(
      collection(db, 'announcements'),
      where('active', '==', true),
      where('expiresAt', '>', Timestamp.now()),
      orderBy('expiresAt', 'asc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Announcement[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<Announcement, 'id'>;
          items.push({ id: doc.id, ...data });
        });

        // Sort: Urgent first, then Warning, then Info
        items.sort((a, b) => {
          const priority = { urgent: 3, warning: 2, info: 1 };
          const diff = priority[b.type] - priority[a.type];
          if (diff !== 0) return diff;
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        });

        setAnnouncements(items);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching announcements:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { announcements, loading };
}
