// Copyright 2026 Martin Winkler

import { describe, expect, test } from 'bun:test';
import type { Equal, Expect, ExpectFalse, Extends } from '../../../../tests/types/type-utils.js';
import { createRisBuilder, ris } from '../../src/builder/builder.js';
import type {
    BuiltRisRecord,
    MaybeArray,
    RawBuiltRisRecord,
    RisStringifyValue,
    StringifyRisRecord,
} from '../../src/core.types.js';

// Runtime/type conformance of builder outputs: static types checked against real `build()`/`get`/`toJSON()`/`raw()` output.

// -------------------------------------------------------------------
// 1. Static Output Contract
// -------------------------------------------------------------------

export type Test_Build = Expect<Equal<ReturnType<typeof ris.build>, BuiltRisRecord>>;
export type Test_Get = Expect<Equal<typeof ris.get, BuiltRisRecord>>;
export type Test_ToJSON = Expect<Equal<ReturnType<typeof ris.toJSON>, BuiltRisRecord>>;
export type Test_Raw = Expect<Equal<ReturnType<typeof ris.raw>, RawBuiltRisRecord>>;

// TY required, no `undefined` (items 4, 5)
export type Test_BuiltTY = Expect<Equal<BuiltRisRecord['TY'], MaybeArray<string | null>>>;
export type Test_RawTY = Expect<Equal<RawBuiltRisRecord['TY'], (string | null)[]>>;
export type Test_RawValue = Expect<Equal<RawBuiltRisRecord['TI'], RisStringifyValue[] | undefined>>;
export type Test_RawNoER = Expect<Equal<RawBuiltRisRecord['ER'], undefined>>;

// outputs are valid stringify input
export type Test_BuiltIsStringifyRecord = Expect<Extends<BuiltRisRecord, StringifyRisRecord>>;
export type Test_RawIsStringifyRecord = Expect<Extends<RawBuiltRisRecord, StringifyRisRecord>>;

// -------------------------------------------------------------------
// 2. Runtime Conformance
// -------------------------------------------------------------------

const isTypeValue = (value: unknown): boolean => value === null || typeof value === 'string';

describe('build / get / toJSON', () => {
    test('TY defaults to GEN when never set', () => {
        const built = ris.title('t').build();
        expect(built).toEqual({ TY: 'GEN', TI: 't' });
        expect(ris.title('t').get).toEqual(built);
        expect(ris.title('t').toJSON()).toEqual(built);
        expect(JSON.parse(JSON.stringify(ris.title('t')))).toEqual(built);
    });

    test('every TY member of MaybeArray<string | null> is reachable', () => {
        const samples: MaybeArray<string | null>[] = [
            ris.TY('JOUR').build().TY,
            ris.TY(null).build().TY,
            ris.TY('A', 'B').build().TY,
            ris.TY(['A', null]).build().TY,
            ris.typeOfReference('BOOK').get.TY,
        ];
        expect(samples).toEqual(['JOUR', null, ['A', 'B'], ['A', null], 'BOOK']);
        for (const sample of samples) {
            const elements: readonly unknown[] = Array.isArray(sample) ? sample : [sample];
            expect(elements.every(isTypeValue)).toBe(true);
        }
    });

    test('content values keep scalar/array shape', () => {
        const date = new Date(Date.UTC(2020, 0, 2));
        const built = ris.title('t').author('A', 'B').VL(12).custom(true).DA(date).N1(null).build();
        expect(built).toEqual({ TY: 'GEN', TI: 't', AU: ['A', 'B'], VL: 12, CUSTOM: true, DA: date, N1: null });
    });

    test('ER is never present', () => {
        expect('ER' in ris.title('t').build()).toBe(false);
        expect('ER' in ris.title('t').raw()).toBe(false);
    });
});

describe('raw', () => {
    test('every value is an array and TY is always present', () => {
        const raw = ris.title('t').author('A', 'B').VL(12).raw();
        expect(raw).toEqual({ TY: ['GEN'], TI: ['t'], AU: ['A', 'B'], VL: [12] });
        expect(Object.values(raw).every((value) => Array.isArray(value))).toBe(true);
    });

    test('TY elements are string | null', () => {
        const samples: (string | null)[][] = [
            ris.raw().TY,
            ris.TY(null).raw().TY,
            ris.TY('A', null).raw().TY,
        ];
        expect(samples).toEqual([['GEN'], [null], ['A', null]]);
        expect(samples.flat().every(isTypeValue)).toBe(true);
    });
});

describe('configured builder', () => {
    test('custom semantic method maps to its RIS tag', () => {
        const builder = createRisBuilder({ customSemanticMap: { TI: 'heading' } });
        type B = typeof builder;
        type _HasHeading = Expect<Extends<'heading', keyof B>>;
        type _BuildContract = Expect<Equal<ReturnType<B['build']>, BuiltRisRecord>>;
        expect(builder.heading('h').build()).toEqual({ TY: 'GEN', TI: 'h' });
    });

    test('boundary methods are not callable', () => {
        type B = typeof ris;
        type _NoER = Expect<Equal<B['ER'], undefined>>;
        type _NoEndOfReference = Expect<Equal<B['endOfReference'], undefined>>;
        type _NoThen = ExpectFalse<Extends<B['then'], (...args: never[]) => unknown>>;
        expect(typeof Reflect.get(ris, 'then')).toBe('undefined');
    });
});
