// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { ris } from '../../../src/builder/builder.js';

function t(name: string, actionOrValue: any, expected: any): [string, any, any] {
    return [name, actionOrValue, expected];
}

function assertResult(_name: string, actionOrValue: any, expected: any): void {
    if (typeof actionOrValue === 'function') {
        expect(actionOrValue).toThrow(expected);
    } else {
        expect(actionOrValue).toEqual(expected);
    }
}

// 1. ALL VALID TYPES (Yields value or coerces to null)
const VALID_TUPLES = [
    [null, null],
    [undefined, null], // INTENTION: undefined defaults to null to keep empty tags present
    [[], null],
    [[[]], null],
    [[null], null],
    [[[null]], null],
    [[undefined], null],
    [[[undefined]], null],
    [true, true],
    [false, false],
    ['', ''],
    [' ', ' '],
    ['string', 'string'],
    ['\nstring\n', '\nstring\n'],
    ['\tstring\t', '\tstring\t'],
    [0, 0],
    [-0, -0],
    [100, 100],
    [Infinity, Infinity],
    [-Infinity, -Infinity],
    [NaN, NaN],
    [new Date('2026-07-18T00:00:00.000Z'), new Date('2026-07-18T00:00:00.000Z')],
    [{ year: '2026' }, { year: '2026' }],
    [{ month: '05' }, { month: '05' }],
    [{ day: '15' }, { day: '15' }],
    [
        { year: '2026', month: '05' },
        { year: '2026', month: '05' },
    ],
    [
        { year: '2026', day: '15' },
        { year: '2026', day: '15' },
    ],
    [
        { month: '05', day: '15' },
        { month: '05', day: '15' },
    ],
    [
        { year: '2026', month: '05', day: '15' },
        { year: '2026', month: '05', day: '15' },
    ],
    [
        { year: '2026', extra: 'info' },
        { year: '2026', extra: 'info' },
    ],
];

// 2. ALL INVALID TYPES (Must throw TypeError)
const INVALID_TUPLES = [
    [{}],
    [{ key: 'value' }],
    [{ other: 123 }],
    [Object.create(null)],
    [() => {}],
    [function test() {}],
    [class MyClass {}],
    [/regex-pattern/],
    [new Map()],
    [new Set()],
    [new Error('error')],
    [1n],
    [Symbol('sym')],
    [new Date('not-a-date')],
    [new Date(NaN)],
    [[new Date('invalid')]],
    [[new Date(NaN)]],
    [['valid', {}]],
];

