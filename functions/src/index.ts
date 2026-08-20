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

// Initialize Firebase Admin SDK
initializeApp();

const db = getFirestore();

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

            // Batch delete (max 500 per batch)
            const batch = db.batch();
            expiredSnapshot.docs.forEach((doc: QueryDocumentSnapshot) => batch.delete(doc.ref));
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
        if (user.email === "benevole@scba.fr") {
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
        if (email !== "benevole@scba.fr") {
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
const SCBA_LOGO_URL = "https://api.ffbb.com/assets/2784a7b8-1c06-4334-aa6e-16a371475971";

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

    const mCat = raw.match(/U\s*(\d+)/i) || comp.match(/U\s*(\d+)/i);
    if (mCat) {
        const cat = mCat[1];
        const mNum = raw.match(/[- ](\d+)$/);
        const num = mNum ? mNum[1] : "1";
        return `U${cat} M${num}`;
    }

    const mNum = raw.match(/[- ](\d+)$/);
    let num = mNum ? mNum[1] : "";
    if (!num) {
        if (comp.includes("RM2") || comp.includes("DIVISION 2")) num = "2";
        else if (comp.includes("RM3") || comp.includes("DIVISION 3")) num = "3";
        else if (comp.includes("PNM") || comp.includes("PRE NATIONALE") || comp.includes("PRÉ NATIONALE")) num = "1";
        else num = "1";
    }
    return `SENIOR M${num}`;
}

function cleanOpponentName(raw: string): string {
    if (!raw) return "Adversaire Inconnu";
    return raw.replace(/^(IE\s*[-]?\s*|CTC\s*[-]?\s*)/i, "").trim();
}

export const fetchFFBBMatches = onCall(
    { region: "europe-west1" },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Authentification requise pour importer les matchs.");
        }

        const teamFilter = (request.data?.team as string | undefined)?.toUpperCase().trim();
        logger.info("Fetching FFBB Matches for SCBA", { teamFilter });

        try {
            // 1. Récupération du token dynamique FFBB
            const configRes = await fetch("https://api.ffbb.app/items/configuration", {
                headers: { "User-Agent": "okhttp/4.12.0" }
            });
            if (!configRes.ok) {
                throw new Error(`Échec de récupération de la configuration FFBB (status: ${configRes.status})`);
            }
            const configJson = await configRes.json();
            const bearerToken = configJson?.data?.key_dh;
            if (!bearerToken) {
                throw new Error("Token d'authentification FFBB introuvable.");
            }

            const ffbbHeaders = {
                "User-Agent": "okhttp/4.12.0",
                "Authorization": `Bearer ${bearerToken}`
            };

            // 2. Récupération des engagements du SCBA
            const orgRes = await fetch(`https://api.ffbb.app/items/ffbbserver_organismes/${SCBA_ORGANISME_ID}?fields=*.*`, {
                headers: ffbbHeaders
            });
            if (!orgRes.ok) {
                throw new Error(`Échec de récupération du club SCBA (status: ${orgRes.status})`);
            }
            const orgJson = await orgRes.json();
            const engagements = orgJson?.data?.engagements || [];

            const matchesList: any[] = [];
            const seenMatchIds = new Set<string>();
            const salleCache: Record<string, string> = {};
            const logoCache: Record<string, string | null> = {
                [String(SCBA_ORGANISME_ID)]: SCBA_LOGO_URL
            };

            // 3. Parcours de chaque poule
            for (const eng of engagements) {
                const pouleId = eng?.idPoule?.id || (typeof eng?.idPoule === "string" || typeof eng?.idPoule === "number" ? eng.idPoule : null);
                const compNom = eng?.idCompetition?.nom || "";
                if (!pouleId) continue;

                try {
                    const pouleRes = await fetch(`https://api.ffbb.app/items/ffbbserver_poules/${pouleId}?fields=*.*`, {
                        headers: ffbbHeaders
                    });
                    if (!pouleRes.ok) continue;

                    const pouleJson = await pouleRes.json();
                    const rencontres = pouleJson?.data?.rencontres || [];

                    for (const m of rencontres) {
                        const matchId = String(m?.id || "");
                        if (!matchId || seenMatchIds.has(matchId)) continue;

                        const nomEq1 = m?.nomEquipe1 || "";
                        const nomEq2 = m?.nomEquipe2 || "";
                        const idOrg1 = String(m?.idOrganismeEquipe1 || "");
                        const idOrg2 = String(m?.idOrganismeEquipe2 || "");

                        const isScba1 = idOrg1 === String(SCBA_ORGANISME_ID) || nomEq1.toUpperCase().includes("STADE CLERMONTOIS") || nomEq1.toUpperCase().includes("SCBA");
                        const isScba2 = idOrg2 === String(SCBA_ORGANISME_ID) || nomEq2.toUpperCase().includes("STADE CLERMONTOIS") || nomEq2.toUpperCase().includes("SCBA");

                        if (!isScba1 && !isScba2) continue;
                        seenMatchIds.add(matchId);

                        const isHome = isScba1;
                        const scbaTeam = normalizeScbaTeam(isHome ? nomEq1 : nomEq2, compNom);
                        const opponent = cleanOpponentName(isHome ? nomEq2 : nomEq1);
                        const oppOrgId = isHome ? idOrg2 : idOrg1;

                        if (teamFilter && teamFilter !== "ALL" && !scbaTeam.toUpperCase().includes(teamFilter)) {
                            continue;
                        }

                        // Date & Heure
                        const dateRaw = String(m?.date_rencontre || m?.date || "");
                        let dateISO = "";
                        if (dateRaw.match(/^\d{4}-\d{2}-\d{2}/)) {
                            dateISO = dateRaw.substring(0, 10);
                        }

                        let timeStr = "15:00";
                        const horaire = String(m?.horaire || "");
                        if (horaire) {
                            const hClean = horaire.replace(/[hH:]/g, "").trim();
                            if (hClean.length === 4) timeStr = `${hClean.substring(0, 2)}:${hClean.substring(2)}`;
                            else if (hClean.length === 2) timeStr = `${hClean}:00`;
                        } else if (dateRaw.includes(" ")) {
                            const timePart = dateRaw.split(" ")[1]?.substring(0, 5);
                            if (timePart && timePart.includes(":")) timeStr = timePart;
                        }

                        // Salle
                        let location = isHome ? "Maison des Sports, Place des Bughes, 63000 Clermont-Ferrand" : `Extérieur (${opponent})`;
                        const salleId = m?.salle;
                        if (!isHome && salleId) {
                            const salleKey = String(salleId);
                            if (salleCache[salleKey]) {
                                location = salleCache[salleKey];
                            } else {
                                try {
                                    const salleRes = await fetch(`https://api.ffbb.app/items/ffbbserver_salles/${salleKey}?fields=*.*`, {
                                        headers: ffbbHeaders
                                    });
                                    if (salleRes.ok) {
                                        const salleJson = await salleRes.json();
                                        const sData = salleJson?.data || {};
                                        const nom = sData?.libelle || sData?.nom || "";
                                        const adr = sData?.adresse || sData?.adresse1 || "";
                                        const cp = sData?.code_postal || sData?.codePostal || "";
                                        const v = typeof sData?.commune === "object" ? sData.commune?.libelle : (sData?.ville || "");
                                        const parts = [adr, `${cp} ${v}`.trim()].filter(Boolean);
                                        const full = [nom, parts.join(", ")].filter(Boolean).join(" - ");
                                        if (full) {
                                            salleCache[salleKey] = full;
                                            location = full;
                                        }
                                    }
                                } catch (e) {
                                    // Fallback to Extérieur
                                }
                            }
                        }

                        // Logo adverse
                        let opponentLogo: string | undefined;
                        if (oppOrgId) {
                            if (logoCache[oppOrgId] !== undefined) {
                                opponentLogo = logoCache[oppOrgId] || undefined;
                            } else {
                                try {
                                    const oppRes = await fetch(`https://api.ffbb.app/items/ffbbserver_organismes/${oppOrgId}?fields=logo.*`, {
                                        headers: ffbbHeaders
                                    });
                                    if (oppRes.ok) {
                                        const oppJson = await oppRes.json();
                                        const logoId = oppJson?.data?.logo?.id || oppJson?.data?.logo;
                                        if (logoId) {
                                            const url = `https://api.ffbb.com/assets/${logoId}`;
                                            logoCache[oppOrgId] = url;
                                            opponentLogo = url;
                                        } else {
                                            logoCache[oppOrgId] = null;
                                        }
                                    }
                                } catch (e) {
                                    logoCache[oppOrgId] = null;
                                }
                            }
                        }

                        matchesList.push({
                            ffbbMatchId: matchId,
                            team: scbaTeam,
                            opponent: opponent,
                            date: formatFrenchDate(dateISO),
                            dateISO: dateISO,
                            time: timeStr,
                            location: location,
                            isHome: isHome,
                            competition: compNom,
                            teamLogo: SCBA_LOGO_URL,
                            ...(opponentLogo ? { opponentLogo } : {}),
                        });
                    }
                } catch (e) {
                    logger.warn(`Erreur lecture poule ${pouleId}`, { error: e });
                }
            }

            matchesList.sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.time.localeCompare(b.time));

            logger.info("FFBB Matches fetched successfully", { count: matchesList.length });
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
