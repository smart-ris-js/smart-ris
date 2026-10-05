// Copyright 2026 Martin Winkler

import type {
    DEFAULT_ARRAY_TAGS,
    DEFAULT_SMART_CAST_SCHEMA,
    OBJECT_PROTOTYPE_PROPERTIES,
    PROMISE_THENABLE_PROPERTIES,
    tag,
} from './core.constants.js';
import type {
    LOG_LEVEL,
    VALID_ARRAY_MERGE_STRATEGIES,
    VALID_CAST_TYPES,
    VALID_DATE_FORMATS,
    VALID_EOL,
} from './core.options.js';
import type { RisBaseError } from './errors.js';

// -------------------------------------------------------------------
// 1. General Type Utilities
// -------------------------------------------------------------------

/** Represents a single value or an array of values. */
export type MaybeArray<T> = T | T[] | readonly T[];

// -------------------------------------------------------------------
// 2. Underlying Types
// -------------------------------------------------------------------

type Letter =
    | 'A'
    | 'B'
    | 'C'
    | 'D'
    | 'E'
    | 'F'
    | 'G'
    | 'H'
    | 'I'
    | 'J'
    | 'K'
    | 'L'
    | 'M'
    | 'N'
    | 'O'
    | 'P'
    | 'Q'
    | 'R'
    | 'S'
    | 'T'
    | 'U'
    | 'V'
    | 'W'
    | 'X'
    | 'Y'
    | 'Z';
type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type Char = Letter | Digit;

/** Possible numbers for month of year - `01-12`. */
export type Month = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12';
/** Possible values for the day of month - `01-31`. */
export type Day =
    | '01'
    | '02'
    | '03'
    | '04'
    | '05'
    | '06'
    | '07'
    | '08'
    | '09'
    | '10'
    | '11'
    | '12'
    | '13'
    | '14'
    | '15'
    | '16'
    | '17'
    | '18'
    | '19'
    | '20'
    | '21'
    | '22'
    | '23'
    | '24'
    | '25'
    | '26'
    | '27'
    | '28'
    | '29'
    | '30'
    | '31';

// -------------------------------------------------------------------
// 3. Dates
// -------------------------------------------------------------------

/** Internal date object representation with at least one date property required. */
export type RawDate =
    | { year: string; month?: Month; day?: Day }
    | { year?: string; month: Month; day?: Day }
    | { year?: string; month?: Month; day: Day };
/**
 * **RIS date structure**.
 *
 * - Uses generic `number` for year to prevent TS union type explosion.
 */
export type RisDate =
    | `${number}`
    | `${number}-${Month}`
    | `${number}-${Month}-${Day}`
    | `${number}/${Month}`
    | `${number}/${Month}/${Day}`;

// -------------------------------------------------------------------
// 4. Staged Value Primitives
// -------------------------------------------------------------------

/** Raw value types (only `string | null`). */
export type RisRawValue = string | null;

/**
 * **Value types in parse pipeline after type casting**.
 *
 * - Never creates native `Date` instances to avoid filling missing month/day.
 */
export type RisParseValue = string | number | boolean | RisDate | null;

/** Value types in stringify pipeline after type casting AND accepted by builder. */
export type RisStringifyValue = string | number | boolean | Date | RawDate | RisDate | null;

// -------------------------------------------------------------------
// 5. RIS Tags & Key Types
// -------------------------------------------------------------------

/** Generic RIS tag - two uppercase alphanumeric characters. */
export type RisTag = `${Char}${Char}`;
/** Semantic key - inferred from the `tag` mapping object keys. */
export type SemanticKey = keyof typeof tag;
/** Known standard 2-character RIS tags. */
export type KnownRisTag = (typeof tag)[SemanticKey];
/** Structural RIS boundary tag - start (TY) and end (ER) of RIS record. */
export type StructuralRisTag = 'TY' | 'ER';
/** Non-structural RIS tag representing content fields. */
export type ContentRisTag = Exclude<RisTag, StructuralRisTag>;

// -------------------------------------------------------------------
// 6. Staged Internal Pipeline Record Types
// -------------------------------------------------------------------

/**
 * **Pre-arrayCaster parse and post-arrayCaster stringify payload**.
 *
 * - Every tag value is strictly an array of raw strings or nulls.
 */
export type RawArrayPipelineRecord = Record<string, RisRawValue[]>;

