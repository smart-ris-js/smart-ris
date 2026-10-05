// Copyright 2026 Martin Winkler

import { afterEach, describe, expect, it, mock } from 'bun:test';
import { ERROR_MESSAGES, ris } from '@smart-ris/core';
import { type StringifyOptions, stringify } from '../../src/index.js';

// `bun test` runs in UTC unless `TZ` is set; Bun applies `process.env.TZ` changes at runtime.
const ORIGINAL_TZ = process.env.TZ;

afterEach(() => {
    // Deleting `TZ` would fall back to the system timezone, not the runner's UTC default.
    process.env.TZ = ORIGINAL_TZ ?? 'UTC';
});

/** Sets the process timezone; call it before creating `Date` objects, they use the current timezone. */
function useTimezone(tz: string): void {
    process.env.TZ = tz;
}

/** Stringifies a single record and collects `onError` messages. */
function run(record: Record<string, unknown>, options: StringifyOptions = {}) {
    const onError = mock();
    const output = stringify([record], { logLevel: 'warn', onError, ...options });
    return { lines: output.split('\n'), messages: onError.mock.calls.map((call) => call[0].error.message) };
}

const TIMEZONES = ['UTC', 'Europe/Vienna', 'Pacific/Kiritimati', 'Asia/Kathmandu', 'America/New_York', 'Etc/GMT+12'];

describe('stringify - integration > date-objects', () => {
    describe('Date objects are written as their local calendar date', () => {
        it.each(TIMEZONES)('should write New Year and New Year Eve dates unshifted in %s', (tz) => {
            useTimezone(tz);
            const { lines, messages } = run({
                TY: 'JOUR',
                DA: new Date(2024, 0, 1),
                Y1: new Date(2023, 11, 31, 23, 59, 59, 999),
                Y2: new Date(2024, 1, 29, 0, 0, 0, 1),
            });
            expect(lines).toContain('DA  - 2024-01-01');
            expect(lines).toContain('Y1  - 2023-12-31');
            expect(lines).toContain('Y2  - 2024-02-29');
            expect(messages).toEqual([]);
        });

        it.each(TIMEZONES)('should write builder Date values unshifted in %s', (tz) => {
            useTimezone(tz);
            const { lines } = run(ris.TY('JOUR').DA(new Date(2024, 0, 1)).PY(new Date(2024, 0, 1)).get);
            expect(lines).toContain('DA  - 2024-01-01');
            expect(lines).toContain('PY  - 2024-01-01');
        });

        it.each(TIMEZONES)('should use the local year of a Date as fallback year for partial dates in %s', (tz) => {
            useTimezone(tz);
            const { lines } = run(
                { TY: 'JOUR', PY: new Date(2024, 0, 1), DA: { month: '03', day: '05' }, Y1: 'Feb 29' },
                { useSmartTypes: true },
            );
            expect(lines).toContain('DA  - 2024-03-05');
            expect(lines).toContain('Y1  - 2024-02-29');
        });

        it('should format a Date by the timezone active when stringifying', () => {
            useTimezone('Europe/Vienna');
            const newYear = new Date(2024, 0, 1);
            useTimezone('America/New_York');
            expect(run({ TY: 'JOUR', DA: newYear }).lines).toContain('DA  - 2023-12-31');
        });

        it('should respect dateFormat for local dates', () => {
            useTimezone('Pacific/Kiritimati');
            const { lines } = run({ TY: 'JOUR', DA: new Date(2024, 0, 1) }, { dateFormat: 'YYYY/MM' });
            expect(lines).toContain('DA  - 2024/01');
        });

        it.each(TIMEZONES)('should pad years below 1000 and drop years above 9999 with a warning in %s', (tz) => {
            useTimezone(tz);
            const early = new Date(2000, 0, 1);
            early.setFullYear(999, 11, 31);
            const late = new Date(2000, 0, 1);
            late.setFullYear(10000, 0, 1);
            const { lines, messages } = run({ TY: 'JOUR', DA: early, Y1: late });
            expect(lines).toContain('DA  - 0999-12-31');
            expect(lines.some((line) => line.startsWith('Y1'))).toBe(false);
            expect(messages).toEqual([ERROR_MESSAGES.INVALID_DATE_FALLBACK]);
        });
    });


    describe('RawDate objects are validated', () => {
        it.each([
            [{ year: '2024', month: '13', day: '45' }, '2024-13-45'],
            [{ year: 'abc' }, 'abc'],
            [{ year: '2023', month: '02', day: '29' }, '2023-02-29'],
            [{ year: '2024', month: '04', day: '31' }, '2024-04-31'],
            [{ year: '2024', month: '00' }, '2024-00'],
            [{ year: '24', month: '01', day: '01' }, '24-01-01'],
            [{ year: '2024', month: 'Jan' }, '2024-Jan'],
            [{ year: '2024', month: '1', day: '1.5' }, '2024-01-1.5'],
        ])('should write %j unvalidated as %s with an INVALID_DATE_FALLBACK warning', (rawDate, expected) => {
            const { lines, messages } = run({ TY: 'JOUR', DA: rawDate });
            expect(lines).toContain(`DA  - ${expected}`);
            expect(messages).toEqual([ERROR_MESSAGES.INVALID_DATE_FALLBACK]);
        });

        it('should write invalid builder RawDate values unvalidated with a warning', () => {
            const { lines, messages } = run(
                ris.TY('JOUR').DA({ year: '2024', month: '13', day: '45' } as never).PY('2024').get,
            );
            expect(lines).toEqual(['TY  - JOUR', 'DA  - 2024-13-45', 'PY  - 2024', 'ER  - ', '']);
            expect(messages).toEqual([ERROR_MESSAGES.INVALID_DATE_FALLBACK]);
        });

        it('should write valid RawDate values including leap days', () => {
            const { lines, messages } = run({
                TY: 'JOUR',
                DA: { year: '2024', month: '02', day: '29' },
                Y1: { year: '2024', month: '2' },
                Y2: { year: '2024' },
            });
            expect(lines).toContain('DA  - 2024-02-29');
            expect(lines).toContain('Y1  - 2024-02');
            expect(lines).toContain('Y2  - 2024');
            expect(messages).toEqual([]);
        });

        it('should validate yearless RawDate values against the fallback year', () => {
            const leap = run({ TY: 'JOUR', PY: '2024', DA: { month: '02', day: '29' } });
            expect(leap.lines).toContain('DA  - 2024-02-29');
            expect(leap.messages).toEqual([]);

            const common = run({ TY: 'JOUR', PY: '2023', DA: { month: '02', day: '29' } });
            expect(common.lines).toContain('DA  - 2023-02-29');
            expect(common.messages).toEqual([ERROR_MESSAGES.INVALID_DATE_FALLBACK]);
        });

        it('should not resolve a fallback year for an empty month', () => {
            const { lines, messages } = run({ TY: 'JOUR', PY: '2024', DA: { month: '', day: '15' } });
            expect(lines).toContain('DA  - 15');
            expect(messages).toEqual([ERROR_MESSAGES.INVALID_DATE_FALLBACK]);
        });

        it('should write invalid RawDate entries in arrays unvalidated next to valid siblings', () => {
            const { lines, messages } = run({
                TY: 'JOUR',
                KW: [{ year: '2024', month: '13' }, { year: '2024', month: '12', day: '31' }],
            });
            expect(lines).toEqual(['TY  - JOUR', 'KW  - 2024-13', 'KW  - 2024-12-31', 'ER  - ', '']);
            expect(messages).toEqual([ERROR_MESSAGES.INVALID_DATE_FALLBACK]);
        });
    });
});
