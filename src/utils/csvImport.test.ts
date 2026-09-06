import { describe, it, expect } from 'vitest';
import { hasGameChanged, type ParsedMatch } from './csvImport';
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
