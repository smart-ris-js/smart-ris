// Copyright 2026 Martin Winkler

import { LOG_LEVEL } from './core.options.js';
import type { EmitErrorOptions, LogLevelValue, RisErrorContext } from './core.types.js';

// -------------------------------------------------------------------
// 1. Error Codes & Messages
// -------------------------------------------------------------------

// INTENTION: type-definition literal for `null`-prototype schema inference.
const risErrorMap = {
    // --- CORE & STRUCTURAL ERRORS ---
    INVALID_RECORD_TYPE: 'INVALID_RECORD_TYPE',
    VALID_TAG_OUTSIDE_RECORD: 'VALID_TAG_OUTSIDE_RECORD',
    CONTENT_OUTSIDE_RECORD: 'CONTENT_OUTSIDE_RECORD',
    MISSING_ER_IMPLICIT_START: 'MISSING_ER_IMPLICIT_START',
    MISSING_ER_AT_EOF: 'MISSING_ER_AT_EOF',
    DUPLICATE_ER_TAG: 'DUPLICATE_ER_TAG',
    INVALID_DATE_FALLBACK: 'INVALID_DATE_FALLBACK',
    UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
    RECORD_EXCEEDS_MAX_LINES: 'RECORD_EXCEEDS_MAX_LINES',
    LINE_EXCEEDS_MAX_BUFFER_SIZE: 'LINE_EXCEEDS_MAX_BUFFER_SIZE',

    // --- FLATTENED TAG FORMATS ---
    INVALID_TAG_FORMAT_BASE: 'INVALID_TAG_FORMAT_BASE',
    INVALID_TAG_FORMAT_SEMANTIC: 'INVALID_TAG_FORMAT_SEMANTIC',
    INVALID_TAG_FORMAT_SKIPPED: 'INVALID_TAG_FORMAT_SKIPPED',
    TAG_LIKE_CONTINUATION_INDENTED: 'TAG_LIKE_CONTINUATION_INDENTED',

    // --- REFERENCE TYPE & DATE ERRORS ---
    INVALID_TY_VALUE: 'INVALID_TY_VALUE',
    MISSING_TY_TAG: 'MISSING_TY_TAG',
} as const;

/** Enumeration of standard RIS error codes. */
export const RIS_ERROR: typeof risErrorMap = Object.freeze(Object.assign(Object.create(null), risErrorMap));

// INTENTION: type-definition literal for `null`-prototype schema inference.
const errorMessageMap = {
    // --- CORE & STRUCTURAL ERRORS ---
    [RIS_ERROR.INVALID_RECORD_TYPE]:
        'Input to stringifier must be a strictly single, non-null, non-array object record.',
    [RIS_ERROR.VALID_TAG_OUTSIDE_RECORD]: 'Valid tag found outside of record.',
    [RIS_ERROR.CONTENT_OUTSIDE_RECORD]: 'Content found outside of record.',
    [RIS_ERROR.MISSING_ER_IMPLICIT_START]: 'Missing ER tag, starting new record implicitly.',
    [RIS_ERROR.MISSING_ER_AT_EOF]: 'Missing ER tag at end of input, flushing pending record.',
    [RIS_ERROR.DUPLICATE_ER_TAG]: 'ER tag found outside of record.',
    [RIS_ERROR.INVALID_DATE_FALLBACK]: 'Invalid or impossible date found, fallback to string.',
    [RIS_ERROR.UNSUPPORTED_FORMAT]: 'Unsupported file format or header detected.',
    [RIS_ERROR.RECORD_EXCEEDS_MAX_LINES]: 'Record exceeds maximum allowed lines limit without ER tag.',
    [RIS_ERROR.LINE_EXCEEDS_MAX_BUFFER_SIZE]: 'Line exceeds maximum buffer size (10 MiB) without line break.',

    // --- FLATTENED TAG FORMATS ---
    [RIS_ERROR.INVALID_TAG_FORMAT_BASE]: 'Invalid tag format. Tag must be exactly 2 (A-Z, 0-9) characters.',
    [RIS_ERROR.INVALID_TAG_FORMAT_SEMANTIC]:
        'Invalid tag format. Tag must be exactly 2 (A-Z, 0-9) characters. Using option fromSemantic:true; consider checking semantic tags or option customSemanticMap.',
    [RIS_ERROR.INVALID_TAG_FORMAT_SKIPPED]:
        'Invalid tag omitted due to option skipInvalidTags:true. Tag must be exactly 2 (A-Z, 0-9) characters.',
    [RIS_ERROR.TAG_LIKE_CONTINUATION_INDENTED]:
        'Embedded line starting like a tag header indented by one space to keep it inside the field on parse.',

    // --- REFERENCE TYPE & DATE ERRORS ---
    [RIS_ERROR.INVALID_TY_VALUE]:
        'Invalid TY value. Multiple or empty TY tag values found. Must be ONE (no array) non-empty string.',
    [RIS_ERROR.MISSING_TY_TAG]: 'Missing TY tag.',
} as const satisfies Record<(typeof RIS_ERROR)[keyof typeof RIS_ERROR], string>;

/** Canonical error message templates mapped by RIS error codes. */
export const ERROR_MESSAGES: typeof errorMessageMap = Object.freeze(
    Object.assign(Object.create(null), errorMessageMap),
);

// -------------------------------------------------------------------
// 2. Base & Subclassed Error Types
// -------------------------------------------------------------------

// INVARIANT: classes explicitly retained to derive error hierarchy from native Error.
/** Abstract base class for all RIS-related errors and diagnostic incidents. */
export abstract class RisBaseError extends Error {
    public abstract readonly severity: LogLevelValue;

    constructor(message: string) {
        super(message);
        // INTENTION: restore prototype chain across transpilation targets.
        Object.setPrototypeOf(this, new.target.prototype);

        const errorWithCapture = Error as {
            // biome-ignore lint/complexity/noBannedTypes: Node captureStackTrace accepts Function/constructor.
            captureStackTrace?: (targetObject: object, constructorOpt?: Function) => void;
        };

        if (typeof errorWithCapture.captureStackTrace === 'function') {
            errorWithCapture.captureStackTrace(this, new.target);
        }
    }
}

/** Represents a fatal or unrecoverable error during RIS parsing or stringification. */
export class RisError extends RisBaseError {
    public override readonly name = 'RisError';
    public override readonly severity = LOG_LEVEL.error;
}

/** Represents a non-fatal warning incident during RIS processing. */
export class RisWarning extends RisBaseError {
    public override readonly name = 'RisWarning';
    public override readonly severity = LOG_LEVEL.warn;
}

/** Represents an informational diagnostic message during RIS processing. */
export class RisInfo extends RisBaseError {
    public override readonly name = 'RisInfo';
    public override readonly severity = LOG_LEVEL.info;
}

// -------------------------------------------------------------------
// 3. Error Dispatcher
// -------------------------------------------------------------------

// INVARIANT: incident context passed as un-cloned live reference to avoid GC allocations in hot path.
/** Emits an error or diagnostic incident to configured error handler based on log level. */
export function emitError(opts: EmitErrorOptions, incident: RisErrorContext): void {
    if (!opts.onError || opts.logLevel === LOG_LEVEL.silent) {
        return;
    }

    if (incident.error.severity <= opts.logLevel) {
        opts.onError(incident);
    }
}
