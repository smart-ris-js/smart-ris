// Copyright 2026 Martin Winkler

import type { RisBuilder, StringifyInput, StringifyRisRecord } from '@smart-ris/core';
import type { Equal, Expect } from '../../../../tests/types/type-utils.js';
import { stringify, stringifyStream } from '../../src/index.js';

// -------------------------------------------------------------------
// 1. Positive Cases: stringify() Input Acceptance & Return Types
// -------------------------------------------------------------------

declare const singleRecord: StringifyRisRecord;
declare const multipleRecords: StringifyRisRecord[];
declare const builderInstance: RisBuilder;
declare const mixedInputs: (StringifyRisRecord | RisBuilder)[];

// 1.1 Accepts single record, returns string
const resSingle = stringify(singleRecord);
export type Test_StringifySingle = Expect<Equal<typeof resSingle, string>>;

// 1.2 Accepts array of records, returns string
const resMultiple = stringify(multipleRecords);
export type Test_StringifyMultiple = Expect<Equal<typeof resMultiple, string>>;

// 1.3 Accepts RisBuilder, returns string
const resBuilder = stringify(builderInstance);
export type Test_StringifyBuilder = Expect<Equal<typeof resBuilder, string>>;

// 1.4 Accepts mixed array of records and builders, returns string
const resMixed = stringify(mixedInputs);
export type Test_StringifyMixed = Expect<Equal<typeof resMixed, string>>;

// 1.5 Accepts readonly / as const array of records, returns string
declare const readonlyRecords: readonly StringifyRisRecord[];
const resReadonly = stringify(readonlyRecords);
export type Test_StringifyReadonly = Expect<Equal<typeof resReadonly, string>>;

// 1.5 Accepts options object
const resWithOptions = stringify(singleRecord, {
    eol: '\r\n',
    dateFormat: 'YYYY/MM/DD',
    useSmartTypes: true,
});
export type Test_StringifyWithOptions = Expect<Equal<typeof resWithOptions, string>>;

// -------------------------------------------------------------------
// 2. Positive Cases: stringifyStream() Return Type
// -------------------------------------------------------------------

declare const recordStream: AsyncIterable<StringifyRisRecord>;
declare const builderStream: AsyncIterable<RisBuilder>;
declare const inputUnionStream: AsyncIterable<StringifyInput>;

// 2.1 Accepts AsyncIterable<StringifyRisRecord>
const streamResult = stringifyStream(recordStream);
export type Test_StringifyStream = Expect<Equal<typeof streamResult, AsyncGenerator<string>>>;

// 2.2 Accepts AsyncIterable<RisBuilder>
const builderStreamResult = stringifyStream(builderStream);
export type Test_StringifyBuilderStream = Expect<Equal<typeof builderStreamResult, AsyncGenerator<string>>>;

// 2.3 Accepts AsyncIterable<StringifyInput>
const inputUnionStreamResult = stringifyStream(inputUnionStream);
export type Test_StringifyInputUnionStream = Expect<Equal<typeof inputUnionStreamResult, AsyncGenerator<string>>>;

// -------------------------------------------------------------------
// 3. Negative Cases: Invalid Inputs & Options Rejection
// -------------------------------------------------------------------

// 3.1 Invalid input type (number is not a StringifyInput)
// @ts-expect-error Invalid input type
stringify(12345);

// 3.2 Invalid EOL option
// @ts-expect-error Invalid EOL option
stringify(singleRecord, { eol: 'invalid_eol' });

// 3.3 Invalid dateFormat option
// @ts-expect-error Invalid dateFormat option
stringify(singleRecord, { dateFormat: 'invalid_date_format' });

// 3.4 Invalid arrayMergeStrategy option
// @ts-expect-error Invalid arrayMergeStrategy option
stringify(singleRecord, { arrayMergeStrategy: 'invalid_merge_strategy' });

// 3.5 Record fields reject functions and symbols
// @ts-expect-error Function is not a RisStringifyValue
stringify({ TY: 'JOUR', AU: () => 1 });

// @ts-expect-error Symbol is not a RisStringifyValue
stringify({ TY: 'JOUR', AU: Symbol('x') });
