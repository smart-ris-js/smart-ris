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

/** User configuration options for parsing RIS data. */
export type ParseOptions = {
    // --- 1. Engine Options ---
    /**
     * Normalizes malformed tag headers (e.g. 'T_1' -> 'T1') and enables lax line extraction format matching.
     * If `false`, only strict tag lines (`XX  - `) start a tag; other lines are continuation text.
     * @default false
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

    /** Callback for parsing errors or warnings. */
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
     * Defines how multiple line entries with the same scalar tag are handled.
     * - `'first'` - First non-null value in array.
     * - `'last'` - Last non-null value in array.
     * - `'join-space'` - Joins all non-null values with a single space.
     * - `'join-newline'` - Joins all non-null values with a newline character.
     * - `false` - Disables merging and returns all values as an array (e.g. `[val1, val2]`).
     * @default 'join-space'
     */
    arrayMergeStrategy?: ArrayMergeStrategy;

    /**
     * Custom tags to be recognized as array tags allowing multiple tag entries.
     * @default []
     */
    customArrayTags?: ContentRisTag[];

    /**
     * Map specific tag aliases to other tags. Example: `{ A1: 'AU' }` maps `A1` to `AU`.
     * Mapped values use the cast type and date roles of the target tag; source tag casts are ignored.
     */
    tagMapping?: Partial<Record<ContentRisTag, ContentRisTag>>;

    // --- 3. Parse-Specific Options ---
    /**
     * Maps RIS tags to semantic object keys (e.g. `TI` -> `title`).
     * @default false
     */
    toSemantic?: boolean;

    /**
     * Custom semantic mapping for tags not in the default SemanticTagMap. Example: `{ EE: 'extraField' }`.
     * @default {}
     */
    customSemanticMap?: Partial<Record<ContentRisTag, string>>;

    /**
     * Attempts casting output values to native types (numbers, dates).
     * @default false
     */
    useSmartTypes?: boolean;

    /**
     * Custom tag schema for smart casting. Example: `{ DA: 'date', VL: 'number' }`.
     * @default {}
     */
    smartCastSchema?: Partial<Record<ContentRisTag, CastType>>;

    /**
     * Target date format template for parsed dates.
     * @default 'YYYY-MM-DD'
     */
    dateFormat?: DateFormatType;
};

// -------------------------------------------------------------------
// 2. Resolved Options Interface
// -------------------------------------------------------------------

/** Fully resolved and validated configuration options for the parse engine. */
export type ResolvedParseOptions = {
    // --- 1. Engine Options ---
    /** Normalizes malformed tag headers. */
    repairTags: boolean;
    /** Skips invalid RIS format tags. */
    skipInvalidTags: boolean;
    /** Skips tags with empty values. */
    skipEmptyTags: boolean;
    /** Resolved line terminator character. */
    eol: EolType;
    /** Numeric error log level filter. */
    logLevel: LogLevelValue;
    /** Optional callback for parsing errors or warnings. */
    onError?: OnErrorCallback | undefined;

    // --- 2. Core Middleware Options ---
    /** Trims values and collapses consecutive newlines. */
    cleanWhitespace: boolean;
    /** Merges multiline values with spaces. */
    mergeMultiline: boolean;
    /** Strategy for resolving multiple line entries with the same scalar tag. */
    arrayMergeStrategy: ArrayMergeStrategy;
    /** Resolved list of tags recognized as array tags. */
    customArrayTags: ContentRisTag[];
    /** Normalized tag alias mappings. */
    tagMapping: Partial<Record<ContentRisTag, ContentRisTag>>;

    // --- 3. Parse-Specific Options ---
    /** Maps RIS tags to semantic object keys. */
    toSemantic: boolean;
    /** Resolved semantic map: default RIS tag mappings merged with custom entries. */
    customSemanticMap: Partial<Record<RisTag, string>>;
    /** Attempts casting output values to native types. */
    useSmartTypes: boolean;
    /** Schema defining tag casting targets. */
    smartCastSchema: Record<string, CastType>;
    /** Target date format template for parsed dates. */
    dateFormat: DateFormatType;
};
