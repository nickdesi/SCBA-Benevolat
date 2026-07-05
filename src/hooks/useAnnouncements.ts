import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Announcement } from '../types';

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query on `active == true` only: no composite index required (the
    // (active, createdAt) index already exists). Expired announcements are
    // filtered client-side; their physical deletion is handled by the
    // Cloud Function cron `cleanupExpiredAnnouncements`.
    const q = query(
      collection(db, 'announcements'),
      where('active', '==', true),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const items: Announcement[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<Announcement, 'id'>;
          // Client-side expiration check (server-side would require an extra index)
          if (data.expiresAt?.toMillis() > now) {
            items.push({ id: doc.id, ...data });
          }
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
