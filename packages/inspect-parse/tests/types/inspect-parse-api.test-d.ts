// Copyright 2026 Martin Winkler

import type { Equal, Expect } from '../../../../tests/types/type-utils.js';
import { inspectParse, inspectParseStream, type ParseInspectionReport } from '../../src/index.js';

// -------------------------------------------------------------------
// 1. Positive Cases: Inspection Functions Return Types
// -------------------------------------------------------------------

// 1.1 inspectParse returns ParseInspectionReport
const report = inspectParse('TY  - JOUR\nER  - \n');
export type Test_InspectParse = Expect<Equal<typeof report, ParseInspectionReport>>;

// 1.2 inspectParse accepts options
const reportWithOptions = inspectParse('TY  - JOUR\nER  - \n', {
    repairTags: true,
    skipEmptyTags: true,
});
export type Test_InspectParseWithOptions = Expect<Equal<typeof reportWithOptions, ParseInspectionReport>>;

// 1.3 inspectParseStream with string stream returns Promise<ParseInspectionReport>
declare const sampleStringStream: AsyncIterable<string>;
const asyncStringReport = inspectParseStream(sampleStringStream);
export type Test_InspectParseStringStream = Expect<Equal<typeof asyncStringReport, Promise<ParseInspectionReport>>>;

// 1.4 inspectParseStream with binary Uint8Array stream returns Promise<ParseInspectionReport>
declare const sampleUint8Stream: AsyncIterable<Uint8Array>;
const asyncUint8Report = inspectParseStream(sampleUint8Stream);
export type Test_InspectParseUint8Stream = Expect<Equal<typeof asyncUint8Report, Promise<ParseInspectionReport>>>;

// -------------------------------------------------------------------
// 2. Negative Cases: Invalid Option Arguments Rejection
// -------------------------------------------------------------------

// 2.1 Rejects invalid option value
// @ts-expect-error Invalid option parameter
inspectParse('TY  - JOUR\nER  - \n', { arrayMergeStrategy: 'invalid_option' });

// 2.2 Rejects invalid EOL option value
// @ts-expect-error Invalid EOL option value
inspectParse('TY  - JOUR\nER  - \n', { eol: 'invalid_eol' });

// 2.3 Rejects non-string / non-stream argument
// @ts-expect-error Invalid input type (number)
inspectParse(12345);
