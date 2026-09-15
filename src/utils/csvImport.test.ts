import { describe, it, expect } from 'vitest';
import { hasGameChanged, reconcileMatchesWithExisting, type ParsedMatch } from './csvImport';
import type { Game } from '../types';

describe('hasGameChanged', () => {
  const baseGame: Game = {
    id: 'g1',
    team: 'SENIOR M1',
    opponent: 'CLERMONT BASKET - 1',
    date: 'Samedi 10 Octobre 2026',
    dateISO: '2026-10-10',
    time: '20:30',
    location: 'Maison des Sports, Place des Bughes, 63000 Clermont-Ferrand',
    isHome: true,
    competition: 'Pré nationale masculine',
    teamLogo: 'https://api.ffbb.com/assets/scba',
    opponentLogo: 'https://api.ffbb.com/assets/cb',
    ffbbMatchId: '12345',
    roles: [],
  };

  const baseParsed: ParsedMatch = {
    team: 'SENIOR M1',
    opponent: 'CLERMONT BASKET - 1',
    date: 'Samedi 10 Octobre 2026',
    dateISO: '2026-10-10',
    time: '20:30',
    location: 'Maison des Sports, Place des Bughes, 63000 Clermont-Ferrand',
    isHome: true,
    competition: 'Pré nationale masculine',
    teamLogo: 'https://api.ffbb.com/assets/scba',
    opponentLogo: 'https://api.ffbb.com/assets/cb',
    ffbbMatchId: '12345',
  };

  it('returns changed=false when all match fields are identical', () => {
    const res = hasGameChanged(baseParsed, baseGame);
    expect(res.changed).toBe(false);
    expect(res.diffs).toHaveLength(0);
  });

  it('detects time changes', () => {
    const modified: ParsedMatch = { ...baseParsed, time: '18:15' };
    const res = hasGameChanged(modified, baseGame);
    expect(res.changed).toBe(true);
    expect(res.diffs).toContain('Heure: 20:30 → 18:15');
  });

  it('detects location changes (e.g. relocated home game)', () => {
    const modified: ParsedMatch = {
      ...baseParsed,
      location: 'Gymnase Thévenet, 63000 Clermont-Ferrand',
    };
    const res = hasGameChanged(modified, baseGame);
    expect(res.changed).toBe(true);
    expect(res.diffs).toContain(
      'Lieu: Maison des Sports, Place des Bughes, 63000 Clermont-Ferrand → Gymnase Thévenet, 63000 Clermont-Ferrand',
    );
  });

  it('detects date reschedulings', () => {
    const modified: ParsedMatch = {
      ...baseParsed,
      dateISO: '2026-10-11',
      date: 'Dimanche 11 Octobre 2026',
    };
    const res = hasGameChanged(modified, baseGame);
    expect(res.changed).toBe(true);
    expect(res.diffs).toContain('Date: 2026-10-10 → 2026-10-11');
  });

  it('detects new opponent logo', () => {
    const gameWithoutLogo: Game = { ...baseGame, opponentLogo: undefined };
    const res = hasGameChanged(baseParsed, gameWithoutLogo);
    expect(res.changed).toBe(true);
    expect(res.diffs).toContain('Logo adversaire');
  });
});

describe('reconcileMatchesWithExisting', () => {
  const existingGame: Game = {
    id: 'g1',
    team: 'SENIOR M1',
    opponent: 'CLERMONT BASKET - 1',
    date: 'Samedi 10 Octobre 2026',
    dateISO: '2026-10-10',
    time: '20:30',
    location: 'Maison des Sports',
    isHome: true,
    ffbbMatchId: '12345',
    roles: [],
  };

  it('correctly classifies new, modified, and unchanged matches', () => {
    const unchangedMatch: ParsedMatch = {
      team: 'SENIOR M1',
      opponent: 'CLERMONT BASKET - 1',
      date: 'Samedi 10 Octobre 2026',
      dateISO: '2026-10-10',
      time: '20:30',
      location: 'Maison des Sports',
      isHome: true,
      ffbbMatchId: '12345',
    };

    const modifiedMatch: ParsedMatch = {
      team: 'SENIOR M1',
      opponent: 'CLERMONT BASKET - 1',
      date: 'Samedi 10 Octobre 2026',
      dateISO: '2026-10-10',
      time: '21:00', // modified time
      location: 'Maison des Sports',
      isHome: true,
      ffbbMatchId: '12345',
    };

    const newMatch: ParsedMatch = {
      team: 'SENIOR M2',
      opponent: 'ISSOIRE - 2',
      date: 'Dimanche 11 Octobre 2026',
      dateISO: '2026-10-11',
      time: '15:00',
      location: 'Extérieur',
      isHome: false,
    };

    const result = reconcileMatchesWithExisting(
      [unchangedMatch, modifiedMatch, newMatch],
      [existingGame],
    );

    expect(result.newCount).toBe(1);
    expect(result.reconciled[2].matchStatus).toBe('new');

    expect(result.updateCount).toBe(1);
    expect(result.reconciled[1].matchStatus).toBe('modified');
    expect(result.reconciled[1].id).toBe('g1');

    expect(result.unchangedCount).toBe(1);
    expect(result.reconciled[0].matchStatus).toBe('unchanged');
    expect(result.reconciled[0].id).toBe('g1');
  });

  it('excludes already played past matches by default', () => {
    const pastMatch: ParsedMatch = {
      team: 'U18 M1',
      opponent: 'ST JEAN BONNEFONDS AVANT GARDE BASKET',
      date: 'Dimanche 13 Septembre 2026',
      dateISO: '2026-09-13',
      time: '14:00',
      location: 'Gymnase Fleury',
      isHome: true,
      competition: 'U18 MASCULIN COUPE ARA',
      ffbbMatchId: '200000014648496',
    };

    const futureMatch: ParsedMatch = {
      team: 'U18 M1',
      opponent: 'US CHAURIAT VERTAIZON',
      date: 'Dimanche 20 Septembre 2026',
      dateISO: '2026-09-20',
      time: '15:30',
      location: 'Gymnase Fleury',
      isHome: true,
      competition: 'RMU18 Brassage',
      ffbbMatchId: '200000014578908',
    };

    // Supposons que le match passé existe ou non en base
    const result = reconcileMatchesWithExisting([pastMatch, futureMatch], []);

    // Le match passé du 13 septembre ne doit pas être réconcilié ni proposé comme nouveau match
    expect(result.reconciled).toHaveLength(1);
    expect(result.reconciled[0].ffbbMatchId).toBe('200000014578908');
    expect(result.newCount).toBe(1);
  });

  it('allows including past matches when filterPastGames is explicitly false', () => {
    const pastMatch: ParsedMatch = {
      team: 'U18 M1',
      opponent: 'ST JEAN BONNEFONDS',
      date: 'Dimanche 13 Septembre 2026',
      dateISO: '2026-09-13',
      time: '14:00',
      location: 'Gymnase Fleury',
      isHome: true,
      ffbbMatchId: '200000014648496',
    };

    const result = reconcileMatchesWithExisting([pastMatch], [], false);
    expect(result.reconciled).toHaveLength(1);
    expect(result.reconciled[0].ffbbMatchId).toBe('200000014648496');
  });
});
