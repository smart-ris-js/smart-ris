// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { CastType } from '@smart-ris/core';
import { type ParseOptions, resolveParseOptions } from '@smart-ris/parse';
import { createInitialReport } from '../../../src/inspect-parse.engine.js';
import type { ParseInspectionReport, TagStats } from '../../../src/inspect-parse.types.js';
import {
    createCastPlan,
    inspectRecordCasting,
    inspectTypeCasting,
} from '../../../src/inspectors/type-cast.inspector.js';

function createMockStats(): TagStats {
    return {
        count: 1,
        emptyCount: 0,
        multilineCount: 0,
        whitespacePaddedCount: 0,
        isStandard: true,
    };
}

/** Runs record casting with stats pre-created for every record key, as `inspectRecord` does. */
function castRecord(record: Record<string, unknown>, options: ParseOptions = {}): ParseInspectionReport {
    const report = createInitialReport();
    for (const key in record) {
        report.tags[key] = createMockStats();
    }
    inspectRecordCasting(record, report, createCastPlan(resolveParseOptions(options)));
    return report;
}

/** Extracts `[castSuccessCount, castFailureCount]` of a tag. */
function verdict(report: ParseInspectionReport, tag: string): [number | undefined, number | undefined] {
    return [report.tags[tag]?.castSuccessCount, report.tags[tag]?.castFailureCount];
}

