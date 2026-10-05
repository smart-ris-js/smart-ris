// Copyright 2026 Martin Winkler

import type { ContentRisTag, Middleware, RawArrayPipelineRecord } from '../../core.types.js';
import { remapRecordKeys } from '../../utils/record.js';

/** Configuration options for the tag mapper middleware. */
export type TagMapperOptions = {
    /** Map of source {@link ContentRisTag} to destination {@link ContentRisTag}. Pre-normalized and validated via `resolveTagMapping`. */
    tagMapping: Partial<Record<ContentRisTag, ContentRisTag>>;
};

/** Creates tag mapper middleware remapping and merging RIS tags according to mapping dictionary. */
export function createTagMapper(options: TagMapperOptions): Middleware<RawArrayPipelineRecord, RawArrayPipelineRecord> {
    // INTENTION: hoisted configuration reference.
    const tagMapping = options.tagMapping;

    return (payload: RawArrayPipelineRecord): RawArrayPipelineRecord => {
        return remapRecordKeys(payload, tagMapping);
    };
}
