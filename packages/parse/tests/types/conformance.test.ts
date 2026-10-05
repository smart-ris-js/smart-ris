// Copyright 2026 Martin Winkler

import { describe, expect, test } from 'bun:test';
import type { ContentRisTag, ParsedRisRecord, RisRecord } from '@smart-ris/core';
import { expectKeys, expectShape } from '../../../../tests/types/shape.js';
import type { Equal, Expect, ExpectFalse, Extends } from '../../../../tests/types/type-utils.js';
import { parse, parseStream } from '../../src/index.js';

// Runtime/type conformance: every `expectShape` spec is checked against the static type at compile time
// and against real `parse()` output at runtime, with every union member witnessed.

// r1: valid values, repeated scalar TI | r2: failed casts | r3: empty values | r4: TY only
const MATRIX_FIXTURE = [
    'TY  - JOUR',
    'TI  - Title',
    'TI  - Sub',
    'AU  - Alpha',
    'AU  - Beta',
    'VL  - 12',
    'PY  - 2020',
    'XY  - custom',
    'ER  - ',
    '',
    'TY  - BOOK',
    'TI  - Other',
    'AU  - Gamma',
    'VL  - abc',
    'PY  - abc',
    'XY  - other',
    'ER  - ',
    '',
    'TY  - CHAP',
    'TI  - ',
    'AU  - ',
    'VL  - ',
    'PY  - ',
    'XY  - ',
    'ER  - ',
    '',
    'TY  - GEN',
    'ER  - ',
    '',
].join('\n');

const TY_ONLY = 'TY  - GEN\nER  - \n';

const RIS_KEYS =['TY', 'TI', 'AU', 'VL', 'PY', 'XY'] as const;
const SEMANTIC_KEYS = ['typeOfReference', 'title', 'author', 'volume', 'publicationYear', 'XY'] as const;

// -------------------------------------------------------------------
// 1. Option Matrix: toSemantic x useSmartTypes x arrayMergeStrategy x skipEmptyTags
// -------------------------------------------------------------------

describe('option matrix - RIS keys', () => {
    test('default', () => {
        const r = parse(MATRIX_FIXTURE, {});
        expect(r).toHaveLength(4);
        expectKeys(r[0], RIS_KEYS);
        expectKeys(r[3], ['TY']);
        expect(r[0].TI).toBe('Title Sub');
        expectShape(
            r.map((x) => x.TY),
            'string',
        );
        expectShape(
            r.map((x) => x.TI),
            'string?',
        );
        expectShape(
            r.map((x) => x.AU),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.VL),
            'string?',
        );
        expectShape(
            r.map((x) => x.PY),
            'string?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string?',
        );
    });

    test('skipEmptyTags: false', () => {
        const r = parse(MATRIX_FIXTURE, { skipEmptyTags: false });
        expectKeys(r[2], RIS_KEYS);
        expectShape(
            r.map((x) => x.TY),
            'string',
        );
        expectShape(
            r.map((x) => x.TI),
            'string|null?',
        );
        expectShape(
            r.map((x) => x.AU),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.VL),
            'string|null?',
        );
        expectShape(
            r.map((x) => x.PY),
            'string|null?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string|null?',
        );
    });

    test('useSmartTypes: true', () => {
        const r = parse(MATRIX_FIXTURE, { useSmartTypes: true });
        expect(r[0].VL).toBe(12);
        expect(r[0].PY).toBe('2020');
        expectShape(
            r.map((x) => x.TY),
            'string',
        );
        expectShape(
            r.map((x) => x.TI),
            'string?',
        );
        expectShape(
            r.map((x) => x.AU),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.VL),
            'number|string?',
        );
        expectShape(
            r.map((x) => x.PY),
            'string?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string?',
        );
    });

    test('useSmartTypes: true, skipEmptyTags: false', () => {
        const r = parse(MATRIX_FIXTURE, { useSmartTypes: true, skipEmptyTags: false });
        expectShape(
            r.map((x) => x.TY),
            'string',
        );
        expectShape(
            r.map((x) => x.TI),
            'string|null?',
        );
        expectShape(
            r.map((x) => x.AU),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.VL),
            'number|string|null?',
        );
        expectShape(
            r.map((x) => x.PY),
            'string|null?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string|null?',
        );
    });

    test('arrayMergeStrategy: false', () => {
        const r = parse(MATRIX_FIXTURE, { arrayMergeStrategy: false });
        expect(r[0].TI).toEqual(['Title', 'Sub']);
        expectShape(
            r.map((x) => x.TY),
            'string[]',
        );
        expectShape(
            r.map((x) => x.TI),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.AU),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.VL),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.PY),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string[]?',
        );
    });

    test('arrayMergeStrategy: false, skipEmptyTags: false', () => {
        const r = parse(MATRIX_FIXTURE, { arrayMergeStrategy: false, skipEmptyTags: false });
        expectShape(
            r.map((x) => x.TY),
            'string[]',
        );
        expectShape(
            r.map((x) => x.TI),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.AU),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.VL),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.PY),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.XY),
            '(string|null)[]?',
        );
    });

    test('arrayMergeStrategy: false, useSmartTypes: true', () => {
        const r = parse(MATRIX_FIXTURE, { arrayMergeStrategy: false, useSmartTypes: true });
        expectShape(
            r.map((x) => x.TY),
            'string[]',
        );
        expectShape(
            r.map((x) => x.TI),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.AU),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.VL),
            '(number|string)[]?',
        );
        expectShape(
            r.map((x) => x.PY),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string[]?',
        );
    });

    test('arrayMergeStrategy: false, useSmartTypes: true, skipEmptyTags: false', () => {
        const r = parse(MATRIX_FIXTURE, { arrayMergeStrategy: false, useSmartTypes: true, skipEmptyTags: false });
        expectShape(
            r.map((x) => x.TY),
            'string[]',
        );
        expectShape(
            r.map((x) => x.TI),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.AU),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.VL),
            '(number|string|null)[]?',
        );
        expectShape(
            r.map((x) => x.PY),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.XY),
            '(string|null)[]?',
        );
    });
});