/**
 * **Post-arrayCaster parse and post-typeCaster stringify payload**.
 *
 * - Tags are either scalar strings/nulls or string/null arrays.
 */
export type RawPipelineRecord = Record<string, MaybeArray<RisRawValue>>;

/**
 * **Pre-typeCaster stringify payload**.
 *
 * - Every tag value is strictly an array of stringify values (Date, numbers, booleans, strings).
 */
export type StringifyPipelineRecord = Record<string, RisStringifyValue[]>;

/** Standard middleware function contract with typed input and output. */
export type Middleware<TInput = never, TOutput = unknown> = (payload: TInput) => TOutput;

type SafeLiteral<T> = string extends T ? never : [ContentRisTag] extends [T] ? never : T;

export type ExtractCustomSemanticValues<T> =
    T extends Record<PropertyKey, unknown> ? SafeLiteral<T[keyof T] & string> : never;

export type ExtractCustomArrayTags<T> = T extends readonly (infer Element)[]
    ? SafeLiteral<Element & string>
    : T extends string
      ? SafeLiteral<T>
      : never;

export type ExtractSchemaKeys<T> = T extends Record<PropertyKey, unknown> ? SafeLiteral<keyof T & string> : never;

type OverwrittenSemanticKeys<TOpts> = TOpts extends {
    customSemanticMap: infer TMap;
}
    ? ContentRisTag extends keyof TMap
        ? never
        : {
              [K in SemanticKey]: (typeof tag)[K] extends keyof TMap ? K : never;
          }[SemanticKey]
    : never;

// -------------------------------------------------------------------
// 7. Builder Types
// -------------------------------------------------------------------

export type BuilderSemanticKey<TConfig> = Exclude<SemanticKey, OverwrittenSemanticKeys<TConfig>>;

export type BuilderAutocompleteKey<TConfig> =
    | BuilderSemanticKey<TConfig>
    | KnownRisTag
    | ExtractCustomSemanticValues<TConfig extends { customSemanticMap: infer M } ? M : never>;

export type PromiseThenableProperty = (typeof PROMISE_THENABLE_PROPERTIES)[number];

export type ObjectPrototypeProperty = (typeof OBJECT_PROTOTYPE_PROPERTIES)[number];

export type ReservedBuilderMethods = {
    [K in PromiseThenableProperty | ObjectPrototypeProperty]?: never;
};

/** Builder output of `build()`, `get`, `toJSON()`; RIS tag keys, `TY` always present (default reference type if never set). */
export type BuiltRisRecord = {
    [K in Exclude<KnownRisTag, StructuralRisTag> | (string & {})]?: MaybeArray<RisStringifyValue>;
} & {
    TY: MaybeArray<string | null>;
    ER?: never;
};

/** Builder output of `raw()`; RIS tag keys, every value an array, `TY` always present. */
export type RawBuiltRisRecord = {
    [K in Exclude<KnownRisTag, StructuralRisTag> | (string & {})]?: RisStringifyValue[];
} & {
    TY: (string | null)[];
    ER?: never;
};

type SpecialBuilderMethods = {
    build(): BuiltRisRecord;
    raw(): RawBuiltRisRecord;
    readonly get: BuiltRisRecord;
    toJSON(): BuiltRisRecord;
};

// INTENTION: must never call ER/endOfReference or promise thenables; value for TY/typeOfReference only allows MaybeArray<`string | null`>.
type BoundaryBuilderMethods<TConfig> = {
    TY(...values: MaybeArray<string | null>[]): RisBuilder<TConfig>;
    typeOfReference(...values: MaybeArray<string | null>[]): RisBuilder<TConfig>;
    ER?: never;
    endOfReference?: never;
} & ReservedBuilderMethods;

// INTENTION: derive reserved keys from special and boundary definitions to avoid manual string duplication.
type ReservedBuilderKeys = keyof SpecialBuilderMethods | keyof BoundaryBuilderMethods<never>;

type KnownBuilderMethods<TConfig> = {
    [K in Exclude<BuilderAutocompleteKey<TConfig>, ReservedBuilderKeys>]: (
        ...values: MaybeArray<RisStringifyValue>[]
    ) => RisBuilder<TConfig>;
};

type FallbackBuilderMethods<TConfig> = {
    [customTag: string & {}]: (...values: MaybeArray<RisStringifyValue>[]) => RisBuilder<TConfig>;
};

