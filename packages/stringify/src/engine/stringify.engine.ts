// Copyright 2026 Martin Winkler

import {
    DEFAULT_REFERENCE_TYPE,
    type EolType,
    ERROR_MESSAGES,
    emitError,
    executePipeline,
    type LogLevelValue,
    type Middleware,
    type OnErrorCallback,
    type RawArrayPipelineRecord,
    REGEX_SPLIT_LINES,
    REGEX_TAG_FORMAT,
    REGEX_TAG_LINE_STRICT,
    RIS_ERROR,
    RisError,
    type RisRecord,
    type RisStringifyValue,
    type RisTag,
    RisWarning,
    recordType,
    repairTag,
    type StringifyInput,
    type StringifyPipelineRecord,
    type StringifyRisRecord,
    safeStringify,
    TAG_SORT_ORDER_MAP,
} from '@smart-ris/core';

/** Options for configuring the low-level RIS stringify engine. */
export type StringifyEngineOptions = {
    /** Enables automatic normalization of malformed tag keys. */
    repairTags: boolean;
    /** Skips invalid tag keys instead of keeping them; both cases emit a RisWarning. */
    skipInvalidTags: boolean;
    /** Omits empty or whitespace-only tag entries from output. */
    skipEmptyTags: boolean;
    // INTENTION: using `fromSemantic` only for error reporting purpose.
    /** Indicates whether input originates from semantic property mapping. */
    fromSemantic: boolean;
    /** End-of-line delimiter pattern. */
    eol: EolType;
    /** Logging threshold severity level. */
    logLevel: LogLevelValue;
    /** Optional callback invoked on non-fatal warnings or serialization errors. */
    onError?: OnErrorCallback | undefined;
    /** Uppercase semantic keys (to RIS tags) that skip ingestion repair; set only with `fromSemantic`. */
    semanticMap?: Record<string, RisTag> | undefined;
    /** Readonly middleware execution pipeline stages. */
    middlewares: Middleware[];
};

/** Low-level RIS record serializer instance. */
export type StringifyEngine = {
    serializeRecord(input: StringifyInput): string;
};

const KNOWN_TY_SET: ReadonlySet<string> = new Set<string>(Object.values(recordType));

