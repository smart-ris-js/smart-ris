// Copyright 2026 Martin Winkler

import type { ParseOptions, ResolvedParseOptions } from './parse.types.js';

export type { ParseOptions, ResolvedParseOptions };

// -------------------------------------------------------------------
// 1. Engine & Stream Buffer Limits
// -------------------------------------------------------------------

/**
 * **Maximum number of lines accumulated per RIS record**.
 *
 * - Tracks total lines processed while in an active record.
 * - If line count exceeds 1,000 before reaching `ER`, engine emits `RECORD_EXCEEDS_MAX_LINES` and aborts.
 */
export const MAX_RECORD_LINES = 1000;

/**
 * **Maximum string buffer size (10 MiB) before stream parsing aborts**.
 *
 * - Accumulates chunks in internal buffer until newline delimiter (`\n`).
 * - Emits `LINE_EXCEEDS_MAX_BUFFER_SIZE` via `onError` and aborts if unterminated remainder exceeds 10 MiB.
 */
export const MAX_BUFFER_SIZE = 10 * 1024 * 1024;

// -------------------------------------------------------------------
// 2. Default Options
// -------------------------------------------------------------------

/** Default scalar parse configuration fallback values. */
export const DEFAULT_PARSE_OPTIONS: Readonly<ParseOptions> = Object.freeze({
    // --- ENGINE ---
    repairTags: false,
    skipInvalidTags: false,
    skipEmptyTags: true,
    eol: '\n',
    logLevel: 'error',

    // --- CORE MIDDLEWARES ---
    cleanWhitespace: true,
    mergeMultiline: false,
    arrayMergeStrategy: 'join-space',

    // --- PARSE SPECIFIC ---
    toSemantic: false,
    useSmartTypes: false,
    dateFormat: 'YYYY-MM-DD',
});