describe('option matrix - semantic keys', () => {
    test('toSemantic: true', () => {
        const r = parse(MATRIX_FIXTURE, { toSemantic: true });
        expectKeys(r[0], SEMANTIC_KEYS);
        expectKeys(r[3], ['typeOfReference']);
        expectShape(
            r.map((x) => x.typeOfReference),
            'string',
        );
        expectShape(
            r.map((x) => x.title),
            'string?',
        );
        expectShape(
            r.map((x) => x.author),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.volume),
            'string?',
        );
        expectShape(
            r.map((x) => x.publicationYear),
            'string?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string?',
        );
    });

    test('toSemantic: true, skipEmptyTags: false', () => {
        const r = parse(MATRIX_FIXTURE, { toSemantic: true, skipEmptyTags: false });
        expectKeys(r[2], SEMANTIC_KEYS);
        expectShape(
            r.map((x) => x.typeOfReference),
            'string',
        );
        expectShape(
            r.map((x) => x.title),
            'string|null?',
        );
        expectShape(
            r.map((x) => x.author),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.volume),
            'string|null?',
        );
        expectShape(
            r.map((x) => x.publicationYear),
            'string|null?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string|null?',
        );
    });

    test('toSemantic: true, useSmartTypes: true', () => {
        const r = parse(MATRIX_FIXTURE, { toSemantic: true, useSmartTypes: true });
        expect(r[0].volume).toBe(12);
        expectShape(
            r.map((x) => x.typeOfReference),
            'string',
        );
        expectShape(
            r.map((x) => x.title),
            'string?',
        );
        expectShape(
            r.map((x) => x.author),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.volume),
            'number|string?',
        );
        expectShape(
            r.map((x) => x.publicationYear),
            'string?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string?',
        );
    });

    test('toSemantic: true, useSmartTypes: true, skipEmptyTags: false', () => {
        const r = parse(MATRIX_FIXTURE, { toSemantic: true, useSmartTypes: true, skipEmptyTags: false });
        expectShape(
            r.map((x) => x.typeOfReference),
            'string',
        );
        expectShape(
            r.map((x) => x.title),
            'string|null?',
        );
        expectShape(
            r.map((x) => x.author),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.volume),
            'number|string|null?',
        );
        expectShape(
            r.map((x) => x.publicationYear),
            'string|null?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string|null?',
        );
    });

    test('toSemantic: true, arrayMergeStrategy: false', () => {
        const r = parse(MATRIX_FIXTURE, { toSemantic: true, arrayMergeStrategy: false });
        expectShape(
            r.map((x) => x.typeOfReference),
            'string[]',
        );
        expectShape(
            r.map((x) => x.title),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.author),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.volume),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.publicationYear),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string[]?',
        );
    });

    test('toSemantic: true, arrayMergeStrategy: false, skipEmptyTags: false', () => {
        const r = parse(MATRIX_FIXTURE, { toSemantic: true, arrayMergeStrategy: false, skipEmptyTags: false });
        expectShape(
            r.map((x) => x.typeOfReference),
            'string[]',
        );
        expectShape(
            r.map((x) => x.title),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.author),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.volume),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.publicationYear),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.XY),
            '(string|null)[]?',
        );
    });

    test('toSemantic: true, arrayMergeStrategy: false, useSmartTypes: true', () => {
        const r = parse(MATRIX_FIXTURE, { toSemantic: true, arrayMergeStrategy: false, useSmartTypes: true });
        expectShape(
            r.map((x) => x.typeOfReference),
            'string[]',
        );
        expectShape(
            r.map((x) => x.title),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.author),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.volume),
            '(number|string)[]?',
        );
        expectShape(
            r.map((x) => x.publicationYear),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string[]?',
        );
    });

    test('toSemantic: true, arrayMergeStrategy: false, useSmartTypes: true, skipEmptyTags: false', () => {
        const r = parse(MATRIX_FIXTURE, {
            toSemantic: true,
            arrayMergeStrategy: false,
            useSmartTypes: true,
            skipEmptyTags: false,
        });
        expectShape(
            r.map((x) => x.typeOfReference),
            'string[]',
        );
        expectShape(
            r.map((x) => x.title),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.author),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.volume),
            '(number|string|null)[]?',
        );
        expectShape(
            r.map((x) => x.publicationYear),
            '(string|null)[]?',
        );
        expectShape(
            r.map((x) => x.XY),
            '(string|null)[]?',
        );
    });
});

