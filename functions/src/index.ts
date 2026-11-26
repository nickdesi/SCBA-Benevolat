/**
 * Cloud Functions for SCBA Bénévoles
 *
 * This file contains server-side logic that runs on Firebase infrastructure.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import {
    countMatchCarpoolEntries,
    countMatchVolunteers,
    groupDuplicateRecordIndices,
    mergeDuplicateMatchData,
} from "./matchDedup";

// Initialize Firebase Admin SDK
initializeApp();

const db = getFirestore();
const ADMIN_EMAIL = "benevole@scba.fr";

const isAdminRequest = (request: { auth?: { token: Record<string, unknown> } | null }): boolean => {
    const token = request.auth?.token;
    return token?.admin === true || (
        token?.email === ADMIN_EMAIL
    );
};

const commitDeleteChunks = async (documents: QueryDocumentSnapshot[]): Promise<void> => {
    for (let i = 0; i < documents.length; i += 500) {
        const batch = db.batch();
        documents.slice(i, i + 500).forEach((document) => batch.delete(document.ref));
        await batch.commit();
    }
};

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

        const now = Timestamp.now();

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

            await commitDeleteChunks(expiredSnapshot.docs);

            logger.info("Cleanup completed successfully", {
                deletedCount: expiredSnapshot.size,
            });
        } catch (error) {
            logger.error("Error during cleanup", { error });
            throw error; // Re-throw to trigger retry
        }
    }
);

/**
 * Scheduled function: Clean up past matches + deduplicate upcoming ones
 *
 * Runs every day at 3:00 AM (Europe/Paris timezone).
 * Phase 1: deletes all documents in the "matches" collection with dateISO < today.
 * Phase 2: collapses upcoming documents sharing the same ffbbMatchId or
 * the same logical match signature (including legacy documents without FFBB ID).
 * Survivor priority: document with participant data first, then most recently updated.
 * Same-day matches are kept (client hides them after tip-off + 2h30 buffer).
 * Documents without dateISO are ignored (handled separately, not auto-deleted).
 * Volunteer history is preserved: users/{uid}/registrations embed their own
 * snapshot (date, opponent, location), so deleting past matches loses nothing.
 */
export const cleanupPastMatches = onSchedule(
    {
        schedule: "0 3 * * *", // Cron: 3 AM daily
        timeZone: "Europe/Paris",
        retryCount: 3,
        region: "europe-west1",
    },
    async (event) => {
        logger.info("Starting cleanup of past matches", {
            scheduleTime: event.scheduleTime,
        });

        const todayISO = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
        const toDelete: QueryDocumentSnapshot[] = [];

        try {
            const pastSnapshot = await db
                .collection("matches")
                .where("dateISO", "<", todayISO)
                .get();

            pastSnapshot.docs.forEach((doc: QueryDocumentSnapshot) => toDelete.push(doc));
            logger.info("Past matches found", { count: pastSnapshot.size });

            // Deduplicate FFBB matches and legacy equivalents before deleting them.
            const upcomingSnapshot = await db
                .collection("matches")
                .where("dateISO", ">=", todayISO)
                .get();

            let duplicateCount = 0;
            const mergedSurvivors: Array<{
                document: QueryDocumentSnapshot;
                data: Record<string, unknown>;
            }> = [];
            const duplicateGroups = groupDuplicateRecordIndices(
                upcomingSnapshot.docs.map((document) => document.data())
            ).map((indices) => indices.map((index) => upcomingSnapshot.docs[index]));
            for (const group of duplicateGroups) {
                if (group.length < 2) continue;
                const sorted = [...group].sort((a, b) => {
                    const userDataDiff =
                        countMatchVolunteers(b.data()) + countMatchCarpoolEntries(b.data()) -
                        countMatchVolunteers(a.data()) - countMatchCarpoolEntries(a.data());
                    if (userDataDiff !== 0) return userDataDiff;
                    return b.updateTime.toMillis() - a.updateTime.toMillis();
                });

                const survivor = sorted[0];
                const chronological = [...group].sort((a, b) => {
                    const ffbbPriority =
                        Number(Boolean(a.data().ffbbMatchId)) -
                        Number(Boolean(b.data().ffbbMatchId));
                    if (ffbbPriority !== 0) return ffbbPriority;
                    return a.updateTime.toMillis() - b.updateTime.toMillis();
                });
                mergedSurvivors.push({
                    document: survivor,
                    data: mergeDuplicateMatchData(chronological.map((document) => document.data())),
                });

                for (const dup of sorted.slice(1)) {
                    toDelete.push(dup);
                    duplicateCount++;
                }
            }
            logger.info("Duplicate upcoming matches found", { count: duplicateCount });

            if (toDelete.length === 0) {
                logger.info("Nothing to clean up");
                return;
            }

            const writes: Array<
                | { kind: "set"; document: QueryDocumentSnapshot; data: Record<string, unknown> }
                | { kind: "delete"; document: QueryDocumentSnapshot }
            > = [
                ...mergedSurvivors.map(({ document, data }) => ({
                    kind: "set" as const,
                    document,
                    data,
                })),
                ...toDelete.map((document) => ({ kind: "delete" as const, document })),
            ];
            for (let i = 0; i < writes.length; i += 500) {
                const batch = db.batch();
                writes.slice(i, i + 500).forEach((write) => {
                    if (write.kind === "set") batch.set(write.document.ref, write.data);
                    else batch.delete(write.document.ref);
                });
                await batch.commit();
            }

            logger.info("Cleanup completed successfully", {
                deletedCount: toDelete.length,
                mergedCount: mergedSurvivors.length,
            });
        } catch (error) {
            logger.error("Error during past matches cleanup", { error });
            throw error; // Re-throw to trigger retry
        }
    }
);

