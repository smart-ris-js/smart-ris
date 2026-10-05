// Copyright 2026 Martin Winkler

import type { Equal, Expect, ExpectFalse, Extends } from '../../../../tests/types/type-utils.js';
import type {
    LOG_LEVEL,
    VALID_ARRAY_MERGE_STRATEGIES,
    VALID_CAST_TYPES,
    VALID_DATE_FORMATS,
    VALID_EOL,
} from '../../src/core.options.js';
import type {
    ActiveArrayMergeStrategy,
    ArrayMergeStrategy,
    CastType,
    DateFormatType,
    EolType,
    LogLevel,
} from '../../src/core.types.js';

// -------------------------------------------------------------------
// 1. Positive Cases: Option Literal Unions
// -------------------------------------------------------------------

// 1.1 EolType exactly matches VALID_EOL tuple values
export type Test_EolType = Expect<Equal<EolType, (typeof VALID_EOL)[number]>>;
export type Test_EolType_Members = Expect<Equal<EolType, '\n' | '\r\n' | '\r'>>;

// 1.2 ActiveArrayMergeStrategy strictly matches VALID_ARRAY_MERGE_STRATEGIES tuple values without false
export type Test_ActiveArrayMergeStrategy = Expect<
    Equal<ActiveArrayMergeStrategy, (typeof VALID_ARRAY_MERGE_STRATEGIES)[number]>
>;
export type Test_ActiveArrayMergeStrategy_Members = Expect<
    Equal<ActiveArrayMergeStrategy, 'first' | 'last' | 'join-space' | 'join-newline'>
>;
export type Test_ActiveArrayMergeStrategy_Disallows_False = ExpectFalse<Extends<false, ActiveArrayMergeStrategy>>;

// 1.3 ArrayMergeStrategy matches valid strategies plus boolean false
export type Test_ArrayMergeStrategy = Expect<
    Equal<ArrayMergeStrategy, (typeof VALID_ARRAY_MERGE_STRATEGIES)[number] | false>
>;
export type Test_ArrayMergeStrategy_Union = Expect<Equal<ArrayMergeStrategy, ActiveArrayMergeStrategy | false>>;
export type Test_ArrayMergeStrategy_Members = Expect<
    Equal<ArrayMergeStrategy, 'first' | 'last' | 'join-space' | 'join-newline' | false>
>;

// 1.3 DateFormatType matches VALID_DATE_FORMATS tuple values
export type Test_DateFormatType = Expect<Equal<DateFormatType, (typeof VALID_DATE_FORMATS)[number]>>;
export type Test_DateFormatType_Members = Expect<
    Equal<DateFormatType, 'YYYY-MM-DD' | 'YYYY-MM' | 'YYYY/MM/DD' | 'YYYY/MM' | 'YYYY'>
>;

// 1.4 CastType matches VALID_CAST_TYPES tuple values
export type Test_CastType = Expect<Equal<CastType, (typeof VALID_CAST_TYPES)[number]>>;
export type Test_CastType_Members = Expect<Equal<CastType, 'string' | 'number' | 'boolean' | 'date'>>;

// 1.5 LogLevel matches keys of LOG_LEVEL constant object
export type Test_LogLevel = Expect<Equal<LogLevel, keyof typeof LOG_LEVEL>>;
export type Test_LogLevel_Members = Expect<Equal<LogLevel, 'silent' | 'error' | 'warn' | 'info'>>;
