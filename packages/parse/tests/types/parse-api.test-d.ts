// Copyright 2026 Martin Winkler

import type {
    ArrayRisRecord,
    RisRecord,
    SemanticArrayRisRecord,
    SemanticRisRecord,
    SmartArrayRisRecord,
    SmartRisRecord,
    SmartSemanticArrayRisRecord,
    SmartSemanticRisRecord,
} from '@smart-ris/core';
import type { Equal, Expect } from '../../../../tests/types/type-utils.js';
import { parse, parseStream } from '../../src/index.js';

// -------------------------------------------------------------------
// 1. Positive Cases: parse() Option-Inferred Return Types
// -------------------------------------------------------------------

// 1.1 Default parse() returns RisRecord[]
const defaultResult = parse('TY  - JOUR\nER  - \n');
export type Test_DefaultParse = Expect<Equal<typeof defaultResult, RisRecord[]>>;

// 1.2 parse() with toSemantic returns SemanticRisRecord[]
const semanticResult = parse('TY  - JOUR\nER  - \n', { toSemantic: true } as const);
export type Test_SemanticParse = Expect<Equal<typeof semanticResult, SemanticRisRecord[]>>;

// 1.3 parse() with useSmartTypes returns SmartRisRecord[]
const smartResult = parse('TY  - JOUR\nER  - \n', { useSmartTypes: true } as const);
export type Test_SmartParse = Expect<Equal<typeof smartResult, SmartRisRecord[]>>;

// 1.4 parse() with toSemantic + useSmartTypes returns SmartSemanticRisRecord[]
const smartSemanticResult = parse('TY  - JOUR\nER  - \n', {
    toSemantic: true,
    useSmartTypes: true,
} as const);
export type Test_SmartSemanticParse = Expect<Equal<typeof smartSemanticResult, SmartSemanticRisRecord[]>>;

// 1.5 parse() with arrayMergeStrategy: false returns ArrayRisRecord[]
const arrayResult = parse('TY  - JOUR\nER  - \n', { arrayMergeStrategy: false } as const);
export type Test_ArrayParse = Expect<Equal<typeof arrayResult, ArrayRisRecord[]>>;

// 1.6 parse() with toSemantic + arrayMergeStrategy: false returns SemanticArrayRisRecord[]
const semanticArrayResult = parse('TY  - JOUR\nER  - \n', {
    toSemantic: true,
    arrayMergeStrategy: false,
} as const);
export type Test_SemanticArrayParse = Expect<Equal<typeof semanticArrayResult, SemanticArrayRisRecord[]>>;

// 1.7 parse() with useSmartTypes + arrayMergeStrategy: false returns SmartArrayRisRecord[]
const smartArrayResult = parse('TY  - JOUR\nER  - \n', {
    useSmartTypes: true,
    arrayMergeStrategy: false,
} as const);
export type Test_SmartArrayParse = Expect<Equal<typeof smartArrayResult, SmartArrayRisRecord[]>>;

// 1.8 parse() with combined all options returns SmartSemanticArrayRisRecord[]
const combinedResult = parse('TY  - JOUR\nER  - \n', {
    toSemantic: true,
    useSmartTypes: true,
    arrayMergeStrategy: false,
} as const);
export type Test_CombinedParse = Expect<Equal<typeof combinedResult, SmartSemanticArrayRisRecord[]>>;

// 1.9 parse() with as const options variable preserves full inference
const variableOptions = {
    toSemantic: true,
    useSmartTypes: true,
} as const;
const variableResult = parse('TY  - JOUR\nER  - \n', variableOptions);
export type Test_VariableOptionsParse = Expect<Equal<typeof variableResult, SmartSemanticRisRecord[]>>;

// 1.10 parse<CustomRecord>() generic override
interface CustomUserRecord {
    customId: string;
    [key: string]: unknown;
}
const customResult = parse<CustomUserRecord>('TY  - JOUR\nER  - \n');
export type Test_CustomGenericParse = Expect<Equal<typeof customResult, CustomUserRecord[]>>;

// -------------------------------------------------------------------
// 2. Positive Cases: parseStream() Option-Inferred Return Types
// -------------------------------------------------------------------

declare const sampleStringStream: AsyncIterable<string>;
declare const sampleUint8Stream: AsyncIterable<Uint8Array>;

// 2.1 Default parseStream() returns AsyncGenerator<RisRecord>
const defaultStream = parseStream(sampleStringStream);
export type Test_DefaultStream = Expect<Equal<typeof defaultStream, AsyncGenerator<RisRecord>>>;

