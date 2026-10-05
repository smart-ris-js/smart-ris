// Copyright 2026 Martin Winkler

import {
    DEFAULT_REFERENCE_TYPE,
    type EolType,
    ERROR_MESSAGES,
    emitError,
    executePipeline,
    LOG_LEVEL,
    type LogLevelValue,
    type Middleware,
    type OnErrorCallback,
    type ParseRisRecord,
    type RawArrayPipelineRecord,
    REGEX_TAG_FORMAT,
    RIS_ERROR,
    RisError,
    RisInfo,
    RisWarning,
    repairTag,
} from '@smart-ris/core';
import { MAX_RECORD_LINES } from '../parse.options.js';
import { extractStrictTagFromLine, extractTagFromLine } from './parse.tags.js';

/** Options for configuring the low-level RIS parse engine. */
export type ParseEngineOptions = {
    /** Enables automatic normalization of malformed tag keys. */
    repairTags: boolean;
    /** Skips invalid tag keys instead of keeping them; both cases emit a RisWarning. */
    skipInvalidTags: boolean;
    /** Omits empty or whitespace-only tag entries from output. */
    skipEmptyTags: boolean;
    /** End-of-line delimiter pattern. */
    eol: EolType;
    /** Logging threshold severity level. */
    logLevel: LogLevelValue;
    /** Optional callback invoked on non-fatal warnings or parsing errors. */
    onError?: OnErrorCallback | undefined;
    /** Readonly middleware execution pipeline stages. */
    middlewares: Middleware[];
};

/** Low-level line-by-line RIS parse engine instance. */
export type ParseEngine = {
    /** Ingests and processes a single line of RIS text. */
    processLine(line: string): ParseRisRecord | null;
    /** Flushes any buffered record at end of input. */
    flush(): ParseRisRecord | null;
    /** Indicates whether parsing was aborted due to critical error or limit. */
    get isAborted(): boolean;
};

/** Matches UTF-8 Byte Order Mark (BOM `\uFEFF`) at the beginning of an input string. */
const REGEX_BOM = /^\uFEFF/;

/** Matches Clarivate Analytics / ISI Export file format headers. */
const REGEX_CLARIVATE_HEADER = /^FN\s+(?:Clarivate Analytics|ISI Export)/i;

