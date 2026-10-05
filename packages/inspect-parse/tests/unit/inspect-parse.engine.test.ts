// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { resolveParseOptions } from '@smart-ris/parse';
import { createInitialReport, inspectRecord } from '../../src/inspect-parse.engine.js';

describe('inspect-parse - unit > inspect-parse.engine.ts', () => {
    describe('Function: createInitialReport()', () => {
        it('should initialize empty inspection report structure', () => {
            const report = createInitialReport();
            expect(report.totalRecords).toBe(0);
            expect(report.totalAnomalies).toBe(0);
            expect(report.eol.styles).toEqual([]);
            expect(report.anomalies).toEqual([]);
            expect(report.tags).toEqual({});
        });
    });

    describe('Function: inspectRecord()', () => {
        it('should record tag stats for scalar and array values in a record', () => {
            const report = createInitialReport();
            inspectRecord(
                {
                    TY: 'JOUR',
                    AU: ['Smith, A.', 'Doe, B.'],
                    VL: '27',
                    PY: '2023',
                },
                report,
                resolveParseOptions(),
            );

            expect(report.tags.TY.count).toBe(1);
            expect(report.tags.AU.count).toBe(2);
            expect(report.tags.AU.multipleOccurrencesCount).toBe(1);
            expect(report.tags.VL.castSuccessCount).toBe(1);
            expect(report.tags.PY.dateCastSuccessCount).toBe(1);
        });

        it('should not count empty or whitespace-only strings as successful casts in smartCastSchema', () => {
            const report = createInitialReport();
            inspectRecord(
                {
                    TY: 'JOUR',
                    VL: '   ',
                    IS: '',
                },
                report,
                resolveParseOptions({ smartCastSchema: { VL: 'number', IS: 'number' } }),
            );

            expect(report.tags.VL.emptyCount).toBe(1);
            expect(report.tags.VL.castSuccessCount).toBeUndefined();
            expect(report.tags.IS.emptyCount).toBe(1);
            expect(report.tags.IS.castSuccessCount).toBeUndefined();
        });

        it('should flag invalid tag keys as not repairable and leave anomalies to the parser diagnostics', () => {
            const report = createInitialReport();
            const options = resolveParseOptions();
            inspectRecord({ TY: 'JOUR', BADTAG: ['a', 'b'] }, report, options);
            inspectRecord({ TY: 'BOOK', BADTAG: 'c' }, report, options);

            expect(report.tags.BADTAG.count).toBe(3);
            expect(report.tags.BADTAG.canBeRepaired).toBe(false);
            expect(report.tags.TY.canBeRepaired).toBeUndefined();
            expect(report.anomalies).toEqual([]);
            expect(report.totalAnomalies).toBe(0);
        });

        it('should model the parser fallback year and year-less date failures', () => {
            const report = createInitialReport();
            const options = resolveParseOptions();
            inspectRecord({ TY: ['JOUR'], PY: ['2020'], DA: ['March'] }, report, options);
            inspectRecord({ TY: ['JOUR'], DA: ['March'] }, report, options);

            expect(report.tags.DA.dateCastSuccessCount).toBe(1);
            expect(report.tags.DA.dateCastFailureCount).toBe(1);
            expect(report.tags.DA.castSuccessCount).toBe(1);
            expect(report.tags.DA.castFailureCount).toBe(1);
            expect(report.tags.DA.datePrecision).toEqual({
                fullDateCount: 0,
                yearMonthCount: 1,
                yearOnlyCount: 0,
                monthOnlyCount: 1,
            });
        });

        it('should record no invalid tag format anomaly for valid tags', () => {
            const report = createInitialReport();
            inspectRecord({ TY: 'JOUR', AU: ['a', 'b'] }, report, resolveParseOptions());

            expect(report.anomalies).toEqual([]);
            expect(report.totalAnomalies).toBe(0);
        });
    });
});