// 2.2 parseStream() with Uint8Array stream accepts binary input
const uint8StreamResult = parseStream(sampleUint8Stream);
export type Test_Uint8Stream = Expect<Equal<typeof uint8StreamResult, AsyncGenerator<RisRecord>>>;

// 2.3 parseStream() with toSemantic returns AsyncGenerator<SemanticRisRecord>
const semanticStream = parseStream(sampleStringStream, { toSemantic: true } as const);
export type Test_SemanticStream = Expect<Equal<typeof semanticStream, AsyncGenerator<SemanticRisRecord>>>;

// 2.4 parseStream() with useSmartTypes returns AsyncGenerator<SmartRisRecord>
const smartStream = parseStream(sampleStringStream, { useSmartTypes: true } as const);
export type Test_SmartStream = Expect<Equal<typeof smartStream, AsyncGenerator<SmartRisRecord>>>;

// 2.5 parseStream() with combined options returns AsyncGenerator<SmartSemanticArrayRisRecord>
const combinedStream = parseStream(sampleStringStream, {
    toSemantic: true,
    useSmartTypes: true,
    arrayMergeStrategy: false,
} as const);
export type Test_CombinedStream = Expect<Equal<typeof combinedStream, AsyncGenerator<SmartSemanticArrayRisRecord>>>;

// 2.6 parseStream<CustomRecord>() generic override
const customStream = parseStream<CustomUserRecord>(sampleStringStream);
export type Test_CustomGenericStream = Expect<Equal<typeof customStream, AsyncGenerator<CustomUserRecord>>>;

// -------------------------------------------------------------------
// 3. Negative Cases: Invalid Options Call-Site Rejection
// -------------------------------------------------------------------

// 3.1 Rejects invalid arrayMergeStrategy string literal
// @ts-expect-error Invalid arrayMergeStrategy option value
parse('TY  - JOUR\nER  - \n', { arrayMergeStrategy: 'invalid_strategy' });

// 3.2 Rejects invalid EOL option value
// @ts-expect-error Invalid EOL option value
parse('TY  - JOUR\nER  - \n', { eol: 'invalid_eol' });

// 3.3 Rejects invalid logLevel option value
// @ts-expect-error Invalid logLevel option value
parse('TY  - JOUR\nER  - \n', { logLevel: 'invalid_log_level' });

// 3.4 Rejects invalid dateFormat option value
// @ts-expect-error Invalid dateFormat option value
parse('TY  - JOUR\nER  - \n', { dateFormat: 'invalid_date_format' });

// -------------------------------------------------------------------
// 4. tagMapping: Targets Keep Their Own Cast Type (Source Casts Never Inherit)
// -------------------------------------------------------------------

// 4.1 Target with default cast keeps it despite a conflicting source default cast (VL: number -> PY: date)
const mappedDefaultCast = parse('TY  - JOUR\nER  - \n', { useSmartTypes: true, tagMapping: { VL: 'PY' } } as const)[0];
export type Test_MappedDefaultCast = Expect<Equal<NonNullable<(typeof mappedDefaultCast)['PY']>, string>>;

// 4.2 Target without cast stays string despite a custom source cast (M1: number -> N1)
const mappedUncast = parse('TY  - JOUR\nER  - \n', {
    useSmartTypes: true,
    tagMapping: { M1: 'N1' },
    smartCastSchema: { M1: 'number' },
} as const)[0];
export type Test_MappedUncast = Expect<Equal<NonNullable<(typeof mappedUncast)['N1']>, string[]>>;

// 4.3 Target keeps its default cast despite a custom source cast (C1: date -> VL: number)
const mappedCustomSource = parse('TY  - JOUR\nER  - \n', {
    useSmartTypes: true,
    tagMapping: { C1: 'VL' },
    smartCastSchema: { C1: 'date' },
} as const)[0];
export type Test_MappedCustomSource = Expect<Equal<NonNullable<(typeof mappedCustomSource)['VL']>, number | string>>;

// 4.4 Boolean source cast does not leak into the number target (date source collapses into the string fallback)
const mappedBooleanSource = parse('TY  - JOUR\nER  - \n', {
    useSmartTypes: true,
    tagMapping: { C1: 'VL' },
    smartCastSchema: { C1: 'boolean' },
} as const)[0];
export type Test_MappedBooleanSource = Expect<Equal<NonNullable<(typeof mappedBooleanSource)['VL']>, number | string>>;