describe('inspect-parse - unit > inspectors > type-cast.inspector.ts', () => {
    describe('Function: inspectTypeCasting()', () => {
        it.each<[CastType, string, [number | undefined, number | undefined]]>([
            ['number', '123', [1, undefined]],
            ['number', ' 12 ', [1, undefined]],
            ['number', 'NotANumber', [undefined, 1]],
            ['number', '   ', [undefined, undefined]],
            ['number', '-3.5', [1, undefined]],
            ['number', '0x10', [undefined, 1]],
            ['number', '0b1', [undefined, 1]],
            ['number', '0o7', [undefined, 1]],
            ['number', '1e3', [undefined, 1]],
            ['number', 'Infinity', [undefined, 1]],
            ['number', '-Infinity', [undefined, 1]],
            ['number', '12345678901234567890', [undefined, 1]],
            ['boolean', 'true', [1, undefined]],
            ['boolean', 'FALSE', [1, undefined]],
            ['boolean', ' true', [1, undefined]],
            ['boolean', 'NotABool', [undefined, 1]],
            ['boolean', ' ', [undefined, undefined]],
            ['date', '2023-05-10', [1, undefined]],
            ['date', 'May', [undefined, 1]],
            ['date', 'NotADate', [undefined, 1]],
            ['string', 'Text', [1, undefined]],
        ])('should mirror parse smartCast verdict for %s cast of %p', (castType, val, expected) => {
            const stats = createMockStats();
            inspectTypeCasting(val, castType, stats);
            expect([stats.castSuccessCount, stats.castFailureCount]).toEqual(expected);
        });

        it('should apply the fallback year resolver to date casts and keep date counters in sync', () => {
            const stats = createMockStats();
            inspectTypeCasting('May', 'date', stats, () => '2020');
            expect(stats.castSuccessCount).toBe(1);
            expect(stats.dateCastSuccessCount).toBe(1);
            expect(stats.datePrecision?.yearMonthCount).toBe(1);
        });

        it('should not touch date counters for non-date casts', () => {
            const stats = createMockStats();
            inspectTypeCasting('12', 'number', stats);
            expect(stats.dateCastSuccessCount).toBeUndefined();
            expect(stats.datePrecision).toBeUndefined();
        });
    });

    describe('Function: createCastPlan()', () => {
        it('should resolve the default schema, fallback tags, supplier tags and array tags', () => {
            const plan = createCastPlan(resolveParseOptions());
            expect(plan.castSchema.PY).toBe('date');
            expect(plan.castSchema.VL).toBe('number');
            expect([...plan.fallbackTags]).toEqual(['DA', 'Y1']);
            expect(plan.supplierTags).toEqual(['PY', 'Y1']);
            expect(plan.arrayTags.has('AU')).toBe(true);
            expect(plan.sanitizer).toBeDefined();
        });

        it('should not pass cast type, fallback or supplier roles of mapped source tags to their targets', () => {
            const plan = createCastPlan(resolveParseOptions({ tagMapping: { PY: 'C1', DA: 'C2', C3: 'VL' } }));
            expect(plan.castSchema.C1).toBeUndefined();
            expect(plan.castSchema.C2).toBeUndefined();
            expect(plan.castSchema.VL).toBe('number');
            expect(plan.fallbackTags.has('C2')).toBe(false);
            expect(plan.supplierTags).toEqual(['PY', 'Y1']);
        });

        it('should keep the target cast type when a mapped source has its own cast type', () => {
            const plan = createCastPlan(
                resolveParseOptions({ tagMapping: { C1: 'VL' }, smartCastSchema: { C1: 'date' } }),
            );
            expect(plan.castSchema.VL).toBe('number');
        });

        it('should skip the sanitizer when neither cleanWhitespace nor mergeMultiline is enabled', () => {
            expect(createCastPlan(resolveParseOptions({ cleanWhitespace: false })).sanitizer).toBeUndefined();
            expect(
                createCastPlan(resolveParseOptions({ cleanWhitespace: false, mergeMultiline: true })).sanitizer,
            ).toBeDefined();
        });
    });

    describe('Function: inspectRecordCasting()', () => {
        it('should model the PY and Y1 fallback year for DA like the parser', () => {
            expect(castRecord({ PY: ['2020'], DA: ['March'] }).tags.DA.datePrecision?.yearMonthCount).toBe(1);
            expect(castRecord({ Y1: ['2019'], DA: ['March'] }).tags.DA.dateCastSuccessCount).toBe(1);
            expect(castRecord({ DA: ['March'] }).tags.DA.dateCastFailureCount).toBe(1);
        });

        it('should not resolve a fallback year from conflicting supplier years', () => {
            const report = castRecord({ PY: ['2020', '2021'], DA: ['March'] }, { customArrayTags: ['PY'] });
            expect(report.tags.DA.dateCastFailureCount).toBe(1);
        });

        it('should not apply a fallback year to tags outside the fallback tag set', () => {
            expect(castRecord({ PY: ['2020'], Y2: ['March'] }).tags.Y2.dateCastFailureCount).toBe(1);
        });

        it('should cast the merged value once for repeated scalar tags (join-space default)', () => {
            const report = castRecord({ VL: ['12', '13'] });
            expect(verdict(report, 'VL')).toEqual([undefined, 1]);
        });

        it.each([
            ['first', ['12', 'abc'], [1, undefined]],
            ['last', ['12', 'abc'], [undefined, 1]],
            ['join-newline', ['12', '13'], [undefined, 1]],
        ] as const)(
            'should cast only the value selected by arrayMergeStrategy %p',
            (arrayMergeStrategy, values, expected) => {
                expect(verdict(castRecord({ VL: [...values] }, { arrayMergeStrategy }), 'VL')).toEqual(expected);
            },
        );

        it('should skip null entries when selecting the merged value', () => {
            expect(verdict(castRecord({ VL: [null, '12'] }, { arrayMergeStrategy: 'first' }), 'VL')).toEqual([
                1,
                undefined,
            ]);
        });

        it('should cast every entry when arrayMergeStrategy is false or the tag is an array tag', () => {
            expect(verdict(castRecord({ VL: ['12', 'abc'] }, { arrayMergeStrategy: false }), 'VL')).toEqual([1, 1]);
            expect(verdict(castRecord({ VL: ['12', 'abc'] }, { customArrayTags: ['VL'] }), 'VL')).toEqual([1, 1]);
        });

        it('should attribute verdicts to the raw tag the value came from under tagMapping', () => {
            const report = castRecord({ C1: ['2020'], C2: ['abc'] }, { tagMapping: { C1: 'PY', C2: 'VL' } });
            expect(report.tags.C1.dateCastSuccessCount).toBe(1);
            expect(verdict(report, 'C2')).toEqual([undefined, 1]);
        });

        it('should attribute a merged value of mapped tags to the primary target tag first', () => {
            const report = castRecord({ C1: ['12'], VL: ['13'] }, { tagMapping: { C1: 'VL' } });
            expect(verdict(report, 'VL')).toEqual([undefined, 1]);
            expect(verdict(report, 'C1')).toEqual([undefined, undefined]);
        });

        it('should not use a supplier tag mapped to a non-supplier target for the fallback year', () => {
            const report = castRecord({ PY: ['2020'], DA: ['March'] }, { tagMapping: { PY: 'C1' } });
            expect(report.tags.PY.dateCastSuccessCount).toBeUndefined();
            expect(report.tags.DA.dateCastFailureCount).toBe(1);
        });

        it('should use a tag mapped to a supplier target for the fallback year', () => {
            const report = castRecord({ C1: ['2020'], DA: ['March'] }, { tagMapping: { C1: 'PY' } });
            expect(report.tags.C1.dateCastSuccessCount).toBe(1);
            expect(report.tags.DA.datePrecision?.yearMonthCount).toBe(1);
        });

        it('should cast values of swapped tags with the cast type of their target tag', () => {
            const report = castRecord({ VL: ['2020'], PY: ['abc'] }, { tagMapping: { VL: 'PY', PY: 'VL' } });
            expect(report.tags.VL.dateCastSuccessCount).toBe(1);
            expect(verdict(report, 'PY')).toEqual([undefined, 1]);
        });

        it('should cast whitespace-padded booleans regardless of cleanWhitespace', () => {
            const options = { smartCastSchema: { C1: 'boolean' } } as const;
            expect(verdict(castRecord({ C1: [' true'] }, options), 'C1')).toEqual([1, undefined]);
            expect(verdict(castRecord({ C1: [' true'] }, { ...options, cleanWhitespace: false }), 'C1')).toEqual([
                1,
                undefined,
            ]);
        });

        it('should skip tags without cast type and null values', () => {
            const report = castRecord({ AU: ['Smith'], VL: [null] });
            expect(verdict(report, 'AU')).toEqual([undefined, undefined]);
            expect(verdict(report, 'VL')).toEqual([undefined, undefined]);
        });

        it('should accept scalar record values', () => {
            expect(verdict(castRecord({ VL: '12' }), 'VL')).toEqual([1, undefined]);
        });
    });
});
