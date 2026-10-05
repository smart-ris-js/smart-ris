// Copyright 2026 Martin Winkler

import type {
    ArrayMergeStrategy,
    CastType,
    ContentRisTag,
    DateFormatType,
    EolType,
    LogLevel,
    LogLevelValue,
    OnErrorCallback,
    RisTag,
} from '@smart-ris/core';
import type { Equal, Expect, ExpectFalse, Extends } from '../../../../tests/types/type-utils.js';
import type { ParseEngine, ParseEngineOptions } from '../../src/engine/parse.engine.js';
import type { SemanticMapperOptions } from '../../src/middlewares/semanticMapper/semanticMapper.middleware.js';
import type { TypeCasterOptions } from '../../src/middlewares/typeCaster/typeCaster.middleware.js';
import type { ParseOptions, ResolvedParseOptions } from '../../src/parse.types.js';

// -------------------------------------------------------------------
// 1. Positive Cases: ParseOptions Interface Shape
// -------------------------------------------------------------------

// 1.1 ParseOptions accepts all valid configuration properties
export type Test_ParseOptions_Shape = Expect<
    Extends<
        {
            repairTags?: boolean;
            skipInvalidTags?: boolean;
            skipEmptyTags?: boolean;
            eol?: EolType;
            logLevel?: LogLevel;
            onError?: OnErrorCallback;
            cleanWhitespace?: boolean;
            mergeMultiline?: boolean;
            customArrayTags?: ContentRisTag[];
            arrayMergeStrategy?: ArrayMergeStrategy;
            useSmartTypes?: boolean;
            smartCastSchema?: Partial<Record<ContentRisTag, CastType>>;
            dateFormat?: DateFormatType;
            tagMapping?: Partial<Record<ContentRisTag, ContentRisTag>>;
            toSemantic?: boolean;
            customSemanticMap?: Partial<Record<ContentRisTag, string>>;
        },
        ParseOptions
    >
>;

// -------------------------------------------------------------------
// 2. Positive Cases: ResolvedParseOptions Interface Shape
// -------------------------------------------------------------------

// 2.1 ResolvedParseOptions provides non-optional defaults
export type Test_ResolvedParseOptions_Shape = Expect<
    Extends<
        {
            repairTags: boolean;
            skipInvalidTags: boolean;
            skipEmptyTags: boolean;
            eol: EolType;
            logLevel: LogLevelValue;
            onError?: OnErrorCallback;
            cleanWhitespace: boolean;
            mergeMultiline: boolean;
            customArrayTags: ContentRisTag[];
            arrayMergeStrategy: ArrayMergeStrategy;
            useSmartTypes: boolean;
            smartCastSchema: Record<string, CastType>;
            dateFormat: DateFormatType;
            tagMapping: Partial<Record<ContentRisTag, ContentRisTag>>;
            toSemantic: boolean;
            customSemanticMap: Partial<Record<RisTag, string>>;
        },
        ResolvedParseOptions
    >
>;

// -------------------------------------------------------------------
// 3. Positive Cases: Engine & Middleware Interfaces
// -------------------------------------------------------------------

// 3.1 ParseEngineOptions validation
export type Test_ParseEngineOptions_Shape = Expect<
    Extends<
        {
            repairTags: boolean;
            skipInvalidTags: boolean;
            skipEmptyTags: boolean;
            eol: EolType;
            logLevel: LogLevelValue;
            onError?: OnErrorCallback;
            middlewares: any[];
        },
        ParseEngineOptions
    >
>;

// 3.2 ParseEngine contract validation
declare const engine: ParseEngine;
export type Test_ParseEngine_IsAborted = Expect<Equal<typeof engine.isAborted, boolean>>;

// 3.3 SemanticMapperOptions shape
export type Test_SemanticMapperOptions_Shape = Expect<
    Equal<SemanticMapperOptions, { computedSemanticMap: Record<string, string> }>
>;

// 3.4 TypeCasterOptions shape
export type Test_TypeCasterOptions_Shape = Expect<
    Extends<
        {
            smartCastSchema: Partial<Record<string, CastType>>;
            dateFormat: DateFormatType;
            logLevel: LogLevelValue;
            onError?: OnErrorCallback;
            toSemantic: boolean;
            computedSemanticMap: Record<string, string>;
        },
        TypeCasterOptions
    >
>;

// -------------------------------------------------------------------
// 4. Negative Cases: Reject Non-ContentRisTag Keys in Options
// -------------------------------------------------------------------

// 4.1 Reject semantic keys in smartCastSchema
export type Test_Reject_Semantic_In_CastSchema = ExpectFalse<
    Extends<{ smartCastSchema: { volume: 'number' } }, ParseOptions>
>;

// 4.2 Reject structural tag TY in smartCastSchema
export type Test_Reject_TY_In_CastSchema = ExpectFalse<Extends<{ smartCastSchema: { TY: 'number' } }, ParseOptions>>;

// 4.3 Reject structural tag ER in smartCastSchema
export type Test_Reject_ER_In_CastSchema = ExpectFalse<Extends<{ smartCastSchema: { ER: 'date' } }, ParseOptions>>;

// 4.4 Reject semantic keys in customArrayTags
export type Test_Reject_Semantic_In_ArrayTags = ExpectFalse<Extends<{ customArrayTags: ['authors'] }, ParseOptions>>;

// 4.5 Reject structural tag TY in customArrayTags
export type Test_Reject_TY_In_ArrayTags = ExpectFalse<Extends<{ customArrayTags: ['TY'] }, ParseOptions>>;

// 4.6 Reject structural tag ER in customArrayTags
export type Test_Reject_ER_In_ArrayTags = ExpectFalse<Extends<{ customArrayTags: ['ER'] }, ParseOptions>>;
