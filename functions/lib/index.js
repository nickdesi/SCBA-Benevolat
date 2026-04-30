"use strict";
/**
 * Cloud Functions for SCBA Bénévoles
 *
 * This file contains server-side logic that runs on Firebase infrastructure.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminClaim = exports.setAdminRole = exports.cleanupExpiredAnnouncements = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
/**
 * Scheduled function: Clean up expired announcements
 *
 * Runs every day at 2:00 AM (Europe/Paris timezone).
 * Deletes all documents in the "announcements" collection where expiresAt < now.
 */
exports.cleanupExpiredAnnouncements = (0, scheduler_1.onSchedule)({
    schedule: "0 2 * * *", // Cron: 2 AM daily
    timeZone: "Europe/Paris",
    retryCount: 3,
    region: "europe-west1", // Closest to France
}, async (event) => {
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
    }
    catch (error) {
        logger.error("Error during cleanup", { error });
        throw error; // Re-throw to trigger retry
    }
});
/**
 * Authentication Trigger: Set Admin Role
 *
 * Automatically assigns the 'admin' custom claim to specific users upon creation.
 * This replaces client-side email checks for better security.
 */
const functions = __importStar(require("firebase-functions/v1"));
exports.setAdminRole = functions
    .region("europe-west1")
    .auth.user()
    .onCreate(async (user) => {
    if (user.email === "benevole@scba.fr") {
        try {
            await admin.auth().setCustomUserClaims(user.uid, {
                admin: true,
            });
            logger.info(`Admin claim set for new user: ${user.email}`);
        }
        catch (error) {
            logger.error("Error setting admin claim", error);
        }
    }
});
/**
 * Callable Function: setAdminClaim
 *
 * Permet à l'utilisateur admin existant (non créé après la mise en place de setAdminRole)
 * d'obtenir son custom claim 'admin' sans intervention manuelle.
 * Accessible uniquement si l'email est 'benevole@scba.fr'.
 */
exports.setAdminClaim = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentification requise.");
    }
    const { email } = request.auth.token;
    if (email !== "benevole@scba.fr") {
        throw new https_1.HttpsError("permission-denied", "Non autorisé.");
    }
    if (request.auth.token.admin === true) {
        return { message: "Le claim admin est déjà défini." };
    }
    await admin.auth().setCustomUserClaims(request.auth.uid, { admin: true });
    logger.info(`Admin claim défini pour l'utilisateur existant: ${email}`);
    return { message: "Claim admin défini. Déconnectez-vous puis reconnectez-vous." };
});
//# sourceMappingURL=index.js.map