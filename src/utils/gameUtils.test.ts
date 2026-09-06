import { describe, it, expect } from 'vitest';
import { formatRank, isChampionshipCompetition, formatCompetitionShort } from './gameUtils';

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

describe('formatCompetitionShort', () => {
  it('shortens departmental youth competitions with divisions', () => {
    expect(formatCompetitionShort('Départementale Masculine U15 - Division 10')).toBe('DMU15 D10');
    expect(formatCompetitionShort('Départementale Féminine U13 - Division 2')).toBe('DFU13 D2');
    expect(formatCompetitionShort('Départementale masculine u15 - division 10')).toBe('DMU15 D10');
  });

  it('shortens regional youth competitions with divisions & brassage', () => {
    expect(formatCompetitionShort('Régionale Masculine U18 - Division 1')).toBe('RMU18 D1');
    expect(formatCompetitionShort('RMU18 Brassage')).toBe('RMU18 Brassage');
    expect(formatCompetitionShort('Régionale Masculine U18 Brassage')).toBe('RMU18 Brassage');
  });

  it('shortens seniors regional and departmental championships', () => {
    expect(formatCompetitionShort('Régionale masculine seniors - Division 2')).toBe('RM2');
    expect(formatCompetitionShort('Départementale masculine seniors - Division 3')).toBe('DM3');
    expect(formatCompetitionShort('Pré nationale masculine')).toBe('PNM');
    expect(formatCompetitionShort('Pre nationale feminine')).toBe('PNF');
  });

  it('shortens cup competitions', () => {
    expect(formatCompetitionShort('U18 MASCULIN COUPE ARA')).toBe('Coupe AURA U18M');
    expect(formatCompetitionShort('U18 MASCULIN COUPE AURA')).toBe('Coupe AURA U18M');
  });
});