// -------------------------------------------------------------------
// 2. Options Without Type Impact
// -------------------------------------------------------------------

describe('options without type impact', () => {
    test('active merge strategies keep scalar shape', () => {
        const first = parse(MATRIX_FIXTURE, { arrayMergeStrategy: 'first' });
        const last = parse(MATRIX_FIXTURE, { arrayMergeStrategy: 'last' });
        const space = parse(MATRIX_FIXTURE, { arrayMergeStrategy: 'join-space' });
        const newline = parse(MATRIX_FIXTURE, { arrayMergeStrategy: 'join-newline' });
        type _First = Expect<Equal<typeof first, RisRecord[]>>;
        type _Last = Expect<Equal<typeof last, RisRecord[]>>;
        type _Space = Expect<Equal<typeof space, RisRecord[]>>;
        type _Newline = Expect<Equal<typeof newline, RisRecord[]>>;
        expect([first[0].TI, last[0].TI, space[0].TI, newline[0].TI]).toEqual([
            'Title',
            'Sub',
            'Title Sub',
            'Title\nSub',
        ]);
        expectShape(
            [...first, ...last, ...space, ...newline].map((x) => x.TI),
            'string?',
        );
        expectShape(
            [...first, ...last, ...space, ...newline].map((x) => x.AU),
            'string[]?',
        );
    });

    test('engine and sanitizer options keep default record type', () => {
        const input = `TY  - JOUR\nti  - lower\nTI  -   padded  \n  continued\nER  - \n${TY_ONLY}`;
        const repaired = parse(input, { repairTags: true, skipInvalidTags: false });
        const raw = parse(input, { cleanWhitespace: false, mergeMultiline: true, eol: '\r\n', logLevel: 'silent' });
        type _Repaired = Expect<Equal<typeof repaired, RisRecord[]>>;
        type _Raw = Expect<Equal<typeof raw, RisRecord[]>>;
        expectShape(
            [...repaired, ...raw].map((x) => x.TI),
            'string?',
        );
        expectShape(
            [...repaired, ...raw].map((x) => x.TY),
            'string',
        );
    });

    test('dateFormat keeps date tags typed as string', () => {
        const r = parse(`TY  - JOUR\nDA  - 2020/01/02\nER  - \n${TY_ONLY}`, {
            useSmartTypes: true,
            dateFormat: 'YYYY/MM',
        });
        expect(r[0].DA).toBe('2020/01');
        expectShape(
            r.map((x) => x.DA),
            'string?',
        );
    });

    test('tagMapping moves values; target keeps its own type', () => {
        const r = parse(`TY  - JOUR\nX1  - 7\nX2  - title\nER  - \nTY  - JOUR\nX1  - abc\nER  - \n${TY_ONLY}`, {
            useSmartTypes: true,
            tagMapping: { X1: 'VL', X2: 'TI' },
        });
        expectKeys(r[0], ['TY', 'VL', 'TI']);
        expectShape(
            r.map((x) => x.VL),
            'number|string?',
        );
        expectShape(
            r.map((x) => x.TI),
            'string?',
        );
    });
});

