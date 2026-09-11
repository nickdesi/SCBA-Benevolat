import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseFrenchDate,
  toISODateString,
  getTodayISO,
  getGameDateValue,
  getDaysOfWeek,
  isOffSeason,
  getSeasonInfo,
  getSeasonStartISO,
  getRelativeDateInfo,
  isGamePast,
} from './dateUtils';
import type { Game } from '../types';

describe('dateUtils', () => {
  describe('parseFrenchDate', () => {
    it('parses ISO date string correctly', () => {
      const date = parseFrenchDate('2024-12-14');
      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(11); // 0-indexed, so 11 is December
      expect(date?.getDate()).toBe(14);
    });

    it('parses DD/MM/YYYY date string correctly', () => {
      const date = parseFrenchDate('14/12/2024');
      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(11);
      expect(date?.getDate()).toBe(14);
    });

    it('parses DD/MM/YYYY without year falling back to current year', () => {
      const currentYear = new Date().getFullYear();
      const date = parseFrenchDate('14/12');
      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(currentYear);
      expect(date?.getMonth()).toBe(11);
      expect(date?.getDate()).toBe(14);
    });

    it('parses French full date strings correctly', () => {
      const date1 = parseFrenchDate('Samedi 14 décembre 2024');
      expect(date1).not.toBeNull();
      expect(date1?.getFullYear()).toBe(2024);
      expect(date1?.getMonth()).toBe(11);
      expect(date1?.getDate()).toBe(14);

      const date2 = parseFrenchDate('14 février 2024');
      expect(date2).not.toBeNull();
      expect(date2?.getFullYear()).toBe(2024);
      expect(date2?.getMonth()).toBe(1);
      expect(date2?.getDate()).toBe(14);

      const date3 = parseFrenchDate('14 aout 2024');
      expect(date3).not.toBeNull();
      expect(date3?.getFullYear()).toBe(2024);
      expect(date3?.getMonth()).toBe(7);
      expect(date3?.getDate()).toBe(14);
    });

    it('parses French date strings without year falling back to current year', () => {
      const currentYear = new Date().getFullYear();
      const date = parseFrenchDate('14 décembre');
      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(currentYear);
      expect(date?.getMonth()).toBe(11);
      expect(date?.getDate()).toBe(14);
    });

    it('parses date strings with time correctly', () => {
      const date1 = parseFrenchDate('2024-12-14', '14h30');
      expect(date1?.getHours()).toBe(14);
      expect(date1?.getMinutes()).toBe(30);

      const date2 = parseFrenchDate('14/12/2024', '09:15');
      expect(date2?.getHours()).toBe(9);
      expect(date2?.getMinutes()).toBe(15);

      const date3 = parseFrenchDate('Samedi 14 décembre 2024', '14H00');
      expect(date3?.getHours()).toBe(14);
      expect(date3?.getMinutes()).toBe(0);
    });

    it('returns null for unparseable dates', () => {
      expect(parseFrenchDate('invalid date')).toBeNull();
      expect(parseFrenchDate('14 inconnu 2024')).toBeNull();
    });

    it('handles JS date overflow for invalid logical dates (like 32/13/2024)', () => {
      const date = parseFrenchDate('32/13/2024');
      // JS Date will wrap 13th month to Jan of next year, and 32nd day to Feb 1st
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(1); // Feb
      expect(date?.getDate()).toBe(1);
    });

    it('returns null when time is provided but date is invalid', () => {
      expect(parseFrenchDate('invalid date', '14h30')).toBeNull();
    });
  });

  describe('toISODateString', () => {
    it('converts Date object to ISO string correctly', () => {
      const date1 = new Date(2024, 11, 14); // Dec 14 2024
      expect(toISODateString(date1)).toBe('2024-12-14');

      const date2 = new Date(2024, 0, 5); // Jan 5 2024
      expect(toISODateString(date2)).toBe('2024-01-05');
    });
  });

  describe('getTodayISO', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns today's date in ISO format", () => {
      // Set mock date to 2024-12-14T12:00:00.000Z
      const mockDate = new Date(2024, 11, 14, 12, 0, 0);
      vi.setSystemTime(mockDate);

      expect(getTodayISO()).toBe('2024-12-14');

      // Set mock date to 2024-01-05T12:00:00.000Z
      const mockDate2 = new Date(2024, 0, 5, 12, 0, 0);
      vi.setSystemTime(mockDate2);

      expect(getTodayISO()).toBe('2024-01-05');
    });
  });

  describe('getGameDateValue', () => {
    it('uses dateISO if available', () => {
      const game = { dateISO: '2024-12-14', date: 'invalid date' } as Game;
      expect(getGameDateValue(game)).toBe('2024-12-14');
    });

    it('falls back to parsing French date if dateISO is not available', () => {
      const game = { date: 'Samedi 14 décembre 2024' } as Game;
      expect(getGameDateValue(game)).toBe('2024-12-14');
    });

    it('returns 9999-12-31 for unparseable dates', () => {
      const game = { date: 'invalid date' } as Game;
      expect(getGameDateValue(game)).toBe('9999-12-31');
    });
  });

  describe('getDaysOfWeek', () => {
    it('returns 7 days of the week starting from Monday', () => {
      // Dec 14 2024 is a Saturday
      const saturday = new Date(2024, 11, 14);
      const days = getDaysOfWeek(saturday);

      expect(days.length).toBe(7);

      // Dec 9 2024 is the preceding Monday
      expect(days[0].getFullYear()).toBe(2024);
      expect(days[0].getMonth()).toBe(11);
      expect(days[0].getDate()).toBe(9);
      expect(days[0].getDay()).toBe(1); // 1 is Monday

      // Dec 15 2024 is the following Sunday
      expect(days[6].getFullYear()).toBe(2024);
      expect(days[6].getMonth()).toBe(11);
      expect(days[6].getDate()).toBe(15);
      expect(days[6].getDay()).toBe(0); // 0 is Sunday
    });

    it('handles weeks crossing month boundaries correctly', () => {
      // Jan 1 2025 is a Wednesday
      const wednesday = new Date(2025, 0, 1);
      const days = getDaysOfWeek(wednesday);

      expect(days.length).toBe(7);

      // Dec 30 2024 is the Monday
      expect(days[0].getFullYear()).toBe(2024);
      expect(days[0].getMonth()).toBe(11);
      expect(days[0].getDate()).toBe(30);

      // Jan 5 2025 is the Sunday
      expect(days[6].getFullYear()).toBe(2025);
      expect(days[6].getMonth()).toBe(0);
      expect(days[6].getDate()).toBe(5);
    });

    it('handles Sundays correctly (Sunday is day 0 in JS but last day of week here)', () => {
      // Dec 15 2024 is a Sunday
      const sunday = new Date(2024, 11, 15);
      const days = getDaysOfWeek(sunday);

      expect(days.length).toBe(7);

      // The preceding Monday should be Dec 9 2024
      expect(days[0].getFullYear()).toBe(2024);
      expect(days[0].getMonth()).toBe(11);
      expect(days[0].getDate()).toBe(9);
    });
  });

  describe('isOffSeason', () => {
    it('returns false when off-season is disabled (match schedule active)', () => {
      expect(isOffSeason(new Date(2026, 5, 15))).toBe(false); // June
      expect(isOffSeason(new Date(2026, 6, 15))).toBe(false); // July
      expect(isOffSeason(new Date(2026, 7, 15))).toBe(false); // August
      expect(isOffSeason(new Date(2026, 0, 15))).toBe(false); // January
      expect(isOffSeason(new Date(2026, 8, 15))).toBe(false); // September
    });
  });

  describe('getSeasonInfo', () => {
    it('calculates the correct season transitions', () => {
      const info = getSeasonInfo(new Date(2026, 5, 15));
      expect(info.endedSeason).toBe('2025-2026');
      expect(info.nextSeason).toBe('2026-2027');

      const infoNextYear = getSeasonInfo(new Date(2027, 6, 10));
      expect(infoNextYear.endedSeason).toBe('2026-2027');
      expect(infoNextYear.nextSeason).toBe('2027-2028');
    });
  });

  describe('getSeasonStartISO', () => {
    it('returns Sep 1 of current year during off-season (Jun–Aug)', () => {
      expect(getSeasonStartISO(new Date(2026, 6, 5))).toBe('2026-09-01'); // July
      expect(getSeasonStartISO(new Date(2026, 5, 15))).toBe('2026-09-01'); // June
      expect(getSeasonStartISO(new Date(2026, 7, 31))).toBe('2026-09-01'); // August
    });

    it('returns Sep 1 of current year during Sep–Dec', () => {
      expect(getSeasonStartISO(new Date(2026, 8, 1))).toBe('2026-09-01'); // September
      expect(getSeasonStartISO(new Date(2026, 11, 15))).toBe('2026-09-01'); // December
    });

    it('returns Sep 1 of previous year during Jan–May', () => {
      expect(getSeasonStartISO(new Date(2027, 0, 10))).toBe('2026-09-01'); // January
      expect(getSeasonStartISO(new Date(2027, 4, 1))).toBe('2026-09-01'); // May
    });
  });

  describe('getRelativeDateInfo', () => {
    it('identifies today correctly', () => {
      const res = getRelativeDateInfo('2026-09-11', '2026-09-11');
      expect(res.diffDays).toBe(0);
      expect(res.label).toBe("Aujourd'hui");
      expect(res.isToday).toBe(true);
      expect(res.isTomorrow).toBe(false);
    });

    it('identifies tomorrow correctly', () => {
      const res = getRelativeDateInfo('2026-09-12', '2026-09-11');
      expect(res.diffDays).toBe(1);
      expect(res.label).toBe('Demain');
      expect(res.isToday).toBe(false);
      expect(res.isTomorrow).toBe(true);
    });

    it('identifies in 2 days correctly (Sunday from Friday)', () => {
      // Cas utilisateur : vendredi 11 septembre vs dimanche 13 septembre
      const res = getRelativeDateInfo('2026-09-13', '2026-09-11');
      expect(res.diffDays).toBe(2);
      expect(res.label).toBe('Dans 2j');
      expect(res.isToday).toBe(false);
      expect(res.isTomorrow).toBe(false);
    });

    it('handles future dates (> 2 days)', () => {
      const res = getRelativeDateInfo('2026-09-15', '2026-09-11');
      expect(res.diffDays).toBe(4);
      expect(res.label).toBe('Dans 4j');
    });
  });

  describe('isGamePast', () => {
    it('returns true for past dates', () => {
      expect(isGamePast('2026-09-10', '14h00', new Date(2026, 8, 11, 10, 0))).toBe(true);
    });

    it('returns false for future dates', () => {
      expect(isGamePast('2026-09-13', '14h00', new Date(2026, 8, 11, 10, 0))).toBe(false);
    });

    it('detects if today game is past based on game time + 2h30', () => {
      const nowBefore = new Date(2026, 8, 11, 15, 0); // 15h00, match à 14h00 (finit vers 16h30)
      expect(isGamePast('2026-09-11', '14h00', nowBefore)).toBe(false);

      const nowAfter = new Date(2026, 8, 11, 17, 0); // 17h00, match à 14h00 (terminé)
      expect(isGamePast('2026-09-11', '14h00', nowAfter)).toBe(true);
    });
  });
});
