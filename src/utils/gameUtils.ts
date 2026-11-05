import type { Game, Role, CarpoolEntry } from '../types';
import { getGameDateValue } from './dateUtils';

/**
 * Normalizes time string (e.g., "9h00" -> "0900", "14:30" -> "1430")
 * for consistent string comparison.
 */
const normalizeTime = (t: string): string => {
  if (!t) return '0000';
  // Split by 'h' or ':' case insensitive
  const parts = t.split(/[h:]/i);
  if (parts.length < 2) return t.padStart(4, '0'); // Fallback

  const [h, m] = parts;
  return `${h.padStart(2, '0')}${m.padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// FFBB Asset URL Resolution (BunnyCDN WAF Bypass)
// ---------------------------------------------------------------------------
const SCBA_ASSET_UUID = '2784a7b8-1c06-4334-aa6e-16a371475971';
const FFBB_ASSET_REGEX =
  /^https?:\/\/(?:api|bo)\.ffbb\.(?:com|app)\/assets\/([0-9a-fA-F-]{36})(?:[/?#].*)?$/i;

/**
 * Réécrit les URLs d'assets FFBB (`api.ffbb.com/assets/...` ou `bo.ffbb.com/assets/...`)
 * bloquées en 403 / ERR_BLOCKED_BY_ORB par BunnyCDN WAF en France :
 * - Le logo officiel du SCBA utilise directement l'asset local `/logo-scba.webp`.
 * - Les logos adverses passent par le proxy same-origin `/api/v1/assets/<uuid>`.
 */
export const resolveTeamLogoUrl = (url?: string | null, isScba?: boolean): string | undefined => {
  if (isScba) {
    return '/logo-scba.webp';
  }
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (trimmed.includes(SCBA_ASSET_UUID)) {
    return '/logo-scba.webp';
  }

  const match = FFBB_ASSET_REGEX.exec(trimmed);
  if (match?.[1]) {
    return `/api/v1/assets/${match[1].toLowerCase()}`;
  }

  return trimmed;
};

/**
 * Pure function to sort games by Date then Time.
 * Uses getGameDateValue (ISO date) and normalizeTime for sorting.
 *
 * ⚡ Bolt Optimization: Uses the Schwartzian transform (decorate-sort-undecorate)
 * to precompute expensive string parsing/normalization operations (getGameDateValue, normalizeTime)
 * in a single O(N) pass before running the O(N log N) sort operation, avoiding
 * redundant calculations inside the comparator function.
 */
export const sortGames = (games: Game[]): Game[] => {
  return games
    .map((game) => ({
      game,
      dateVal: getGameDateValue(game),
      timeVal: normalizeTime(game.time),
    }))
    .sort((a, b) => {
      const dateDiff = a.dateVal.localeCompare(b.dateVal);
      if (dateDiff !== 0) return dateDiff;
      return a.timeVal.localeCompare(b.timeVal);
    })
    .map((item) => item.game);
};

/**
 * Check if a role is considered "complete" based on its capacity.
 */
const isRoleComplete = (role: Role | { capacity: number; volunteers: string[] }): boolean => {
  const isUnlimited = role.capacity === Infinity || role.capacity === 0;
  if (isUnlimited) {
    return role.volunteers.length >= 2;
  }
  return role.volunteers.length >= role.capacity;
};

/**
 * Détecte si la compétition est une coupe vs un championnat régulier.
 */
export const isCupCompetition = (competition?: string): boolean => {
  if (!competition) return false;
  const lower = competition.toLowerCase();
  return lower.includes('coupe') || lower.includes('trophée') || lower.includes('challenge');
};

/**
 * Raccourcit intelligemment les noms de compétitions FFBB pour l'affichage :
 * Ex: "Pré Nationale Masculine" -> "PNM", "Régionale Masculine Seniors - Division 2" -> "RM2"
 */
export const formatCompetitionShort = (competition?: string): string => {
  if (!competition) return '';
  const trimmed = competition.trim();

  // 1. Abréviations directes
  const map: Record<string, string> = {
    'pré nationale masculine': 'PNM',
    'pre nationale masculine': 'PNM',
    'pré nationale féminine': 'PNF',
    'pre nationale feminine': 'PNF',
    'nationale masculine 1': 'NM1',
    'nationale masculine 2': 'NM2',
    'nationale masculine 3': 'NM3',
    'nationale féminine 1': 'NF1',
    'nationale féminine 2': 'NF2',
    'nationale féminine 3': 'NF3',
    'u18 masculin coupe ara': 'Coupe AURA U18M',
    'u18 masculin coupe aura': 'Coupe AURA U18M',
    'u15 masculin coupe ara': 'Coupe AURA U15M',
    'u15 masculin coupe aura': 'Coupe AURA U15M',
    'u18 masculin': 'U18M',
    'u18 féminin': 'U18F',
    'u15 masculin': 'U15M',
    'u15 féminin': 'U15F',
    'u13 masculin': 'U13M',
    'u13 féminin': 'U13F',
    'u11 masculin': 'U11M',
    'u11 féminin': 'U11F',
    'u9 masculin': 'U9M',
    'u9 féminin': 'U9F',
    'u7 masculin': 'U7M',
  };

  const lower = trimmed.toLowerCase();
  if (map[lower]) return map[lower];

  let result = trimmed;

  // 2. Catégories Jeunes avec Division ou Phase (ex: "Régionale masculine U13 - Division 2" -> "RMU13 D2")
  result = result.replace(
    /D[ée]partementale\s+Masculine\s+U\s*(\d+)\s*[-–]\s*Division\s*(\d+)/gi,
    'DMU$1 D$2',
  );
  result = result.replace(
    /D[ée]partementale\s+F[ée]minine\s+U\s*(\d+)\s*[-–]\s*Division\s*(\d+)/gi,
    'DFU$1 D$2',
  );
  result = result.replace(
    /R[ée]gionale\s+Masculine\s+U\s*(\d+)\s*[-–]\s*Division\s*(\d+)/gi,
    'RMU$1 D$2',
  );
  result = result.replace(
    /R[ée]gionale\s+F[ée]minine\s+U\s*(\d+)\s*[-–]\s*Division\s*(\d+)/gi,
    'RFU$1 D$2',
  );
  result = result.replace(
    /D[ée]partementale\s+Masculine\s+U\s*(\d+)\s*[-–]\s*Phase\s*(\d+)/gi,
    'DMU$1 P$2',
  );
  result = result.replace(
    /D[ée]partementale\s+F[ée]minine\s+U\s*(\d+)\s*[-–]\s*Phase\s*(\d+)/gi,
    'DFU$1 P$2',
  );
  result = result.replace(
    /D[ée]partementale\s+Mixte\s+U\s*(\d+)\s*[-–]\s*Phase\s*(\d+)/gi,
    'DXU$1 P$2',
  );

  // 3. Catégories Jeunes avec Brassage ou sans division (ex: "Régionale masculine U18" -> "RMU18")
  result = result.replace(
    /R[ée]gionale\s+Masculine\s+U\s*(\d+)\s*[-–]?\s*Brassage/gi,
    'RMU$1 Brassage',
  );
  result = result.replace(
    /R[ée]gionale\s+F[ée]minine\s+U\s*(\d+)\s*[-–]?\s*Brassage/gi,
    'RFU$1 Brassage',
  );
  result = result.replace(
    /D[ée]partementale\s+Masculine\s+U\s*(\d+)\s*[-–]?\s*Brassage/gi,
    'DMU$1 Brassage',
  );
  result = result.replace(
    /D[ée]partementale\s+F[ée]minine\s+U\s*(\d+)\s*[-–]?\s*Brassage/gi,
    'DFU$1 Brassage',
  );
  result = result.replace(/^R[ée]gionale\s+Masculine\s+U\s*(\d+)$/gi, 'RMU$1');
  result = result.replace(/^R[ée]gionale\s+F[ée]minine\s+U\s*(\d+)$/gi, 'RFU$1');
  result = result.replace(/^D[ée]partementale\s+Masculine\s+U\s*(\d+)$/gi, 'DMU$1');
  result = result.replace(/^D[ée]partementale\s+F[ée]minine\s+U\s*(\d+)$/gi, 'DFU$1');
  result = result.replace(/^D[ée]partementale\s+Mixte\s+U\s*(\d+)$/gi, 'DXU$1');

  // 4. Catégories Seniors avec Division (ex: "Régionale Masculine Seniors - Division 2" -> "RM2")
  result = result.replace(
    /R[ée]gionale\s+Masculine\s+(?:Seniors\s*)?[-–]\s*Division\s*(\d+)/gi,
    'RM$1',
  );
  result = result.replace(
    /R[ée]gionale\s+F[ée]minine\s+(?:Seniors\s*)?[-–]\s*Division\s*(\d+)/gi,
    'RF$1',
  );
  result = result.replace(
    /D[ée]partementale\s+Masculine\s+(?:Seniors\s*)?[-–]\s*Division\s*(\d+)/gi,
    'DM$1',
  );
  result = result.replace(
    /D[ée]partementale\s+F[ée]minine\s+(?:Seniors\s*)?[-–]\s*Division\s*(\d+)/gi,
    'DF$1',
  );
  result = result.replace(
    /D[ée]partementale\s+Masculine\s+(?:Seniors\s*)?[-–]\s*Pr[ée]\s*R[ée]gionale/gi,
    'PRM',
  );
  result = result.replace(
    /D[ée]partementale\s+F[ée]minine\s+(?:Seniors\s*)?[-–]\s*Pr[ée]\s*R[ée]gionale/gi,
    'PRF',
  );

  // 5. Pré-Nationale & Nationale
  result = result.replace(/Pr[ée]\s*Nationale\s*Masculine/gi, 'PNM');
  result = result.replace(/Pr[ée]\s*Nationale\s*F[ée]minine/gi, 'PNF');
  result = result.replace(/Nationale\s*Masculine\s*(\d+)/gi, 'NM$1');
  result = result.replace(/Nationale\s*F[ée]minine\s*(\d+)/gi, 'NF$1');

  // 6. Coupes
  result = result.replace(/U\s*(\d+)\s*Masculin\s+Coupe\s+ARA/gi, 'Coupe ARA U$1M');
  result = result.replace(/U\s*(\d+)\s*F[ée]minin\s+Coupe\s+ARA/gi, 'Coupe ARA U$1F');

  // 7. Remplacements génériques résiduels
  result = result.replace(/R[ée]gionale\s*Masculine\s*(\d+)/gi, 'RM$1');
  result = result.replace(/R[ée]gionale\s*F[ée]minine\s*(\d+)/gi, 'RF$1');
  result = result.replace(/D[ée]partementale\s*Masculine\s*(\d+)/gi, 'DM$1');
  result = result.replace(/D[ée]partementale\s*F[ée]minine\s*(\d+)/gi, 'DF$1');
  result = result.replace(/U\s*(\d+)\s*Masculin/gi, 'U$1M');
  result = result.replace(/U\s*(\d+)\s*F[ée]minin/gi, 'U$1F');

  return result.trim();
};

/**
 * Check if all roles in a game are complete.
 */
const isGameFullyStaffed = (game: Game): boolean => {
  return game.roles.every(isRoleComplete);
};

/**
 * Calculates filled slots, total capacity, staffing status, and missing roles
 * in a single pass over the game's roles array.
 *
 * ⚡ Bolt Optimization: Replaces multiple separate loops (reduce, every, filter)
 * with a single O(N) pass for better performance.
 */
export const getGameRoleStats = (game: Game) => {
  let filledSlots = 0;
  let totalCapacity = 0;
  let isFullyStaffed = true;
  // ⚡ Bolt Optimization: Track hasUnlimited during this O(N) role pass
  // to avoid redundant iterations later.
  let hasUnlimited = false;
  const missingRoles: string[] = [];

  for (let i = 0; i < game.roles.length; i++) {
    const r = game.roles[i];
    const isUnlimited = r.capacity === Infinity || r.capacity === 0;
    if (!isFinite(r.capacity)) {
      hasUnlimited = true;
    }
    const capacity = isUnlimited ? 2 : r.capacity;

    filledSlots += Math.min(r.volunteers.length, capacity);
    totalCapacity += capacity;

    const isComplete = isUnlimited ? r.volunteers.length >= 2 : r.volunteers.length >= r.capacity;
    if (!isComplete) {
      isFullyStaffed = false;
      missingRoles.push(r.name);
    }
  }

  return {
    filledSlots,
    totalCapacity,
    isFullyStaffed,
    missingRoles,
    hasUnlimited,
  };
};

/**
 * Check if a game is urgent (< 48h and incomplete).
 */
export const isGameUrgent = (
  game: Game,
  now: Date | number = Date.now(),
  isFullyStaffedPrecomputed?: boolean,
): boolean => {
  if (!game.isHome) return false;

  // ⚡ Bolt Optimization: Use precomputed complete status if provided to avoid redundant O(R) iteration over roles.
  const isComplete =
    isFullyStaffedPrecomputed !== undefined ? isFullyStaffedPrecomputed : isGameFullyStaffed(game);

  if (isComplete) return false;

  try {
    if (!game.dateISO) return false;
    const nowMs = typeof now === 'number' ? now : now.getTime();

    // Parse de la date et de l'heure précise du match
    // ⚡ Bolt Optimization: Use string slicing to avoid array allocation overhead in render loops
    const y = +game.dateISO.substring(0, 4);
    const m = +game.dateISO.substring(5, 7);
    const d = +game.dateISO.substring(8, 10);
    let hours = 14;
    let minutes = 0;
    if (game.time) {
      const match = game.time.match(/(\d{1,2})[hH:](\d{2})/);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
      }
    }

    const matchDate = new Date(y, m - 1, d, hours, minutes);
    const diffMs = matchDate.getTime() - nowMs;
    const diffHours = diffMs / (1000 * 60 * 60);

    // Urgent si le match est dans les prochaines 48h et pas encore terminé (buffer 2h30)
    return diffHours >= -2.5 && diffHours <= 48;
  } catch {
    return false;
  }
};

/**
 * Get internal priority for a team to maintain a consistent logical order (U9 < U11 < ... < Senior).
 */
const getTeamPriority = (team: string): number => {
  const t = team.toUpperCase();
  if (t.includes('U9') || t.includes('U7')) return 1;
  if (t.includes('U11')) return 2;
  if (t.includes('U13')) return 3;
  if (t.includes('U15')) return 4;
  if (t.includes('U18') || t.includes('U20')) return 5;
  if (
    t.includes('SENIOR') ||
    t.includes('RM') ||
    t.includes('DM') ||
    t.includes('PNM') ||
    t.includes('PNF') ||
    t.includes('NM') ||
    t.includes('NF')
  )
    return 6;
  if (t.includes('VETERAN') || t.includes('LOISIR')) return 7;
  return 99;
};

/**
 * Sort a list of team names based on their category priority then alphabetical.
 *
 * ⚡ Bolt Optimization: Uses the Schwartzian transform (decorate-sort-undecorate)
 * to precompute getTeamPriority in a single O(N) pass, preventing repeated string
 * allocations and lookups inside the O(N log N) .sort() callback.
 */
export const sortTeamNames = (teamList: string[]): string[] => {
  return teamList
    .map((team) => ({ team, prio: getTeamPriority(team) }))
    .sort((a, b) => {
      if (a.prio !== b.prio) return a.prio - b.prio;
      return a.team.localeCompare(b.team);
    })
    .map((item) => item.team);
};

/**
 * Calculates carpool stats in a single pass over the carpool array.
 */
export const getCarpoolStats = (carpool: CarpoolEntry[] | undefined) => {
  let drivers = 0;
  let passengers = 0;
  let totalSeats = 0;

  if (!carpool) return { drivers, passengers, totalSeats };

  for (let i = 0; i < carpool.length; i++) {
    const entry = carpool[i];
    if (entry.type === 'driver') {
      drivers++;
      totalSeats += entry.seats || 0;
    } else if (entry.type === 'passenger') {
      passengers++;
    }
  }

  return { drivers, passengers, totalSeats };
};

/**
 * Calculates home and away games count in a single pass over the games array.
 */
export const getHomeAwayCounts = (games: Game[]) => {
  let homeCount = 0;
  let awayCount = 0;
  for (let i = 0; i < games.length; i++) {
    if (games[i].isHome ?? true) {
      homeCount++;
    } else {
      awayCount++;
    }
  }
  return { homeCount, awayCount };
};

/**
 * Détermine si la compétition est un match de championnat (et non une coupe ou trophée).
 */
export const isChampionshipCompetition = (competition?: string): boolean => {
  if (!competition) return true; // Par défaut, considéré comme match de championnat si non spécifié
  const lower = competition.toLowerCase();
  return !(lower.includes('coupe') || lower.includes('trophée') || lower.includes('challenge'));
};

/**
 * Formate un classement en chaîne française (ex: 1 -> "1er", 2 -> "2e", 3 -> "3e").
 * Retourne null si aucun classement valide n'est fourni.
 */
export const formatRank = (rank?: number | string | null): string | null => {
  if (rank === undefined || rank === null) return null;
  const str = String(rank).trim();
  if (!str) return null;

  // Si c'est déjà formaté proprement (ex: "1er", "2e", "3e")
  if (/^1(er|ER)$/i.test(str)) return '1er';
  if (/^\d+(e|E|ème|EME)$/i.test(str)) return str.toLowerCase().replace(/ème$/, 'e');

  const num = parseInt(str, 10);
  if (isNaN(num) || num <= 0) return null;

  return num === 1 ? '1er' : `${num}e`;
};

const stripAccentsUpper = (s?: string | null): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

/**
 * Calcule le rang hiérarchique sportif d'une division (plus le score est élevé, plus la division est haute) :
 * - Nationale (NM1/2/3, Élite, Championnat de France) : 3000+
 * - Pré-Nationale (PNM, PNF) : 2500
 * - Régionale (R1 / RMU18 : 2300, Brassage régional : 2250, R2 / Division 2 : 2200, R3 / Division 3 : 2100)
 * - Pré-Régionale (PRM, PRF) : 1500
 * - Départementale (Division 10 pré-région : 1400, Poule Confirmés/Haute : 1350, D1 : 1300, Standard/Phase 2 : 1250, D2 : 1200, D3 : 1100, Poule Initiés/Basse : 1050)
 * - Coupe / Non renseigné : 0 (neutre pour le classement hiérarchique de championnat)
 */
export const getCompetitionDivisionRank = (
  competition?: string | null,
  poule?: string | null,
): number => {
  const comp = stripAccentsUpper(competition);
  const pouleUp = stripAccentsUpper(poule);
  if (!comp) return 0;
  if (comp.includes('COUPE') || comp.includes('TROPHEE') || comp.includes('CHALLENGE')) {
    return 0;
  }

  // 1. Niveau National (3000+)
  if (
    comp.includes('CHAMPIONNAT DE FRANCE') ||
    (comp.includes('NATIONALE') &&
      !comp.includes('PRE NATIONALE') &&
      !comp.includes('PRE-NATIONALE')) ||
    /\bN[MF]?\d+\b/.test(comp) ||
    comp.includes('ELITE')
  ) {
    if (comp.includes('ELITE')) return 3500;
    if (comp.includes('DIVISION 1') || /\bN[MF]?1\b/.test(comp)) return 3300;
    if (comp.includes('DIVISION 2') || /\bN[MF]?2\b/.test(comp)) return 3200;
    if (comp.includes('DIVISION 3') || /\bN[MF]?3\b/.test(comp)) return 3100;
    return 3000;
  }

  // 2. Niveau Pré-National (2500)
  if (comp.includes('PRE NATIONALE') || comp.includes('PRE-NATIONALE') || /\bPN[MF]\b/.test(comp)) {
    return 2500;
  }

  // 3. Niveau Régional (2000+)
  if (comp.includes('REGIONALE') || comp.includes('REGIONAL') || /\bR[MF]U?\d+/.test(comp)) {
    if (comp.includes('BRASSAGE')) return 2250;
    if (comp.includes('DIVISION 1') || /\bR[MF]?1\b/.test(comp)) return 2300;
    if (comp.includes('DIVISION 2') || /\bR[MF]?2\b/.test(comp)) return 2200;
    if (comp.includes('DIVISION 3') || /\bR[MF]?3\b/.test(comp)) return 2100;
    return 2300;
  }

  // 4. Niveau Pré-Régional (1500)
  if (comp.includes('PRE REGIONALE') || comp.includes('PRE-REGIONALE') || /\bPR[MF]\b/.test(comp)) {
    return 1500;
  }

  // 5. Niveau Départemental (1000+)
  if (
    comp.includes('DEPARTEMENTALE') ||
    comp.includes('DEPARTEMENTAL') ||
    /\bD[MFX]U?\d+/.test(comp)
  ) {
    if (comp.includes('DIVISION 10') || comp.includes('-10')) return 1400;
    if (pouleUp.includes('CONFIRME') || comp.includes('CONFIRME')) return 1350;
    if (pouleUp.includes('INITIE') || comp.includes('INITIE')) return 1050;
    if (comp.includes('DIVISION 1') || /\bD[MF]?1\b/.test(comp)) return 1300;
    if (comp.includes('DIVISION 2') || /\bD[MF]?2\b/.test(comp)) return 1200;
    if (comp.includes('DIVISION 3') || /\bD[MF]?3\b/.test(comp)) return 1100;
    return 1250;
  }

  return 0;
};

const extractCategoryAndGender = (
  team?: string | null,
  competition?: string | null,
): { category: string; gender: 'M' | 'F' | 'MIXTE'; explicitNum: number } => {
  const t = stripAccentsUpper(team);
  const c = stripAccentsUpper(competition);
  const combined = `${t} ${c}`.trim();

  let category = 'SENIOR';
  if (combined.includes('BABY')) {
    category = 'U7';
  } else if (combined.includes('MINI')) {
    category = 'U9';
  } else {
    const mCat = t.match(/\bU\s*(\d{1,2})\b/) || c.match(/\bU\s*(\d{1,2})\b/);
    if (mCat) {
      category = `U${mCat[1]}`;
    }
  }

  let gender: 'M' | 'F' | 'MIXTE' = 'M';
  if (combined.includes('MIXTE') || combined.includes('MIXED') || /\bDXU\d+/.test(combined)) {
    gender = 'MIXTE';
  } else if (
    /\b(FEMININ|FEMININE|NF\d*|RF\d*|DF\d*|PNF|PRF|U\d+F\d*|SENIOR F\d*|SF\d*)\b/.test(combined)
  ) {
    gender = 'F';
  }

  // Numéro d'équipe actuel dans `team` (ex: "U13 M2" -> 2, "U9 MIXTE 2" -> 2, "STADE CLERMONTOIS - 2" -> 2)
  let explicitNum = 1;
  const mTeamNum = t.match(/\b(?:M|F|MIXTE)\s*(\d+)$/) || t.match(/[- ]\s*(\d+)$/);
  if (mTeamNum) {
    const parsed = parseInt(mTeamNum[1], 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
      explicitNum = parsed;
    }
  }

  return { category, gender, explicitNum };
};

const formatCanonicalTeamLabel = (
  category: string,
  gender: 'M' | 'F' | 'MIXTE',
  teamNum: number,
): string => {
  if (category.startsWith('U') && gender === 'MIXTE') {
    return teamNum === 1 ? `${category} MIXTE` : `${category} MIXTE ${teamNum}`;
  }
  return `${category} ${gender}${teamNum}`;
};

/**
 * Règle sportive : s'il y a plusieurs équipes dans la même catégorie, l'équipe 1
 * est dans la division la plus haute et l'équipe 2 dans la division inférieure.
 * Par ailleurs, une équipe jeune évoluant au niveau Régional (même en R2 / Division 2)
 * est l'équipe 1 (M1/F1) dès lors qu'aucune autre équipe de la même catégorie n'évolue plus haut.
 */
export const normalizeScbaMatchesTeams = <
  T extends { team: string; competition?: string; poule?: string },
>(
  matches: T[],
): T[] => {
  if (!matches || matches.length === 0) return matches;

  // 1. Collecter les rangs de division par (catégorie, genre)
  const categoryRanks = new Map<string, Set<number>>();

  const parsedMeta = matches.map((m) => {
    const { category, gender, explicitNum } = extractCategoryAndGender(m.team, m.competition);
    const rank = getCompetitionDivisionRank(m.competition, m.poule);
    const groupKey = `${category}_${gender}`;

    // Normalisation du palier pour regrouper les phases successives d'une même équipe :
    // - En jeunes, Brassage régional (2250), Division 10 pré-région (1400) et Régionale (2200/2300)
    //   appartiennent à l'équipe fanion (M1) face à une équipe Départementale (< 1400).
    let effectiveTier = rank;
    if (category.startsWith('U') && rank >= 1400) {
      effectiveTier = rank === 2250 || rank === 1400 ? 2300 : rank;
    }

    if (effectiveTier > 0) {
      if (!categoryRanks.has(groupKey)) {
        categoryRanks.set(groupKey, new Set());
      }
      categoryRanks.get(groupKey)!.add(effectiveTier);
    }
    return { category, gender, explicitNum, rank, effectiveTier, groupKey };
  });

  // Si un groupe jeune contient à la fois du Régional (>=2000) et du Pré-Région D10 (fusionné à 2300),
  // s'assurer qu'un même palier régional (ex: Brassage 2300 + R2 2200) ne crée pas 2 équipes régionales
  // quand il existe déjà une équipe départementale (<1400).
  const sortedTiersByGroup = new Map<string, number[]>();
  for (const [groupKey, tiersSet] of categoryRanks.entries()) {
    const tiers = Array.from(tiersSet).sort((a, b) => b - a);
    const hasRegional = tiers.some((t) => t >= 2000);
    const hasDepartemental = tiers.some((t) => t < 1400);
    if (groupKey.startsWith('U') && hasRegional && hasDepartemental) {
      // Toutes les phases régionales (>=2000) correspondent à l'équipe 1, les phases départementales (<1400) à l'équipe 2+
      const collapsed = [2000, ...tiers.filter((t) => t < 1400)];
      sortedTiersByGroup.set(groupKey, collapsed);
    } else {
      sortedTiersByGroup.set(groupKey, tiers);
    }
  }

  return matches.map((m, idx) => {
    const { category, gender, explicitNum, rank, effectiveTier, groupKey } = parsedMeta[idx];
    const sortedTiers = sortedTiersByGroup.get(groupKey) || [];
    let resolvedNum = explicitNum;

    if (category.startsWith('U')) {
      if (isCupCompetition(m.competition)) {
        resolvedNum = 1;
      } else if (sortedTiers.length >= 2 && effectiveTier > 0) {
        const lookupTier = sortedTiers[0] === 2000 && effectiveTier >= 2000 ? 2000 : effectiveTier;
        const tierIndex = sortedTiers.indexOf(lookupTier);
        if (tierIndex !== -1) {
          resolvedNum = tierIndex + 1;
        }
      } else if (rank >= 1400) {
        // Une seule division connue et elle est Régionale (ex: R2) ou Pré-Région (D10) -> Équipe 1
        resolvedNum = 1;
      }
    } else if (sortedTiers.length >= 2 && effectiveTier > 0) {
      // Senior : la division la plus haute (ex: PNM 2500) est M1, la suivante (ex: RM2 2200) est M2
      const tierIndex = sortedTiers.indexOf(effectiveTier);
      if (tierIndex !== -1) {
        resolvedNum = tierIndex + 1;
      }
    }

    const newTeam = formatCanonicalTeamLabel(category, gender, resolvedNum);
    if (newTeam === m.team) {
      return m;
    }
    return {
      ...m,
      team: newTeam,
    };
  });
};
