// Copyright 2026 Martin Winkler

import { describe, expect, test } from 'bun:test';
import type { MaybeArray, RisStringifyValue, StringifyInput, StringifyRisRecord } from '@smart-ris/core';
import { ris } from '@smart-ris/core';
import type { Equal, Expect, Extends } from '../../../../tests/types/type-utils.js';
import { stringify } from '../../src/index.js';

// Runtime/type conformance of stringify input: every record the types accept serializes as typed.

// -------------------------------------------------------------------
// 1. Static Input Contract
// -------------------------------------------------------------------

// structural keys are clean, not intersected with the content value type (item 3)
export type Test_TY = Expect<Equal<StringifyRisRecord['TY'], MaybeArray<string | null> | undefined>>;
export type Test_TypeOfReference = Expect<
    Equal<StringifyRisRecord['typeOfReference'], MaybeArray<string | null> | undefined>
>;
export type Test_ER = Expect<Equal<StringifyRisRecord['ER'], undefined>>;
export type Test_EndOfReference = Expect<Equal<StringifyRisRecord['endOfReference'], undefined>>;

// builder method names are plain data keys on records (item 6)
export type Test_Raw = Expect<Equal<StringifyRisRecord['raw'], MaybeArray<RisStringifyValue> | undefined>>;
export type Test_BuildKey = Expect<Equal<StringifyRisRecord['build'], MaybeArray<RisStringifyValue> | undefined>>;

// -------------------------------------------------------------------
// 2. Runtime Conformance
// -------------------------------------------------------------------

describe('record input', () => {
    test('builder method names as data keys serialize as custom tags (item 6)', () => {
        const record: StringifyRisRecord = { TY: 'JOUR', raw: 'x', build: 'b', get: 'g', toJSON: 't' };
        expect(stringify(record, { logLevel: 'silent' })).toBe(
            'TY  - JOUR\nBUILD  - b\nGET  - g\nRAW  - x\nTOJSON  - t\nER  - \n',
        );
    });

    test('TY accepts every member of MaybeArray<string | null>', () => {
        const inputs: StringifyRisRecord[] = [
            { TY: 'JOUR', TI: 't' },
            { TY: null, TI: 't' },
            { TY: ['BOOK', null], TI: 't' },
            { TI: 't' },
        ];
        expect(inputs.map((record) => stringify(record))).toEqual([
            'TY  - JOUR\nTI  - t\nER  - \n',
            'TY  - GEN\nTI  - t\nER  - \n',
            'TY  - BOOK\nTI  - t\nER  - \n',
            'TY  - GEN\nTI  - t\nER  - \n',
        ]);
    });

    test('content values accept every RisStringifyValue member', () => {
        const record: StringifyRisRecord = {
            TY: 'JOUR',
            TI: 'Title',
            VL: 12,
            M3: true,
            DA: new Date(Date.UTC(2020, 0, 2)),
            Y2: { year: '2021', month: '03' },
            N1: null,
            AU: ['A', null, 'B'],
        };
        expect(stringify(record)).toContain('VL  - 12\n');
        expect(stringify(record)).toContain('M3  - true\n');
        expect(stringify(record)).toContain('AU  - A\nAU  - B\n');
    });
});

describe('builder input', () => {
    test('builder, build(), get and raw() serialize identically', () => {
        const builder = ris.title('t').author('A', 'B');
        const inputs: StringifyInput[] = [builder, builder.build(), builder.get, builder.raw()];
        type _BuiltInput = Expect<Extends<ReturnType<typeof builder.build>, StringifyInput>>;
        type _RawInput = Expect<Extends<ReturnType<typeof builder.raw>, StringifyInput>>;
        const expected = 'TY  - GEN\nAU  - A\nAU  - B\nTI  - t\nER  - \n';
        expect(inputs.map((input) => stringify(input))).toEqual([expected, expected, expected, expected]);
    });
});
