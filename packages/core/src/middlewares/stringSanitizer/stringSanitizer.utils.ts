// Copyright 2026 Martin Winkler

import { REGEX_INTERNAL_SPACES } from '../../core.constants.js';

/** @internal - for testing only. */
export function cleanWhitespace(lines: string[]): string[] {
    const result: string[] = [];
    let consecutiveEmpty = 0;

    for (let i = 0; i < lines.length; i++) {
        // INTENTION: trim only on first line WITH CONTENT; else only trim end to preserve indentation.
        let line = result.length === 0 ? lines[i].trim() : lines[i].trimEnd();

        if (line.length > 0) {
            // INTENTION: module-scoped global regex is stateless with String.prototype.replace.
            line = line.replace(REGEX_INTERNAL_SPACES, ' ');
            consecutiveEmpty = 0;
            result.push(line);
        } else {
            consecutiveEmpty++;
            // INTENTION: only allow a single empty line to be pushed.
            if (result.length > 0 && consecutiveEmpty === 1) {
                result.push('');
            }
        }
    }

    if (result.length > 0 && result[result.length - 1] === '') {
        result.pop();
    }

    return result;
}

/** @internal - for testing only. */
export function mergeMultilineString(lines: string[]): string[] {
    let merged = '';

    for (let i = 0; i < lines.length; i++) {
        // INTENTION: alias to prevent double-trimming for if and push.
        const trimmed = lines[i].trim();
        if (trimmed.length > 0) {
            merged = merged.length === 0 ? trimmed : `${merged} ${trimmed}`;
        }
    }

    return merged.length === 0 ? [] : [merged];
}
