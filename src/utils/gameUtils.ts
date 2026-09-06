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

  // 2. Catégories Jeunes avec Division (ex: "Départementale masculine U15 - Division 10" -> "DMU15 D10")
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

  // 3. Catégories Jeunes avec Brassage (ex: "Régionale Masculine U18 Brassage" -> "RMU18 Brassage")
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
    // ⚡ Bolt Optimization: Use Date.parse to avoid redundant object allocation for gameDate.
    const nowMs = typeof now === 'number' ? now : now.getTime();
    const gameDateMs = Date.parse(game.dateISO);
    if (isNaN(gameDateMs)) return false;

    const diffMs = gameDateMs - nowMs;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 0 && diffHours < 48;
  } catch {
    return false;
  }
};

/**
 * Get internal priority for a team to maintain a consistent logical order (U9 < U11 < ... < Senior).
 */
const getTeamPriority = (team: string): number => {
  const t = team.toUpperCase();
  if (t.includes('U9')) return 1;
  if (t.includes('U11')) return 2;
  if (t.includes('U13')) return 3;
  if (t.includes('U15')) return 4;
  if (t.includes('U18')) return 5;
  if (t.includes('SENIOR')) return 6;
  if (t.includes('VETERAN')) return 7;
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
