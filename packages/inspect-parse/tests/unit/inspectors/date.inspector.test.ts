// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { TagStats } from '../../../src/inspect-parse.types.js';
import { inspectDateValue } from '../../../src/inspectors/date.inspector.js';

function createMockStats(): TagStats {
    return {
        count: 1,
        emptyCount: 0,
        multilineCount: 0,
        whitespacePaddedCount: 0,
        isStandard: true,
    };
}

describe('inspect-parse - unit > inspectors > date.inspector.ts', () => {
    describe('Function: inspectDateValue()', () => {
        it('should classify full dates (YYYY-MM-DD) into fullDateCount precision', () => {
            const stats = createMockStats();
            expect(inspectDateValue('2023-05-10', stats)).toBe(true);
            expect(stats.dateCastSuccessCount).toBe(1);
            expect(stats.datePrecision?.fullDateCount).toBe(1);
        });

        it('should classify year-month dates (YYYY-MM) into yearMonthCount precision', () => {
            const stats = createMockStats();
            expect(inspectDateValue('2023-05', stats)).toBe(true);
            expect(stats.dateCastSuccessCount).toBe(1);
            expect(stats.datePrecision?.yearMonthCount).toBe(1);
        });

        it('should classify year-only dates (YYYY) into yearOnlyCount precision', () => {
            const stats = createMockStats();
            expect(inspectDateValue('2023', stats)).toBe(true);
            expect(stats.dateCastSuccessCount).toBe(1);
            expect(stats.datePrecision?.yearOnlyCount).toBe(1);
        });

        it('should classify month-only dates (May) into monthOnlyCount precision as a cast failure like the parser', () => {
            const stats = createMockStats();
            expect(inspectDateValue('May', stats)).toBe(false);
            expect(stats.dateCastSuccessCount).toBeUndefined();
            expect(stats.dateCastFailureCount).toBe(1);
            expect(stats.datePrecision?.monthOnlyCount).toBe(1);
        });

        it('should resolve a year-less date with the fallback year resolver into yearMonthCount precision', () => {
            const stats = createMockStats();
            expect(inspectDateValue('May', stats, () => '2020')).toBe(true);
            expect(stats.dateCastSuccessCount).toBe(1);
            expect(stats.dateCastFailureCount).toBeUndefined();
            expect(stats.datePrecision).toEqual({
                fullDateCount: 0,
                yearMonthCount: 1,
                yearOnlyCount: 0,
                monthOnlyCount: 0,
            });
        });

        it('should keep a year-less date a failure when the fallback year resolver finds no year', () => {
            const stats = createMockStats();
            expect(inspectDateValue('May', stats, () => null)).toBe(false);
            expect(stats.dateCastFailureCount).toBe(1);
            expect(stats.datePrecision?.monthOnlyCount).toBe(1);
        });

        it('should increment dateCastFailureCount for unparseable date strings', () => {
            const stats = createMockStats();
            expect(inspectDateValue('Not A Valid Date String 99999', stats)).toBe(false);
            expect(stats.dateCastFailureCount).toBe(1);
            expect(stats.dateCastSuccessCount).toBeUndefined();
            expect(stats.datePrecision).toBeUndefined();
        });
    });
});
