
import { ParsedMatch, parseDate, parseTime } from './csvImport';
import type { Game } from '../types';

/**
 * Normalise une chaîne pour la comparaison (minuscule, sans accents, trim)
 */
const normalize = (str: string) => {
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Vérifie si un match existe déjà dans la base
 */
export const isDuplicateMatch = (newMatch: ParsedMatch, existingGames: Game[]): boolean => {
    return existingGames.some(existing => {
        // 1. Comparaison Date et Heure (critère strict)
        // Note: newMatch.dateISO est YYYY-MM-DD
        // existing.dateISO stocké en base
        const sameDate = existing.dateISO === newMatch.dateISO;
        const sameTime = existing.time === newMatch.time; // Format HH:MM ou HHhmm attendu identique via parseTime

        if (!sameDate || !sameTime) return false;

        // 2. Comparaison Equipe (SCBA)
        const sameTeam = normalize(existing.team) === normalize(newMatch.team);

        // 3. Comparaison Adversaire (plus souple car l'orthographe peut varier)
        // On check si l'un est inclus dans l'autre
        const normExistingOpp = normalize(existing.opponent);
        const normNewOpp = normalize(newMatch.opponent);
        const sameOpponent = normExistingOpp.includes(normNewOpp) || normNewOpp.includes(normExistingOpp);

        return sameTeam && sameOpponent;
    });
};


/**
 * Scrape les matchs depuis une page FFBB via un proxy CORS
 */
export const scrapeFFBBUrl = async (url: string, teamName: string, existingGames: Game[] = []): Promise<{ matches: ParsedMatch[], duplicates: number }> => {
    if (!url.includes('competitions.ffbb.com')) {
        throw new Error("L'URL doit provenir du site competitions.ffbb.com");
    }

    // Utilisation d'un proxy pour éviter les erreurs CORS
    // allorigins.win est un proxy public gratuit souvent utilisé pour ce genre de tâche côté client
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);
    const data = await response.json();

    if (!data.contents) {
        throw new Error("Impossible de récupérer le contenu de la page.");
    }

    const html = data.contents;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Sélecteur pour le tableau des rencontres
    // Sur le site FFBB actuel, c'est souvent table.liste ou .resultats-rencontres
    // On essaie de trouver les lignes qui contiennent des dates
    const rows = Array.from(doc.querySelectorAll('tr'));

    const matches: ParsedMatch[] = [];
    let duplicatesCount = 0;

    for (const row of rows) {
        const text = row.innerText || row.textContent || "";
        // Nettoyage basique
        const cleanLine = text.replace(/\s+/g, ' ').trim();

        // On cherche un pattern de date: DD/MM/YYYY ou DD mmm YYYY
        // Le site FFBB affiche souvent: "Sam 14/12/2024" ou juste "14/12/2024" dans une colonne, et l'heure dans une autre

        // Structure typique d'une ligne FFBB :
        // Jour | Date | Heure | Domicile | Score | Visiteur | Lieu

        const cols = Array.from(row.querySelectorAll('td'));
        if (cols.length < 5) continue;

        // Extraction naïve basée sur le contenu texte des colonnes
        // On cherche la colonne date
        const dateCol = cols.find(c => (c.innerText || "").match(/\d{2}\/\d{2}\/\d{4}/));
        if (!dateCol) continue;

        const dateStr = (dateCol.innerText || "").trim(); // ex: 14/12/2024

        // Heure: souvent la colonne suivante ou celle d'après
        const timeCol = cols.find(c => (c.innerText || "").match(/\d{2}:\d{2}/));
        const timeStr = timeCol ? (timeCol.innerText || "").trim() : "00:00"; // ex: 20:00

        // Equipes
        // On assume que l'équipe fournie (teamName) est l'une des deux.
        // On cherche les colonnes qui ne sont ni date ni heure ni lieu
        // Souvent Domicile est avant Visiteur
        // Mais sans sélecteur précis de classe, c'est dur.
        // Heureusement, souvent les liens vers les équipes contiennent le nom.

        // Tentative d'extraction plus structurée
        // Colonnes usuelles: [Jour, Date, Heure, Domicile, Score, Visiteur, Lieu]
        // Indices probables : 1 (Date), 2 (Heure), 3 (Domicile), 5 (Visiteur), 6 (Lieu)

        // On va plutôt utiliser le texte complet de la ligne et le parser comme du CSV "riche"
        // Ou mieux, utiliser la structure DOM si possible.

        // Récupérons les textes des cellules
        const colTexts = cols.map(c => c.innerText.trim());

        // Trouver l'index de la date
        const dateIdx = colTexts.findIndex(t => t.match(/\d{2}\/\d{2}\/\d{4}/));
        if (dateIdx === -1) continue;

        const parsedDate = parseDate(dateStr);
        if (!parsedDate) continue;

        // Heure
        let parsedTime = "00:00";
        if (colTexts[dateIdx + 1] && colTexts[dateIdx + 1].match(/\d{2}:\d{2}/)) {
            parsedTime = parseTime(colTexts[dateIdx + 1]);
        }

        // Equipes
        // Domicile = dateIdx + 2
        // Visiteur = dateIdx + 4 (saut du score) ou +3 si pas de score
        // On va chercher les deux équipes
        const teamA = colTexts[dateIdx + 2] || "";
        const teamB = colTexts[dateIdx + 4] || colTexts[dateIdx + 3] || ""; // +4 si colonne score, +3 sinon

        let location = colTexts[colTexts.length - 1] || "";
        // Parfois le lieu est dans une colonne cachée ou titre, on prend le dernier

        // Déterminer qui est qui
        // On normalise le nom de l'équipe cible (SCBA)
        const isHome = normalize(teamA).includes(normalize(teamName)) ||
            normalize(teamA).includes("stade clermontois") ||
            normalize(teamA).includes("scba");

        // Si teamA n'est pas nous et teamB n'est pas nous, c'est louche, mais on prend par défaut teamName

        let finalOpponent = isHome ? teamB : teamA;
        let finalLocation = location;

        // Nettoyage nom adversaire
        if (finalOpponent.match(/stade clermontois|scba/i)) {
            // Inversion probable ou erreur
            finalOpponent = isHome ? teamB : teamA;
        }

        // Logique Lieu
        if (isHome) {
            if (!finalLocation || finalLocation.toLowerCase().includes("domicile")) {
                finalLocation = teamName.includes("SENIOR M1") ? "Gymnase Fleury" : "Maison des Sports";
            }
        } else {
            if (!finalLocation || finalLocation.toLowerCase().includes("extérieur")) {
                finalLocation = "Extérieur";
            }
        }

        // Création objets
        const match: ParsedMatch = {
            date: parsedDate.display,
            dateISO: parsedDate.iso,
            time: parsedTime,
            team: teamName,
            opponent: finalOpponent,
            location: finalLocation,
            isHome: isHome
        };

        // DEDUPLICATION
        if (isDuplicateMatch(match, existingGames)) {
            duplicatesCount++;
            continue; // On ignore ce match
        }

        matches.push(match);
    }

    return { matches, duplicates: duplicatesCount };
};
