// Copyright 2026 Martin Winkler

import type { Middleware, RisTag, StringifyPipelineRecord } from '@smart-ris/core';
import { remapRecordKeys } from '@smart-ris/core';

/** Configuration options for the semantic unmapper middleware. */
export type SemanticUnmapperOptions = {
    /** Map of semantic property names to raw RIS tags. */
    computedSemanticMap: Record<string, RisTag>;
};

/** Creates semantic unmapper middleware translating semantic field names back into raw RIS tags. */
export function createSemanticUnmapper(
    options: SemanticUnmapperOptions,
): Middleware<StringifyPipelineRecord, StringifyPipelineRecord> {
    // INTENTION: hoisted configuration reference.
    const computedSemanticMap = options.computedSemanticMap;

    return (payload: StringifyPipelineRecord): StringifyPipelineRecord => {
        return remapRecordKeys(payload, computedSemanticMap);
    };
}
