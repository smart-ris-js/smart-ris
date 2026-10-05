// Copyright 2026 Martin Winkler

import { afterEach, describe, expect, it } from 'bun:test';
import vm from 'node:vm';
import { DATE_YEAR_SUPPLIER_TAGS } from '../../../src/core.constants.js';
import { extractYearFromPayload, extractYearFromVal, formatRisDate } from '../../../src/utils/date.js';

// `bun test` runs in UTC unless `TZ` is set, where UTC and local getters agree; that is why the
// UTC getter bug went unnoticed. Bun applies `process.env.TZ` changes at runtime, so every test
// here switches the process timezone and restores the runner default afterwards.
const ORIGINAL_TZ = process.env.TZ;

afterEach(() => {
    // Deleting `TZ` would fall back to the system timezone, not the runner's UTC default.
    process.env.TZ = ORIGINAL_TZ ?? 'UTC';
});

/** Runs `fn` with the process timezone set to `tz`. */
function withTimezone<T>(tz: string, fn: () => T): T {
    const previous = process.env.TZ;
    process.env.TZ = tz;
    try {
        return fn();
    } finally {
        process.env.TZ = previous ?? 'UTC';
    }
}

/** Timezone and its UTC offset in minutes for `2024-01-15` as returned by `getTimezoneOffset()`. */
const TIMEZONES: [tz: string, offset: number][] = [
    ['UTC', 0],
    ['Europe/Vienna', -60],
    ['Pacific/Kiritimati', -840],
    ['Asia/Kolkata', -330],
    ['Asia/Kathmandu', -345],
    ['Australia/Lord_Howe', -660],
    ['America/Sao_Paulo', 180],
    ['America/St_Johns', 210],
    ['America/New_York', 300],
    ['Pacific/Pago_Pago', 660],
    ['Etc/GMT+12', 720],
];

const SHIFTED_TIMEZONES = TIMEZONES.filter(([, offset]) => offset !== 0);

/** Local wall clock time: year, month (1-12), day, hours, minutes, seconds, milliseconds. */
type LocalTime = [y: number, m: number, d: number, h?: number, min?: number, s?: number, ms?: number];

const LOCAL_TIMES: LocalTime[] = [
    [2024, 1, 1],
    [2024, 1, 1, 0, 0, 0, 1],
    [2023, 12, 31, 23, 59, 59, 999],
    [2024, 1, 1, 12],
    [2024, 2, 28, 23, 59, 59, 999],
    [2024, 2, 29],
    [2024, 2, 29, 23, 59, 59, 999],
    [2023, 2, 28],
    [2024, 3, 1],
    [2024, 6, 30, 23, 59, 59, 999],
    [2024, 7, 1],
    // EU DST start/end (02:30 does not exist on 2024-03-31 in Europe and is moved forward on the same day).
    [2024, 3, 31],
    [2024, 3, 31, 2, 30],
    [2024, 10, 27],
    [2024, 10, 27, 23, 59, 59, 999],
    // US DST start/end.
    [2024, 3, 10],
    [2024, 3, 10, 2, 30],
    [2024, 11, 3],
    // Brazil moved clocks forward at midnight: local 00:00 did not exist and becomes 01:00 of the same day.
    [2018, 11, 4],
    [1970, 1, 1],
    [1969, 12, 31, 23, 59, 59, 999],
    [2000, 1, 1],
    [1900, 3, 1],
    [50, 1, 1],
    [999, 12, 31, 23, 59, 59, 999],
    [0, 1, 1],
    [9999, 12, 31, 23, 59, 59, 999],
];

/** Creates a local `Date` from wall clock parts; years `0-99` are not mapped to `1900-1999`. */
function localDate([y, m, d, h = 0, min = 0, s = 0, ms = 0]: LocalTime): Date {
    const date = new Date(2000, 0, 1, h, min, s, ms);
    date.setFullYear(y, m - 1, d);
    return date;
}

const pad = (n: number, len: number) => String(n).padStart(len, '0');
const calendarDate = ([y, m, d]: LocalTime) => `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;

/** Pre-fix `formatRisDate` `Date` branch (UTC getters), kept to prove the matrix detects that regression. */
function formatWithUtcGetters(date: Date): string {
    return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}`;
}

/** Formats every local time in `tz` and returns all results differing from the local calendar date. */
function collectMismatches(tz: string, format: (date: Date) => string): string[] {
    return withTimezone(tz, () => {
        const mismatches: string[] = [];
        for (const time of LOCAL_TIMES) {
            const expected = calendarDate(time);
            const actual = format(localDate(time));
            if (actual !== expected) {
                mismatches.push(`${expected} -> ${actual}`);
            }
        }
        return mismatches;
    });
}

