// Copyright 2026 Martin Winkler

import { REGEX_SPLIT_LINES } from '../../core.constants.js';
import type { EolType, Middleware, RawPipelineRecord, RisRawValue } from '../../core.types.js';
import { cleanWhitespace, mergeMultilineString } from './stringSanitizer.utils.js';

/** Configuration options for the string sanitizer middleware. */
export type StringSanitizerOptions = {
    /** Whether to apply normalization of whitespace and multiple empty lines. */
    cleanWhitespace: boolean;
    /** Whether to merge multiple lines into a single line. */
    mergeMultiline: boolean;
    /** EOL char for multiline reconstruction. */
    eol: EolType;
};

/** Creates string sanitizer middleware normalizing whitespace and multiline strings. */
export function createStringSanitizer(
    options: StringSanitizerOptions,
): Middleware<RawPipelineRecord, RawPipelineRecord> {
    // INTENTION: hoisted configuration references.
    const cleanWhitespaceOpt = options.cleanWhitespace;
    const mergeMultilineOpt = options.mergeMultiline;
    const eolOpt = options.eol;

    /** Sanitizes and normalizes individual scalar string values according to configured whitespace and multiline rules. */
    function sanitizeValue(val: RisRawValue): RisRawValue {
        if (typeof val !== 'string') {
            return val;
        }

        let lines = val.split(REGEX_SPLIT_LINES);

        if (cleanWhitespaceOpt) {
            lines = cleanWhitespace(lines);
        }
        if (mergeMultilineOpt) {
            lines = mergeMultilineString(lines);
        }

        return lines.join(eolOpt).trim();
    }

    return (payload: RawPipelineRecord): RawPipelineRecord => {
        for (const tag in payload) {
            // INTENTION: type guard alias.
            const val = payload[tag];
            if (val === null) {
                continue;
            }

            // INTENTION: scalar strings (PARSE: arrayCaster runs before this).
            if (typeof val === 'string') {
                payload[tag] = sanitizeValue(val);
            } else {
                // INTENTION: not `null`, not `string`, must be array of strings (`RisRawValue`).
                for (let i = 0; i < val.length; i++) {
                    // INTENTION: mutation of array elements in-place for pipeline efficiency.
                    (val as RisRawValue[])[i] = sanitizeValue(val[i]);
                }
            }
        }
        return payload;
    };
}
