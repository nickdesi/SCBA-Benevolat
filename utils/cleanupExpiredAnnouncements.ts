import { collection, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const CLEANUP_THROTTLE_KEY = 'lastAnnouncementCleanup';
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Supprime les annonces expirées de Firestore
 * Throttled pour s'exécuter maximum une fois par jour
 * @returns Le nombre de documents supprimés, ou null si le cleanup a été throttled
 */
export async function cleanupExpiredAnnouncements(): Promise<number | null> {
    // Vérifier le throttle
    const lastCleanup = localStorage.getItem(CLEANUP_THROTTLE_KEY);
    const now = Date.now();

    if (lastCleanup) {
        const timeSinceLastCleanup = now - parseInt(lastCleanup, 10);
        if (timeSinceLastCleanup < CLEANUP_INTERVAL_MS) {
            console.log('[Cleanup] Skipped - cleanup ran recently');
            return null;
        }
    }

    try {
        // Query pour les annonces expirées
        const expiredQuery = query(
            collection(db, 'announcements'),
            where('expiresAt', '<', Timestamp.now())
        );

        const snapshot = await getDocs(expiredQuery);

        if (snapshot.empty) {
            console.log('[Cleanup] No expired announcements to delete');
            localStorage.setItem(CLEANUP_THROTTLE_KEY, now.toString());
            return 0;
        }

        // Supprimer en batch (max 500 par batch)
        const batch = writeBatch(db);
        let count = 0;

        snapshot.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });

        await batch.commit();

        console.log(`[Cleanup] Deleted ${count} expired announcement(s)`);
        localStorage.setItem(CLEANUP_THROTTLE_KEY, now.toString());

        return count;
    } catch (error) {
        console.error('[Cleanup] Error deleting expired announcements:', error);
        return null;
    }
}
