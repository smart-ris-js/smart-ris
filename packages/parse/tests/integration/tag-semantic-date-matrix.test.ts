// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { ContentRisTag } from '@smart-ris/core';
import { parse } from '../../src/index.js';

describe('parse - integration > tag-semantic-date-matrix', () => {
    describe('Option: tagMapping only (toSemantic: false)', () => {
        it.each([
            [
                'PY -> DA',
                { PY: 'DA' as ContentRisTag },
                'TY  - JOUR\nPY  - 2024\nY1  - 15 Jan\nER  - \n',
                { DA: '2024', Y1: '15 Jan' },
            ],
            [
                'DA -> PY',
                { DA: 'PY' as ContentRisTag },
                'TY  - JOUR\nDA  - 15 Jan\nY1  - 2024\nER  - \n',
                { PY: '15 Jan', Y1: '2024' },
            ],
            [
                'Y1 -> DA',
                { Y1: 'DA' as ContentRisTag },
                'TY  - JOUR\nY1  - 15 Jan\nPY  - 2024\nER  - \n',
                { DA: '2024-01-15', PY: '2024' },
            ],
            [
                'DA -> Y1',
                { DA: 'Y1' as ContentRisTag },
                'TY  - JOUR\nDA  - 15 Jan\nPY  - 2024\nER  - \n',
                { Y1: '2024-01-15', PY: '2024' },
            ],
            [
                'PY -> Y1',
                { PY: 'Y1' as ContentRisTag },
                'TY  - JOUR\nPY  - 2024\nDA  - 15 Jan\nER  - \n',
                { Y1: '2024', DA: '2024-01-15' },
            ],
            [
                'Y1 -> PY',
                { Y1: 'PY' as ContentRisTag },
                'TY  - JOUR\nY1  - 2024\nDA  - 15 Jan\nER  - \n',
                { PY: '2024', DA: '2024-01-15' },
            ],
            [
                'Y2 -> DA',
                { Y2: 'DA' as ContentRisTag },
                'TY  - JOUR\nY2  - 15 Jan\nPY  - 2024\nER  - \n',
                { DA: '2024-01-15', PY: '2024' },
            ],
            [
                'DA -> Y2',
                { DA: 'Y2' as ContentRisTag },
                'TY  - JOUR\nDA  - 15 Jan\nPY  - 2024\nER  - \n',
                { Y2: '15 Jan', PY: '2024' },
            ],
            [
                'Y2 -> PY',
                { Y2: 'PY' as ContentRisTag },
                'TY  - JOUR\nY2  - 2024\nDA  - 15 Jan\nER  - \n',
                { PY: '2024', DA: '2024-01-15' },
            ],
            [
                'PY -> Y2',
                { PY: 'Y2' as ContentRisTag },
                'TY  - JOUR\nPY  - 2024\nDA  - 15 Jan\nER  - \n',
                { Y2: '2024', DA: '15 Jan' },
            ],
            [
                'Y2 -> Y1',
                { Y2: 'Y1' as ContentRisTag },
                'TY  - JOUR\nY2  - 15 Jan\nPY  - 2024\nER  - \n',
                { Y1: '2024-01-15', PY: '2024' },
            ],
            [
                'Y1 -> Y2',
                { Y1: 'Y2' as ContentRisTag },
                'TY  - JOUR\nY1  - 15 Jan\nPY  - 2024\nER  - \n',
                { Y2: '15 Jan', PY: '2024' },
            ],
        ])(
            'should correctly resolve fallback dates with pairwise tagMapping when toSemantic is false | %s',
            (_label, tagMapping, risContent, expected) => {
                const res = parse(risContent, {
                    useSmartTypes: true,
                    toSemantic: false,
                    tagMapping,
                });
                expect(res).toBeArrayOfSize(1);
                const rec = res[0] as Record<string, unknown>;
                for (const key in expected) {
                    expect(rec[key]).toBe(expected[key as keyof typeof expected]);
                }
            },
        );
    });

    describe('Option: tagMapping + defaultSemantic (toSemantic: true)', () => {
        it.each([
            [
                'PY -> DA -> date',
                { PY: 'DA' as ContentRisTag },
                'TY  - JOUR\nPY  - 2024\nY1  - 15 Jan\nER  - \n',
                { date: '2024', primaryDate: '15 Jan' },
            ],
            [
                'DA -> PY -> publicationYear',
                { DA: 'PY' as ContentRisTag },
                'TY  - JOUR\nDA  - 15 Jan\nY1  - 2024\nER  - \n',
                { publicationYear: '15 Jan', primaryDate: '2024' },
            ],
            [
                'Y1 -> DA -> date',
                { Y1: 'DA' as ContentRisTag },
                'TY  - JOUR\nY1  - 15 Jan\nPY  - 2024\nER  - \n',
                { date: '2024-01-15', publicationYear: '2024' },
            ],
            [
                'DA -> Y1 -> primaryDate',
                { DA: 'Y1' as ContentRisTag },
                'TY  - JOUR\nDA  - 15 Jan\nPY  - 2024\nER  - \n',
                { primaryDate: '2024-01-15', publicationYear: '2024' },
            ],
            [
                'PY -> Y1 -> primaryDate',
                { PY: 'Y1' as ContentRisTag },
                'TY  - JOUR\nPY  - 2024\nDA  - 15 Jan\nER  - \n',
                { primaryDate: '2024', date: '2024-01-15' },
            ],
            [
                'Y1 -> PY -> publicationYear',
                { Y1: 'PY' as ContentRisTag },
                'TY  - JOUR\nY1  - 2024\nDA  - 15 Jan\nER  - \n',
                { publicationYear: '2024', date: '2024-01-15' },
            ],
            [
                'Y2 -> DA -> date',
                { Y2: 'DA' as ContentRisTag },
                'TY  - JOUR\nY2  - 15 Jan\nPY  - 2024\nER  - \n',
                { date: '2024-01-15', publicationYear: '2024' },
            ],
            [
                'DA -> Y2 -> accessDate',
                { DA: 'Y2' as ContentRisTag },
                'TY  - JOUR\nDA  - 15 Jan\nPY  - 2024\nER  - \n',
                { accessDate: '15 Jan', publicationYear: '2024' },
            ],
            [
                'Y2 -> PY -> publicationYear',
                { Y2: 'PY' as ContentRisTag },
                'TY  - JOUR\nY2  - 2024\nDA  - 15 Jan\nER  - \n',
                { publicationYear: '2024', date: '2024-01-15' },
            ],
            [
                'PY -> Y2 -> accessDate',
                { PY: 'Y2' as ContentRisTag },
                'TY  - JOUR\nPY  - 2024\nDA  - 15 Jan\nER  - \n',
                { accessDate: '2024', date: '15 Jan' },
            ],
            [
                'Y2 -> Y1 -> primaryDate',
                { Y2: 'Y1' as ContentRisTag },
                'TY  - JOUR\nY2  - 15 Jan\nPY  - 2024\nER  - \n',
                { primaryDate: '2024-01-15', publicationYear: '2024' },
            ],
            [
                'Y1 -> Y2 -> accessDate',
                { Y1: 'Y2' as ContentRisTag },
                'TY  - JOUR\nY1  - 15 Jan\nPY  - 2024\nER  - \n',
                { accessDate: '15 Jan', publicationYear: '2024' },
            ],
        ])(
            'should correctly resolve fallback dates with tagMapping and default semantic keys | %s',
            (_label, tagMapping, risContent, expected) => {
                const res = parse(risContent, {
                    useSmartTypes: true,
                    toSemantic: true,
                    tagMapping,
                });
                expect(res).toBeArrayOfSize(1);
                const rec = res[0] as Record<string, unknown>;
                for (const key in expected) {
                    expect(rec[key]).toBe(expected[key as keyof typeof expected]);
                }
            },
        );
    });

    describe('Option: tagMapping + customSemanticMap', () => {
        it.each([
            [
                'DA -> PY -> customYear',
                { DA: 'PY' as ContentRisTag },
                { PY: 'customYear' },
                'TY  - JOUR\nDA  - 2024\nY1  - 15 Jan\nER  - \n',
                { customYear: '2024', primaryDate: '2024-01-15' },
            ],
            [
                'PY -> DA -> customDate',
                { PY: 'DA' as ContentRisTag },
                { DA: 'customDate' },
                'TY  - JOUR\nPY  - 2024\nY1  - 15 Jan\nER  - \n',
                { customDate: '2024', primaryDate: '15 Jan' },
            ],
            [
                'PY -> Y1 -> customPrimary',
                { PY: 'Y1' as ContentRisTag },
                { Y1: 'customPrimary' },
                'TY  - JOUR\nPY  - 2024\nDA  - 15 Jan\nER  - \n',
                { customPrimary: '2024', date: '2024-01-15' },
            ],
            [
                'DA -> Y1 -> customPrimary',
                { DA: 'Y1' as ContentRisTag },
                { Y1: 'customPrimary' },
                'TY  - JOUR\nDA  - 15 Jan\nPY  - 2024\nER  - \n',
                { customPrimary: '2024-01-15', publicationYear: '2024' },
            ],
            [
                'Y1 -> DA -> customDate',
                { Y1: 'DA' as ContentRisTag },
                { DA: 'customDate' },
                'TY  - JOUR\nY1  - 15 Jan\nPY  - 2024\nER  - \n',
                { customDate: '2024-01-15', publicationYear: '2024' },
            ],
            [
                'Y1 -> PY -> customYear',
                { Y1: 'PY' as ContentRisTag },
                { PY: 'customYear' },
                'TY  - JOUR\nY1  - 2024\nDA  - 15 Jan\nER  - \n',
                { customYear: '2024', date: '2024-01-15' },
            ],
            [
                'Y2 -> DA -> customDate',
                { Y2: 'DA' as ContentRisTag },
                { DA: 'customDate' },
                'TY  - JOUR\nY2  - 15 Jan\nPY  - 2024\nER  - \n',
                { customDate: '2024-01-15', publicationYear: '2024' },
            ],
            [
                'Y2 -> PY -> customYear',
                { Y2: 'PY' as ContentRisTag },
                { PY: 'customYear' },
                'TY  - JOUR\nY2  - 2024\nDA  - 15 Jan\nER  - \n',
                { customYear: '2024', date: '2024-01-15' },
            ],
            [
                'Y2 -> Y1 -> customPrimary',
                { Y2: 'Y1' as ContentRisTag },
                { Y1: 'customPrimary' },
                'TY  - JOUR\nY2  - 15 Jan\nPY  - 2024\nER  - \n',
                { customPrimary: '2024-01-15', publicationYear: '2024' },
            ],
            [
                'Chained alias: DA -> D1 -> myDate',
                { DA: 'D1' as ContentRisTag },
                { D1: 'myDate' },
                'TY  - JOUR\nDA  - 15 Jan\nPY  - 2024\nER  - \n',
                { myDate: '15 Jan', publicationYear: '2024' },
            ],
            [
                'Chained supplier: PY -> P1 -> myYear',
                { PY: 'P1' as ContentRisTag },
                { P1: 'myYear' },
                'TY  - JOUR\nDA  - 15 Jan\nPY  - 2024\nER  - \n',
                { date: '15 Jan', myYear: '2024' },
            ],
            [
                'Both chained: DA -> D1 -> myDate, PY -> P1 -> myYear',
                { DA: 'D1' as ContentRisTag, PY: 'P1' as ContentRisTag },
                { D1: 'myDate', P1: 'myYear' },
                'TY  - JOUR\nDA  - 15 Jan\nPY  - 2024\nER  - \n',
                { myDate: '15 Jan', myYear: '2024' },
            ],
        ])(
            'should correctly resolve fallback dates with tagMapping chained to customSemanticMap | %s',
            (_label, tagMapping, customSemanticMap, risContent, expected) => {
                const res = parse(risContent, {
                    useSmartTypes: true,
                    toSemantic: true,
                    tagMapping,
                    customSemanticMap,
                });
                expect(res).toBeArrayOfSize(1);
                const rec = res[0] as Record<string, unknown>;
                for (const key in expected) {
                    expect(rec[key]).toBe(expected[key as keyof typeof expected]);
                }
            },
        );
    });

    describe('Option: date tags with defaultSemantic (no tagMapping)', () => {
        it.each([
            [
                'DA (15 Jan) + PY (2024)',
                'TY  - JOUR\nDA  - 15 Jan\nPY  - 2024\nER  - \n',
                { date: '2024-01-15', publicationYear: '2024' },
            ],
            [
                'Y1 (15 Jan) + PY (2024)',
                'TY  - JOUR\nY1  - 15 Jan\nPY  - 2024\nER  - \n',
                { primaryDate: '2024-01-15', publicationYear: '2024' },
            ],
            [
                'DA (15 Jan) + Y1 (2024) (no PY)',
                'TY  - JOUR\nDA  - 15 Jan\nY1  - 2024\nER  - \n',
                { date: '2024-01-15', primaryDate: '2024' },
            ],
            [
                'Y1 (15 Jan) alone (self-exclusion prevents loop)',
                'TY  - JOUR\nY1  - 15 Jan\nER  - \n',
                { primaryDate: '15 Jan' },
            ],
            [
                'Y2 (15 Jan) + PY (2024) (Y2 is not a fallback consumer)',
                'TY  - JOUR\nY2  - 15 Jan\nPY  - 2024\nER  - \n',
                { accessDate: '15 Jan', publicationYear: '2024' },
            ],
            [
                'DA (2024-05-15) complete date + PY (2020) (preserves own year)',
                'TY  - JOUR\nDA  - 2024-05-15\nPY  - 2020\nER  - \n',
                { date: '2024-05-15', publicationYear: '2020' },
            ],
        ])('should correctly handle date tags under default semantic options | %s', (_label, risContent, expected) => {
            const res = parse(risContent, {
                useSmartTypes: true,
                toSemantic: true,
            });
            expect(res).toBeArrayOfSize(1);
            const rec = res[0] as Record<string, unknown>;
            for (const key in expected) {
                expect(rec[key]).toBe(expected[key as keyof typeof expected]);
            }
        });
    });

    describe('Option: date tags with customSemantic (no tagMapping)', () => {
        it.each([
            [
                'DA: publishedOn, PY: releaseYear',
                { DA: 'publishedOn', PY: 'releaseYear' },
                'TY  - JOUR\nDA  - 15 Jan\nPY  - 2024\nER  - \n',
                { publishedOn: '2024-01-15', releaseYear: '2024' },
            ],
            [
                'DA: publishedOn, Y1: primaryDateCustom',
                { DA: 'publishedOn', Y1: 'primaryDateCustom' },
                'TY  - JOUR\nDA  - 15 Jan\nY1  - 2024\nER  - \n',
                { publishedOn: '2024-01-15', primaryDateCustom: '2024' },
            ],
            [
                'Y1: primaryDateCustom, PY: releaseYear',
                { Y1: 'primaryDateCustom', PY: 'releaseYear' },
                'TY  - JOUR\nY1  - 15 Jan\nPY  - 2024\nER  - \n',
                { primaryDateCustom: '2024-01-15', releaseYear: '2024' },
            ],
            [
                'Y2: visitedAt, PY: releaseYear',
                { Y2: 'visitedAt', PY: 'releaseYear' },
                'TY  - JOUR\nY2  - 15 Jan\nPY  - 2024\nER  - \n',
                { visitedAt: '15 Jan', releaseYear: '2024' },
            ],
        ])(
            'should correctly resolve fallback dates with custom semantic names on canonical tags | %s',
            (_label, customSemanticMap, risContent, expected) => {
                const res = parse(risContent, {
                    useSmartTypes: true,
                    toSemantic: true,
                    customSemanticMap,
                });
                expect(res).toBeArrayOfSize(1);
                const rec = res[0] as Record<string, unknown>;
                for (const key in expected) {
                    expect(rec[key]).toBe(expected[key as keyof typeof expected]);
                }
            },
        );
    });

    describe('Option: custom tags (XX) with date content', () => {
        describe('Raw tagMapping to DA, PY, Y1, Y2 (toSemantic: false)', () => {
            it.each([
                // XX -> DA
                [
                    'XX -> DA with noYear',
                    { XX: 'DA' as ContentRisTag },
                    'TY  - JOUR\nXX  - 15 Jan\nPY  - 2024\nER  - \n',
                    { DA: '2024-01-15', PY: '2024' },
                ],
                [
                    'XX -> DA with onlyYear',
                    { XX: 'DA' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024\nER  - \n',
                    { DA: '2024' },
                ],
                [
                    'XX -> DA with bothMonthYear',
                    { XX: 'DA' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024-05-15\nER  - \n',
                    { DA: '2024-05-15' },
                ],
                // XX -> PY
                [
                    'XX -> PY with noYear',
                    { XX: 'PY' as ContentRisTag },
                    'TY  - JOUR\nXX  - 15 Jan\nDA  - 15 Jan\nER  - \n',
                    { PY: '15 Jan', DA: '15 Jan' },
                ],
                [
                    'XX -> PY with onlyYear',
                    { XX: 'PY' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024\nDA  - 15 Jan\nER  - \n',
                    { PY: '2024', DA: '2024-01-15' },
                ],
                [
                    'XX -> PY with bothMonthYear',
                    { XX: 'PY' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024-05-15\nDA  - 15 Jan\nER  - \n',
                    { PY: '2024-05-15', DA: '2024-01-15' },
                ],
                // XX -> Y1
                [
                    'XX -> Y1 with noYear',
                    { XX: 'Y1' as ContentRisTag },
                    'TY  - JOUR\nXX  - 15 Jan\nPY  - 2024\nER  - \n',
                    { Y1: '2024-01-15', PY: '2024' },
                ],
                [
                    'XX -> Y1 with onlyYear',
                    { XX: 'Y1' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024\nER  - \n',
                    { Y1: '2024' },
                ],
                [
                    'XX -> Y1 with bothMonthYear',
                    { XX: 'Y1' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024-05-15\nER  - \n',
                    { Y1: '2024-05-15' },
                ],
                // XX -> Y2
                [
                    'XX -> Y2 with noYear',
                    { XX: 'Y2' as ContentRisTag },
                    'TY  - JOUR\nXX  - 15 Jan\nPY  - 2024\nER  - \n',
                    { Y2: '15 Jan', PY: '2024' },
                ],
                [
                    'XX -> Y2 with onlyYear',
                    { XX: 'Y2' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024\nER  - \n',
                    { Y2: '2024' },
                ],
                [
                    'XX -> Y2 with bothMonthYear',
                    { XX: 'Y2' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024-05-15\nER  - \n',
                    { Y2: '2024-05-15' },
                ],
            ])(
                'should correctly parse raw date content via tagMapping (toSemantic: false) | %s',
                (_label, tagMapping, risContent, expected) => {
                    const res = parse(risContent, {
                        useSmartTypes: true,
                        toSemantic: false,
                        tagMapping,
                    });
                    expect(res).toBeArrayOfSize(1);
                    const rec = res[0] as Record<string, unknown>;
                    for (const key in expected) {
                        expect(rec[key]).toBe(expected[key as keyof typeof expected]);
                    }
                },
            );
        });

        describe('TagMapping + defaultSemantic to date, publicationYear, primaryDate, accessDate (toSemantic: true)', () => {
            it.each([
                // XX -> DA -> date
                [
                    'XX -> DA -> date with noYear',
                    { XX: 'DA' as ContentRisTag },
                    'TY  - JOUR\nXX  - 15 Jan\nPY  - 2024\nER  - \n',
                    { date: '2024-01-15', publicationYear: '2024' },
                ],
                [
                    'XX -> DA -> date with onlyYear',
                    { XX: 'DA' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024\nER  - \n',
                    { date: '2024' },
                ],
                [
                    'XX -> DA -> date with bothMonthYear',
                    { XX: 'DA' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024-05-15\nER  - \n',
                    { date: '2024-05-15' },
                ],
                // XX -> PY -> publicationYear
                [
                    'XX -> PY -> publicationYear with noYear',
                    { XX: 'PY' as ContentRisTag },
                    'TY  - JOUR\nXX  - 15 Jan\nDA  - 15 Jan\nER  - \n',
                    { publicationYear: '15 Jan', date: '15 Jan' },
                ],
                [
                    'XX -> PY -> publicationYear with onlyYear',
                    { XX: 'PY' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024\nDA  - 15 Jan\nER  - \n',
                    { publicationYear: '2024', date: '2024-01-15' },
                ],
                [
                    'XX -> PY -> publicationYear with bothMonthYear',
                    { XX: 'PY' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024-05-15\nDA  - 15 Jan\nER  - \n',
                    { publicationYear: '2024-05-15', date: '2024-01-15' },
                ],
                // XX -> Y1 -> primaryDate
                [
                    'XX -> Y1 -> primaryDate with noYear',
                    { XX: 'Y1' as ContentRisTag },
                    'TY  - JOUR\nXX  - 15 Jan\nPY  - 2024\nER  - \n',
                    { primaryDate: '2024-01-15', publicationYear: '2024' },
                ],
                [
                    'XX -> Y1 -> primaryDate with onlyYear',
                    { XX: 'Y1' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024\nER  - \n',
                    { primaryDate: '2024' },
                ],
                [
                    'XX -> Y1 -> primaryDate with bothMonthYear',
                    { XX: 'Y1' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024-05-15\nER  - \n',
                    { primaryDate: '2024-05-15' },
                ],
                // XX -> Y2 -> accessDate
                [
                    'XX -> Y2 -> accessDate with noYear',
                    { XX: 'Y2' as ContentRisTag },
                    'TY  - JOUR\nXX  - 15 Jan\nPY  - 2024\nER  - \n',
                    { accessDate: '15 Jan', publicationYear: '2024' },
                ],
                [
                    'XX -> Y2 -> accessDate with onlyYear',
                    { XX: 'Y2' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024\nER  - \n',
                    { accessDate: '2024' },
                ],
                [
                    'XX -> Y2 -> accessDate with bothMonthYear',
                    { XX: 'Y2' as ContentRisTag },
                    'TY  - JOUR\nXX  - 2024-05-15\nER  - \n',
                    { accessDate: '2024-05-15' },
                ],
            ])(
                'should correctly resolve semantic date properties via tagMapping (toSemantic: true) | %s',
                (_label, tagMapping, risContent, expected) => {
                    const res = parse(risContent, {
                        useSmartTypes: true,
                        toSemantic: true,
                        tagMapping,
                    });
                    expect(res).toBeArrayOfSize(1);
                    const rec = res[0] as Record<string, unknown>;
                    for (const key in expected) {
                        expect(rec[key]).toBe(expected[key as keyof typeof expected]);
                    }
                },
            );
        });
    });
});
