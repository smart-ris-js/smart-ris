// Copyright 2026 Martin Winkler

import type { Middleware } from '@smart-ris/core';
import { createArrayCaster, createStringSanitizer, createTagMapper } from '@smart-ris/core';
import type { ResolvedStringifyOptions } from '../stringify.options.js';
import { createSemanticUnmapper } from './semanticUnmapper/semanticUnmapper.middleware.js';
import { createStringifyTypeCaster } from './typeCaster/typeCaster.middleware.js';

/**
 * **Builds stringify middleware pipeline based on resolved options**.
 *
 * Pipeline Stages:
 * - 1. `semanticUnmapper` (if `fromSemantic`)
 * - 2. `tagMapper` (if `tagMapping` is non-empty)
 * - 3. `stringSanitizer` (if `cleanWhitespace || mergeMultiline`)
 * - 4. `typeCaster` (always active)
 * - 5. `arrayCaster` (if `arrayMergeStrategy !== false`)
 */
export function buildStringifyPipeline(opts: ResolvedStringifyOptions): Middleware[] {
    const pipeline: Middleware[] = [];

    // --- 1. Semantic Unmapping ---
    if (opts.fromSemantic) {
        pipeline.push(
            createSemanticUnmapper({
                computedSemanticMap: opts.customSemanticMap,
            }),
        );
    }

    // --- 2. Tag Mapping ---
    let hasTagMapping = false;
    for (const _ in opts.tagMapping) {
        hasTagMapping = true;
        break;
    }
    if (hasTagMapping) {
        pipeline.push(createTagMapper({ tagMapping: opts.tagMapping }));
    }

    // --- 3. String Sanitization ---
    if (opts.cleanWhitespace || opts.mergeMultiline) {
        pipeline.push(
            createStringSanitizer({
                cleanWhitespace: opts.cleanWhitespace,
                mergeMultiline: opts.mergeMultiline,
                eol: opts.eol,
            }),
        );
    }

    // --- 4. Type Casting ---
    pipeline.push(
        createStringifyTypeCaster({
            useSmartTypes: opts.useSmartTypes,
            smartCastSchema: opts.smartCastSchema,
            dateFormat: opts.dateFormat,
            logLevel: opts.logLevel,
            onError: opts.onError,
        }),
    );

    // --- 5. Array Casting & Merging ---
    if (opts.arrayMergeStrategy !== false) {
        pipeline.push(
            createArrayCaster({
                forStringify: true,
                arrayMergeStrategy: opts.arrayMergeStrategy,
                arrayTags: opts.customArrayTags,
                semanticMap: opts.customSemanticMap,
                eol: opts.eol,
            }),
        );
    }

    return pipeline;
}
