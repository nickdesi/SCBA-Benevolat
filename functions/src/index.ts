/**
 * Cloud Functions for SCBA Bénévoles
 *
 * This file contains server-side logic that runs on Firebase infrastructure.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

/**
 * Scheduled function: Clean up expired announcements
 *
 * Runs every day at 2:00 AM (Europe/Paris timezone).
 * Deletes all documents in the "announcements" collection where expiresAt < now.
 */
export const cleanupExpiredAnnouncements = onSchedule(
    {
        schedule: "0 2 * * *", // Cron: 2 AM daily
        timeZone: "Europe/Paris",
        retryCount: 3,
        region: "europe-west1", // Closest to France
    },
    async (event) => {
        logger.info("Starting cleanup of expired announcements", {
            scheduleTime: event.scheduleTime,
        });

        const now = admin.firestore.Timestamp.now();

        try {
            // Query for expired announcements
            const expiredSnapshot = await db
                .collection("announcements")
                .where("expiresAt", "<", now)
                .get();

            if (expiredSnapshot.empty) {
                logger.info("No expired announcements found");
                return;
            }

            // Batch delete (max 500 per batch)
            const batch = db.batch();
            expiredSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();

            logger.info("Cleanup completed successfully", {
                deletedCount: expiredSnapshot.size,
            });
        } catch (error) {
            logger.error("Error during cleanup", { error });
            throw error; // Re-throw to trigger retry
        }
    }
);
