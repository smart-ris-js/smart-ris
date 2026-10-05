// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { ERROR_MESSAGES, RIS_ERROR } from '@smart-ris/core';
import { type ParseOptions, parse, resolveParseOptions } from '@smart-ris/parse';
import { inspectParse } from '../../src/index.js';

type Verdicts = Record<string, { ok: number; fail: number }>;

const TAGS = ['PY', 'DA', 'Y1', 'Y2', 'VL', 'IS', 'KW', 'AU', 'C1', 'C2', 'M1'];
const VALUES = [
    '2020',
    'March',
    '2020-03',
    '2020/03/05/',
    '05 March 2019',
    'garbage',
    '12',
    '1e3',
    'abc',
    'true',
    'TRUE',
    'yes',
    '2020 2021',
    '31.12.2020',
    '2019-02-30',
    '0',
    'Infinity',
    '12\n  34',
    'true\n   ',
    '2020\n\n\n',
];

const OPTION_SETS: ParseOptions[] = [
    {},
    { arrayMergeStrategy: 'first' },
    { arrayMergeStrategy: 'last' },
    { arrayMergeStrategy: 'join-newline' },
    { arrayMergeStrategy: false },
    { cleanWhitespace: false },
    { mergeMultiline: true },
    { cleanWhitespace: false, mergeMultiline: true },
    { smartCastSchema: { C1: 'boolean', C2: 'number', KW: 'date' } },
    { smartCastSchema: { C1: 'boolean' }, cleanWhitespace: false },
    { tagMapping: { C1: 'PY', C2: 'VL' } },
    { tagMapping: { PY: 'C1' }, smartCastSchema: { C1: 'date' } },
    { tagMapping: { DA: 'C2' } },
    { tagMapping: { C1: 'VL' }, smartCastSchema: { C1: 'date' } },
    { toSemantic: true },
    { toSemantic: true, tagMapping: { C1: 'DA' } },
    { tagMapping: { VL: 'PY' } },
    { tagMapping: { VL: 'PY', PY: 'VL' } },
    { tagMapping: { PY: 'VL', DA: 'Y2' } },
    { tagMapping: { C1: 'C2', C2: 'M1' }, smartCastSchema: { C1: 'number', C2: 'date', M1: 'boolean' } },
    { tagMapping: { C1: 'M1', C2: 'M1' }, smartCastSchema: { C1: 'number', C2: 'boolean', M1: 'date' } },
    { tagMapping: { M1: 'C1' }, smartCastSchema: { M1: 'number' } },
    { toSemantic: true, tagMapping: { VL: 'PY', DA: 'C1' } },
    { customArrayTags: ['PY', 'VL'] },
];

/** Deterministic pseudo-random source builder. */
function createSources(count: number): string[] {
    let seed = 42;
    const rnd = (n: number) => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed % n;
    };
    const sources: string[] = [];
    for (let s = 0; s < count; s++) {
        const lines = ['TY  - JOUR'];
        const entries = 1 + rnd(6);
        for (let i = 0; i < entries; i++) {
            const [first, ...rest] = VALUES[rnd(VALUES.length)].split('\n');
            lines.push(`${TAGS[rnd(TAGS.length)]}  - ${first}`, ...rest);
        }
        lines.push('ER  - ');
        sources.push(`${lines.join('\n')}\n`);
    }
    return sources;
}

