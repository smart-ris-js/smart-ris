// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { DateFormatType, RawDate } from '../../../src/core.types.js';
import { formatRisDate, heuristicallyParseDateString, isValidDate } from '../../../src/utils/date.js';

/** Deterministic pseudo-random generator. */
function createRandom(seed: number) {
    return (n: number) => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed % n;
    };
}

/** Independent calendar oracle: JavaScript `Date` arithmetic without the `Date.UTC` 0-99 -> 1900-1999 year mapping. */
function referenceIsValid(year: number, month: number, day: number): boolean {
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Independent string oracle for `isValidDate` (regex format check + {@link referenceIsValid}). */
function referenceIsValidString(y: string, m: string, d: string): boolean {
    if (!/^[0-9]{4}$/.test(y) || !/^[0-9]{1,2}$/.test(m) || !/^[0-9]{1,2}$/.test(d)) {
        return false;
    }
    return referenceIsValid(Number(y), Number(m), Number(d));
}

const pad = (n: number, len: number) => String(n).padStart(len, '0');

const FORMATS: DateFormatType[] = ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY-MM', 'YYYY/MM', 'YYYY'];

/** Independent oracle for `formatRisDate` with a `RawDate`. */
function referenceFormat(raw: Record<string, unknown>, format: DateFormatType): string {
    const part = (val: unknown) => (val == null ? '' : String(val));
    const y = part(raw.year);
    const m = part(raw.month).padStart(part(raw.month) === '' ? 0 : 2, '0');
    const d = part(raw.day).padStart(part(raw.day) === '' ? 0 : 2, '0');
    if (!/^[0-9]{4}$/.test(y) || (m && !/^[0-9]{2}$/.test(m)) || (d && !/^[0-9]{2}$/.test(d))) {
        return '';
    }
    if (!referenceIsValid(Number(y), m ? Number(m) : 1, d ? Number(d) : 1)) {
        return '';
    }
    const s = format.includes('/') ? '/' : '-';
    if (format.endsWith('DD') && !m && d) {
        return `${y}${s}${s}${d}`;
    }
    if (format === 'YYYY' || !m) {
        return y;
    }
    return format.endsWith('DD') && d ? `${y}${s}${m}${s}${d}` : `${y}${s}${m}`;
}

/** Pre-fix `formatRisDate` `RawDate` branch (no validation), kept to prove the tests detect that regression. */
function formatWithoutValidation(raw: Record<string, unknown>, format: DateFormatType): string {
    const y = String(raw.year ?? '');
    const m = raw.month != null ? String(raw.month).padStart(2, '0') : '';
    const d = raw.day != null ? String(raw.day).padStart(2, '0') : '';
    const s = format.includes('/') ? '/' : '-';
    if (format === 'YYYY') {
        return y;
    }
    if (format.endsWith('DD')) {
        return y && m && d ? `${y}${s}${m}${s}${d}` : y && m ? `${y}${s}${m}` : y;
    }
    return y && m ? `${y}${s}${m}` : y;
}

const YEAR_PARTS: unknown[] = [
    undefined,
    null,
    '',
    '2024',
    '2023',
    '2000',
    '1900',
    '0000',
    '9999',
    2024,
    'abc',
    '24',
    '20245',
    ' 2024',
    '-2024',
    '+2024',
    '2024.0',
    '２０２４',
];
const MONTH_PARTS: unknown[] = [
    undefined,
    null,
    '',
    '1',
    '01',
    '02',
    '04',
    '12',
    1,
    2,
    12,
    '0',
    '00',
    '13',
    13,
    '001',
    'ab',
    ' 1',
    '1 ',
    '1.0',
    -1,
    1.5,
    'Jan',
];
const DAY_PARTS: unknown[] = [
    undefined,
    null,
    '',
    '1',
    '01',
    '28',
    '29',
    '30',
    '31',
    31,
    '0',
    '00',
    '32',
    '45',
    '001',
    'x',
    ' 1',
    '+1',
];

/** All year/month/day part combinations; `undefined` parts are left out of the object. */
function rawDateCombinations(): Record<string, unknown>[] {
    const out: Record<string, unknown>[] = [];
    for (const year of YEAR_PARTS) {
        for (const month of MONTH_PARTS) {
            for (const day of DAY_PARTS) {
                const raw: Record<string, unknown> = {};
                if (year !== undefined) {
                    raw.year = year;
                }
                if (month !== undefined) {
                    raw.month = month;
                }
                if (day !== undefined) {
                    raw.day = day;
                }
                out.push(raw);
            }
        }
    }
    return out;
}

/** Returns all combinations where `format` differs from {@link referenceFormat}. */
function collectFormatMismatches(format: (raw: Record<string, unknown>, f: DateFormatType) => string): string[] {
    const mismatches: string[] = [];
    for (const raw of rawDateCombinations()) {
        for (const f of FORMATS) {
            const expected = referenceFormat(raw, f);
            const actual = format(raw, f);
            if (actual !== expected) {
                mismatches.push(`${JSON.stringify(raw)} ${f}: ${actual} !== ${expected}`);
            }
        }
    }
    return mismatches;
}

describe('core - unit > utils > date (validation)', () => {
    describe('Function: isValidDate()', () => {
        describe('Calendar rules', () => {
            it.each([
                ['2024', '01', '31'],
                ['2024', '02', '29'],
                ['2023', '02', '28'],
                ['2000', '02', '29'],
                ['2400', '02', '29'],
                ['0000', '02', '29'],
                ['2024', '04', '30'],
                ['2024', '12', '31'],
                ['9999', '12', '31'],
                ['0000', '01', '01'],
            ])('should accept %s-%s-%s', (y, m, d) => {
                expect(isValidDate(y, m, d)).toBe(true);
            });

            it.each([
                ['2023', '02', '29'],
                ['1900', '02', '29'],
                ['2100', '02', '29'],
                ['0100', '02', '29'],
                ['2024', '02', '30'],
                ['2024', '04', '31'],
                ['2024', '06', '31'],
                ['2024', '09', '31'],
                ['2024', '11', '31'],
                ['2024', '01', '32'],
                ['2024', '13', '01'],
                ['2024', '00', '01'],
                ['2024', '01', '00'],
                ['2024', '13', '45'],
            ])('should reject %s-%s-%s', (y, m, d) => {
                expect(isValidDate(y, m, d)).toBe(false);
            });

            it('should accept 1- and 2-digit month and day', () => {
                expect(isValidDate('2024', '1', '5')).toBe(true);
                expect(isValidDate('2024', '01', '05')).toBe(true);
                expect(isValidDate('2024', '2', '29')).toBe(true);
                expect(isValidDate('2023', '2', '29')).toBe(false);
            });

            it('should match the calendar oracle for every day boundary of every month of every year 0000-9999', () => {
                const mismatches: string[] = [];
                for (let year = 0; year <= 9999; year++) {
                    const y = pad(year, 4);
                    for (let month = 0; month <= 13; month++) {
                        const m = pad(month, 2);
                        for (const day of [0, 1, 27, 28, 29, 30, 31, 32]) {
                            if (isValidDate(y, m, pad(day, 2)) !== referenceIsValid(year, month, day)) {
                                mismatches.push(`${y}-${m}-${day}`);
                            }
                        }
                    }
                }
                expect(mismatches).toEqual([]);
            });

            it('should match the calendar oracle for every month/day 00-99 in leap, non-leap and century years', () => {
                const mismatches: string[] = [];
                for (const year of [0, 4, 100, 400, 1582, 1600, 1700, 1900, 2000, 2023, 2024, 2100, 9996, 9999]) {
                    for (let month = 0; month <= 99; month++) {
                        for (let day = 0; day <= 99; day++) {
                            const expected = month >= 1 && month <= 12 && referenceIsValid(year, month, day);
                            if (isValidDate(pad(year, 4), pad(month, 2), pad(day, 2)) !== expected) {
                                mismatches.push(`${year}-${month}-${day}`);
                            }
                        }
                    }
                }
                expect(mismatches).toEqual([]);
            });

            it('should have exactly 365 valid days in common years and 366 in leap years', () => {
                for (const [year, days] of [
                    ['2023', 365],
                    ['2024', 366],
                    ['1900', 365],
                    ['2000', 366],
                    ['0000', 366],
                ] as const) {
                    let count = 0;
                    for (let m = 1; m <= 12; m++) {
                        for (let d = 1; d <= 31; d++) {
                            if (isValidDate(year, String(m), String(d))) {
                                count++;
                            }
                        }
                    }
                    expect([year, count]).toEqual([year, days]);
                }
            });
        });

        describe('Strict format', () => {
            it.each([
                '',
                '1',
                '24',
                '202',
                '20245',
                ' 2024',
                '2024 ',
                '+2024',
                '-2024',
                '2024.0',
                '2e03',
                '0x7E8',
                'abcd',
                '２０２４',
                '٢٠٢٤',
            ])('should reject year %j', (y) => {
                expect(isValidDate(y, '01', '01')).toBe(false);
            });

            it.each([
                '',
                '001',
                '012',
                ' 1',
                '1 ',
                '+1',
                '-1',
                '1.',
                '1.0',
                '1e0',
                '0x1',
                'Jan',
                '１',
            ])('should reject month %j', (m) => {
                expect(isValidDate('2024', m, '01')).toBe(false);
            });

            it.each([
                '',
                '001',
                '015',
                ' 1',
                '1 ',
                '+1',
                '-1',
                '1.',
                '1.5',
                '1e1',
                'x',
                '１',
            ])('should reject day %j', (d) => {
                expect(isValidDate('2024', '01', d)).toBe(false);
            });

            it('should accept only ASCII digits as a 1-character month (all UTF-16 code units)', () => {
                for (let c = 0; c <= 0xffff; c++) {
                    const ch = String.fromCharCode(c);
                    expect([c, isValidDate('2024', ch, '1')]).toEqual([c, c >= 49 && c <= 57]);
                }
            });

            it('should reject any non-digit code unit inside year, month or day (all UTF-16 code units)', () => {
                for (let c = 0; c <= 0xffff; c++) {
                    if (c >= 48 && c <= 57) {
                        continue;
                    }
                    const ch = String.fromCharCode(c);
                    expect([c, isValidDate(`20${ch}4`, '1', '1')]).toEqual([c, false]);
                    expect([c, isValidDate('2024', `1${ch}`, '1')]).toEqual([c, false]);
                    expect([c, isValidDate('2024', '1', `${ch}1`)]).toEqual([c, false]);
                }
            });

            it('should match the string oracle for random short inputs', () => {
                const alphabet = '0123456789 +-.eEx１';
                const rnd = createRandom(5);
                const randomPart = (maxLen: number) => {
                    let s = '';
                    const len = rnd(maxLen + 1);
                    for (let i = 0; i < len; i++) {
                        s += alphabet[rnd(alphabet.length)];
                    }
                    return s;
                };
                for (let n = 0; n < 100_000; n++) {
                    const y = rnd(3) ? pad(rnd(10000), 4) : randomPart(5);
                    const m = randomPart(3);
                    const d = randomPart(3);
                    expect([y, m, d, isValidDate(y, m, d)]).toEqual([y, m, d, referenceIsValidString(y, m, d)]);
                }
            });
        });

        describe('Consistency with heuristicallyParseDateString()', () => {
            it('should parse every ISO-like date exactly when isValidDate accepts it', () => {
                for (const year of ['2023', '2024', '1900', '2000']) {
                    for (let month = 0; month <= 13; month++) {
                        for (let day = 0; day <= 32; day++) {
                            const input = `${year}-${pad(month, 2)}-${pad(day, 2)}`;
                            const parsed = heuristicallyParseDateString(input);
                            const valid = isValidDate(year, pad(month, 2), pad(day, 2));
                            expect([input, parsed !== null && parsed.day !== undefined]).toEqual([input, valid]);
                        }
                    }
                }
            });
        });
    });

    describe('Function: formatRisDate() with RawDate objects', () => {
        describe('Reported cases', () => {
            it.each([
                [{ year: '2024', month: '13', day: '45' }],
                [{ year: 'abc' }],
                [{ year: '2023', month: '02', day: '29' }],
                [{ year: '2024', month: '04', day: '31' }],
                [{ year: '2024', month: '00' }],
                [{ year: '2024', day: '32' }],
                [{ year: '24', month: '01' }],
            ])('should return an empty string for invalid %j in every format', (raw) => {
                for (const f of FORMATS) {
                    expect([f, formatRisDate(raw as RawDate, f)]).toEqual([f, '']);
                }
            });

            it('should validate month/day even when the format omits them', () => {
                expect(formatRisDate({ year: '2024', month: '13' } as unknown as RawDate, 'YYYY')).toBe('');
                expect(formatRisDate({ year: '2023', month: '02', day: '29' }, 'YYYY-MM')).toBe('');
                expect(formatRisDate({ year: '2024', month: '02', day: '29' }, 'YYYY-MM')).toBe('2024-02');
            });

            it('should format valid leap day and month end dates', () => {
                expect(formatRisDate({ year: '2024', month: '02', day: '29' }, 'YYYY-MM-DD')).toBe('2024-02-29');
                expect(formatRisDate({ year: '2000', month: '02', day: '29' }, 'YYYY/MM/DD')).toBe('2000/02/29');
                expect(formatRisDate({ year: '2024', month: '04', day: '30' }, 'YYYY-MM-DD')).toBe('2024-04-30');
                expect(formatRisDate({ year: '2024', month: '12', day: '31' }, 'YYYY-MM-DD')).toBe('2024-12-31');
            });

            it('should treat null and empty string parts as missing', () => {
                const raw = { year: '2024', month: '', day: null } as unknown as RawDate;
                expect(formatRisDate(raw, 'YYYY-MM-DD')).toBe('2024');
                expect(formatRisDate({ year: '', month: '01' } as unknown as RawDate, 'YYYY-MM-DD')).toBe('');
            });

            it('should validate and keep a day with an empty month slot when the month is missing', () => {
                expect(formatRisDate({ year: '2024', day: '31' }, 'YYYY-MM-DD')).toBe('2024--31');
                expect(formatRisDate({ year: '2024', day: '31' }, 'YYYY/MM/DD')).toBe('2024//31');
                expect(formatRisDate({ year: '2024', day: '31' }, 'YYYY-MM')).toBe('2024');
                expect(formatRisDate({ year: '2024', day: '32' } as unknown as RawDate, 'YYYY-MM-DD')).toBe('');
            });

            it('should accept numeric parts from untyped input', () => {
                expect(formatRisDate({ year: 2024, month: 2, day: 9 } as unknown as RawDate, 'YYYY-MM-DD')).toBe(
                    '2024-02-09',
                );
                expect(formatRisDate({ year: 2024, month: 2, day: 30 } as unknown as RawDate, 'YYYY-MM-DD')).toBe('');
            });
        });

        describe('All part combinations', () => {
            it(`should match the reference oracle for all ${YEAR_PARTS.length * MONTH_PARTS.length * DAY_PARTS.length} year/month/day combinations in every format`, () => {
                expect(collectFormatMismatches((raw, f) => formatRisDate(raw as RawDate, f))).toEqual([]);
            });

            it('should either return an empty string or a date heuristicallyParseDateString() accepts', () => {
                for (const raw of rawDateCombinations()) {
                    const formatted = formatRisDate(raw as RawDate, 'YYYY-MM-DD');
                    // year+day without month (`2024--15`) has no heuristic pattern; parse keeps it as string.
                    if (formatted !== '' && !formatted.includes('--')) {
                        expect([formatted, heuristicallyParseDateString(formatted) !== null]).toEqual([formatted, true]);
                    }
                }
            });

            it('should round-trip every valid day of 2023 and 2024 through heuristicallyParseDateString()', () => {
                for (const year of ['2023', '2024']) {
                    for (let month = 1; month <= 12; month++) {
                        for (let day = 1; day <= 31; day++) {
                            const raw = { year, month: pad(month, 2), day: pad(day, 2) } as RawDate;
                            const formatted = formatRisDate(raw, 'YYYY-MM-DD');
                            const parsed = heuristicallyParseDateString(formatted);
                            expect([raw, parsed]).toEqual([raw, formatted === '' ? null : raw]);
                        }
                    }
                }
            });
        });

        describe('Regression detection: pre-fix unvalidated formatting', () => {
            // Expected to fail: `it.failing` passes while the assertion fails and reports an error if it ever passes,
            // proving the combination matrix detects unvalidated `RawDate` output such as `2024-13-45`.
            it.failing('should detect unvalidated RawDate formatting', () => {
                expect(collectFormatMismatches(formatWithoutValidation)).toEqual([]);
            });

            it('should reproduce the reported invalid output with the pre-fix formatter', () => {
                expect(formatWithoutValidation({ year: '2024', month: '13', day: '45' }, 'YYYY-MM-DD')).toBe('2024-13-45');
                expect(formatWithoutValidation({ year: 'abc' }, 'YYYY-MM-DD')).toBe('abc');
                expect(formatRisDate({ year: '2024', month: '13', day: '45' } as unknown as RawDate, 'YYYY-MM-DD')).toBe(
                    '',
                );
            });
        });
    });
});
