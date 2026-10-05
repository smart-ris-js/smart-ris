// Copyright 2026 Martin Winkler

import { tag as DEFAULT_SEMANTIC_TAGS_MAP, type RisTag } from '@smart-ris/core';
import type { ResolvedParseOptions } from '@smart-ris/parse';
import type { TagStats } from '../inspect-parse.types.js';

const STANDARD_TAGS_SET = new Set<string>(Object.values(DEFAULT_SEMANTIC_TAGS_MAP));

/** Classifies tag as standard, custom, or unknown, and evaluates semantic mapping availability. */
export function inspectSemanticAndClassification(key: string, stats: TagStats, options: ResolvedParseOptions): void {
    const isStandard = STANDARD_TAGS_SET.has(key);
    // INTENTION: type guard alias.
    const tagMapping = options.tagMapping as Record<string, string>;
    // INTENTION: parse `semanticMapper` runs after `tagMapper` - semantic key is resolved from the mapped tag.
    const targetTag = tagMapping[key] ?? key;
    // INTENTION: type guard alias.
    const customArrayTags: readonly string[] = options.customArrayTags;
    const isMappingTag = targetTag !== key || Object.values(tagMapping).includes(key);
    const isCustom =
        !isStandard &&
        (Boolean(options.customSemanticMap[key as RisTag]) ||
            isMappingTag ||
            customArrayTags.includes(key) ||
            Boolean(options.smartCastSchema[key]));

    stats.isStandard = isStandard;
    if (isCustom) {
        stats.isCustom = true;
    }
    if (!isStandard && !isCustom) {
        stats.isUnknown = true;
    }

    // INVARIANT: resolved `customSemanticMap` contains the default semantic map merged with custom entries.
    if (options.customSemanticMap[targetTag as RisTag]) {
        stats.hasSemanticMapping = true;
    }
}
