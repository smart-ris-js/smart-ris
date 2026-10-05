// Copyright 2026 Martin Winkler

import type { Middleware } from '@smart-ris/core';
import { createArrayCaster, createStringSanitizer, createTagMapper } from '@smart-ris/core';
import type { ResolvedParseOptions } from '../parse.options.js';
import { createSemanticMapper } from './semanticMapper/semanticMapper.middleware.js';
import { createParseTypeCaster } from './typeCaster/typeCaster.middleware.js';

/**
 * **Builds parse middleware pipeline based on resolved options**.
 *
 * Pipeline Stages:
 * - 1. `tagMapper` (if `tagMapping` is non-empty)
 * - 2. `semanticMapper` (if `toSemantic`)
 * - 3. `arrayCaster` (if `arrayMergeStrategy !== false`)
 * - 4. `stringSanitizer` (if `cleanWhitespace || mergeMultiline`)
 * - 5. `typeCaster` (if `useSmartTypes`)
 */
export function buildParsePipeline(opts: ResolvedParseOptions): Middleware[] {
    const pipeline: Middleware[] = [];

    // --- 1. Tag Mapping ---
    let hasTagMapping = false;
    for (const _ in opts.tagMapping) {
        hasTagMapping = true;
        break;
    }
    if (hasTagMapping) {
        pipeline.push(createTagMapper({ tagMapping: opts.tagMapping }));
    }

    // --- 2. Semantic Mapping ---
    if (opts.toSemantic) {
        pipeline.push(
            createSemanticMapper({
                computedSemanticMap: opts.customSemanticMap,
            }),
        );
    }

    // --- 3. Array Casting & Merging ---
    if (opts.arrayMergeStrategy !== false) {
        pipeline.push(
            createArrayCaster({
                forStringify: false,
                arrayMergeStrategy: opts.arrayMergeStrategy,
                arrayTags: opts.customArrayTags,
                semanticMap: opts.customSemanticMap,
                eol: opts.eol,
            }),
        );
    }

    // --- 4. String Sanitization ---
    if (opts.cleanWhitespace || opts.mergeMultiline) {
        pipeline.push(
            createStringSanitizer({
                cleanWhitespace: opts.cleanWhitespace,
                mergeMultiline: opts.mergeMultiline,
                eol: opts.eol,
            }),
        );
    }

    // --- 5. Type Casting ---
    if (opts.useSmartTypes) {
        pipeline.push(
            createParseTypeCaster({
                smartCastSchema: opts.smartCastSchema,
                dateFormat: opts.dateFormat,
                logLevel: opts.logLevel,
                onError: opts.onError,
                toSemantic: opts.toSemantic,
                computedSemanticMap: opts.customSemanticMap,
            }),
        );
    }

    return pipeline;
}