/**
 * **Fluent RIS Builder interface**.
 *
 * - Output from: `ris()`
 * - Input to: `stringify()`
 */
export type RisBuilder<TConfig = Record<string, never>> = KnownBuilderMethods<TConfig> &
    SpecialBuilderMethods &
    BoundaryBuilderMethods<TConfig> &
    FallbackBuilderMethods<TConfig>;

/** Configuration options for extending the fluent RIS builder. */
export type RisBuilderConfig = {
    customSemanticMap?: Partial<Record<ContentRisTag, string>>;
};

/** Callable function and direct proxy entrypoint for the RIS builder. */
export type RisCallableBuilder = (<const TConfig extends RisBuilderConfig = Record<string, never>>(
    config?: TConfig,
) => RisBuilder<TConfig>) &
    RisBuilder<Record<string, never>>;

// -------------------------------------------------------------------
// 8. Type Inference Helpers for Parse Output
// -------------------------------------------------------------------

export type DefaultArrayRisTag = (typeof DEFAULT_ARRAY_TAGS)[number];
export type DefaultArraySemanticKey = {
    [K in keyof typeof tag]: (typeof tag)[K] extends DefaultArrayRisTag ? K : never;
}[keyof typeof tag];

// --- 8.1. Transitive Bidirectional Tag & Alias Engine ---
type StandardSemanticAlias<TKey extends string> = TKey extends keyof typeof tag
    ? (typeof tag)[TKey]
    : { [K in keyof typeof tag]: (typeof tag)[K] extends TKey ? K : never }[keyof typeof tag];

type CustomSemanticAlias<TKey extends string, TOpts> = TOpts extends {
    customSemanticMap: infer TMap;
}
    ? TKey extends keyof TMap
        ? TMap[TKey] & string
        : { [K in keyof TMap]: TMap[K] extends TKey ? K & string : never }[keyof TMap]
    : never;

type DirectTagAliases<TKey extends string, TOpts> =
    | TKey
    | StandardSemanticAlias<TKey>
    | CustomSemanticAlias<TKey, TOpts>;

export type TagAliases<TKey extends string, TOpts> =
    | DirectTagAliases<TKey, TOpts>
    | (DirectTagAliases<TKey, TOpts> extends infer A extends string ? DirectTagAliases<A, TOpts> : never);

// --- 8.2. Smart Casting & Array Resolution Engine ---
// failed casts keep the raw string; `date` output is any string (`RisDate | string` collapses).
type SmartCastTypeMap = {
    date: string;
    number: number | string;
    boolean: boolean | string;
    string: string;
};

type ResolveTagCastType<TKey extends string, TOpts> = TOpts extends {
    smartCastSchema: infer TSchema;
}
    ? {
          [A in TagAliases<TKey, TOpts>]: A extends keyof TSchema
              ? TSchema[A] extends keyof SmartCastTypeMap
                  ? SmartCastTypeMap[TSchema[A]]
                  : string
              : never;
      }[TagAliases<TKey, TOpts>] extends infer R
        ? [R] extends [never]
            ? never
            : R
        : never
    : never;

type ResolveDefaultCastType<TKey extends string, TOpts> = {
    [A in TagAliases<TKey, TOpts>]: A extends keyof typeof DEFAULT_SMART_CAST_SCHEMA
        ? (typeof DEFAULT_SMART_CAST_SCHEMA)[A] extends keyof SmartCastTypeMap
            ? SmartCastTypeMap[(typeof DEFAULT_SMART_CAST_SCHEMA)[A]]
            : never
        : never;
}[TagAliases<TKey, TOpts>] extends infer R
    ? [R] extends [never]
        ? string
        : R
    : string;

type InferPrimitiveValue<TKey extends string, TOpts> = TOpts extends { useSmartTypes: true }
    ? [ResolveTagCastType<TKey, TOpts>] extends [never]
        ? ResolveDefaultCastType<TKey, TOpts>
        : ResolveTagCastType<TKey, TOpts>
    : string;

type IsArrayKey<TKey extends string, TOpts> = TOpts extends { arrayMergeStrategy: false }
    ? true
    : [
            Extract<
                TagAliases<TKey, TOpts>,
                | DefaultArrayRisTag
                | DefaultArraySemanticKey
                | (TOpts extends { customArrayTags: infer TCustomArrays }
                      ? ExtractCustomArrayTags<TCustomArrays>
                      : never)
            >,
        ] extends [never]
      ? false
      : true;

