// Copyright 2026 Martin Winkler

import type { ResolvedStringifyOptions, StringifyOptions } from './stringify.types.js';

export type { ResolvedStringifyOptions, StringifyOptions };

// -------------------------------------------------------------------
// 1. Default Options
// -------------------------------------------------------------------

/** Default scalar stringify configuration fallback values. */
export const DEFAULT_STRINGIFY_OPTIONS: Readonly<StringifyOptions> = Object.freeze({
    // --- ENGINE ---
    repairTags: true,
    skipInvalidTags: false,
    skipEmptyTags: true,
    eol: '\n',
    logLevel: 'error',

    // --- CORE MIDDLEWARES ---
    cleanWhitespace: true,
    mergeMultiline: false,
    arrayMergeStrategy: 'join-space',

    // --- STRINGIFY SPECIFIC ---
    fromSemantic: false,
    useSmartTypes: false,
    dateFormat: 'YYYY-MM-DD',
});