// -------------------------------------------------------------------
// 3. Custom Option Values
// -------------------------------------------------------------------

// r1: valid casts | r2: failed casts, no TI/AU | r3: TY only
const CUSTOM_FIXTURE = [
    'TY  - JOUR',
    'TI  - Title',
    'AU  - Alpha',
    'VL  - true',
    'IS  - 7',
    'XY  - 5',
    'ZZ  - 2021-03',
    'ER  - ',
    '',
    'TY  - BOOK',
    'VL  - abc',
    'IS  - abc',
    'XY  - x',
    'ZZ  - nodate',
    'ER  - ',
    '',
    'TY  - GEN',
    'ER  - ',
    '',
].join('\n');

describe('customArrayTags', () => {
    test('literal tags become arrays', () => {
        const r = parse(CUSTOM_FIXTURE, { customArrayTags: ['TI', 'XY'] });
        expectShape(
            r.map((x) => x.TI),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.AU),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.VL),
            'string?',
        );
    });

    test('literal tags become arrays under semantic keys', () => {
        const r = parse(CUSTOM_FIXTURE, { toSemantic: true, customArrayTags: ['TI', 'XY'] });
        expectShape(
            r.map((x) => x.title),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.volume),
            'string?',
        );
    });

    test('non-literal ContentRisTag[] falls back to default array tags (item 1)', () => {
        const tags: ContentRisTag[] = ['AU'];
        const r = parse(CUSTOM_FIXTURE, { customArrayTags: tags });
        expectShape(
            r.map((x) => x.TI),
            'string?',
        );
        expectShape(
            r.map((x) => x.VL),
            'string?',
        );
        expectShape(
            r.map((x) => x.AU),
            'string[]?',
        );
    });

    test('non-literal ContentRisTag[] under semantic keys (item 1)', () => {
        const tags: ContentRisTag[] = ['AU'];
        const r = parse(CUSTOM_FIXTURE, { toSemantic: true, customArrayTags: tags });
        expectShape(
            r.map((x) => x.title),
            'string?',
        );
        expectShape(
            r.map((x) => x.author),
            'string[]?',
        );
    });
});

describe('customSemanticMap', () => {
    test('remaps standard and custom tags; replaced semantic keys are dropped', () => {
        const r = parse(CUSTOM_FIXTURE, {
            toSemantic: true,
            customSemanticMap: { TI: 'heading', AU: 'writers', XY: 'extra' },
        });
        type R = (typeof r)[number];
        type _NoTitle = ExpectFalse<Extends<'title', keyof R>>;
        type _NoAuthor = ExpectFalse<Extends<'author', keyof R>>;
        type _NoXY = ExpectFalse<Extends<'XY', keyof R>>;
        expectKeys(r[0], ['typeOfReference', 'heading', 'writers', 'volume', 'issue', 'extra', 'ZZ']);
        expectShape(
            r.map((x) => x.heading),
            'string?',
        );
        expectShape(
            r.map((x) => x.writers),
            'string[]?',
        );
        expectShape(
            r.map((x) => x.extra),
            'string?',
        );
    });

    test('remap with smart types and custom cast schema', () => {
        const r = parse(CUSTOM_FIXTURE, {
            toSemantic: true,
            useSmartTypes: true,
            customSemanticMap: { VL: 'flag', XY: 'extra' },
            smartCastSchema: { VL: 'boolean', XY: 'number' },
        });
        expectShape(
            r.map((x) => x.flag),
            'boolean|string?',
        );
        expectShape(
            r.map((x) => x.extra),
            'number|string?',
        );
        expectShape(
            r.map((x) => x.issue),
            'number|string?',
        );
    });

    test('remap without toSemantic has no effect on keys', () => {
        const r = parse(CUSTOM_FIXTURE, { customSemanticMap: { TI: 'heading' } });
        type _NoHeading = ExpectFalse<Extends<'heading', keyof (typeof r)[number]>>;
        expectKeys(r[0], ['TY', 'TI', 'AU', 'VL', 'IS', 'XY', 'ZZ']);
        expectShape(
            r.map((x) => x.TI),
            'string?',
        );
    });
});