describe('core - unit > utils > date (timezones)', () => {
    describe('Test setup: process timezone switching', () => {
        it.each(TIMEZONES)('should apply TZ=%s at runtime (offset %p)', (tz, offset) => {
            withTimezone(tz, () => {
                expect(new Date(2024, 0, 15, 12).getTimezoneOffset()).toBe(offset);
            });
        });

        it('should restore the runner default timezone after a test', () => {
            expect(process.env.TZ).toBe(ORIGINAL_TZ ?? 'UTC');
            withTimezone('Europe/Vienna', () => undefined);
            expect(process.env.TZ).toBe(ORIGINAL_TZ ?? 'UTC');
        });
    });

    describe('Function: formatRisDate() with Date objects', () => {
        it.each(TIMEZONES)('should format the local calendar date in %s', (tz) => {
            expect(collectMismatches(tz, (date) => formatRisDate(date, 'YYYY-MM-DD'))).toEqual([]);
        });

        it.each(TIMEZONES)('should apply every date format to the local calendar date in %s', (tz) => {
            withTimezone(tz, () => {
                const date = new Date(2024, 0, 1);
                expect(formatRisDate(date, 'YYYY-MM-DD')).toBe('2024-01-01');
                expect(formatRisDate(date, 'YYYY/MM/DD')).toBe('2024/01/01');
                expect(formatRisDate(date, 'YYYY-MM')).toBe('2024-01');
                expect(formatRisDate(date, 'YYYY/MM')).toBe('2024/01');
                expect(formatRisDate(date, 'YYYY')).toBe('2024');
            });
        });

        it('should format cross-realm Date objects by their local calendar date', () => {
            withTimezone('Pacific/Kiritimati', () => {
                expect(formatRisDate(vm.runInNewContext('new Date(2024, 0, 1)'), 'YYYY-MM-DD')).toBe('2024-01-01');
            });
        });

        it('should format one instant as the calendar date of the current timezone (documented convention)', () => {
            // Date-only ISO strings are parsed as UTC midnight by JavaScript; west of UTC this is the previous local day.
            const utcMidnight = new Date('2024-01-01');
            expect(withTimezone('UTC', () => formatRisDate(utcMidnight, 'YYYY-MM-DD'))).toBe('2024-01-01');
            expect(withTimezone('Europe/Vienna', () => formatRisDate(utcMidnight, 'YYYY-MM-DD'))).toBe('2024-01-01');
            expect(withTimezone('America/New_York', () => formatRisDate(utcMidnight, 'YYYY-MM-DD'))).toBe('2023-12-31');
        });

        it.each(TIMEZONES)('should pad years below 1000 to 4 digits in %s', (tz) => {
            withTimezone(tz, () => {
                expect(formatRisDate(localDate([0, 1, 1]), 'YYYY')).toBe('0000');
                expect(formatRisDate(localDate([7, 3, 4]), 'YYYY-MM-DD')).toBe('0007-03-04');
                expect(formatRisDate(localDate([999, 12, 31]), 'YYYY/MM/DD')).toBe('0999/12/31');
            });
        });

        it.each(TIMEZONES)('should return an empty string for local years outside 0000-9999 in %s', (tz) => {
            withTimezone(tz, () => {
                expect(formatRisDate(localDate([-1, 12, 31, 23, 59, 59, 999]), 'YYYY-MM-DD')).toBe('');
                expect(formatRisDate(localDate([10000, 1, 1]), 'YYYY-MM-DD')).toBe('');
                expect(formatRisDate(localDate([-271821, 4, 21]), 'YYYY')).toBe('');
                expect(formatRisDate(new Date(8.64e15), 'YYYY')).toBe('');
            });
        });

        it('should return an empty string for invalid Date objects in every timezone', () => {
            for (const [tz] of TIMEZONES) {
                expect([tz, withTimezone(tz, () => formatRisDate(new Date(Number.NaN), 'YYYY-MM-DD'))]).toEqual([tz, '']);
            }
        });
    });

    describe('Function: extractYearFromVal() with Date objects', () => {
        it.each(TIMEZONES)('should extract the local year in %s', (tz) => {
            withTimezone(tz, () => {
                for (const time of LOCAL_TIMES) {
                    expect([calendarDate(time), extractYearFromVal(localDate(time))]).toEqual([
                        calendarDate(time),
                        pad(time[0], 4),
                    ]);
                }
            });
        });

        it.each(TIMEZONES)('should return null for invalid dates and local years outside 0000-9999 in %s', (tz) => {
            withTimezone(tz, () => {
                expect(extractYearFromVal(new Date(Number.NaN))).toBeNull();
                expect(extractYearFromVal(localDate([-1, 12, 31, 23, 59, 59, 999]))).toBeNull();
                expect(extractYearFromVal(localDate([10000, 1, 1]))).toBeNull();
            });
        });

        it.each(SHIFTED_TIMEZONES)('should supply the local year of a New Year date as fallback year in %s', (tz) => {
            withTimezone(tz, () => {
                const payload = { PY: [new Date(2024, 0, 1)], DA: [{ month: '03' }] };
                expect(extractYearFromPayload(payload, 'DA', DATE_YEAR_SUPPLIER_TAGS)).toBe('2024');
                const lateNight = { PY: [new Date(2023, 11, 31, 23, 59, 59, 999)] };
                expect(extractYearFromPayload(lateNight, 'DA', DATE_YEAR_SUPPLIER_TAGS)).toBe('2023');
            });
        });
    });

    describe('Regression detection: pre-fix UTC getters', () => {
        // Expected to fail: `it.failing` passes while the assertion fails and reports an error if it ever passes,
        // proving the timezone matrix detects dates formatted with UTC getters.
        for (const [tz] of SHIFTED_TIMEZONES) {
            it.failing(`should detect UTC getter formatting in ${tz}`, () => {
                expect(collectMismatches(tz, formatWithUtcGetters)).toEqual([]);
            });
        }

        it('should not detect UTC getter formatting under the runner default UTC timezone', () => {
            // Why the matrix is needed: in UTC both getter families agree.
            expect(collectMismatches('UTC', formatWithUtcGetters)).toEqual([]);
        });

        it('should detect the reported one-day shift of UTC getters in Europe/Vienna', () => {
            withTimezone('Europe/Vienna', () => {
                const newYear = new Date(2024, 0, 1);
                expect(formatWithUtcGetters(newYear)).toBe('2023-12-31');
                expect(formatRisDate(newYear, 'YYYY-MM-DD')).toBe('2024-01-01');
            });
        });
    });
});
