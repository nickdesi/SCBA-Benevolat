import { getFirebaseFunctions } from '../firebase';
import type { ParsedMatch } from '../utils/csvImport';
import { isGamePast } from '../utils/dateUtils';

/**
 * Filtre les matchs pour n'inclure que les rencontres à venir (exclut les matchs déjà passés).
 */
const filterUpcomingMatches = (matches: ParsedMatch[]): ParsedMatch[] => {
  const now = new Date();
  return matches.filter((m) => !isGamePast(m.dateISO, m.time, now));
};

/**
 * Service pour récupérer les rencontres officielles depuis la FFBB.
 * Tente successivement plusieurs points d'accès résilients :
 * 1. Same-Origin Nginx Proxy (/api/v1/club/9326/matches)
 * 2. API Dokploy directe (VITE_FFBB_API_URL ou https://ffbb-api.desimone.fr)
 * 3. Endpoint proxy local dev (/api/ffbb-matches)
 * 4. Firebase Cloud Function Callable (fetchFFBBMatches)
 */
export const fetchClubMatchesFromFFBB = async (
  selectedTeam: string = 'ALL',
): Promise<ParsedMatch[]> => {
  const params = new URLSearchParams();
  if (selectedTeam !== 'ALL') {
    params.set('team', selectedTeam);
  }
  params.set('upcoming_only', 'true');
  const queryString = `?${params.toString()}`;
  let localError: string | null = null;

  // 1. Essai prioritaire en Same-Origin / proxy Nginx (/api/v1/club/9326/matches)
  try {
    const sameOriginRes = await fetch(`/api/v1/club/9326/matches${queryString}`);
    if (sameOriginRes.ok) {
      const data = await sameOriginRes.json();
      if (Array.isArray(data?.matches) && data.matches.length > 0) {
        return filterUpcomingMatches(data.matches);
      }
    }
  } catch {
    // Si same-origin échoue (ex: hébergé sur Firebase sans reverse proxy), continuer
  }

  // 2. Essai via l'API Dokploy directe (https://ffbb-api.desimone.fr)
  const ffbbApiBase = import.meta.env.VITE_FFBB_API_URL || 'https://ffbb-api.desimone.fr';
  try {
    const apiRes = await fetch(`${ffbbApiBase}/api/v1/club/9326/matches${queryString}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (Array.isArray(data?.matches) && data.matches.length > 0) {
        return filterUpcomingMatches(data.matches);
      }
    }
  } catch (apiErr) {
    console.warn('API Dokploy directe non joignable:', apiErr);
  }

  // 3. Essai via l'API locale /api/ffbb-matches (ffbb-data-client) si en dev
  try {
    const localRes = await fetch(`/api/ffbb-matches${queryString}`);
    if (localRes.ok) {
      const data = await localRes.json();
      if (Array.isArray(data?.matches) && data.matches.length > 0) {
        return filterUpcomingMatches(data.matches);
      }
      if (data?.error) {
        localError = data.error;
      }
    }
  } catch {
    // Fallback sur Cloud Function si l'endpoint local n'est pas dispo
  }

  // 4. Si non récupéré, appel de la Cloud Function Firebase
  if (!localError) {
    try {
      const [{ httpsCallable }, functionsInstance] = await Promise.all([
        import('firebase/functions'),
        getFirebaseFunctions(),
      ]);
      const fetchFn = httpsCallable<{ team?: string }, { matches: ParsedMatch[]; count: number }>(
        functionsInstance,
        'fetchFFBBMatches',
      );
      const res = await fetchFn({ team: selectedTeam === 'ALL' ? undefined : selectedTeam });
      if (res.data?.matches) {
        return filterUpcomingMatches(res.data.matches);
      }
    } catch (cloudErr: any) {
      console.warn('Fallback Cloud Function échoué:', cloudErr);
      if (
        cloudErr?.code === 'functions/not-found' ||
        cloudErr?.code === 'functions/internal' ||
        cloudErr?.message?.includes('internal')
      ) {
        throw new Error(
          'Impossible de joindre le service FFBB. Veuillez vérifier votre connexion ou réessayer.',
          { cause: cloudErr },
        );
      }
      throw cloudErr;
    }
  }

  if (localError) {
    throw new Error(`Erreur API FFBB : ${localError}`);
  }

  return [];
};