describe('smartCastSchema', () => {
    test('custom casts merge with default schema', () => {
        const r = parse(CUSTOM_FIXTURE, {
            useSmartTypes: true,
            smartCastSchema: { VL: 'boolean', XY: 'number', ZZ: 'date', IS: 'string' },
        });
        expect(r[0].VL).toBe(true);
        expect(r[0].ZZ).toBe('2021-03');
        expectShape(
            r.map((x) => x.VL),
            'boolean|string?',
        );
        expectShape(
            r.map((x) => x.XY),
            'number|string?',
        );
        expectShape(
            r.map((x) => x.ZZ),
            'string?',
        );
        expectShape(
            r.map((x) => x.IS),
            'string?',
        );
    });

    test('custom casts under semantic keys', () => {
        const r = parse(CUSTOM_FIXTURE, {
            toSemantic: true,
            useSmartTypes: true,
            smartCastSchema: { VL: 'boolean', XY: 'number', IS: 'string' },
        });
        expectShape(
            r.map((x) => x.volume),
            'boolean|string?',
        );
        expectShape(
            r.map((x) => x.XY),
            'number|string?',
        );
        expectShape(
            r.map((x) => x.issue),
            'string?',
        );
    });

    test('custom casts with array tags and nullable values', () => {
        const r = parse(`${CUSTOM_FIXTURE}\nTY  - GEN\nXY  - \nER  - \n`, {
            useSmartTypes: true,
            skipEmptyTags: false,
            customArrayTags: ['XY'],
            smartCastSchema: { XY: 'number' },
        });
        expectShape(
            r.map((x) => x.XY),
            '(number|string|null)[]?',
        );
    });

    test('schema is ignored without useSmartTypes', () => {
        const r = parse(CUSTOM_FIXTURE, { smartCastSchema: { VL: 'boolean', XY: 'number' } });
        expectShape(
            r.map((x) => x.VL),
            'string?',
        );
        expectShape(
            r.map((x) => x.XY),
            'string?',
        );
    });
});

// -------------------------------------------------------------------
// 4. Structural Keys & Stream Parity
// -------------------------------------------------------------------

describe('structural keys', () => {
    test('typeOfReference is exactly string[] in semantic array mode (item 2)', () => {
        type R = ParsedRisRecord<{ toSemantic: true; arrayMergeStrategy: false }>;
        type _Exact = Expect<Equal<R['typeOfReference'], string[]>>;
        type _NoER = Expect<Equal<R['endOfReference'], undefined>>;
        const r = parse(MATRIX_FIXTURE, { toSemantic: true, arrayMergeStrategy: false });
        expect(r.every((x) => !('endOfReference' in x) && !('ER' in x))).toBe(true);
    });

    test('ER never present', () => {
        const r = parse(MATRIX_FIXTURE, { skipEmptyTags: false });
        type _NoER = Expect<Equal<(typeof r)[number]['ER'], undefined>>;
        expect(r.every((x) => !('ER' in x))).toBe(true);
    });
});

describe('parseStream parity', () => {
    async function* chunks(): AsyncGenerator<string> {
        yield MATRIX_FIXTURE.slice(0, 40);
        yield MATRIX_FIXTURE.slice(40);
    }

    test('stream yields the same typed records as parse()', async () => {
        const opts = { toSemantic: true, useSmartTypes: true, skipEmptyTags: false } as const;
        const out: ParsedRisRecord<typeof opts>[] = [];
        for await (const rec of parseStream(chunks(), opts)) {
            type _Same = Expect<Equal<typeof rec, ParsedRisRecord<typeof opts>>>;
            out.push(rec);
        }
        expect(out).toEqual(parse(MATRIX_FIXTURE, opts));
        expectShape(
            out.map((x) => x.volume),
            'number|string|null?',
        );
    });
});
