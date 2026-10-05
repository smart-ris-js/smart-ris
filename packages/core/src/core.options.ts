// Copyright 2026 Martin Winkler

// -------------------------------------------------------------------
// 1. Validation Literals & Enums
// -------------------------------------------------------------------

/** Valid end-of-line (EOL) sequence identifiers. */
export const VALID_EOL = Object.freeze(['\n', '\r\n', '\r'] as const);

/** Valid end-of-line (EOL) sequence identifiers - O(1) lookup. */
export const VALID_EOL_SET: ReadonlySet<string> = new Set<string>(VALID_EOL);

/** Valid strategies for resolving multiple values for scalar RIS tags. */
export const VALID_ARRAY_MERGE_STRATEGIES = Object.freeze(['first', 'last', 'join-space', 'join-newline'] as const);

/** Valid strategies for resolving multiple values for scalar RIS tags - O(1) lookup. */
export const VALID_ARRAY_MERGE_STRATEGIES_SET: ReadonlySet<string> = new Set<string>(VALID_ARRAY_MERGE_STRATEGIES);

/** Valid target date formatting templates. */
export const VALID_DATE_FORMATS = Object.freeze(['YYYY-MM-DD', 'YYYY-MM', 'YYYY/MM/DD', 'YYYY/MM', 'YYYY'] as const);

/** Valid target date formatting templates - O(1) lookup. */
export const VALID_DATE_FORMATS_SET: ReadonlySet<string> = new Set<string>(VALID_DATE_FORMATS);

/** Valid primitive types for smart type casting. */
export const VALID_CAST_TYPES = Object.freeze(['string', 'number', 'boolean', 'date'] as const);

/** Valid primitive types for smart type casting - O(1) lookup. */
export const VALID_CAST_TYPES_SET: ReadonlySet<string> = new Set<string>(VALID_CAST_TYPES);

// INTENTION: type-definition literal for `null`-prototype schema inference.
const logLevelMap = {
    silent: -1,
    error: 0,
    warn: 1,
    info: 2,
} as const;

/** Valid string literals for logging severity levels. */
export const VALID_LOG_LEVELS = Object.freeze([
    'silent',
    'error',
    'warn',
    'info',
] as const satisfies readonly (keyof typeof logLevelMap)[]);

/** Valid string literals for logging severity levels - O(1) lookup. */
export const VALID_LOG_LEVELS_SET: ReadonlySet<string> = new Set<string>(VALID_LOG_LEVELS);

// -------------------------------------------------------------------
// 2. Logging Levels
// -------------------------------------------------------------------

/** Numeric severity map for supported logging levels. */
export const LOG_LEVEL: typeof logLevelMap = Object.freeze(Object.assign(Object.create(null), logLevelMap));
