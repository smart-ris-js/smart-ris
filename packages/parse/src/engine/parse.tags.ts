// Copyright 2026 Martin Winkler

import { REGEX_TAG_LINE_STRICT } from '@smart-ris/core';

// -------------------------------------------------------------------
// 1. Tag Line Regular Expressions
// -------------------------------------------------------------------

/**
 * **Matches and extracts tag headers in repair mode**.
 *
 * Pattern Branches:
 * - **Branch 1 (`([A-Z0-9]{2})`)**: Standard 2-character alphanumeric tag. Requires at least 1 space either before or after the hyphen (`(?:\s+-\s*|\s*-\s+)`).
 * - **Branch 2 (`([^-\s](?:[^-]*[^- ])?)`)**: Malformed/arbitrary tag length. Requires at least 2 spaces before the first hyphen (` {2,}-\s*`).
 */
// INVARIANT: tag must end in a non-space character, so the space run before the hyphen belongs to ` {2,}` only.
// unambiguous split keeps matching linear; equivalent to the former lazy `([^-\s][^-]*?)`, which backtracked quadratically.
export const REGEX_TAG_LINE_REPAIR = /^\s*(?:([A-Z0-9]{2})(?:\s+-\s*|\s*-\s+)|([^-\s](?:[^-]*[^- ])?) {2,}-\s*)/;

// -------------------------------------------------------------------
// 2. Tag Line Extraction Helpers
// -------------------------------------------------------------------

/** Extracts tag and value from a raw RIS line using repair pattern matching. */
export function extractTagFromLine(line: string): { rawTag: string; value: string } | null {
    // every tag header contains a hyphen; cheap skip for hyphen-less continuation lines.
    if (line.indexOf('-') === -1) {
        return null;
    }

    const match = line.match(REGEX_TAG_LINE_REPAIR);
    if (!match) {
        return null;
    }

    // INVARIANT: regex matches only tag header prefix; unparsed value is extracted from remaining substring.
    return {
        rawTag: match[1] || match[2],
        value: line.substring(match[0].length),
    };
}

/** Extracts tag and value from a raw RIS line using strict pattern matching. */
export function extractStrictTagFromLine(line: string): { rawTag: string; value: string } | null {
    const match = line.match(REGEX_TAG_LINE_STRICT);
    if (!match) {
        return null;
    }

    // INVARIANT: regex matches only tag header prefix; unparsed value is extracted from remaining substring.
    return {
        rawTag: match[1],
        value: line.substring(match[0].length),
    };
}
