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

// -------------------------------------------------------------------
// 1. User Options Interface
// -------------------------------------------------------------------

/** User configuration options for stringifying RIS records. */
export type StringifyOptions = {
    // --- 1. Engine Options ---
    /**
     * Uppercases and normalizes non-standard input object keys to valid 2-character RIS tags (e.g. 'T_1' -> 'T1').
     * @default true
     */
    repairTags?: boolean;

    /**
     * Skips invalid RIS format tags (not '[A-Z0-9]{2}') - may result in data loss!
     * Kept (`false`) and skipped (`true`) invalid tags both emit a `RisWarning` via `onError`.
     * @default false
     */
    skipInvalidTags?: boolean;

    /**
     * Skips tags with empty values.
     * @default true
     */
    skipEmptyTags?: boolean;

    /**
     * Line terminator character.
     * @default '\n'
     */
    eol?: EolType;

    /**
     * Error log level filter.
     * @default 'error'
     */
    logLevel?: LogLevel;

    /** Callback for stringifying errors or warnings. */
    onError?: OnErrorCallback;

    // --- 2. Core Middleware Options ---
    /**
     * Trims values and collapses consecutive newlines.
     * @default true
     */
    cleanWhitespace?: boolean;

    /**
     * Merges multiline values with spaces.
     * @default false
     */
    mergeMultiline?: boolean;

    /**
     * Defines how array inputs for scalar tags are merged into a single RIS tag entry.
     * - `'first'` - First non-null value in array.
     * - `'last'` - Last non-null value in array.
     * - `'join-space'` - Joins all non-null values with a single space.
     * - `'join-newline'` - Joins all non-null values with a newline character.
     * - `false` - Disables merging and emits multiple RIS tag lines.
     * @default 'join-space'
     */
    arrayMergeStrategy?: ArrayMergeStrategy;

    /**
     * Custom tags to be recognized as array tags allowing multiple tag entries.
     * @default []
     */
    customArrayTags?: ContentRisTag[];

    /**
     * Map specific aliases to other tags. Example: `{ A1: 'AU' }` maps `A1` to `AU`.
     * Mapped values use the cast type and date roles of the target tag; source tag casts are ignored.
     */
    tagMapping?: Partial<Record<ContentRisTag, ContentRisTag>>;

    // --- 3. Stringify-Specific Options ---
    /**
     * Maps semantic keys back to RIS tags.
     * @default false
     */
    fromSemantic?: boolean;

    /**
     * Custom semantic mapping for keys not in the default SemanticTagMap. Example: `{ EE: 'extraField' }`.
     * @default {}
     */
    customSemanticMap?: Partial<Record<ContentRisTag, string>>;

    /**
     * Casts structural types (like Date) to string.
     * @default false
     */
    useSmartTypes?: boolean;

    /**
     * Custom tag schema for smart casting. Example: `{ DA: 'date', VL: 'number' }`.
     * @default {}
     */
    smartCastSchema?: Partial<Record<ContentRisTag, CastType>>;

    /**
     * Target date format template for serialized dates.
     *
     * `Date` objects use their local calendar date; invalid `RawDate` objects (e.g. month `13`, `2023-02-29`) are dropped with a warning.
     * @default 'YYYY-MM-DD'
     */
    dateFormat?: DateFormatType;
};

// -------------------------------------------------------------------
// 2. Resolved Options Interface
// -------------------------------------------------------------------

/** Fully resolved and validated configuration options for the stringify engine. */
export type ResolvedStringifyOptions = {
    // --- 1. Engine Options ---
    /** Enables automatic normalization of malformed tag keys. */
    repairTags: boolean;
    /** Skips invalid RIS format tags. */
    skipInvalidTags: boolean;
    /** Skips tags with empty values. */
    skipEmptyTags: boolean;
    /** Resolved line terminator character. */
    eol: EolType;
    /** Numeric error log level filter. */
    logLevel: LogLevelValue;
    /** Optional callback for stringifying errors or warnings. */
    onError?: OnErrorCallback | undefined;

    // --- 2. Core Middleware Options ---
    /** Trims values and collapses consecutive newlines. */
    cleanWhitespace: boolean;
    /** Merges multiline values with spaces. */
    mergeMultiline: boolean;
    /** Strategy for resolving multiple line entries with the same scalar tag. */
    arrayMergeStrategy: ArrayMergeStrategy;
    // INTENTION: internally requires TY to keep array values for engine heuristic; and ER is omitted anyways.
    /** Resolved list of tags recognized as array tags. */
    customArrayTags: RisTag[];
    /** Normalized tag alias mappings. */
    tagMapping: Partial<Record<ContentRisTag, ContentRisTag>>;

    // --- 3. Stringify-Specific Options ---
    /** Indicates whether input originates from semantic property mapping. */
    fromSemantic: boolean;
    /** Custom semantic mappings from property names back to RIS tags. */
    customSemanticMap: Record<string, RisTag>;
    /** Enables automatic date and primitive type formatting. */
    useSmartTypes: boolean;
    /** Schema defining tag casting targets. */
    smartCastSchema: Record<string, CastType>;
    /** Target date format template for stringified dates. */
    dateFormat: DateFormatType;
};