/**
 * Authentication Trigger: Set Admin Role
 *
 * Automatically assigns the 'admin' custom claim to specific users upon creation.
 * This replaces client-side email checks for better security.
 */
import * as functions from "firebase-functions/v1";

export const setAdminRole = functions
    .region("europe-west1")
    .auth.user()
    .onCreate(async (user) => {
        if (user.email === ADMIN_EMAIL) {
            try {
                await getAuth().setCustomUserClaims(user.uid, {
                    admin: true,
                });
                logger.info(`Admin claim set for new user: ${user.email}`);
            } catch (error) {
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
export const setAdminClaim = onCall(
    { region: "europe-west1" },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Authentification requise.");
        }
        const { email } = request.auth.token;
        if (email !== ADMIN_EMAIL) {
            throw new HttpsError("permission-denied", "Non autorisé.");
        }
        if (request.auth.token.admin === true) {
            return { message: "Le claim admin est déjà défini." };
        }
        await getAuth().setCustomUserClaims(request.auth.uid, { admin: true });
        logger.info(`Admin claim défini pour l'utilisateur existant: ${email}`);
        return { message: "Claim admin défini. Déconnectez-vous puis reconnectez-vous." };
    }
);

/**
 * Callable Function: fetchFFBBMatches
 *
 * Récupère en direct depuis l'API officielle FFBB toutes les rencontres du SCBA (9326),
 * leurs horaires, adresses précises de salles et logos officiels.
 */
const SCBA_ORGANISME_ID = 9326;
const SCBA_LOGO_URL = "https://bo.ffbb.com/assets/2784a7b8-1c06-4334-aa6e-16a371475971";

const WEEKDAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function formatFrenchDate(isoDateStr: string): string {
    if (!isoDateStr) return "";
    const parts = isoDateStr.split("-");
    if (parts.length !== 3) return isoDateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month - 1, day);
    const weekday = WEEKDAYS_FR[(d.getDay() + 6) % 7];
    return `${weekday} ${day} ${MONTHS_FR[month - 1]} ${year}`;
}

function normalizeScbaTeam(teamRaw: string, compName: string = ""): string {
    const raw = (teamRaw || "").toUpperCase().trim();
    const comp = (compName || "").toUpperCase().trim();
    const combined = `${raw} ${comp}`.trim();

    let gender = "M";
    if (combined.includes("MIXTE") || combined.includes("MIXED") || /\bDXU\d+/.test(combined)) {
        gender = "MIXTE";
    } else if (/\b(FEMININ|FÉMININ|FEMININE|FÉMININE|NF\d*|RF\d*|DF\d*|PNF|PRF|U\d+F\d*|SENIOR F\d*|SF\d*)\b/.test(combined)) {
        gender = "F";
    }

    const mCat = raw.match(/U\s*(\d+)/i) || comp.match(/U\s*(\d+)/i);
    if (mCat) {
        const cat = `U${mCat[1]}`;
        const mNum = raw.match(/[- ](\d+)$/);
        let num = mNum ? mNum[1] : "1";
        if (comp.includes("REGIONALE") || comp.includes("RÉGIONALE") || comp.includes("DIVISION 10") || comp.includes("COUPE") || comp.includes("BRASSAGE")) {
            num = "1";
        }
        if (gender === "MIXTE") {
            return num === "1" ? `${cat} MIXTE` : `${cat} MIXTE ${num}`;
        }
        return `${cat} ${gender}${num}`;
    }

    const mNum = raw.match(/[- ](\d+)$/);
    let num = mNum ? mNum[1] : "";
    if (!num) {
        if (comp.includes("RM2") || comp.includes("RF2") || comp.includes("DIVISION 2")) num = "2";
        else if (comp.includes("RM3") || comp.includes("RF3") || comp.includes("DIVISION 3")) num = "3";
        else if (comp.includes("PNM") || comp.includes("PNF") || comp.includes("PRE NATIONALE") || comp.includes("PRÉ NATIONALE")) num = "1";
        else num = "1";
    }
    return `SENIOR ${gender}${num}`;
}

function cleanOpponentName(raw: string): string {
    if (!raw) return "Adversaire Inconnu";
    return raw.replace(/^(IE\s*[-]?\s*|CTC\s*[-]?\s*)/i, "").trim();
}

const DEFAULT_MEILISEARCH_TOKEN =
    "98f07e4d3869853c218a0f65edce2ae56cc670728d9bcb8b035a5107ce1b55dc";
const SCBA_CLUB_CODE = "ARA0063074";

export const fetchFFBBMatches = onCall(
    { region: "europe-west1" },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Authentification requise pour importer les matchs.");
        }
        if (!isAdminRequest(request)) {
            throw new HttpsError("permission-denied", "Import réservé aux administrateurs.");
        }

        const teamFilter = (request.data?.team as string | undefined)?.toUpperCase().trim();
        logger.info("Fetching FFBB Matches for SCBA", { teamFilter });

        // 1. Source primaire : API Cache-First ffbb-api.desimone.fr (Meilisearch-first, 0 Directus)
        try {
            const proxyUrl = new URL(`https://ffbb-api.desimone.fr/api/v1/club/${SCBA_ORGANISME_ID}/matches`);
            if (teamFilter && teamFilter !== "ALL") {
                proxyUrl.searchParams.set("team", teamFilter);
            }
            const proxyRes = await fetch(proxyUrl.toString(), {
                headers: { "Accept": "application/json" },
                signal: AbortSignal.timeout(10000),
            });
            if (proxyRes.ok) {
                const proxyJson = await proxyRes.json();
                if (Array.isArray(proxyJson?.matches)) {
                    logger.info("FFBB Matches fetched via ffbb-api.desimone.fr", { count: proxyJson.matches.length });
                    return {
                        matches: proxyJson.matches,
                        count: proxyJson.matches.length,
                    };
                }
            }
        } catch (proxyErr) {
            logger.warn("ffbb-api.desimone.fr indisponible, bascule sur Meilisearch direct", { error: proxyErr });
        }

        // 2. Fallback direct Meilisearch FFBB (sans WAF BunnyCDN ni Directus)
        try {
            const msToken = process.env.MEILISEARCH_BEARER_TOKEN || DEFAULT_MEILISEARCH_TOKEN;
            const msRes = await fetch("https://meilisearch-prod.ffbb.app/indexes/ffbbserver_rencontres/search", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${msToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    q: "",
                    filter: `idOrganismeEquipe1.code = "${SCBA_CLUB_CODE}" OR idOrganismeEquipe2.code = "${SCBA_CLUB_CODE}"`,
                    limit: 500,
                }),
                signal: AbortSignal.timeout(10000),
            });
            if (!msRes.ok) {
                throw new Error(`Meilisearch FFBB error (HTTP ${msRes.status})`);
            }
            const msJson = await msRes.json();
            const hits: any[] = Array.isArray(msJson?.hits) ? msJson.hits : [];
            const todayISO = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
            const matchesList: any[] = [];

            for (const m of hits) {
                const matchId = String(m?.id || "");
                if (!matchId) continue;

                const org1 = m?.idOrganismeEquipe1 || {};
                const isHome = org1?.code === SCBA_CLUB_CODE;
                const nomEq1 = m?.nomEquipe1 || "";
                const nomEq2 = m?.nomEquipe2 || "";
                const compNom = m?.competitionId?.nom || "";
                const scbaTeam = normalizeScbaTeam(isHome ? nomEq1 : nomEq2, compNom);
                const opponent = cleanOpponentName(isHome ? nomEq2 : nomEq1);

                if (teamFilter && teamFilter !== "ALL" && !scbaTeam.toUpperCase().includes(teamFilter)) {
                    continue;
                }

                const dateRaw = String(m?.date_rencontre || m?.date || "");
                const dateISO = /^\d{4}-\d{2}-\d{2}/.test(dateRaw) ? dateRaw.substring(0, 10) : "";
                if (dateISO && dateISO < todayISO) {
                    continue;
                }

                let timeStr = "15:00";
                const horaire = String(m?.horaire || "");
                if (horaire) {
                    const hClean = horaire.replace(/[hH:]/g, "").trim();
                    if (hClean.length === 4) timeStr = `${hClean.substring(0, 2)}:${hClean.substring(2)}`;
                    else if (hClean.length === 2) timeStr = `${hClean}:00`;
                } else if (dateRaw.length >= 16 && dateRaw.includes("T")) {
                    timeStr = dateRaw.substring(11, 16);
                }

                const salleLibelle = m?.salle?.libelle || m?.salle?.nom || "";
                const location = salleLibelle || (isHome ? "Maison des Sports, Place des Bughes, 63000 Clermont-Ferrand" : `Extérieur (${opponent})`);

                matchesList.push({
                    ffbbMatchId: matchId,
                    team: scbaTeam,
                    opponent,
                    date: formatFrenchDate(dateISO),
                    dateISO,
                    time: timeStr,
                    location,
                    isHome,
                    competition: compNom,
                    teamLogo: SCBA_LOGO_URL,
                });
            }

            matchesList.sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.time.localeCompare(b.time));
            logger.info("FFBB Matches fetched via Meilisearch fallback", { count: matchesList.length });
            return {
                matches: matchesList,
                count: matchesList.length,
            };
        } catch (error: any) {
            logger.error("Error fetching FFBB matches", { error: error?.message || error });
            throw new HttpsError("internal", error?.message || "Impossible de récupérer les matchs FFBB.");
        }
    }
);
