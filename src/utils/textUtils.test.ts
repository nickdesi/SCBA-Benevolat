import { describe, it, expect } from 'vitest';
import { parseNames } from './textUtils';

describe('parseNames', () => {
    it('returns an empty array for empty string', () => {
        expect(parseNames('')).toEqual([]);
    });

    it('returns an empty array for undefined or null inputs', () => {
        // @ts-expect-error testing invalid inputs
        expect(parseNames(undefined)).toEqual([]);
        // @ts-expect-error testing invalid inputs
        expect(parseNames(null)).toEqual([]);
    });

    it('handles a single name without separators', () => {
        expect(parseNames('Thierry')).toEqual(['Thierry']);
    });

    it('splits names by " et "', () => {
        expect(parseNames('Thierry et Christelle')).toEqual(['Thierry', 'Christelle']);
    });

    it('splits names by " ET " (case insensitive)', () => {
        expect(parseNames('Thierry ET Christelle')).toEqual(['Thierry', 'Christelle']);
    });

    it('does not split on "et" that is part of a word', () => {
        expect(parseNames('Juliette et Pierrette')).toEqual(['Juliette', 'Pierrette']);
    });

    it('splits names by "&" with spaces', () => {
        expect(parseNames('Thierry & Christelle')).toEqual(['Thierry', 'Christelle']);
    });

    it('splits names by "&" without spaces', () => {
        expect(parseNames('Thierry&Christelle')).toEqual(['Thierry', 'Christelle']);
    });

    it('splits names by "+" with spaces', () => {
        expect(parseNames('Thierry + Christelle')).toEqual(['Thierry', 'Christelle']);
    });

    it('splits names by "+" without spaces', () => {
        expect(parseNames('Thierry+Christelle')).toEqual(['Thierry', 'Christelle']);
    });

    it('splits names by ","', () => {
        expect(parseNames('Thierry, Christelle')).toEqual(['Thierry', 'Christelle']);
        expect(parseNames('Thierry,Christelle')).toEqual(['Thierry', 'Christelle']);
    });

    it('splits names by ";"', () => {
        expect(parseNames('Thierry; Christelle')).toEqual(['Thierry', 'Christelle']);
        expect(parseNames('Thierry;Christelle')).toEqual(['Thierry', 'Christelle']);
    });

    it('handles multiple different separators in the same string', () => {
        expect(parseNames('Thierry, Christelle & Jean + Marie; Pierre et Paul')).toEqual([
            'Thierry', 'Christelle', 'Jean', 'Marie', 'Pierre', 'Paul'
        ]);
    });

    it('trims whitespace around names', () => {
        expect(parseNames('  Thierry   et   Christelle  ')).toEqual(['Thierry', 'Christelle']);
        expect(parseNames('Thierry   ,   Christelle')).toEqual(['Thierry', 'Christelle']);
    });

    it('filters out empty names', () => {
        expect(parseNames('Thierry, , Christelle')).toEqual(['Thierry', 'Christelle']);
        expect(parseNames('Thierry & & Christelle')).toEqual(['Thierry', 'Christelle']);
        expect(parseNames('Thierry + + Christelle')).toEqual(['Thierry', 'Christelle']);
        expect(parseNames(' et Thierry et Christelle et ')).toEqual(['Thierry', 'Christelle']);
    });
});
