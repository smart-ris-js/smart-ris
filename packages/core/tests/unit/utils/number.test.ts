// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { parseDecimalNumber } from '../../../src/utils/number.js';

/** Deterministic pseudo-random generator. */
function createRandom(seed: number) {
    return (n: number) => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed % n;
    };
}

describe('core - unit > utils > number', () => {
    describe('Function: parseDecimalNumber()', () => {
        describe('Accepted plain decimals', () => {
            it.each([
                ['0', 0],
                ['7', 7],
                ['42', 42],
                ['2020', 2020],
                ['3.14', 3.14],
                ['0.5', 0.5],
                ['10.25', 10.25],
                ['123456789', 123456789],
            ])('should parse %p', (input, expected) => {
                expect(parseDecimalNumber(input)).toBe(expected);
            });

            it.each([
                ['+12', 12],
                ['-12', -12],
                ['+3.5', 3.5],
                ['-3.5', -3.5],
                ['-0.001', -0.001],
            ])('should parse signed %p', (input, expected) => {
                expect(parseDecimalNumber(input)).toBe(expected);
            });

            it.each([
                ['.5', 0.5],
                ['-.5', -0.5],
                ['+.5', 0.5],
                ['5.', 5],
                ['-5.', -5],
                ['0.', 0],
                ['.0', 0],
            ])('should parse leading or trailing dot form %p like Number()', (input, expected) => {
                expect(parseDecimalNumber(input)).toBe(expected);
            });

            it.each([
                ['007', 7],
                ['0000', 0],
                ['00.50', 0.5],
                ['-0010', -10],
            ])('should parse leading/trailing zeros %p', (input, expected) => {
                expect(parseDecimalNumber(input)).toBe(expected);
            });

            it('should keep the sign of negative zero like Number()', () => {
                expect(Object.is(parseDecimalNumber('-0'), -0)).toBe(true);
                expect(Object.is(parseDecimalNumber('-0.0'), -0)).toBe(true);
                expect(Object.is(parseDecimalNumber('+0'), 0)).toBe(true);
            });
        });

        describe('Surrounding whitespace', () => {
            it.each([
                [' 12', 12],
                ['12 ', 12],
                ['  -3.5  ', -3.5],
                ['\t12\t', 12],
                ['\n12\n', 12],
                ['\r\n12\r\n', 12],
                [' 12 ', 12],
                ['﻿12', 12],
                ['　12 ', 12],
            ])('should strip surrounding whitespace in %j', (input, expected) => {
                expect(parseDecimalNumber(input)).toBe(expected);
            });

            it('should treat exactly the String.prototype.trim() whitespace set as surrounding whitespace (all UTF-16 code units)', () => {
                for (let c = 0; c <= 0xffff; c++) {
                    const ch = String.fromCharCode(c);
                    const isDigitOrSyntax = (c >= 48 && c <= 57) || c === 43 || c === 45 || c === 46;
                    if (isDigitOrSyntax) {
                        continue;
                    }
                    const expected = ch.trim() === '' ? 12 : null;
                    expect([c, parseDecimalNumber(`${ch}12`)]).toEqual([c, expected]);
                    expect([c, parseDecimalNumber(`12${ch}`)]).toEqual([c, expected]);
                }
            });

            it('should reject any non-digit code unit inside the number (all UTF-16 code units)', () => {
                for (let c = 0; c <= 0xffff; c++) {
                    if (c >= 48 && c <= 57) {
                        continue;
                    }
                    const expected = c === 46 ? 1.2 : null;
                    expect([c, parseDecimalNumber(`1${String.fromCharCode(c)}2`)]).toEqual([c, expected]);
                }
            });
        });

        describe('Rejected non-decimal syntaxes accepted by Number()', () => {
            it.each([
                '0x10',
                '0X10',
                '0xff',
                '-0x10',
                '0b1',
                '0B101',
                '0o7',
                '0O17',
            ])('should keep radix-prefixed %p as non-decimal', (input) => {
                expect(parseDecimalNumber(input)).toBeNull();
            });

            it.each([
                '1e3',
                '1E3',
                '1e-3',
                '1e+3',
                '-1e3',
                '1.5e3',
                '.5e1',
                '5.e1',
                '1e',
                'e3',
            ])('should keep exponent form %p as non-decimal', (input) => {
                expect(parseDecimalNumber(input)).toBeNull();
            });

            it.each([
                'Infinity',
                '+Infinity',
                '-Infinity',
                ' Infinity ',
                'infinity',
                'INFINITY',
                'Inf',
                'NaN',
                'nan',
            ])('should keep %p as non-decimal', (input) => {
                expect(parseDecimalNumber(input)).toBeNull();
            });
        });

        describe('Rejected malformed input', () => {
            it.each([
                '',
                ' ',
                '\t\n',
                '+',
                '-',
                '.',
                '+.',
                '-.',
                '..5',
                '1.2.3',
                '0.5.1',
                '--5',
                '++5',
                '+-5',
                '-+5',
                '5-',
                '5+',
                '1 2',
                '1\n2',
                '- 5',
                '1,000',
                '1,5',
                '1_000',
                "1'000",
                '12-14',
                '1/2',
                '12a',
                'a12',
                'abc',
                'Vol. 3',
                'Spring 2020',
                'true',
                'null',
                '１２',
                '٣',
                '½',
                '−5',
            ])('should return null for %j', (input) => {
                expect(parseDecimalNumber(input)).toBeNull();
            });
        });

        describe('Precision guard', () => {
            it('should accept up to 15 significant digits', () => {
                expect(parseDecimalNumber('123456789012345')).toBe(123456789012345);
                expect(parseDecimalNumber('1234567890.12345')).toBe(1234567890.12345);
                expect(parseDecimalNumber('0.123456789012345')).toBe(0.123456789012345);
                expect(parseDecimalNumber('-9.99999999999999')).toBe(-9.99999999999999);
            });

            it('should accept longer safe integers', () => {
                expect(parseDecimalNumber('9007199254740991')).toBe(Number.MAX_SAFE_INTEGER);
                expect(parseDecimalNumber('-9007199254740991')).toBe(Number.MIN_SAFE_INTEGER);
                expect(parseDecimalNumber('1234567890123456.000')).toBe(1234567890123456);
            });

            it('should reject integers beyond the safe integer range', () => {
                expect(parseDecimalNumber('9007199254740992')).toBeNull();
                expect(parseDecimalNumber('9007199254740993')).toBeNull();
                expect(parseDecimalNumber('12345678901234567890')).toBeNull();
                expect(parseDecimalNumber(`1${'0'.repeat(400)}`)).toBeNull();
                expect(parseDecimalNumber('9'.repeat(400))).toBeNull();
            });

            it('should reject fractions with more than 15 significant digits', () => {
                expect(parseDecimalNumber('0.1234567890123456')).toBeNull();
                expect(parseDecimalNumber('1234567890.123456')).toBeNull();
                expect(parseDecimalNumber('3.14159265358979323846')).toBeNull();
            });

            it('should not count leading zeros or trailing fraction zeros as significant', () => {
                expect(parseDecimalNumber(`${'0'.repeat(30)}1`)).toBe(1);
                expect(parseDecimalNumber(`1.5${'0'.repeat(30)}`)).toBe(1.5);
                expect(parseDecimalNumber(`0.${'0'.repeat(20)}123`)).toBe(1.23e-21);
                expect(parseDecimalNumber('0'.repeat(1000))).toBe(0);
                expect(parseDecimalNumber(`0.${'0'.repeat(1000)}`)).toBe(0);
            });

            it('should count trailing integer zeros as significant', () => {
                expect(parseDecimalNumber(`1${'0'.repeat(14)}`)).toBe(1e14);
                expect(parseDecimalNumber(`1${'0'.repeat(15)}`)).toBe(1e15);
                expect(parseDecimalNumber(`1${'0'.repeat(16)}.5`)).toBeNull();
            });

            it('should reject non-zero values that underflow the normal double range', () => {
                expect(parseDecimalNumber(`0.${'0'.repeat(400)}1`)).toBeNull();
                expect(parseDecimalNumber(`-0.${'0'.repeat(320)}5`)).toBeNull();
                expect(parseDecimalNumber(`0.${'0'.repeat(300)}1`)).toBe(1e-301);
            });
        });

        describe('Properties', () => {
            it('should only ever return finite numbers equal to Number() of the input, or null', () => {
                const alphabet = '0123456789+-.eExXbBoO _,\t\nInfinityNaN';
                const rnd = createRandom(7);
                for (let n = 0; n < 50_000; n++) {
                    let s = '';
                    const len = rnd(12);
                    for (let i = 0; i < len; i++) {
                        s += alphabet[rnd(alphabet.length)];
                    }
                    const result = parseDecimalNumber(s);
                    if (result !== null) {
                        expect(Number.isFinite(result)).toBe(true);
                        expect(Object.is(result, Number(s))).toBe(true);
                        expect(/^\s*[+-]?(?:\d+\.?\d*|\.\d+)\s*$/.test(s)).toBe(true);
                    }
                }
            });

            it('should match a reference decimal grammar for random short inputs', () => {
                const alphabet = '0123456789+-.x ';
                const grammar = /^\s*[+-]?(?:\d+\.?\d*|\.\d+)\s*$/;
                const rnd = createRandom(11);
                for (let n = 0; n < 50_000; n++) {
                    let s = '';
                    const len = rnd(8);
                    for (let i = 0; i < len; i++) {
                        s += alphabet[rnd(alphabet.length)];
                    }
                    expect([s, parseDecimalNumber(s) !== null]).toEqual([s, grammar.test(s)]);
                }
            });

            it('should round-trip random decimals with up to 15 significant digits', () => {
                const rnd = createRandom(23);
                for (let n = 0; n < 20_000; n++) {
                    const intDigits = rnd(9);
                    const fracDigits = rnd(16 - intDigits);
                    let s = rnd(2) ? '-' : '';
                    for (let i = 0; i < intDigits; i++) {
                        s += rnd(10);
                    }
                    if (fracDigits > 0 || intDigits === 0) {
                        s += '.';
                        for (let i = 0; i < Math.max(fracDigits, 1); i++) {
                            s += rnd(10);
                        }
                    }
                    const result = parseDecimalNumber(s);
                    expect([s, result]).toEqual([s, Number(s)]);
                    expect(Number(String(result)) === result).toBe(true);
                }
            });
        });
    });
});
