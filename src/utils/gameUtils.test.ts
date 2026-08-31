import { describe, it, expect } from 'vitest';
import { formatRank, isChampionshipCompetition } from './gameUtils';

describe('formatRank', () => {
  it('formats numeric ranks correctly into French ordinal format', () => {
    expect(formatRank(1)).toBe('1er');
    expect(formatRank(2)).toBe('2e');
    expect(formatRank(3)).toBe('3e');
    expect(formatRank(10)).toBe('10e');
  });

  it('formats string ranks correctly', () => {
    expect(formatRank('1')).toBe('1er');
    expect(formatRank('2')).toBe('2e');
    expect(formatRank('1er')).toBe('1er');
    expect(formatRank('1ER')).toBe('1er');
    expect(formatRank('2e')).toBe('2e');
    expect(formatRank('3ème')).toBe('3e');
  });

  it('returns null for empty, undefined, null or invalid inputs', () => {
    expect(formatRank(undefined)).toBeNull();
    expect(formatRank(null)).toBeNull();
    expect(formatRank('')).toBeNull();
    expect(formatRank('   ')).toBeNull();
    expect(formatRank(0)).toBeNull();
    expect(formatRank(-2)).toBeNull();
    expect(formatRank('invalid')).toBeNull();
  });
});

describe('isChampionshipCompetition', () => {
  it('returns true for championship competitions', () => {
    expect(isChampionshipCompetition('Pré nationale masculine')).toBe(true);
    expect(isChampionshipCompetition('RM2')).toBe(true);
    expect(isChampionshipCompetition('Régionale masculine seniors - Division 2')).toBe(true);
    expect(isChampionshipCompetition(undefined)).toBe(true);
  });

  it('returns false for cup / trophée / challenge competitions', () => {
    expect(isChampionshipCompetition('U18 MASCULIN COUPE ARA')).toBe(false);
    expect(isChampionshipCompetition('Coupe du Puy-de-Dôme')).toBe(false);
    expect(isChampionshipCompetition('Trophée Coupe de France')).toBe(false);
    expect(isChampionshipCompetition('Challenge Crédit Agricole')).toBe(false);
  });
});
