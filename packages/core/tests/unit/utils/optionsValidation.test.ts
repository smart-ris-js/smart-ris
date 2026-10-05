// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { assertBoolean, assertCustom, assertStringLiteral, isDefined } from '../../../src/utils/optionsValidation.js';

describe('core - unit > utils > optionsValidation', () => {
    describe('Function: isDefined()', () => {
        it('should return true for defined non-null values', () => {
            expect(isDefined(true)).toBe(true);
            expect(isDefined(false)).toBe(true);
            expect(isDefined(0)).toBe(true);
            expect(isDefined('')).toBe(true);
            expect(isDefined([])).toBe(true);
            expect(isDefined({})).toBe(true);
        });

        it('should return false for null or undefined', () => {
            expect(isDefined(null)).toBe(false);
            expect(isDefined(undefined)).toBe(false);
        });

        it('should correctly narrow nullable union types', () => {
            const val: string | null | undefined = 'hello';
            if (isDefined(val)) {
                const narrowed: string = val;
                expect(narrowed).toBe('hello');
            }
        });
    });

    describe('Function: assertBoolean()', () => {
        it('should not throw for valid boolean values', () => {
            expect(() => assertBoolean(true, 'testKey')).not.toThrow();
            expect(() => assertBoolean(false, 'testKey')).not.toThrow();
        });

        it.each([[null], [undefined], [123], ['true'], [{}], [[]]])(
            'should throw a TypeError for non-boolean input | Input: %p',
            (val) => {
                expect(() => assertBoolean(val, 'testKey')).toThrow(TypeError);
                expect(() => assertBoolean(val, 'testKey')).toThrow(/Option 'testKey' must be a boolean/);
            },
        );
    });

    describe('Function: assertStringLiteral()', () => {
        const allowed = ['first', 'last'] as const;

        it('should not throw when value is included in allowed string literals', () => {
            expect(() => assertStringLiteral('first', allowed, 'testKey')).not.toThrow();
            expect(() => assertStringLiteral('last', allowed, 'testKey')).not.toThrow();
        });

        it.each([['other'], ['FIRST'], [null], [undefined], [123], [true], [{}], [[]]])(
            'should throw a TypeError when value is not in allowed literals | Input: %p',
            (val) => {
                expect(() => assertStringLiteral(val, allowed, 'testKey')).toThrow(TypeError);
                expect(() => assertStringLiteral(val, allowed, 'testKey')).toThrow(
                    /Option 'testKey' must be one of \[first, last\]/,
                );
            },
        );
    });

    describe('Function: assertCustom()', () => {
        it('should not throw when custom validator returns true', () => {
            const validator = (val: unknown) => typeof val === 'number' && val > 0;
            expect(() => assertCustom(42, 'testKey', validator, 'Must be positive number.')).not.toThrow();
        });

        it('should throw an Error with the custom message when validator returns false', () => {
            const validator = (val: unknown) => typeof val === 'number' && val > 0;
            expect(() => assertCustom(-1, 'testKey', validator, 'Must be positive number.')).toThrow(
                "Option 'testKey' is invalid. Must be positive number.",
            );
        });

        it('should throw a TypeError like the other option assertions', () => {
            expect(() => assertCustom(-1, 'testKey', () => false, 'Invalid.')).toThrow(TypeError);
        });
    });
});
