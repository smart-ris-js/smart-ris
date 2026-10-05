// Copyright 2026 Martin Winkler

import type { RisTag } from '../core.types.js';

// INTENTION: hoisted configuration reference.
/** Matches any character that is not an uppercase ASCII letter or digit. */
const REGEX_NON_ALPHANUMERIC = /[^A-Z0-9]/g;

/** Tries to repair a tag string by converting to uppercase and stripping non-alphanumeric characters. */
export function repairTag(tag: string): RisTag | null {
    // INTENTION: `String.prototype.replace` resets regex `lastIndex`; hoisted `/g` regex is stateless.
    const stripped = tag.toUpperCase().replace(REGEX_NON_ALPHANUMERIC, '');

    return stripped.length === 2 ? (stripped as RisTag) : null;
}