describe('core - unit > builder > builder', () => {
    describe('Function: ris() Initialization & Idempotency', () => {
        it('should support factory function call and direct proxy access', () => {
            const direct = ris.ty('JOUR').ti('Title').get;
            expect(direct).toEqual({ TY: 'JOUR', TI: 'Title' });

            const factory = ris().ty('JOUR').ti('Title').get;
            expect(factory).toEqual({ TY: 'JOUR', TI: 'Title' });
        });

        it('should return identical outputs for .get and .build() but as different references', () => {
            const builder = ris().ty('GEN').au('Author');
            const getResult = builder.get;
            const buildResult = builder.build();

            expect(getResult).toEqual(buildResult);
            expect(getResult).not.toBe(buildResult);
        });

        it('should perform repeated idempotent build calls without mutating the internal state', () => {
            const builder = ris().au('Smith');
            const first = builder.get;
            const second = builder.build();
            const third = builder.get;

            expect(first).toEqual({ TY: 'GEN', AU: 'Smith' });
            expect(second).toEqual({ TY: 'GEN', AU: 'Smith' });
            expect(third).toEqual({ TY: 'GEN', AU: 'Smith' });
            expect(first).not.toBe(second);
            expect(second).not.toBe(third);
        });

        it('should allow building multiple distinct tags sequentially without interfering via explicit ris() factory', () => {
            const record1 = ris().ty('JOUR').au('Alpha').get;
            const record2 = ris().ty('BOOK').au('Beta').get;

            expect(record1).toEqual({ TY: 'JOUR', AU: 'Alpha' });
            expect(record2).toEqual({ TY: 'BOOK', AU: 'Beta' });
            expect(record1).not.toBe(record2);
        });

        it('should safely ignore property access without invocation (Proxy trap safety)', () => {
            const builder = ris();
            (builder as any).au;
            (builder as any).kw;
            expect(builder.get).toEqual({ TY: 'GEN' });
        });

        it('should expose build as a callable function', () => {
            const builder = ris();
            expect(typeof builder.build).toBe('function');
            expect(() => builder.build()).not.toThrow();
        });

        it('should expose raw as a callable function', () => {
            const builder = ris();
            expect(typeof builder.raw).toBe('function');
            expect(() => builder.raw()).not.toThrow();
        });

        it('should expose get as a property returning an object', () => {
            const builder = ris();
            expect(typeof builder.get).toBe('object');
            expect(() => builder.get).not.toThrow();
        });

        it('should naturally throw a TypeError if get is mistakenly invoked as a function', () => {
            const builder = ris();
            // Because .get returns an object, JS runtime will throw "builder.get is not a function"
            expect(() => (builder as any).get()).toThrow(TypeError);
        });
    });

    describe('Function: ris() Core Engine: Output Calls', () => {
        it.each([
            t('Output via .build()', ris().ty('JOUR').ti('Title').build(), { TY: 'JOUR', TI: 'Title' }),
            t('Output via .get', ris().ty('JOUR').ti('Title').get, { TY: 'JOUR', TI: 'Title' }),
            t('Output via .raw()', ris().ty('JOUR').ti('Title').raw(), { TY: ['JOUR'], TI: ['Title'] }),
        ])('Resolves %s', assertResult);

        it('should support continuous mutation after .build() is called', () => {
            const builder = ris().ty('JOUR').ti('Title');
            const doc1 = builder.build();
            builder.au('Smith');
            const doc2 = builder.build();

            expect(doc1).toEqual({ TY: 'JOUR', TI: 'Title' });
            expect(doc2).toEqual({ TY: 'JOUR', TI: 'Title', AU: 'Smith' });
        });
    });

    describe('Function: ris() Core Engine: Basic Tag Handling with different types', () => {
        it.each([
            t('Chained basic strings', ris().ty('JOUR').xx('xx').yy('yy').zz('zz').get, {
                TY: 'JOUR',
                XX: 'xx',
                YY: 'yy',
                ZZ: 'zz',
            }),
            t('Number', ris().ty('JOUR').xx(123).get, { TY: 'JOUR', XX: 123 }),
            t('Boolean (true)', ris().ty('JOUR').xx(true).get, { TY: 'JOUR', XX: true }),
            t('Boolean (false)', ris().ty('JOUR').xx(false).get, { TY: 'JOUR', XX: false }),
            t('Undefined coerces to null', ris().ty('JOUR').xx(undefined).get, { TY: 'JOUR', XX: null }),
            t('Valid Date (ISO format)', ris().ty('JOUR').xx(new Date('2023-12-12T12:00:00Z')).get, {
                TY: 'JOUR',
                XX: new Date('2023-12-12T12:00:00Z'),
            }),
            t('Valid Date (Short format)', ris().ty('JOUR').xx(new Date('2023-12-12')).get, {
                TY: 'JOUR',
                XX: new Date('2023-12-12'),
            }),
            t('Invalid Date triggers exception', () => ris().ty('JOUR').xx(new Date('invalid')), TypeError),
        ])('Handles %s', assertResult);
    });

    describe('Function: ris() Core Engine: Generic Tags', () => {
        it.each(VALID_TUPLES)('should handle valid types for any generic tag (case %#)', (val, expected) => {
            const builder = ris().xx(val);
            expect(builder.get.XX).toEqual(expected);
        });

        it.each(VALID_TUPLES)('should handle valid types for any generic tag -- raw (case %#)', (val, expected) => {
            const builder = ris().xx(val);
            expect(builder.raw().XX).toEqual([expected]);
        });

        it.each(INVALID_TUPLES)(
            'should throw TypeError for completely invalid types on normal tags (case %#)',
            (val) => {
                expect(() => {
                    ris().xx(val);
                }).toThrow(TypeError);
            },
        );

        it('should throw TypeError if invalid types are hidden inside deeply nested arrays', () => {
            expect(() => ris().xx(['valid', ['valid', 1n]])).toThrow(TypeError);
            expect(() => ris().xx([['valid', Symbol('sym')]])).toThrow(TypeError);
        });
    });

    describe('Function: ris() Core Engine: TY Tag behavior', () => {
        // --- TY GET FALLBACK ---

        it('should default TY to "GEN" if no explicit TY is provided', () => {
            const builder = ris();
            expect(builder.get.TY).toBe('GEN');
        });

        it('should fallback TY to [GEN] array when calling .raw() without explicit TY', () => {
            const result = ris().ti('Test Title').raw();
            expect(result.TY).toEqual(['GEN']);
            expect(result.TI).toEqual(['Test Title']);
        });

        // --- TY MUST NOT FALLBACK WITH VALUE ---

        it.each(VALID_TUPLES)(
            'should handle explicit valid/trash values for TY without defaulting to GEN (case %#)',
            (val, expected) => {
                const builder = ris().ty(val);
                expect(builder.get.TY).toEqual(expected);
                expect(builder.get.TY).not.toBe('GEN');
            },
        );

        it.each(INVALID_TUPLES)('should throw TypeError for completely invalid types on ty tag (case %#)', (val) => {
            expect(() => {
                ris().ty(val);
            }).toThrow(TypeError);
        });

        // --- TY VAL ACCUMULATION ---

        it('should keep multiple TY values (no last-writer-wins)', () => {
            const builder = ris().ty('JOUR').ty('BOOK').ty('CONF');
            expect(builder.get).toEqual({ TY: ['JOUR', 'BOOK', 'CONF'] });
        });

        it.each([
            t('Sequential chained calls', ris().ty('JOUR').ty('BOOK').ty('CONF').get.TY, ['JOUR', 'BOOK', 'CONF']),
        ])('should accumulate multiple chained calls correctly: %s', assertResult);
    });

    describe('Function: ris() Core Engine: ER Tag behavior', () => {
        it('should return undefined when accessing ER tag case-insensitively', () => {
            const builder = ris();
            expect((builder as any).ER).toBeUndefined();
            expect((builder as any).er).toBeUndefined();
            expect((builder as any).Er).toBeUndefined();
            expect((builder as any).eR).toBeUndefined();
            expect((builder as any).endOfReference).toBeUndefined();
            expect((builder as any).endofreference).toBeUndefined();
            expect((builder as any).ENDOFREFERENCE).toBeUndefined();
        });

        it('should throw TypeError when attempting to invoke ER or endOfReference as a function', () => {
            const builder = ris();
            expect(() => (builder as any).ER('value')).toThrow(TypeError);
            expect(() => (builder as any).er('value')).toThrow(TypeError);
            expect(() => (builder as any).endOfReference('value')).toThrow(TypeError);
            expect(() => (builder as any).endofreference('value')).toThrow(TypeError);
        });
    });

    describe('Function: ris() Core Engine: Empty Tag Handling', () => {
        it('should handle sequential empty invocations without crashing, accumulating nulls', () => {
            const builder = ris().xx().xx().xx();
            expect(builder.get.XX).toEqual([null, null, null]);
        });

        it.each([
            t('Empty invocation', ris().ty('JOUR').xx().get, { TY: 'JOUR', XX: null }),
            t('Empty array', ris().ty('JOUR').xx([]).get, { TY: 'JOUR', XX: null }),
            t('Nested empty array', ris().ty('JOUR').xx([[]]).get, { TY: 'JOUR', XX: null }),
            t('Explicit null', ris().ty('JOUR').xx(null).get, { TY: 'JOUR', XX: null }),
            t('Array with explicit null', ris().ty('JOUR').xx([null]).get, { TY: 'JOUR', XX: null }),
            t(
                'Nested array with explicit null',
                ris()
                    .ty('JOUR')
                    .xx([[null]]).get,
                { TY: 'JOUR', XX: null },
            ),
            t('Explicit undefined', ris().ty('JOUR').xx(undefined).get, { TY: 'JOUR', XX: null }),
            t('Array with explicit undefined', ris().ty('JOUR').xx([undefined]).get, { TY: 'JOUR', XX: null }),
            t(
                'Nested array with explicit undefined',
                ris()
                    .ty('JOUR')
                    .xx([[undefined]]).get,
                { TY: 'JOUR', XX: null },
            ),
        ])('Handles empty or nullish input: %s', assertResult);
    });

    describe('Function: ris() Core Engine: Multiple Value Handling', () => {
        it.each([
            t('Array with null and undefined', ris().xx([null, undefined]).get.XX, [null, null]),
            t('Arguments null and undefined', ris().xx(null, undefined).get.XX, [null, null]),
            t('Mixed array with strings', ris().xx(['Smith', null, undefined, 'Doe']).get.XX, [
                'Smith',
                null,
                null,
                'Doe',
            ]),
            t('Trailing empty string', ris().xx([null, undefined, '']).get.XX, [null, null, '']),
            t('Surrounded by empty strings', ris().xx(['', null, undefined, '']).get.XX, ['', null, null, '']),
            t('Mixed with text and empty string', ris().xx(['df', null, undefined, '']).get.XX, ['df', null, null, '']),
            t('Deeply nested sparse array', ris().xx([['df', undefined], [null]]).get.XX, ['df', null, null]),
            t('Deeply nested sparse array', ris().xx([['df', undefined], [null]]).get.XX, ['df', null, null]),
            t(
                'Deeply nested at multiple varying levels',
                ris().xx([undefined, ['a', undefined], [[undefined, 'b']]]).get.XX,
                [null, 'a', null, null, 'b'],
            ),
            t('Literal JS sparse arrays (holes)', ris().xx(['Smith', undefined, 'Doe']).get.XX, ['Smith', null, 'Doe']),
            t('Chained undefined mixed with strings', ris().xx('a').xx(undefined).xx('b').get.XX, ['a', null, 'b']),
        ])('should map undefined to null explicitly in sparse structures: %s', assertResult);

        it.each([
            t('Single call (get)', ris().ty('JOUR').au('A', 'B').get, { TY: 'JOUR', AU: ['A', 'B'] }),
            t('Single call (raw)', ris().ty('JOUR').au('A', 'B').raw(), { TY: ['JOUR'], AU: ['A', 'B'] }),

            t('Chained calls (get)', ris().ty('JOUR').au('A').au('B').get, { TY: 'JOUR', AU: ['A', 'B'] }),
            t('Chained calls (raw)', ris().ty('JOUR').au('A').au('B').raw(), { TY: ['JOUR'], AU: ['A', 'B'] }),

            t('Array input (get)', ris().ty('JOUR').au(['A', 'B']).get, { TY: 'JOUR', AU: ['A', 'B'] }),
            t('Array input (raw)', ris().ty('JOUR').au(['A', 'B']).raw(), { TY: ['JOUR'], AU: ['A', 'B'] }),
        ])('Resolves output structures: %s', assertResult);

        it.each([
            t('Sequential chained calls', ris().xx('JOUR').xx('BOOK').get.XX, ['JOUR', 'BOOK']),
            t('Multiple arguments', ris().xx('JOUR', 'BOOK').get.XX, ['JOUR', 'BOOK']),
            t('Single array', ris().xx(['JOUR', 'BOOK']).get.XX, ['JOUR', 'BOOK']),
            t('Nested array single items', ris().xx([['JOUR'], ['BOOK']]).get.XX, ['JOUR', 'BOOK']),
            t('Nested array combined', ris().xx([['JOUR', 'BOOK']]).get.XX, ['JOUR', 'BOOK']),
            t('Mixed scalar and array', ris().xx('JOUR', ['BOOK']).get.XX, ['JOUR', 'BOOK']),
            t('Deep nested array', ris().xx([[['JOUR', ['BOOK']]]]).get.XX, ['JOUR', 'BOOK']),
            t('Array of multiple nulls', ris().xx([null, null]).get.XX, [null, null]),
        ])('should aggressively flatten nested arrays: %s', assertResult);
    });

    describe('Function: ris() Core Engine: Tag Normalization and Interception', () => {
        it.each([
            t('Lowercase tags (.get)', ris().ty('JOUR').yy('yy').zz('zz').get, { TY: 'JOUR', YY: 'yy', ZZ: 'zz' }),
            t('Lowercase tags (.raw)', ris().ty('JOUR').yy('yy').zz('zz').raw(), {
                TY: ['JOUR'],
                YY: ['yy'],
                ZZ: ['zz'],
            }),

            t('Mixed-case tags (.get)', ris().ty('JOUR').yY('yy').Zz('zz').get, { TY: 'JOUR', YY: 'yy', ZZ: 'zz' }),
            t('Mixed-case tags (.raw)', ris().ty('JOUR').yY('yy').Zz('zz').raw(), {
                TY: ['JOUR'],
                YY: ['yy'],
                ZZ: ['zz'],
            }),

            t('Uppercase tags (.get)', ris().ty('JOUR').YY('yy').ZZ('zz').get, { TY: 'JOUR', YY: 'yy', ZZ: 'zz' }),
            t('Uppercase tags (.raw)', ris().ty('JOUR').YY('yy').ZZ('zz').raw(), {
                TY: ['JOUR'],
                YY: ['yy'],
                ZZ: ['zz'],
            }),
        ])('Normalizes standard alphabetical tags: %s', assertResult);

        it.each([
            t(
                'Unmapped alphabetical identifiers',
                (ris() as any).ty('JOUR').unresolveable('aa').other_unresolveable('bb').get,
                {
                    TY: 'JOUR',
                    UNRESOLVEABLE: 'aa',
                    OTHER_UNRESOLVEABLE: 'bb',
                },
            ),
            t('Identifiers with leading underscore', (ris() as any).ty('JOUR')._special_character('aa').get, {
                TY: 'JOUR',
                _SPECIAL_CHARACTER: 'aa',
            }),
            t('Identifiers with leading dollar sign', (ris() as any).ty('JOUR').$special_character('bb').get, {
                TY: 'JOUR',
                $SPECIAL_CHARACTER: 'bb',
            }),
            t('Standard tag via bracket notation', (ris().ty('JOUR') as any).xx('aa').get, {
                TY: 'JOUR',
                XX: 'aa',
            }),
            t('Underscore identifier via bracket notation', (ris().ty('JOUR') as any)._special_character('aa').get, {
                TY: 'JOUR',
                _SPECIAL_CHARACTER: 'aa',
            }),
            t('Dollar sign identifier via bracket notation', (ris().ty('JOUR') as any).$special_character('bb').get, {
                TY: 'JOUR',
                $SPECIAL_CHARACTER: 'bb',
            }),
            t(
                'Exotic arbitrary characters via bracket notation',
                (ris().ty('JOUR') as any)['unallowed#char+acter']('cc').get,
                {
                    TY: 'JOUR',
                    'UNALLOWED#CHAR+ACTER': 'cc',
                },
            ),
        ])('Intercepts and normalizes custom/exotic identifiers: %s', assertResult);
    });

    describe('Function: ris() Interception & Semantic Mapping', () => {
        it.each([
            t('Lowercase standard tags', (ris() as any).ty('JOUR').get, { TY: 'JOUR' }),
            t('Lowercase shorthand tag', (ris() as any).au('Alpha').get, { TY: 'GEN', AU: 'Alpha' }),
            t('Uppercase standard tags', (ris() as any).TY('JOUR').get, { TY: 'JOUR' }),
            t('Uppercase shorthand tag', (ris() as any).AU('Alpha').get, { TY: 'GEN', AU: 'Alpha' }),
            t('Mixed case standard tags', (ris() as any).tY('JOUR').get, { TY: 'JOUR' }),
            t('Mixed case shorthand tag', (ris() as any).aU('Alpha').get, { TY: 'GEN', AU: 'Alpha' }),
        ])('should normalize tag casing: %s', assertResult);

        it('should block exact JS prototype property names but intercept their uppercase variants as RIS tags', () => {
            const builder = ris() as any;
            expect(() => builder.toString('Value')).toThrow(TypeError);
            builder.TOSTRING('Value').CONSTRUCTOR('Value').VALUEOF('Value');
            expect(builder.get).toEqual({ TY: 'GEN', TOSTRING: 'Value', CONSTRUCTOR: 'Value', VALUEOF: 'Value' });
        });
    });

    describe('Function: ris() Semantic Mapping -- default mappings', () => {
        it('should accumulate values when mixing raw tags and semantic aliases', () => {
            const builder = ris().author('Smith').au('Doe').author('Johnson');
            expect(builder.get).toEqual({
                TY: 'GEN',
                AU: ['Smith', 'Doe', 'Johnson'],
            });
        });

        it.each([
            t('author -> AU', (ris() as any).author('Smith').get, { TY: 'GEN', AU: 'Smith' }),
            t('title -> TI', (ris() as any).title('My Book').get, { TY: 'GEN', TI: 'My Book' }),
            t('date -> DA', (ris() as any).date('2026-07-18').get, { TY: 'GEN', DA: '2026-07-18' }),
            t('publisher -> PB', (ris() as any).publisher('Springer').get, { TY: 'GEN', PB: 'Springer' }),
            t('volume -> VL', (ris() as any).volume('12').get, { TY: 'GEN', VL: '12' }),
            t('issue -> IS', (ris() as any).issue('4').get, { TY: 'GEN', IS: '4' }),
            t('startPage -> SP', (ris() as any).startPage('100').get, { TY: 'GEN', SP: '100' }),
            t('endPage -> EP', (ris() as any).endPage('200').get, { TY: 'GEN', EP: '200' }),
            t('abstract -> AB', (ris() as any).abstract('Summary').get, { TY: 'GEN', AB: 'Summary' }),
            t('keywords -> KW', (ris() as any).keywords('RIS').get, { TY: 'GEN', KW: 'RIS' }),
            t('url -> UR', (ris() as any).url('http://example.com').get, { TY: 'GEN', UR: 'http://example.com' }),
            t('doi -> DO', (ris() as any).doi('10.1000/randomdoishit').get, { TY: 'GEN', DO: '10.1000/randomdoishit' }),
            t('isbnIssn -> SN', (ris() as any).isbnIssn('1234-5678').get, { TY: 'GEN', SN: '1234-5678' }),
        ])('should resolve Semantic Tags (isolated): %s', assertResult);

        it.each([
            t('Author -> AU', (ris() as any).Author('Smith').get, { TY: 'GEN', AU: 'Smith' }),
            t('TITle -> TI', (ris() as any).TITle('My Book').get, { TY: 'GEN', TI: 'My Book' }),
            t('dAtE -> DA', (ris() as any).dAtE('2026-07-18').get, { TY: 'GEN', DA: '2026-07-18' }),
            t('VOLUME -> VL', (ris() as any).VOLUME('12').get, { TY: 'GEN', VL: '12' }),
        ])('should resolve Semantic Tags case-insensitively: %s', assertResult);

        it('should resolve SemanticTags (chained)', () => {
            const builder = ris()
                .typeOfReference('JOUR')
                .title('The Evolution of APIs')
                .author('Lovelace, Ada')
                .author('Turing, Alan')
                .publicationYear(1950)
                .journalFullFormat('Computer Science Review')
                .volume(12)
                .issue(4)
                .startPage('100-115')
                .keywords('Computing', 'History')
                .abstract('An exploratory paper.')
                .doi('10.1234/cs.1950.001');

            expect(builder.get).toEqual({
                TY: 'JOUR',
                TI: 'The Evolution of APIs',
                AU: ['Lovelace, Ada', 'Turing, Alan'],
                PY: 1950,
                JF: 'Computer Science Review',
                VL: 12,
                IS: 4,
                SP: '100-115',
                KW: ['Computing', 'History'],
                AB: 'An exploratory paper.',
                DO: '10.1234/cs.1950.001',
            });
        });
    });

    describe('Function: ris() Configuration (RisBuilderConfig) -- overwrite default mappings', () => {
        it('should normalize the TARGET tags provided in customSemanticMap', () => {
            const builder = ris({ customSemanticMap: { CA: 'customAuthor' } });
            (builder as any).customAuthor('Smith');
            expect(builder.get).toEqual({ TY: 'GEN', CA: 'Smith' });
        });

        it('should correctly merge and prioritize custom semantic map over default map', () => {
            const builder = ris({ customSemanticMap: { C1: 'customOne', C2: 'customTwo' } })
                .customOne('Value 1')
                .customTwo('Value 2');
            expect(builder.get).toEqual({ TY: 'GEN', C1: 'Value 1', C2: 'Value 2' });
        });

        it('should allow adding custom semantic tag mappings', () => {
            const builder = ris({ customSemanticMap: { XX: 'customNotes' } });
            (builder as any).customNotes('Smith');
            expect(builder.get.XX).toEqual('Smith');
        });

        it('should handle case insensitivity in customSemanticMap definitions seamlessly', () => {
            const builder = ris({ customSemanticMap: { C1: 'mYtAg' } });
            (builder as any).mytag('Value');
            expect(builder.get).toEqual({ TY: 'GEN', C1: 'Value' });
        });

        it.each([
            [{ ' 99 ': '  trimmedKeyAndValue  ' }, 'trimmedKeyAndValue', '99'],
            [{ '00': 'zeroZeroTag' }, 'zeroZeroTag', '00'],
            [{ ZZ: 'endTag' }, 'endTag', 'ZZ'],
            [{ C1: 'CustomPascal' }, 'custompascal', 'C1'],
            [{ C2: 'CUSTOMUPPER' }, 'customupper', 'C2'],
            [{ C3: 'customlower' }, 'CUSTOMLOWER', 'C3'],
        ])(
            'should map and normalize boundary tag keys and custom semantic names | Input: %p',
            (customMap, methodName, expectedTag) => {
                const builder = ris({ customSemanticMap: customMap });
                (builder as any)[methodName]('TestValue');
                expect(builder.get[expectedTag]).toBe('TestValue');
            },
        );

        it.each([
            // Core structural tag remapping attempts
            [{ TY: 'customType' }, "Cannot remap 'TY' or 'ER' tags."],
            [{ ty: 'customType' }, "Cannot remap 'TY' or 'ER' tags."],
            [{ ER: 'customEnd' }, "Cannot remap 'TY' or 'ER' tags."],
            [{ er: 'customEnd' }, "Cannot remap 'TY' or 'ER' tags."],
            [{ ' TY ': 'customType' }, "Cannot remap 'TY' or 'ER' tags."],

            // Invalid tag key shapes
            [{ '': 'emptyKey' }, 'Keys must be valid 2-character RIS tags.'],
            [{ '   ': 'whitespaceKey' }, 'Keys must be valid 2-character RIS tags.'],
            [{ A: 'singleChar' }, 'Keys must be valid 2-character RIS tags.'],
            [{ ABC: 'threeChars' }, 'Keys must be valid 2-character RIS tags.'],
            [{ 'A-': 'specialChar' }, 'Keys must be valid 2-character RIS tags.'],
            [{ 'A ': 'trailingSpace' }, 'Keys must be valid 2-character RIS tags.'],
            [{ '1': 'singleDigit' }, 'Keys must be valid 2-character RIS tags.'],
            [{ '123': 'threeDigits' }, 'Keys must be valid 2-character RIS tags.'],

            // Overriding core semantic keys
            [{ C1: 'author' }, 'Cannot override core semantic keys.'],
            [{ C1: 'AUTHOR' }, 'Cannot override core semantic keys.'],
            [{ C1: 'Title' }, 'Cannot override core semantic keys.'],
            [{ C1: 'date' }, 'Cannot override core semantic keys.'],
            [{ C1: 'typeOfReference' }, 'Cannot override core semantic keys.'],

            // Value cannot be 2-character RIS tag
            [{ C1: 'AU' }, 'Values cannot be 2-character RIS tags.'],
            [{ C1: 'TI' }, 'Values cannot be 2-character RIS tags.'],
            [{ C1: 'au' }, 'Values cannot be 2-character RIS tags.'],
            [{ C1: 'XX' }, 'Values cannot be 2-character RIS tags.'],

            // Invalid value types / empty values
            [{ C1: '' }, 'Values must be non-empty strings.'],
            [{ C1: '   ' }, 'Values must be non-empty strings.'],
            [{ C1: 123 as any }, 'Values must be strings.'],
            [{ C1: null as any }, 'Values must be strings.'],
            [{ C1: undefined as any }, 'Values must be strings.'],
            [{ C1: {} as any }, 'Values must be strings.'],
            [{ C1: [] as any }, 'Values must be strings.'],

            // Duplicate semantic values (case-insensitive)
            [{ C1: 'foo', C2: 'foo' }, 'Duplicate semantic value.'],
            [{ C1: 'foo', C2: 'FOO' }, 'Duplicate semantic value.'],

            // Reserved builder, thenable and prototype names (case-insensitive)
            [{ C1: 'build' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'Build' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'finally' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'valueOf' }, 'Cannot override builder reserved methods.'],

            // Non-object config payloads
            [123 as any, 'Must be a valid object.'],
            ['string' as any, 'Must be a valid object.'],
            [true as any, 'Must be a valid object.'],
            [null as any, 'Must be a valid object.'],
            [[{ C1: 'tag' }] as any, 'Must be a valid object.'],
        ])(
            'should throw error when customSemanticMap contains invalid mapping | Input: %p',
            (customMap, expectedMsg) => {
                expect(() => ris({ customSemanticMap: customMap as any })).toThrow(expectedMsg);
            },
        );
    });

    describe('Function: ris() Proxy Integrity & Reflection (The "has" trap)', () => {
        it('should correctly report core methods and dynamic tags via the "in" operator', () => {
            const builder = ris();

            // 'in' operator triggers 'has' trap.
            expect('build' in builder).toBe(true);
            expect('get' in builder).toBe(true);
            expect('raw' in builder).toBe(true);
            expect('toJSON' in builder).toBe(true);
            expect('title' in builder).toBe(true);
            expect('au' in builder).toBe(true);
            expect('customTag' in builder).toBe(true);

            // js native reflect API triggers 'has' trap.
            expect(Reflect.has(builder, 'build')).toBe(true);
            expect(Reflect.has(builder, 'get')).toBe(true);
            expect(Reflect.has(builder, 'raw')).toBe(true);
            expect(Reflect.has(builder, 'toJSON')).toBe(true);
            expect(Reflect.has(builder, 'title')).toBe(true);
            expect(Reflect.has(builder, 'au')).toBe(true);
            expect(Reflect.has(builder, 'customTag')).toBe(true);
        });

        it('should correctly support the "in" operator directly on callable ris proxy entrypoint', () => {
            expect('build' in ris).toBe(true);
            expect('get' in ris).toBe(true);
            expect('raw' in ris).toBe(true);
            expect('title' in ris).toBe(true);
            expect('au' in ris).toBe(true);
            expect('then' in ris).toBe(false);
            expect(Reflect.has(ris, 'build')).toBe(true);
        });

        it('should return false for promise thenable properties and boundary ER tags', () => {
            const builder = ris();
            expect('then' in builder).toBe(false);
            expect('catch' in builder).toBe(false);
            expect('finally' in builder).toBe(false);
            expect('ER' in builder).toBe(false);
            expect('er' in builder).toBe(false);
            expect('Er' in builder).toBe(false);
            expect('endOfReference' in builder).toBe(false);
            expect('endofreference' in builder).toBe(false);
            expect('ENDOFREFERENCE' in builder).toBe(false);

            expect(Reflect.has(builder, 'then')).toBe(false);
            expect(Reflect.has(builder, 'catch')).toBe(false);
            expect(Reflect.has(builder, 'finally')).toBe(false);
            expect(Reflect.has(builder, 'ER')).toBe(false);
            expect(Reflect.has(builder, 'er')).toBe(false);
            expect(Reflect.has(builder, 'endOfReference')).toBe(false);
            expect(Reflect.has(builder, 'endofreference')).toBe(false);
        });

        it('should return false for Symbol property keys in "has" trap', () => {
            const builder = ris();
            const customSym = Symbol('custom');
            expect(customSym in builder).toBe(false);
            expect(Reflect.has(builder, customSym)).toBe(false);
            expect((builder as any)[customSym]).toBeUndefined();
        });
    });

    describe('Function: ris() Integration', () => {
        it('should allow chaining of semantic tags and raw tags together', () => {
            const records = [
                ris()
                    .author('Alpha')
                    .au('Beta')
                    .AU('Gamma', 'Delty')
                    .title('My Book')
                    .AB('AB1\nAB2\n\nB3')
                    .customTag('Another Custom Value')
                    .xx()
                    .yy(undefined)
                    .zz(null).get,
                ris().ty('JOUR').publicationYear(2026).xx('AnotherValue').get,
            ];

            expect(records[0]).toEqual({
                TY: 'GEN',
                AU: ['Alpha', 'Beta', 'Gamma', 'Delty'],
                TI: 'My Book',
                AB: 'AB1\nAB2\n\nB3',
                CUSTOMTAG: 'Another Custom Value',
                XX: null,
                YY: null,
                ZZ: null,
            });

            expect(records[1]).toEqual({
                TY: 'JOUR',
                PY: 2026,
                XX: 'AnotherValue',
            });
        });
    });

    describe('Function: ris() Promise & Symbol Property Traps', () => {
        it('should return undefined for promise resolution properties (then, catch, finally)', () => {
            const builder = ris();
            expect((builder as any).then).toBeUndefined();
            expect((builder as any).catch).toBeUndefined();
            expect((builder as any).finally).toBeUndefined();
        });

        it('should return undefined for primitive/string tag symbols', () => {
            const builder = ris();
            expect((builder as any)[Symbol.toPrimitive]).toBeUndefined();
            expect((builder as any)[Symbol.toStringTag]).toBeUndefined();
        });

        it('should safely resolve within async functions and await expressions without throwing', async () => {
            async function fetchBuilder() {
                return ris().ty('JOUR').au('Smith');
            }

            const builder = await fetchBuilder();
            expect(builder.get).toEqual({ TY: 'JOUR', AU: 'Smith' });
        });

        it('should throw TypeError if builder.then is mistakenly called as a method', () => {
            const builder = ris().ty('JOUR');
            expect(() => (builder as any).then()).toThrow(TypeError);
        });
    });

    describe('Function: ris() Object.prototype Property Traps', () => {
        const OBJECT_PROTOTYPE_NAMES = [
            'constructor',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'toLocaleString',
            'toString',
            'valueOf',
            '__proto__',
            '__defineGetter__',
            '__defineSetter__',
            '__lookupGetter__',
            '__lookupSetter__',
        ];

        it.each(OBJECT_PROTOTYPE_NAMES)('should return undefined for Object.prototype property %s', (name) => {
            const builder = ris().ty('JOUR');
            expect((builder as any)[name]).toBeUndefined();
            expect(builder.raw()).toEqual({ TY: ['JOUR'] });
        });

        it.each(OBJECT_PROTOTYPE_NAMES)(
            'should return false for Object.prototype property %s in "has" trap',
            (name) => {
                const builder = ris();
                expect(name in builder).toBe(false);
                expect(Reflect.has(builder, name)).toBe(false);
            },
        );

        it.each(OBJECT_PROTOTYPE_NAMES)('should throw TypeError if builder.%s is called as a method', (name) => {
            const builder = ris().ty('JOUR');
            expect(() => (builder as any)[name]('x')).toThrow(TypeError);
            expect(builder.raw()).toEqual({ TY: ['JOUR'] });
        });

        it('should throw TypeError on string and number conversion without mutating the record', () => {
            const builder = ris().ty('JOUR').title('T');
            expect(() => String(builder)).toThrow(TypeError);
            expect(() => `${builder}`).toThrow(TypeError);
            expect(() => Number(builder)).toThrow(TypeError);
            expect(builder.raw()).toEqual({ TY: ['JOUR'], TI: ['T'] });
        });

        it('should keep Object.prototype names out of stringified output after a failed conversion', () => {
            const builder = ris().ty('JOUR').title('T');
            expect(() => String(builder)).toThrow(TypeError);
            expect(builder.get).toEqual({ TY: 'JOUR', TI: 'T' });
        });

        it('should still allow case-variant custom tags that are not exact Object.prototype names', () => {
            const builder = ris().ty('JOUR') as any;
            builder.TOSTRING('x');
            expect(builder.raw()).toEqual({ TY: ['JOUR'], TOSTRING: ['x'] });
        });
    });

    describe('Function: ris() JSON Serialization (toJSON)', () => {
        it('should expose toJSON as a callable function', () => {
            const builder = ris();
            expect(typeof (builder as any).toJSON).toBe('function');
        });

        it('should return standard build output when calling toJSON() directly', () => {
            const builder = ris().ty('JOUR').au('Smith, J.').ti('Title');
            const jsonOutput = (builder as any).toJSON();
            expect(jsonOutput).toEqual({ TY: 'JOUR', AU: 'Smith, J.', TI: 'Title' });
            expect(jsonOutput).toEqual(builder.build());
        });

        it('should serialize correctly via JSON.stringify() using unboxed standard format', () => {
            const builder = ris().ty('JOUR').au('Smith, J.').ti('Title');
            const jsonString = JSON.stringify(builder);
            expect(jsonString).toBe('{"TY":"JOUR","AU":"Smith, J.","TI":"Title"}');
            expect(jsonString).toBe(JSON.stringify(builder.build()));
        });
    });

    describe('Function: ris() Raw Input Preservation for Date Tag', () => {
        it('should store Date object directly without string formatting', () => {
            const inputDate = new Date(Date.UTC(2023, 0, 1));
            const record = ris().type('JOUR').date(inputDate).build();
            expect(record.DA).toBeInstanceOf(Date);
            expect(record.DA).toBe(inputDate);
        });

        it('should store raw string date with valid pattern', () => {
            const record = ris().type('JOUR').date('2023-10-15').build();
            expect(typeof record.DA).toBe('string');
            expect(record.DA).toBe('2023-10-15');
        });

        it('should store raw string date with invalid pattern', () => {
            const record = ris().type('JOUR').date('Invalid Date String').build();
            expect(typeof record.DA).toBe('string');
            expect(record.DA).toBe('Invalid Date String');
        });

        it('should store raw impossible calendar dates without auto-correction', () => {
            const record = ris().type('JOUR').date('2023-02-30').build();
            expect(record.DA).toBe('2023-02-30');
        });

        it('should store raw out-of-range month strings without modification', () => {
            const record = ris().type('JOUR').date('2023-13-01').build();
            expect(record.DA).toBe('2023-13-01');
        });
    });

    describe('Function: ris() RawDate Object Support', () => {
        it('should accept RawDate object with year only', () => {
            const rawDate = { year: '2026' };
            const record = ris().type('JOUR').date(rawDate).build();
            expect(record.DA).toEqual(rawDate);
        });

        it('should accept RawDate object with month only', () => {
            const rawDate = { month: '05' as const };
            const record = ris().type('JOUR').date(rawDate).build();
            expect(record.DA).toEqual(rawDate);
        });

        it('should accept RawDate object with day only', () => {
            const rawDate = { day: '15' as const };
            const record = ris().type('JOUR').date(rawDate).build();
            expect(record.DA).toEqual(rawDate);
        });

        it('should accept RawDate object with year and month', () => {
            const rawDate = { year: '2026', month: '05' as const };
            const record = ris().type('JOUR').date(rawDate).build();
            expect(record.DA).toEqual(rawDate);
        });

        it('should accept RawDate object with year and day', () => {
            const rawDate = { year: '2026', day: '15' as const };
            const record = ris().type('JOUR').date(rawDate).build();
            expect(record.DA).toEqual(rawDate);
        });

        it('should accept RawDate object with month and day', () => {
            const rawDate = { month: '05' as const, day: '15' as const };
            const record = ris().type('JOUR').date(rawDate).build();
            expect(record.DA).toEqual(rawDate);
        });

        it('should accept RawDate object with year, month, and day', () => {
            const rawDate = { year: '2026', month: '05' as const, day: '15' as const };
            const record = ris().type('JOUR').date(rawDate).build();
            expect(record.DA).toEqual(rawDate);
        });

        it('should accept RawDate object with extra fields when year, month, or day is present', () => {
            const rawDate = { year: '2026', note: 'estimated' };
            const record = ris().type('JOUR').date(rawDate).build();
            expect(record.DA).toEqual(rawDate);
        });

        it('should throw TypeError for empty object or objects lacking year/month/day', () => {
            expect(() =>
                ris()
                    .typeOfReference('JOUR')
                    .date({} as any),
            ).toThrow(TypeError);
            expect(() =>
                ris()
                    .typeOfReference('JOUR')
                    .date({ foo: 'bar' } as any),
            ).toThrow(TypeError);
            expect(() =>
                ris()
                    .typeOfReference('JOUR')
                    .date({ title: '2026' } as any),
            ).toThrow(TypeError);
        });
    });

    describe('Function: ris() Zero-Argument Method Calls', () => {
        it('should handle zero-argument method calls for TY and typeOfReference by inserting null', () => {
            const recordTY = ris().TY().build();
            expect(recordTY).toEqual({ TY: null });

            const recordTypeOfReference = ris().typeOfReference().build();
            expect(recordTypeOfReference).toEqual({ TY: null });
        });

        it('should handle zero-argument method calls across standard and custom content tags', () => {
            const record = ris()
                .typeOfReference('JOUR')
                .title()
                .author()
                .publicationYear()
                .notes()
                .customField()
                .build();

            expect(record).toEqual({
                TY: 'JOUR',
                TI: null,
                AU: null,
                PY: null,
                N1: null,
                CUSTOMFIELD: null,
            });
        });
    });
});
