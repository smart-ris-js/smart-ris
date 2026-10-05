// Copyright 2026 Martin Winkler

import type { StringifyOptions } from '../../../src/index.js';

export const stringifyFixtureOptions: StringifyOptions = {
    // ENGINE
    repairTags: true,
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

    // STRINGIFY SPECIFIC
    fromSemantic: false,
    customSemanticMap: { EE: 'EETag' },
    useSmartTypes: false,
    smartCastSchema: { XX: 'date', YY: 'number', ZZ: 'boolean' },
    dateFormat: 'YYYY-MM-DD',
};
