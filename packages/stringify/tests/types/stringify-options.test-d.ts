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
    StringifyInput,
} from '@smart-ris/core';
import type { Equal, Expect, ExpectFalse, Extends } from '../../../../tests/types/type-utils.js';
import type { StringifyEngine, StringifyEngineOptions } from '../../src/engine/stringify.engine.js';
import type { SemanticUnmapperOptions } from '../../src/middlewares/semanticUnmapper/semanticUnmapper.middleware.js';
import type { TypeCasterOptions } from '../../src/middlewares/typeCaster/typeCaster.middleware.js';
import type { ResolvedStringifyOptions, StringifyOptions } from '../../src/stringify.types.js';

// -------------------------------------------------------------------
// 1. Positive Cases: StringifyOptions Interface Shape
// -------------------------------------------------------------------

// 1.1 StringifyOptions accepts all valid configuration properties
export type Test_StringifyOptions_Shape = Expect<
    Extends<
        {
            cleanWhitespace?: boolean;
            mergeMultiline?: boolean;
            repairTags?: boolean;
            skipInvalidTags?: boolean;
            skipEmptyTags?: boolean;
            fromSemantic?: boolean;
            customSemanticMap?: Partial<Record<ContentRisTag, string>>;
            customArrayTags?: ContentRisTag[];
            arrayMergeStrategy?: ArrayMergeStrategy;
            useSmartTypes?: boolean;
            smartCastSchema?: Partial<Record<ContentRisTag, CastType>>;
            tagMapping?: Partial<Record<ContentRisTag, ContentRisTag>>;
            eol?: EolType;
            dateFormat?: DateFormatType;
            logLevel?: LogLevel;
            onError?: OnErrorCallback;
        },
        StringifyOptions
    >
>;

// -------------------------------------------------------------------
// 2. Positive Cases: ResolvedStringifyOptions Interface Shape
// -------------------------------------------------------------------

// 2.1 ResolvedStringifyOptions provides non-optional defaults
export type Test_ResolvedStringifyOptions_Shape = Expect<
    Extends<
        {
            cleanWhitespace: boolean;
            mergeMultiline: boolean;
            repairTags: boolean;
            skipInvalidTags: boolean;
            skipEmptyTags: boolean;
            fromSemantic: boolean;
            customSemanticMap: Record<string, RisTag>;
            customArrayTags: RisTag[];
            arrayMergeStrategy: ArrayMergeStrategy;
            useSmartTypes: boolean;
            smartCastSchema: Record<string, CastType>;
            tagMapping: Partial<Record<ContentRisTag, ContentRisTag>>;
            eol: EolType;
            dateFormat: DateFormatType;
            logLevel: LogLevelValue;
            onError?: OnErrorCallback;
        },
        ResolvedStringifyOptions
    >
>;

// -------------------------------------------------------------------
// 3. Positive Cases: Engine & Middleware Interfaces
// -------------------------------------------------------------------

// 3.1 StringifyEngineOptions validation
export type Test_StringifyEngineOptions_Shape = Expect<
    Extends<
        {
            repairTags: boolean;
            skipInvalidTags: boolean;
            skipEmptyTags: boolean;
            fromSemantic: boolean;
            eol: EolType;
            logLevel: LogLevelValue;
            onError?: OnErrorCallback;
            middlewares: any[];
        },
        StringifyEngineOptions
    >
>;

// 3.2 StringifyEngine serializeRecord method contract
declare const engine: StringifyEngine;
export type Test_StringifyEngine_SerializeMethod = Expect<
    Equal<typeof engine.serializeRecord, (input: StringifyInput) => string>
>;

// 3.3 SemanticUnmapperOptions shape
export type Test_SemanticUnmapperOptions_Shape = Expect<
    Equal<SemanticUnmapperOptions, { computedSemanticMap: Record<string, RisTag> }>
>;

// 3.4 TypeCasterOptions shape
export type Test_TypeCasterOptions_Shape = Expect<
    Extends<
        {
            useSmartTypes: boolean;
            smartCastSchema: Partial<Record<string, CastType>>;
            dateFormat: DateFormatType;
            logLevel: LogLevelValue;
            onError?: OnErrorCallback;
        },
        TypeCasterOptions
    >
>;

// -------------------------------------------------------------------
// 4. Negative Cases: Reject Non-ContentRisTag Keys in Options
// -------------------------------------------------------------------

// 4.1 Reject semantic keys in smartCastSchema
export type Test_Reject_Semantic_In_CastSchema = ExpectFalse<
    Extends<{ smartCastSchema: { volume: 'number' } }, StringifyOptions>
>;

// 4.2 Reject structural tag TY in smartCastSchema
export type Test_Reject_TY_In_CastSchema = ExpectFalse<
    Extends<{ smartCastSchema: { TY: 'number' } }, StringifyOptions>
>;

// 4.3 Reject structural tag ER in smartCastSchema
export type Test_Reject_ER_In_CastSchema = ExpectFalse<Extends<{ smartCastSchema: { ER: 'date' } }, StringifyOptions>>;

// 4.4 Reject semantic keys in customArrayTags
export type Test_Reject_Semantic_In_ArrayTags = ExpectFalse<
    Extends<{ customArrayTags: ['authors'] }, StringifyOptions>
>;

// 4.5 Reject structural tag TY in customArrayTags
export type Test_Reject_TY_In_ArrayTags = ExpectFalse<Extends<{ customArrayTags: ['TY'] }, StringifyOptions>>;

// 4.6 Reject structural tag ER in customArrayTags
export type Test_Reject_ER_In_ArrayTags = ExpectFalse<Extends<{ customArrayTags: ['ER'] }, StringifyOptions>>;