/** Derives cast verdicts per RIS tag from what `parse()` actually produces with `useSmartTypes: true`. */
function parserVerdicts(src: string, options: ParseOptions): Verdicts {
    const resolved = resolveParseOptions(options);
    const dateFailures: Record<string, number> = {};
    const [untyped] = parse(src, { ...options, useSmartTypes: false }) as Record<string, unknown>[];
    const [typed] = parse(src, {
        ...options,
        useSmartTypes: true,
        logLevel: 'warn',
        onError: (incident) => {
            if (incident.error.message === ERROR_MESSAGES[RIS_ERROR.INVALID_DATE_FALLBACK] && incident.tag) {
                dateFailures[incident.tag] = (dateFailures[incident.tag] ?? 0) + 1;
            }
        },
    }) as Record<string, unknown>[];

    const semanticToTag: Record<string, string> = {};
    for (const [tag, semanticKey] of Object.entries(resolved.customSemanticMap)) {
        semanticToTag[semanticKey as string] = tag;
    }
    // mapped values only exist under the target tag and use its own cast (sources never inherit).
    const schema = resolved.smartCastSchema as Record<string, string>;
    const castTypeOf = (tag: string) => schema[tag];

    const verdicts: Verdicts = {};
    for (const key of Object.keys(typed)) {
        const tag = options.toSemantic ? (semanticToTag[key] ?? key) : key;
        const castType = castTypeOf(tag);
        if (!castType) {
            continue;
        }
        const before = ([] as unknown[]).concat(untyped[key]);
        const after = ([] as unknown[]).concat(typed[key]);
        verdicts[tag] ??= { ok: 0, fail: 0 };
        const verdict = verdicts[tag];
        if (castType === 'date') {
            const attempts = before.filter((v) => typeof v === 'string').length;
            verdict.fail += dateFailures[key] ?? 0;
            verdict.ok += attempts - (dateFailures[key] ?? 0);
            continue;
        }
        for (let i = 0; i < before.length; i++) {
            const value = before[i];
            if (typeof value !== 'string' || (castType !== 'string' && value.trim() === '')) {
                continue;
            }
            if (castType === 'string' || typeof after[i] === castType) {
                verdict.ok++;
            } else {
                verdict.fail++;
            }
        }
    }
    return verdicts;
}

/** Sums inspector cast counters per RIS tag the parser casts under (the tagMapping target). */
function inspectorVerdicts(src: string, options: ParseOptions): Verdicts {
    const mapping = resolveParseOptions(options).tagMapping as Record<string, string>;
    const report = inspectParse(src, options);
    const verdicts: Verdicts = {};
    for (const [key, stats] of Object.entries(report.tags)) {
        if (stats.castSuccessCount === undefined && stats.castFailureCount === undefined) {
            continue;
        }
        const target = mapping[key] ?? key;
        verdicts[target] ??= { ok: 0, fail: 0 };
        const verdict = verdicts[target];
        verdict.ok += stats.castSuccessCount ?? 0;
        verdict.fail += stats.castFailureCount ?? 0;
    }
    return verdicts;
}

/** Drops zero entries and sorts keys for stable comparison. */
function normalize(verdicts: Verdicts): Verdicts {
    return Object.fromEntries(
        Object.entries(verdicts)
            .filter(([, v]) => v.ok > 0 || v.fail > 0)
            .sort(([a], [b]) => (a < b ? -1 : 1)),
    );
}

describe('inspect-parse - integration > parser alignment', () => {
    const sources = createSources(250);

    it.each(OPTION_SETS.map((options) => [JSON.stringify(options), options] as const))(
        'should report the same cast verdicts as parse() with options %s',
        (_, options) => {
            const mismatches = sources
                .map((src) => ({
                    src,
                    parser: normalize(parserVerdicts(src, options)),
                    inspector: normalize(inspectorVerdicts(src, options)),
                }))
                .filter((m) => JSON.stringify(m.parser) !== JSON.stringify(m.inspector));

            expect(mismatches.slice(0, 3)).toEqual([]);
        },
    );

    it('should match the date precision the parser produces for fallback years', () => {
        const src = 'TY  - JOUR\nPY  - 2020\nDA  - March\nY2  - May\nER  - \n';
        const [record] = parse(src, { useSmartTypes: true }) as Record<string, unknown>[];
        const report = inspectParse(src);

        expect(record.DA).toBe('2020-03');
        expect(report.tags.DA.datePrecision?.yearMonthCount).toBe(1);
        expect(record.Y2).toBe('May');
        expect(report.tags.Y2.dateCastFailureCount).toBe(1);
        expect(report.tags.Y2.datePrecision?.monthOnlyCount).toBe(1);
    });
});
