// Copyright 2026 Martin Winkler

import type { Equal, Expect, ExpectFalse, Extends } from '../../../../tests/types/type-utils.js';
import type {
    ActiveArrayMergeStrategy,
    EolType,
    MaybeArray,
    Middleware,
    RawArrayPipelineRecord,
    RawDate,
    RawPipelineRecord,
    RisDate,
    RisParseValue,
    RisRawValue,
    RisStringifyValue,
    StringifyPipelineRecord,
} from '../../src/core.types.js';
import type { ArrayCasterOptions } from '../../src/index.js';

// -------------------------------------------------------------------
// 1. Positive Cases: Staged Value Primitives
// -------------------------------------------------------------------

// 1.1 RisRawValue is strictly string | null
export type Test_RisRawValue = Expect<Equal<RisRawValue, string | null>>;

// 1.2 RisParseValue includes parsed primitives and RisDate
export type Test_RisParseValue = Expect<Equal<RisParseValue, string | number | boolean | RisDate | null>>;

// 1.3 RisStringifyValue includes Date, RawDate, RisDate, and primitives
export type Test_RisStringifyValue = Expect<
    Equal<RisStringifyValue, string | number | boolean | Date | RawDate | RisDate | null>
>;

// -------------------------------------------------------------------
// 2. Positive Cases: Pipeline Stage Record Types
// -------------------------------------------------------------------

// 2.1 RawArrayPipelineRecord: all values are arrays of RisRawValue
export type Test_RawArrayPipelineRecord = Expect<Equal<RawArrayPipelineRecord, Record<string, (string | null)[]>>>;

// 2.2 RawPipelineRecord: values are scalar or array RisRawValue
export type Test_RawPipelineRecord = Expect<Equal<RawPipelineRecord, Record<string, MaybeArray<string | null>>>>;

// 2.3 StringifyPipelineRecord: all values are arrays of RisStringifyValue
export type Test_StringifyPipelineRecord = Expect<Equal<StringifyPipelineRecord, Record<string, RisStringifyValue[]>>>;

// 2.4 Middleware function signature
export type Test_Middleware = Expect<
    Equal<Middleware<RawArrayPipelineRecord, RawPipelineRecord>, (payload: RawArrayPipelineRecord) => RawPipelineRecord>
>;

// -------------------------------------------------------------------
// 3. Positive & Negative Cases: Middleware Options
// -------------------------------------------------------------------

// 3.1 ArrayCasterOptions arrayMergeStrategy strictly equals ActiveArrayMergeStrategy
export type Test_ArrayCasterOptions_Strategy = Expect<
    Equal<ArrayCasterOptions['arrayMergeStrategy'], ActiveArrayMergeStrategy>
>;

// 3.2 ArrayCasterOptions arrayMergeStrategy strictly disallows false
export type Test_ArrayCasterOptions_Disallows_False = ExpectFalse<
    Extends<false, ArrayCasterOptions['arrayMergeStrategy']>
>;

// 3.3 ArrayCasterOptions eol allows EolType | undefined
export type Test_ArrayCasterOptions_Eol = Expect<Equal<ArrayCasterOptions['eol'], EolType | undefined>>;
