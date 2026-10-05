// Copyright 2026 Martin Winkler

import type { RisTag } from '@smart-ris/core';
import {
    assertBoolean,
    assertStringLiteral,
    DEFAULT_ARRAY_TAGS,
    DEFAULT_SMART_CAST_SCHEMA,
    resolveArrayTags,
    resolveCastSchema,
    resolveLogLevel,
    resolveStringifySemanticMap,
    resolveTagMapping,
    VALID_ARRAY_MERGE_STRATEGIES,
    VALID_DATE_FORMATS,
    VALID_EOL,
} from '@smart-ris/core';
import { DEFAULT_STRINGIFY_OPTIONS, type ResolvedStringifyOptions } from './stringify.options.js';
import type { StringifyOptions } from './stringify.types.js';

/** Resolves and validates stringify configuration options with defaults. */
export function resolveStringifyOptions(options?: StringifyOptions): ResolvedStringifyOptions {
    if (options !== undefined && (typeof options !== 'object' || options === null || Array.isArray(options))) {
        throw new TypeError('Options must be an object.');
    }
    const inputOpts = options ?? {};

    // --- 1. Primitive Option Resolution & Assertion ---
    const repairTags = inputOpts.repairTags ?? DEFAULT_STRINGIFY_OPTIONS.repairTags;
    assertBoolean(repairTags, 'repairTags');

    const skipInvalidTags = inputOpts.skipInvalidTags ?? DEFAULT_STRINGIFY_OPTIONS.skipInvalidTags;
    assertBoolean(skipInvalidTags, 'skipInvalidTags');

    const skipEmptyTags = inputOpts.skipEmptyTags ?? DEFAULT_STRINGIFY_OPTIONS.skipEmptyTags;
    assertBoolean(skipEmptyTags, 'skipEmptyTags');

    const fromSemantic = inputOpts.fromSemantic ?? DEFAULT_STRINGIFY_OPTIONS.fromSemantic;
    assertBoolean(fromSemantic, 'fromSemantic');

    const cleanWhitespace = inputOpts.cleanWhitespace ?? DEFAULT_STRINGIFY_OPTIONS.cleanWhitespace;
    assertBoolean(cleanWhitespace, 'cleanWhitespace');

    const mergeMultiline = inputOpts.mergeMultiline ?? DEFAULT_STRINGIFY_OPTIONS.mergeMultiline;
    assertBoolean(mergeMultiline, 'mergeMultiline');

    const useSmartTypes = inputOpts.useSmartTypes ?? DEFAULT_STRINGIFY_OPTIONS.useSmartTypes;
    assertBoolean(useSmartTypes, 'useSmartTypes');

    const arrayMergeStrategy = inputOpts.arrayMergeStrategy ?? DEFAULT_STRINGIFY_OPTIONS.arrayMergeStrategy;
    if (arrayMergeStrategy !== false) {
        assertStringLiteral(arrayMergeStrategy, VALID_ARRAY_MERGE_STRATEGIES, 'arrayMergeStrategy');
    }

    const dateFormat = inputOpts.dateFormat ?? DEFAULT_STRINGIFY_OPTIONS.dateFormat;
    assertStringLiteral(dateFormat, VALID_DATE_FORMATS, 'dateFormat');

    const eol = inputOpts.eol ?? DEFAULT_STRINGIFY_OPTIONS.eol;
    assertStringLiteral(eol, VALID_EOL, 'eol');

    const logLevel = resolveLogLevel(inputOpts.logLevel, DEFAULT_STRINGIFY_OPTIONS.logLevel);

    if (inputOpts.onError !== undefined && typeof inputOpts.onError !== 'function') {
        throw new TypeError(`Option 'onError' must be a function. Received: ${typeof inputOpts.onError}`);
    }

    // --- 2. Complex Domain Resolution (Objects & Arrays) ---
    const computedTagMapping = resolveTagMapping(inputOpts.tagMapping);
    const computedSemanticMap = resolveStringifySemanticMap(inputOpts.customSemanticMap);
    const userArrayTags = resolveArrayTags(inputOpts.customArrayTags, DEFAULT_ARRAY_TAGS);
    // INTENTION: append TY and ER for internal stringify; ER is omitted anyways; TY uses heuristic in engine output generation to determine best candidate.
    const computedArrayTags: RisTag[] = [...userArrayTags, 'TY', 'ER'];
    const computedSmartCastSchema = resolveCastSchema(inputOpts.smartCastSchema, DEFAULT_SMART_CAST_SCHEMA);

    // --- 3. Return Resolved Options ---
    return {
        repairTags,
        skipInvalidTags,
        skipEmptyTags,
        fromSemantic,
        cleanWhitespace,
        mergeMultiline,
        useSmartTypes,
        arrayMergeStrategy,
        customArrayTags: computedArrayTags,
        tagMapping: computedTagMapping,
        customSemanticMap: computedSemanticMap,
        smartCastSchema: computedSmartCastSchema,
        dateFormat,
        eol,
        logLevel,
        onError: inputOpts.onError,
    };
}