/** Creates a low-level RIS record serializer instance. */
export function createStringifyEngine(opts: StringifyEngineOptions): StringifyEngine {
    // INTENTION: hoisted configuration references.
    const repairTags = opts.repairTags;
    const skipInvalidTags = opts.skipInvalidTags;
    const skipEmptyTags = opts.skipEmptyTags;
    const fromSemantic = opts.fromSemantic;
    const eol = opts.eol;
    const logLevel = opts.logLevel;
    const onError = opts.onError;
    const middlewares = opts.middlewares;
    const semanticMap = opts.semanticMap;

    /** Serializes an individual JavaScript record into valid RIS-formatted text output. */
    function serializeRecord(input: StringifyInput): string {
        if (input === null || typeof input !== 'object' || Array.isArray(input)) {
            emitError(
                { onError, logLevel },
                {
                    error: new RisError(ERROR_MESSAGES.INVALID_RECORD_TYPE),
                    rawLine: safeStringify(input),
                    tag: null,
                },
            );
            // INTENTION: invalid input (no object as RIS record) -- will be skipped.
            return '';
        }

        // INTENTION: unbox RisBuilder via raw() if present.
        const unboxed: unknown = 'raw' in input && typeof input.raw === 'function' ? input.raw() : input;
        // a plain record's own `raw` method may return a non-record (e.g. a string); serialize the record itself then.
        // INTENTION: type guard alias.
        const inputRecord = isRecordObject(unboxed) ? unboxed : (input as StringifyRisRecord);

        // INTENTION: 1. ingestion: filter out prototypes, empty values (if `skipEmptyTags`), and map strictly to `Object.create(null)`.
        const cleanPayload: StringifyPipelineRecord = Object.create(null);

        // INTENTION: use `for..in` loop (raw input was cloned to `Object.create(null)`).
        for (const key in inputRecord) {
            if (!Object.hasOwn(inputRecord, key)) {
                continue;
            }

            // INTENTION: normalize input keys to uppercase during ingestion to enable fast exact matching in uppercase pipeline lookup tables (e.g. semanticUnmapper, tagMapper).
            let tagKey = key.trim().toUpperCase();
            // INTENTION: repairTags normalizes input object keys to valid 2-character RIS tags during ingestion.
            // known semantic keys stay intact for semanticUnmapper (e.g. 'm-f' would repair to 'MF').
            if (repairTags && semanticMap?.[tagKey] === undefined) {
                const repaired = repairTag(tagKey);
                if (repaired) {
                    tagKey = repaired;
                }
            }

            const rawValue = (inputRecord as Record<string, unknown>)[key];
            let processedValue: unknown = rawValue;
            let isEmpty = false;

            if (rawValue == null) {
                isEmpty = true;
                processedValue = null;
            } else if (typeof rawValue === 'string') {
                const trimmed = rawValue.trim();
                if (trimmed === '') {
                    isEmpty = true;
                    processedValue = null;
                } else {
                    processedValue = trimmed;
                }
            } else if (Array.isArray(rawValue)) {
                if (rawValue.length === 0) {
                    isEmpty = true;
                    processedValue = null;
                } else {
                    let requiresNewArray = false;

                    // a. fast path check (zero array allocation).
                    for (let i = 0; i < rawValue.length; i++) {
                        const v = rawValue[i];
                        if (v == null) {
                            requiresNewArray = true;
                            break;
                        }
                        if (typeof v === 'string') {
                            if (v === '' || v.trim() !== v) {
                                requiresNewArray = true;
                                break;
                            }
                        }
                    }

                    if (!requiresNewArray) {
                        // happy path.
                        processedValue = rawValue;
                    } else {
                        // b. slow path fallback.
                        // INTENTION: type-safe array allocation for unboxing and trimming elements.
                        const cleanArray: unknown[] = new Array(rawValue.length);
                        let allNull = true;
                        for (let i = 0; i < rawValue.length; i++) {
                            const v = rawValue[i];
                            if (v == null) {
                                cleanArray[i] = null;
                            } else if (typeof v === 'string') {
                                const trimmed = v.trim();
                                if (trimmed === '') {
                                    cleanArray[i] = null;
                                } else {
                                    cleanArray[i] = trimmed;
                                    allNull = false;
                                }
                            } else {
                                cleanArray[i] = v;
                                allNull = false;
                            }
                        }
                        if (allNull) {
                            isEmpty = true;
                            processedValue = null;
                        } else {
                            processedValue = cleanArray;
                        }
                    }
                }
            }

            if (isEmpty && skipEmptyTags) {
                // INTENTION: skip empty tags entirely (`skipEmptyTags = true`).
                continue;
            }

            // INTENTION: always concat colliding tag keys — `null` entries are handled downstream by `skipEmptyTags`.
            // INTENTION: cached dictionary lookup.
            const existing = cleanPayload[tagKey];
            if (existing !== undefined) {
                if (isEmpty) {
                    existing.push(null);
                } else if (Array.isArray(processedValue)) {
                    // INTENTION: type guard alias.
                    const arr = processedValue as RisStringifyValue[];
                    // INTENTION: for loop strictly faster and stack-safe compared to `push(...valToStore)`.
                    for (let i = 0; i < arr.length; i++) {
                        existing.push(arr[i]);
                    }
                } else {
                    existing.push(processedValue as RisStringifyValue);
                }
            } else {
                cleanPayload[tagKey] = isEmpty
                    ? [null]
                    : Array.isArray(processedValue)
                      ? processedValue === rawValue
                          ? (processedValue.slice() as RisStringifyValue[])
                          : (processedValue as RisStringifyValue[])
                      : [processedValue as RisStringifyValue];
            }
        }

        // INTENTION: check if any tags remaining.
        let hasCleanTags = false;
        for (const _ in cleanPayload) {
            hasCleanTags = true;
            break;
        }
        if (!hasCleanTags) {
            // INTENTION: early return if no tags remain after cleaning.
            return '';
        }

        // INTENTION: 2. middleware execution.
        const pipelineResult = executePipeline<StringifyPipelineRecord, RawArrayPipelineRecord>(
            cleanPayload,
            middlewares,
        );

        // INTENTION: 3. validation & grouping: verify remaining tags, repair tags, handle ER tag properly.
        const tagMap: RawArrayPipelineRecord = Object.create(null);

        for (const key in pipelineResult) {
            let tag = key;
            let isValidTag = REGEX_TAG_FORMAT.test(tag);

            const rawValue = pipelineResult[key];
            const values: (string | null)[] = Array.isArray(rawValue) ? rawValue : [rawValue as string | null];

            // INTENTION: try to repair invalid tags if repairTags is enabled.
            if (!isValidTag && repairTags) {
                const repaired = repairTag(tag);
                if (repaired) {
                    tag = repaired;
                    isValidTag = true;
                }
            }

            if (tag === 'ER') {
                let hasData = false;
                for (let i = 0; i < values.length; i++) {
                    const v = values[i];
                    if (v !== null && String(v).trim() !== '') {
                        hasData = true;
                        break;
                    }
                }
                if (hasData) {
                    const simulatedLine = safeStringify({ [key]: rawValue });
                    emitError(
                        { onError, logLevel },
                        {
                            error: new RisWarning('Data provided for ER tag is ignored'),
                            rawLine: simulatedLine,
                            tag: 'ER',
                            recordContext: inputRecord,
                        },
                    );
                }
                continue;
            }

            // INTENTION: skip invalid tags if `skipInvalidTags:true` else keep; both warn, since the option choice is intentional.
            if (!isValidTag) {
                const message = skipInvalidTags
                    ? ERROR_MESSAGES[RIS_ERROR.INVALID_TAG_FORMAT_SKIPPED]
                    : fromSemantic
                      ? ERROR_MESSAGES[RIS_ERROR.INVALID_TAG_FORMAT_SEMANTIC]
                      : ERROR_MESSAGES[RIS_ERROR.INVALID_TAG_FORMAT_BASE];

                const simulatedLine = safeStringify({ [key]: rawValue });
                emitError(
                    { onError, logLevel },
                    {
                        error: new RisWarning(message),
                        rawLine: simulatedLine,
                        tag: key,
                        recordContext: inputRecord,
                    },
                );

                if (skipInvalidTags) {
                    continue;
                }
            }

            // INTENTION: accumulate all values for duplicate/repaired/mapped tags instead of overwriting.
            // INTENTION: cached dictionary lookup.
            const existing = tagMap[tag];
            if (existing === undefined) {
                tagMap[tag] = values;
            } else {
                for (let i = 0; i < values.length; i++) {
                    existing.push(values[i]);
                }
            }
        }

        let hasTags = false;
        for (const _ in tagMap) {
            hasTags = true;
            break;
        }

        if (!hasTags) {
            return '';
        }

        return compileOutputString(tagMap, inputRecord);
    }

    /** Builds a tag line, normalizing embedded line breaks to the configured eol; embedded lines that start like a tag header are indented and warned. */
    function normalizeEmbeddedEol(tag: string, value: string, inputRecord: RisRecord | StringifyRisRecord): string {
        const line = `${tag}  - ${value}`;
        // fast path: single-line values skip split/join.
        if (line.indexOf('\n') === -1 && line.indexOf('\r') === -1) {
            return line;
        }
        const lines = line.split(REGEX_SPLIT_LINES);
        for (let i = 1; i < lines.length; i++) {
            // leading space keeps the line inside the field for strict parse.
            if (REGEX_TAG_LINE_STRICT.test(lines[i])) {
                emitError(
                    { onError, logLevel },
                    {
                        error: new RisWarning(ERROR_MESSAGES.TAG_LIKE_CONTINUATION_INDENTED),
                        rawLine: lines[i],
                        tag,
                        recordContext: inputRecord,
                    },
                );
                lines[i] = ` ${lines[i]}`;
            }
        }
        return lines.join(eol);
    }

    /** Assembles normalized tag buffers and values into structured lines terminated with an ER tag. */
    function compileOutputString(
        tagMap: Record<string, (string | null)[]>,
        inputRecord: RisRecord | StringifyRisRecord,
    ): string {
        const outputLines: string[] = [];

        // INTENTION: 1. extract and enforce TY tag FIRST.
        // INTENTION: cached dictionary lookup.
        const rawTyValues = tagMap.TY;
        // INTENTION: filter `null`/whitespace TY values; fallback empty or missing TY to DEFAULT_REFERENCE_TYPE even when `skipEmptyTags` is `false` to guarantee valid RIS format.
        const processedTyValues: string[] = [];
        if (rawTyValues !== undefined) {
            for (let i = 0; i < rawTyValues.length; i++) {
                const v = rawTyValues[i];
                if (v !== null && v.trim() !== '') {
                    processedTyValues.push(v);
                }
            }
        }

        let finalTY: string = DEFAULT_REFERENCE_TYPE;

        if (processedTyValues.length === 0) {
            emitError(
                { onError, logLevel },
                {
                    error: new RisWarning(ERROR_MESSAGES.MISSING_TY_TAG),
                    rawLine: 'TY  - ',
                    tag: 'TY',
                    recordContext: inputRecord,
                },
            );
        } else if (processedTyValues.length === 1) {
            // INTENTION: fast-path for standard single-TY records avoiding iteration overhead.
            finalTY = processedTyValues[0];
        } else {
            const simulatedLine = safeStringify({ TY: processedTyValues });
            emitError(
                { onError, logLevel },
                {
                    error: new RisWarning(ERROR_MESSAGES.INVALID_TY_VALUE),
                    rawLine: simulatedLine,
                    tag: 'TY',
                    recordContext: inputRecord,
                },
            );

            // INTENTION: kept as array by arrayCaster (TY/ER default added to arrayCaster in middleware instantiation).
            // INTENTION: find first known RIS reference type; falling back to first custom type; else (if `null`) DEFAULT_REFERENCE_TYPE.
            let match: string | undefined;
            for (let i = 0; i < processedTyValues.length; i++) {
                if (KNOWN_TY_SET.has(processedTyValues[i])) {
                    match = processedTyValues[i];
                    break;
                }
            }
            finalTY = match ?? processedTyValues[0];
        }

        outputLines.push(normalizeEmbeddedEol('TY', finalTY, inputRecord));

        // INTENTION: 2. sort and iterate all other tags deterministically based on tag order.
        const sortedTags: string[] = [];
        for (const t in tagMap) {
            if (t !== 'TY') {
                sortedTags.push(t);
            }
        }

        // INTENTION: 3. sort non-TY tags deterministically based on TAG_SORT_ORDER_MAP, falling back to alphabetical order for custom tags.
        sortedTags.sort(compareTags);

        for (let i = 0; i < sortedTags.length; i++) {
            const tag = sortedTags[i];
            // INTENTION: cached dictionary lookup.
            const values = tagMap[tag];
            if (values !== undefined) {
                for (let j = 0; j < values.length; j++) {
                    const val = values[j];
                    if (val === null) {
                        if (!skipEmptyTags) {
                            outputLines.push(`${tag}  - `);
                        }
                    } else {
                        outputLines.push(normalizeEmbeddedEol(tag, val, inputRecord));
                    }
                }
            }
        }

        outputLines.push(`ER  - `);
        // INTENTION: ensure final EOL.
        outputLines.push('');

        return outputLines.join(eol);
    }

    return {
        serializeRecord,
    };
}

// -------------------------------------------------------------------
// 2. Internal Helper Functions
// -------------------------------------------------------------------

/** Deterministically sorts non-TY tags based on TAG_SORT_ORDER_MAP, falling back to alphabetical order for custom tags. */
function compareTags(a: string, b: string): number {
    const indexA = TAG_SORT_ORDER_MAP.get(a) ?? Infinity;
    const indexB = TAG_SORT_ORDER_MAP.get(b) ?? Infinity;
    return indexA !== indexB ? indexA - indexB : a === b ? 0 : a < b ? -1 : 1;
}

/** Checks for a non-null, non-array object. */
function isRecordObject(value: unknown): value is StringifyRisRecord {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
