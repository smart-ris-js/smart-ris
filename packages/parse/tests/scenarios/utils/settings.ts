// Copyright 2026 Martin Winkler

import type { ParseOptions } from '../../../src/index.js';

export const parseFixtureOptions: ParseOptions = {
    // ENGINE
    repairTags: false,
    skipInvalidTags: false,
    skipEmptyTags: true,
    eol: '\n',
    logLevel: 'error',

    // CORE MIDDLEWARES
    cleanWhitespace: true,
    mergeMultiline: false,
    arrayMergeStrategy: 'join-space',
    customArrayTags: ['DD'],
    tagMapping: { AA: 'BB', CC: 'DD' },

    // PARSE SPECIFIC
    toSemantic: false,
    customSemanticMap: { EE: 'EETag' },
    useSmartTypes: false,
    smartCastSchema: { XX: 'date', YY: 'number', ZZ: 'boolean' },
    dateFormat: 'YYYY-MM-DD',
};