/** Creates a low-level line-by-line RIS parse engine instance. */
export function createParseEngine(opts: ParseEngineOptions): ParseEngine {
    // INTENTION: hoisted configuration references.
    const repairTags = opts.repairTags;
    const skipInvalidTags = opts.skipInvalidTags;
    const skipEmptyTags = opts.skipEmptyTags;
    const eol = opts.eol;
    const middlewares = opts.middlewares;
    const onError = opts.onError;
    const logLevel = opts.logLevel;

    const shouldCollectDetailedDiagnostics = logLevel >= LOG_LEVEL.info;

    let inRecord = false;
    let abortParsing = false;
    let isFirstLine = true;
    // format header check waits for the first non-blank line (leading blank lines must not bypass it).
    let isHeaderPending = true;
    let currentTag: string | null = null;
    // empty entry of `currentTag` dropped via `skipEmptyTags`; next non-empty continuation line opens a new entry.
    let isEmptyEntryPending = false;
    let lineNumber = 0;
    let recordLineCount = 0;
    let tagMap: Record<string, (string | null)[]> = Object.create(null);

    /** Appends a parsed tag-value pair to the current record buffer. */
    function pushTagVal(tag: string, val: string | null): void {
        // INTENTION: cached dictionary lookup.
        const existing = tagMap[tag];
        if (existing === undefined) {
            tagMap[tag] = [val];
        } else {
            existing.push(val);
        }
    }

    /** Ingests and processes a single line of RIS text through the parser state machine. */
    function processLine(rawLine: string): ParseRisRecord | null {
        // INTENTION: early return if parsing has been aborted.
        if (abortParsing) {
            return null;
        }

        let line = rawLine;
        lineNumber++;

        if (isFirstLine) {
            isFirstLine = false;
            // INTENTION: remove win BOM - first char.
            line = line.replace(REGEX_BOM, '');
        }

        if (isHeaderPending && line.trim() !== '') {
            isHeaderPending = false;

            if (REGEX_CLARIVATE_HEADER.test(line)) {
                emitError(
                    { onError, logLevel },
                    {
                        error: new RisError(ERROR_MESSAGES[RIS_ERROR.UNSUPPORTED_FORMAT]),
                        rawLine: line,
                        lineNumber,
                        tag: null,
                        recordContext: {},
                    },
                );
                // INTENTION: wrong format - will early return on every following line.
                abortParsing = true;
                return null;
            }
        }

        // INTENTION: guard against unbounded record size / runaway memory allocation.
        if (inRecord) {
            recordLineCount++;
            if (recordLineCount > MAX_RECORD_LINES) {
                emitError(
                    { onError, logLevel },
                    {
                        error: new RisError(ERROR_MESSAGES[RIS_ERROR.RECORD_EXCEEDS_MAX_LINES]),
                        rawLine: line,
                        lineNumber,
                        tag: currentTag,
                        recordContext: tagMap,
                    },
                );
                abortParsing = true;
                resetState();
                return null;
            }
        }

        // INTENTION: 2. OPTIMIZED HOT PATH: always try strict extraction first.
        let isStrict = true;
        let extracted = extractStrictTagFromLine(line);

        // INTENTION: 3. FALLBACK: if strict extraction fails and repairTags is enabled, try lax line extraction.
        if (!extracted && repairTags) {
            extracted = extractTagFromLine(line);
            isStrict = false; // Flag that we are now using mutated/lax data
        }

        // INTENTION: state machine line evaluation.
        if (extracted) {
            let tag = extracted.rawTag.toUpperCase();
            const rawVal = extracted.value.trim();

            let isValidTag = isStrict || REGEX_TAG_FORMAT.test(tag);
            if (!isValidTag && repairTags) {
                // INTENTION: strips all non-alphanumeric characters; returns repaired 2-character tag or `null`.
                const repaired = repairTag(tag);
                if (repaired) {
                    tag = repaired;
                    // INTENTION: tag has been repaired and is valid now.
                    isValidTag = true;
                    emitError(
                        { onError, logLevel },
                        {
                            error: new RisInfo('Tag key repaired'),
                            rawLine: line,
                            lineNumber,
                            tag: extracted.rawTag,
                            recordContext: tagMap,
                        },
                    );
                }
            } else if (isValidTag && !isStrict && shouldCollectDetailedDiagnostics) {
                if (extracted.rawTag !== tag) {
                    emitError(
                        { onError, logLevel },
                        {
                            error: new RisInfo('Lowercase tag normalized'),
                            rawLine: line,
                            lineNumber,
                            tag: extracted.rawTag,
                            recordContext: tagMap,
                        },
                    );
                } else {
                    emitError(
                        { onError, logLevel },
                        {
                            error: new RisInfo('Lax spacing normalized'),
                            rawLine: line,
                            lineNumber,
                            tag: extracted.rawTag,
                            recordContext: tagMap,
                        },
                    );
                }
            }

            if (inRecord) {
                if (isValidTag) {
                    switch (tag) {
                        case 'TY': {
                            // case: TY tag found without a preceding ER tag - this is an implicit start of a new record.
                            emitError(
                                { onError, logLevel },
                                {
                                    error: new RisWarning(ERROR_MESSAGES[RIS_ERROR.MISSING_ER_IMPLICIT_START]),
                                    rawLine: line,
                                    lineNumber,
                                    tag: 'TY',
                                    recordContext: tagMap,
                                },
                            );
                            const finishedRecord = getFinishedRecord();
                            // INTENTION: `getFinishedRecord()` resets to `inRecord = false`.
                            inRecord = true;
                            recordLineCount = 1;
                            currentTag = 'TY';

                            // INTENTION: if TY is empty, skip -- fallback will be applied in finalizeRecord().
                            if (rawVal !== '') {
                                pushTagVal('TY', rawVal);
                            }
                            return finishedRecord;
                        }
                        case 'ER':
                            // case: ER tag closes current record.
                            return getFinishedRecord();
                        default:
                            // case: valid tag inside record.
                            currentTag = tag;
                            isEmptyEntryPending = rawVal === '' && skipEmptyTags;

                            if (isEmptyEntryPending) {
                                return null;
                            }

                            pushTagVal(tag, rawVal === '' ? null : rawVal);

                            return null;
                    }
                }
                // case: invalid tag inside record.
                if (skipInvalidTags) {
                    // INTENTION: prevent subsequent continuation lines from appending to previous valid tag.
                    currentTag = null;
                    isEmptyEntryPending = false;
                    emitError(
                        { onError, logLevel },
                        {
                            error: new RisWarning(ERROR_MESSAGES[RIS_ERROR.INVALID_TAG_FORMAT_SKIPPED]),
                            rawLine: line,
                            lineNumber,
                            tag,
                            recordContext: tagMap,
                        },
                    );
                    return null;
                }
                // INTENTION: invalid tag retained due to `skipInvalidTags:false` - warn, since data is kept intentionally.
                emitError(
                    { onError, logLevel },
                    {
                        error: new RisWarning(ERROR_MESSAGES[RIS_ERROR.INVALID_TAG_FORMAT_BASE]),
                        rawLine: line,
                        lineNumber,
                        tag,
                        recordContext: tagMap,
                    },
                );
                currentTag = tag;
                isEmptyEntryPending = rawVal === '' && skipEmptyTags;

                if (isEmptyEntryPending) {
                    return null;
                }

                pushTagVal(tag, rawVal === '' ? null : rawVal);

                return null;
            }
            if (isValidTag) {
                switch (tag) {
                    case 'TY': {
                        // case: TY tag starting new record.
                        inRecord = true;
                        recordLineCount = 1;
                        currentTag = 'TY';

                        // INTENTION: if TY is empty, skip -- fallback will be applied in finalizeRecord().
                        if (rawVal !== '') {
                            pushTagVal('TY', rawVal);
                        }
                        break;
                    }
                    case 'ER':
                        // case: ER tag outside record - possibly duplicate ER tag.
                        emitError(
                            { onError, logLevel },
                            {
                                error: new RisWarning(ERROR_MESSAGES[RIS_ERROR.DUPLICATE_ER_TAG]),
                                rawLine: line,
                                lineNumber,
                                tag: 'ER',
                                recordContext: tagMap,
                            },
                        );
                        break;
                    default:
                        // case: valid tag outside record.
                        emitError(
                            { onError, logLevel },
                            {
                                error: new RisWarning(ERROR_MESSAGES[RIS_ERROR.VALID_TAG_OUTSIDE_RECORD]),
                                rawLine: line,
                                lineNumber,
                                tag,
                                recordContext: tagMap,
                            },
                        );
                        break;
                }
            } else {
                // case: any content (no valid tag) outside record.
                emitError(
                    { onError, logLevel },
                    {
                        error: new RisWarning(ERROR_MESSAGES[RIS_ERROR.CONTENT_OUTSIDE_RECORD]),
                        rawLine: line,
                        lineNumber,
                        tag,
                        recordContext: tagMap,
                    },
                );
            }
        } else if (inRecord) {
            // case: multiline continuation line.
            // INTENTION: handle continuation lines for tags that might have been dropped or are `null`.
            if (currentTag && isEmptyEntryPending) {
                // dropped empty entry: open a new entry instead of appending to the previous one.
                if (line.trim() !== '') {
                    pushTagVal(currentTag, line);
                    isEmptyEntryPending = false;
                }
            } else if (currentTag) {
                // INTENTION: cached dictionary lookup.
                const existing = tagMap[currentTag];
                if (!existing) {
                    // INTENTION: create tag array with continuation line if non-empty (when previous empty tag was skipped).
                    if (line.trim() !== '') {
                        pushTagVal(currentTag, line);
                    }
                } else if (existing[existing.length - 1] === null) {
                    // INTENTION: overwrite `null` with first non-empty continuation line.
                    if (line.trim() !== '') {
                        existing[existing.length - 1] = line;
                    }
                } else {
                    // INTENTION: append continuation line to the last entry.
                    existing[existing.length - 1] += eol + line;
                }
            }
        } else if (line.trim() !== '') {
            // case: non-empty content outside record.
            emitError(
                { onError, logLevel },
                {
                    error: new RisWarning(ERROR_MESSAGES[RIS_ERROR.CONTENT_OUTSIDE_RECORD]),
                    rawLine: line,
                    lineNumber,
                    tag: null,
                    recordContext: tagMap,
                },
            );
        }

        return null;
    }

    /** Flushes any remaining uncommitted record data at the end of the input stream. */
    function flush(): ParseRisRecord | null {
        // INTENTION: soft-reset engine state and abort status on flush to permit clean instance reuse.
        isFirstLine = true;
        isHeaderPending = true;
        abortParsing = false;

        if (!inRecord) {
            lineNumber = 0;
            resetState();
            return null;
        }

        lineNumber++;
        emitError(
            { onError, logLevel },
            {
                error: new RisWarning(ERROR_MESSAGES[RIS_ERROR.MISSING_ER_AT_EOF]),
                rawLine: 'EOF',
                lineNumber,
                tag: null,
                recordContext: tagMap,
            },
        );
        const finishedRecord = getFinishedRecord();
        lineNumber = 0;
        return finishedRecord;
    }

    /** Resets the parser state machine and clears internal record buffers. */
    function resetState() {
        inRecord = false;
        tagMap = Object.create(null);
        currentTag = null;
        isEmptyEntryPending = false;
        recordLineCount = 0;
    }

    /** Dispatches completed tag buffers through the middleware pipeline and resets the engine state. */
    function getFinishedRecord(): ParseRisRecord {
        const finishedRecord = finalizeRecord(middlewares, tagMap);
        resetState();
        return finishedRecord;
    }

    return {
        processLine,
        flush,
        get isAborted() {
            return abortParsing;
        },
    };
}

/** Finalizes a parsed RIS record by executing the middleware pipeline. */
function finalizeRecord(middlewares: Middleware[], tagMap: RawArrayPipelineRecord): ParseRisRecord {
    if (!tagMap.TY) {
        tagMap.TY = [DEFAULT_REFERENCE_TYPE];
    }

    // INTENTION: apply middleware pipeline.
    return executePipeline(tagMap, middlewares);
}