type InferValueWithNullability<T, TOpts> = TOpts extends { skipEmptyTags: false } ? T | null : T;

type InferTagValue<TKey extends string, TOpts> =
    IsArrayKey<TKey, TOpts> extends true
        ? InferValueWithNullability<InferPrimitiveValue<TKey, TOpts>, TOpts>[]
        : InferValueWithNullability<InferPrimitiveValue<TKey, TOpts>, TOpts>;

/** Content RIS tags that do not have a built-in semantic name mapping. */
export type UnmappedContentRisTag = Exclude<ContentRisTag, (typeof tag)[SemanticKey]>;

type UnmappedTagsForOpts<TOpts> = TOpts extends {
    customSemanticMap: infer TMap;
}
    ? Exclude<UnmappedContentRisTag, keyof TMap>
    : UnmappedContentRisTag;

// -------------------------------------------------------------------
// 9. Public Parse Output Record Types
// -------------------------------------------------------------------

/**
 * **Dynamic parsed RIS record output**.
 *
 * - Accurately infers exact scalar vs array value types, smart type casting, and semantic / custom tag mappings based on options.
 */
export type ParsedRisRecord<TOpts = Record<string, never>> = TOpts extends { toSemantic: true }
    ? {
          [K in
              | Exclude<SemanticKey, OverwrittenSemanticKeys<TOpts> | 'typeOfReference' | 'endOfReference'>
              | UnmappedTagsForOpts<TOpts>
              | ExtractCustomSemanticValues<TOpts extends { customSemanticMap: infer M } ? M : never>
              | ExtractCustomArrayTags<TOpts extends { customArrayTags: infer A } ? A : never>
              | ExtractSchemaKeys<TOpts extends { smartCastSchema: infer S } ? S : never>]?: InferTagValue<K, TOpts>;
      } & {
          typeOfReference: IsArrayKey<'TY', TOpts> extends true ? string[] : string;
          endOfReference?: never;
          ER?: never;
      }
    : {
          [K in
              | ContentRisTag
              | ExtractCustomArrayTags<TOpts extends { customArrayTags: infer A } ? A : never>
              | ExtractSchemaKeys<TOpts extends { smartCastSchema: infer S } ? S : never>]?: InferTagValue<K, TOpts>;
      } & {
          TY: IsArrayKey<'TY', TOpts> extends true ? string[] : string;
          ER?: never;
      };

/**
 * **Standard parsed output**.
 *
 * - Key: 2-alphanumeric character RIS tags.
 * - Values: scalar / array `strings | null`.
 */
export type RisRecord = ParsedRisRecord<Record<string, never>>;

/**
 * **Standard smart-typed parse output**.
 *
 * - Key: 2-alphanumeric character RIS tags.
 * - Values: scalar / array `strings | numbers | booleans | RisDate | null`.
 */
export type SmartRisRecord = ParsedRisRecord<{ useSmartTypes: true }>;

/**
 * **Standard semantic parse output**.
 *
 * - Key: semantic tag names and unmapped 2-character RIS tags.
 * - Values: scalar / array `strings | null`.
 */
export type SemanticRisRecord = ParsedRisRecord<{ toSemantic: true }>;

/**
 * **Standard semantic smart-typed parse output**.
 *
 * - Key: semantic tag names and unmapped 2-character RIS tags.
 * - Values: scalar / array `strings | numbers | booleans | RisDate | null`.
 */
export type SmartSemanticRisRecord = ParsedRisRecord<{ toSemantic: true; useSmartTypes: true }>;

/**
 * **Array-only parsed output**.
 *
 * - Key: 2-alphanumeric character RIS tags.
 * - Values: strictly array `(strings | null)[]`.
 */
export type ArrayRisRecord = ParsedRisRecord<{ arrayMergeStrategy: false }>;

/**
 * **Array-only smart-typed parse output**.
 *
 * - Key: 2-alphanumeric character RIS tags.
 * - Values: strictly array `(strings | numbers | booleans | RisDate | null)[]`.
 */
export type SmartArrayRisRecord = ParsedRisRecord<{ useSmartTypes: true; arrayMergeStrategy: false }>;

