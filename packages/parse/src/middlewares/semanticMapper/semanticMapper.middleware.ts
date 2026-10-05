// Copyright 2026 Martin Winkler

import type { Middleware, RawArrayPipelineRecord } from '@smart-ris/core';
import { remapRecordKeys } from '@smart-ris/core';

/** Configuration options for the semantic mapper middleware. */
export type SemanticMapperOptions = {
    /** Map of raw RIS tags to semantic property names. */
    computedSemanticMap: Record<string, string>;
};

/** Creates semantic mapper middleware translating raw RIS tags into semantic field names. */
export function createSemanticMapper(
    options: SemanticMapperOptions,
): Middleware<RawArrayPipelineRecord, RawArrayPipelineRecord> {
    // INTENTION: hoisted configuration reference.
    const computedSemanticMap = options.computedSemanticMap;

    // INTENTION: `null`-prototype lookup table avoiding prototype pollution and runtime allocations.
    const lookup: Record<string, string> = Object.create(null);
    // INVARIANT: computedSemanticMap is strictly validated upstream in resolver; all entries are guaranteed non-empty strings.
    for (const key in computedSemanticMap) {
        // INTENTION: cached dictionary lookup.
        const semanticKey = computedSemanticMap[key];
        lookup[key] = semanticKey;
        // INTENTION: map uppercase semantic aliases (e.g. AUTHOR -> author) for non-standard RIS input and faulty stringify payloads.
        lookup[semanticKey.toUpperCase()] = semanticKey;
    }

    return (payload: RawArrayPipelineRecord): RawArrayPipelineRecord => {
        return remapRecordKeys(payload, lookup);
    };
}
