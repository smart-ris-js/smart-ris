// Copyright 2026 Martin Winkler

import {
    assertBoolean,
    assertStringLiteral,
    DEFAULT_ARRAY_TAGS,
    DEFAULT_SMART_CAST_SCHEMA,
    resolveArrayTags,
    resolveCastSchema,
    resolveLogLevel,
    resolveParseSemanticMap,
    resolveTagMapping,
    VALID_ARRAY_MERGE_STRATEGIES,
    VALID_DATE_FORMATS,
    VALID_EOL,
} from '@smart-ris/core';
import { DEFAULT_PARSE_OPTIONS, type ResolvedParseOptions } from './parse.options.js';
import type { ParseOptions } from './parse.types.js';

/** Resolves and validates parse configuration options with defaults. */
export function resolveParseOptions(options?: ParseOptions): ResolvedParseOptions {
    if (options !== undefined && (typeof options !== 'object' || options === null || Array.isArray(options))) {
        throw new TypeError('Options must be an object.');
    }
    const inputOpts = options ?? {};

    // --- 1. Primitive Option Resolution & Assertion ---
    const repairTags = inputOpts.repairTags ?? DEFAULT_PARSE_OPTIONS.repairTags;
    assertBoolean(repairTags, 'repairTags');

    const skipInvalidTags = inputOpts.skipInvalidTags ?? DEFAULT_PARSE_OPTIONS.skipInvalidTags;
    assertBoolean(skipInvalidTags, 'skipInvalidTags');

    const skipEmptyTags = inputOpts.skipEmptyTags ?? DEFAULT_PARSE_OPTIONS.skipEmptyTags;
    assertBoolean(skipEmptyTags, 'skipEmptyTags');

    const toSemantic = inputOpts.toSemantic ?? DEFAULT_PARSE_OPTIONS.toSemantic;
    assertBoolean(toSemantic, 'toSemantic');

    const cleanWhitespace = inputOpts.cleanWhitespace ?? DEFAULT_PARSE_OPTIONS.cleanWhitespace;
    assertBoolean(cleanWhitespace, 'cleanWhitespace');

    const mergeMultiline = inputOpts.mergeMultiline ?? DEFAULT_PARSE_OPTIONS.mergeMultiline;
    assertBoolean(mergeMultiline, 'mergeMultiline');

    const useSmartTypes = inputOpts.useSmartTypes ?? DEFAULT_PARSE_OPTIONS.useSmartTypes;
    assertBoolean(useSmartTypes, 'useSmartTypes');

    const arrayMergeStrategy = inputOpts.arrayMergeStrategy ?? DEFAULT_PARSE_OPTIONS.arrayMergeStrategy;
    if (arrayMergeStrategy !== false) {
        assertStringLiteral(arrayMergeStrategy, VALID_ARRAY_MERGE_STRATEGIES, 'arrayMergeStrategy');
    }

    const dateFormat = inputOpts.dateFormat ?? DEFAULT_PARSE_OPTIONS.dateFormat;
    assertStringLiteral(dateFormat, VALID_DATE_FORMATS, 'dateFormat');

    const eol = inputOpts.eol ?? DEFAULT_PARSE_OPTIONS.eol;
    assertStringLiteral(eol, VALID_EOL, 'eol');

    const logLevel = resolveLogLevel(inputOpts.logLevel, DEFAULT_PARSE_OPTIONS.logLevel);

    if (inputOpts.onError !== undefined && typeof inputOpts.onError !== 'function') {
        throw new TypeError(`Option 'onError' must be a function. Received: ${typeof inputOpts.onError}`);
    }

    // --- 2. Complex Domain Resolution (Objects & Arrays) ---
    const computedTagMapping = resolveTagMapping(inputOpts.tagMapping);
    const computedSemanticMap = resolveParseSemanticMap(inputOpts.customSemanticMap);
    const computedArrayTags = resolveArrayTags(inputOpts.customArrayTags, DEFAULT_ARRAY_TAGS);
    const computedSmartCastSchema = resolveCastSchema(inputOpts.smartCastSchema, DEFAULT_SMART_CAST_SCHEMA);

    // --- 3. Return Resolved Options ---
    return {
        repairTags,
        skipInvalidTags,
        skipEmptyTags,
        cleanWhitespace,
        mergeMultiline,
        arrayMergeStrategy,
        customArrayTags: computedArrayTags,
        tagMapping: computedTagMapping,
        toSemantic,
        customSemanticMap: computedSemanticMap,
        useSmartTypes,
        smartCastSchema: computedSmartCastSchema,
        dateFormat,
        eol,
        logLevel,
        onError: inputOpts.onError,
    };
}
