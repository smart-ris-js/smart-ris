// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { type ParseOptions, parse } from '../../src/index.js';

const t = (tag: string, value: string) => `${tag}  - ${value}\n`;
const record = (...lines: string[]) => `${t('TY', 'JOUR')}${lines.join('')}${t('ER', '')}`;
const parseOne = (input: string, options: ParseOptions) =>
    parse(input, { useSmartTypes: true, ...options })[0] as Record<string, unknown>;

describe('parse - integration > tag-mapping-cast', () => {
    describe('Option: tagMapping + smartCastSchema (mapped values adopt the target cast only)', () => {
        it('should not cast target values with the cast type of a mapped source tag', () => {
            const rec = parseOne(record(t('N1', '42')), { tagMapping: { M1: 'N1' }, smartCastSchema: { M1: 'number' } });
            expect(rec.N1).toEqual(['42']);
        });

        it('should leave mapped source values uncast when the target has no cast type', () => {
            const rec = parseOne(record(t('M1', '42')), { tagMapping: { M1: 'N1' }, smartCastSchema: { M1: 'number' } });
            expect(rec.N1).toEqual(['42']);
        });

        it('should cast mapped source values with the target cast type', () => {
            const rec = parseOne(record(t('C1', '12')), { tagMapping: { C1: 'C2' }, smartCastSchema: { C2: 'number' } });
            expect(rec.C2).toBe(12);
        });

        it('should keep the default target cast type when the source has a conflicting default cast type', () => {
            const rec = parseOne(record(t('PY', '2020/05/01')), { tagMapping: { VL: 'PY' } });
            expect(rec.PY).toBe('2020-05-01');
        });

        it('should cast swapped tags with the cast type of their target tag', () => {
            const rec = parseOne(record(t('VL', '2020/05/01'), t('PY', '12')), { tagMapping: { VL: 'PY', PY: 'VL' } });
            expect(rec.PY).toBe('2020-05-01');
            expect(rec.VL).toBe(12);
        });

        it('should cast chained mappings with the cast type of the direct target only', () => {
            const rec = parseOne(record(t('C1', '2020/05/01'), t('C2', 'true')), {
                tagMapping: { C1: 'C2', C2: 'C3' },
                smartCastSchema: { C1: 'number', C2: 'date', C3: 'boolean' },
            });
            expect(rec.C2).toBe('2020-05-01');
            expect(rec.C3).toBe(true);
        });

        it('should cast values of multiple sources with conflicting cast types with the target cast type', () => {
            const rec = parseOne(record(t('C3', '2019/03/04'), t('C1', '2020/05/01'), t('C2', '2021/01/02')), {
                tagMapping: { C1: 'C3', C2: 'C3' },
                smartCastSchema: { C1: 'number', C2: 'boolean', C3: 'date' },
                customArrayTags: ['C3'],
            });
            expect(rec.C3).toEqual(['2019-03-04', '2020-05-01', '2021-01-02']);
        });

        it('should apply the target semantic key and cast type when toSemantic is true', () => {
            const rec = parseOne(record(t('C1', '12')), {
                toSemantic: true,
                tagMapping: { C1: 'VL' },
                smartCastSchema: { C1: 'date' },
            });
            expect(rec.volume).toBe(12);
        });
    });

    describe('Property: tagMapping AA -> BB equals renaming AA lines to BB', () => {
        const TAGS = ['PY', 'DA', 'Y1', 'Y2', 'VL', 'N1', 'C1', 'C2'];
        const OTHER_LINES = [t('PY', '2024'), t('DA', '15 Jan'), t('VL', '12'), t('C2', 'true'), t('N1', '42')];
        const SOURCE_VALUES = ['15 Jan', '2020/05/01', '2021', '7', 'true'];
        const OPTION_SETS: ParseOptions[] = [
            {},
            { toSemantic: true },
            { smartCastSchema: { C1: 'number', C2: 'boolean', N1: 'date' } },
            { toSemantic: true, smartCastSchema: { C1: 'date' }, customSemanticMap: { C1: 'myC1', C2: 'myC2' } },
            { arrayMergeStrategy: false },
        ];

        const cases: [string, string, ParseOptions][] = [];
        for (const from of TAGS) {
            for (const to of TAGS) {
                if (from !== to) {
                    for (const options of OPTION_SETS) {
                        cases.push([from, to, options]);
                    }
                }
            }
        }

        it.each(cases)('%s -> %s | %j', (from, to, options) => {
            for (const value of SOURCE_VALUES) {
                // source line last, since `tagMapper` appends source values after target values.
                const others = OTHER_LINES.filter((line) => !line.startsWith(from));
                const mapped = parse(record(...others, t(from, value)), {
                    useSmartTypes: true,
                    ...options,
                    tagMapping: { [from]: to },
                });
                const renamed = parse(record(...others, t(to, value)), { useSmartTypes: true, ...options });
                expect(mapped).toEqual(renamed);
            }
        });
    });
});