/**
 * **Array-only semantic parse output**.
 *
 * - Key: semantic tag names and unmapped 2-character RIS tags.
 * - Values: strictly array `(strings | null)[]`.
 */
export type SemanticArrayRisRecord = ParsedRisRecord<{ toSemantic: true; arrayMergeStrategy: false }>;

/**
 * **Array-only semantic smart-typed parse output**.
 *
 * - Key: semantic tag names and unmapped 2-character RIS tags.
 * - Values: strictly array `(strings | numbers | booleans | RisDate | null)[]`.
 */
export type SmartSemanticArrayRisRecord = ParsedRisRecord<{
    toSemantic: true;
    useSmartTypes: true;
    arrayMergeStrategy: false;
}>;

/**
 * **Universal parsed output record**.
 *
 * - Union of all 8 standard, semantic, smart-typed, and array-only parse output records.
 */
export type ParseRisRecord =
    | RisRecord
    | SmartRisRecord
    | SemanticRisRecord
    | SmartSemanticRisRecord
    | ArrayRisRecord
    | SmartArrayRisRecord
    | SemanticArrayRisRecord
    | SmartSemanticArrayRisRecord;

// -------------------------------------------------------------------
// 10. Public Stringify Input Record Types
// -------------------------------------------------------------------

type ReservedStringifyKeys =
    | 'build'
    | 'raw'
    | 'get'
    | 'toJSON'
    | StructuralRisTag
    | 'typeOfReference'
    | 'endOfReference';

/**
 * **Universal stringify input record**.
 *
 * - All known standard RIS tags and semantic tag names with string literal fallback.
 * - Values: scalar/array of `string | number | boolean | Date | RawDate | RisDate | null`.
 */
export type StringifyRisRecord = {
    [K in Exclude<SemanticKey | KnownRisTag, ReservedStringifyKeys> | (string & {})]?: MaybeArray<RisStringifyValue>;
} & {
    TY?: MaybeArray<string | null>;
    typeOfReference?: MaybeArray<string | null>;
    ER?: never;
    endOfReference?: never;
};

/** Universal input accepted by `stringify()` and `stringifyStream()`. */
export type StringifyInput = StringifyRisRecord | RisBuilder;

// -------------------------------------------------------------------
// 11. Default Options
// -------------------------------------------------------------------

/** Supported end-of-line delimiter strings. */
export type EolType = (typeof VALID_EOL)[number];
/** Valid strategies for resolving multiple values for scalar RIS tags (excluding `false`). */
export type ActiveArrayMergeStrategy = (typeof VALID_ARRAY_MERGE_STRATEGIES)[number];
/**
 * **Strategy for resolving multiple values for scalar RIS tags**.
 *
 * - `'first'` - First non-null value in array.
 * - `'last'` - Last non-null value in array.
 * - `'join-space'` - Joins all non-null values with a single space.
 * - `'join-newline'` - Joins all non-null values with a newline character.
 * - `false` - Disables merging and preserves raw array.
 */
export type ArrayMergeStrategy = ActiveArrayMergeStrategy | false;
/** Supported date formatting pattern strings. */
export type DateFormatType = (typeof VALID_DATE_FORMATS)[number];
/** Supported smart type casting targets. */
export type CastType = (typeof VALID_CAST_TYPES)[number];
/** Error logging severity level names. */
export type LogLevel = keyof typeof LOG_LEVEL;
/** Numeric error logging severity values. */
export type LogLevelValue = (typeof LOG_LEVEL)[LogLevel];

// -------------------------------------------------------------------
// 12. Error Handling
// -------------------------------------------------------------------

/** Diagnostic incident context passed to error handlers. */
export type RisErrorContext = {
    /** Root or derived error instance. */
    error: RisBaseError;
    /** Raw source line where incident occurred. */
    rawLine: string;
    /** Source line number if available. */
    lineNumber?: number | null;
    /** RIS tag associated with incident if identified. */
    tag: string | null;
    /** In-progress record context when incident occurred. */
    recordContext?: Record<string, unknown>;
};

/** Error callback function signature. */
export type OnErrorCallback = (incident: RisErrorContext) => void;

/** Error emitter options wrapper. */
export type EmitErrorOptions = {
    /** Optional user-provided error callback. */
    onError?: OnErrorCallback | undefined;
    /** Threshold severity level. */
    logLevel: LogLevelValue;
};
