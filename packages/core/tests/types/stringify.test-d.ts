// Copyright 2026 Martin Winkler

import type { Equal, Expect, Extends } from '../../../../tests/types/type-utils.js';
import type {
    MaybeArray,
    RisBuilder,
    RisStringifyValue,
    StringifyInput,
    StringifyRisRecord,
} from '../../src/core.types.js';

// -------------------------------------------------------------------
// 1. Positive Cases: Record Input & Subtype Validation
// -------------------------------------------------------------------

// 1.1 Accepts standard tags, semantic keys, custom literal tags, nulls, arrays, numbers, dates
export const validRecord: StringifyRisRecord = {
    TY: 'JOUR',
    author: ['Author One', 'Author Two'],
    title: 'Title of Paper',
    publicationYear: 2026,
    CUSTOM_TAG_X: 'Arbitrary Custom String',
    customField: true,
    dateField: new Date(),
    rawDate: { year: '2026', month: '05', day: '15' },
    notes: null,
    keywords: ['kw1', 'kw2', null],
};

// 1.2 TY field is assignable to MaybeArray<string | null>
export type Test_TY_Field_Assignability = Expect<
    Extends<StringifyRisRecord['TY'], MaybeArray<string | null> | undefined>
>;

// 1.3 typeOfReference field is assignable to MaybeArray<string | null>
export type Test_TypeOfReference_Assignability = Expect<
    Extends<StringifyRisRecord['typeOfReference'], MaybeArray<string | null> | undefined>
>;

// 1.4 `raw` is a plain data key on StringifyRisRecord (no builder method)
export type Test_RawAccessor_Signature = Expect<
    Equal<StringifyRisRecord['raw'], MaybeArray<RisStringifyValue> | undefined>
>;

// 1.5 StringifyInput accepts plain record and RisBuilder
export type Test_RecordIsStringifyInput = Expect<Extends<StringifyRisRecord, StringifyInput>>;
export type Test_BuilderIsStringifyInput = Expect<Extends<RisBuilder, StringifyInput>>;

// -------------------------------------------------------------------
// 2. Negative Cases: Boundary Tag Rejection & Invalid Value Types
// -------------------------------------------------------------------

{
    // 2.1 Boundary tag ER is rejected
    const _invalidBoundaryER: StringifyRisRecord = {
        TY: 'JOUR',
        // @ts-expect-error ER is an internal marker and cannot be provided in stringify input
        ER: 'ER - End of Record',
    };

    // 2.2 Boundary semantic tag endOfReference is rejected
    const _invalidBoundaryEOR: StringifyRisRecord = {
        typeOfReference: 'JOUR',
        // @ts-expect-error endOfReference cannot be provided in stringify input
        endOfReference: 'End',
    };

    // 2.3 Arbitrary objects that do not conform to Date or RawDate are rejected
    const _invalidValueObject: StringifyRisRecord = {
        TY: 'JOUR',
        // @ts-expect-error Objects that do not match RawDate or Date are rejected
        title: { invalidObject: true },
    };
}
