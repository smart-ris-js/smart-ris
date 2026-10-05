// Copyright 2026 Martin Winkler

import { REGEX_INTERNAL_SPACES } from '@smart-ris/core';
import type { TagStats } from '../inspect-parse.types.js';

/** Matches 3 or more consecutive newline sequences (`\n` or `\r\n`) representing excessive line breaks. */
const REGEX_EXCESSIVE_LINEBREAKS = /(\r?\n){3,}/;

/** Matches carriage return or newline characters indicating multiline data. */
const REGEX_MULTILINE = /\r|\n/;

/**
 * **Analyzes string values for whitespace padding, empty states, multiline text, internal spaces, and excessive linebreaks**.
 *
 * Returns boolean indicating whether the value is non-empty and valid for downstream inspection.
 */
export function inspectStringValue(val: string | null, stats: TagStats): boolean {
    stats.count++;

    // 1. empty/`null` check.
    if (val === null || val === '') {
        stats.emptyCount++;
        return false;
    }

    // 2. whitespace-only check.
    const trimmed = val.trim();
    if (trimmed === '') {
        stats.emptyCount++;
        return false;
    }

    // 3. unneeded bounding whitespace check.
    if (val !== trimmed) {
        stats.whitespacePaddedCount++;
    }

    // 4. multiline data and excessive linebreaks check.
    if (REGEX_MULTILINE.test(val)) {
        stats.multilineCount++;

        // 5. excessive linebreaks check (3+ consecutive linebreaks).
        if (REGEX_EXCESSIVE_LINEBREAKS.test(val)) {
            stats.excessiveLinebreaksCount = (stats.excessiveLinebreaksCount ?? 0) + 1;
        }
    }

    // 6. multiple internal consecutive spaces check (condensable by stringSanitizer).
    if (val.search(REGEX_INTERNAL_SPACES) !== -1) {
        stats.multipleInternalSpacesCount = (stats.multipleInternalSpacesCount ?? 0) + 1;
    }

    return true;
}
