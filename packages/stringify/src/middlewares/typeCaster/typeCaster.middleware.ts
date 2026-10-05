// Copyright 2026 Martin Winkler

import type {
    CastType,
    ContentRisTag,
    DateFormatType,
    LogLevelValue,
    Middleware,
    OnErrorCallback,
    RawArrayPipelineRecord,
    RawDate,
    RisRawValue,
    RisStringifyValue,
    StringifyPipelineRecord,
} from '@smart-ris/core';
import {
    createFallbackYearResolver,
    DATE_YEAR_FALLBACK_TAGS,
    DATE_YEAR_SUPPLIER_TAGS,
    ERROR_MESSAGES,
    emitError,
    formatRawDateUnchecked,
    formatRisDate,
    heuristicallyParseDateString,
    isDate,
    RisError,
    RisWarning,
    safeStringify,
} from '@smart-ris/core';

/** Configuration options for the stringify type caster middleware. */
export type TypeCasterOptions = {
    /** Enables automatic date and primitive type formatting. */
    useSmartTypes: boolean;
    /** Custom schema defining field-level cast targets. */
    smartCastSchema: Partial<Record<ContentRisTag, CastType>>;
    /** Target date formatting pattern. */
    dateFormat: DateFormatType;
    /** Logging threshold severity level. */
    logLevel: LogLevelValue;
    /** Optional callback invoked on non-fatal warnings or casting errors. */
    onError?: OnErrorCallback | undefined;
};

/** Creates middleware casting and formatting structural values into RIS-compliant strings. */
export function createStringifyTypeCaster(
    options: TypeCasterOptions,
): Middleware<StringifyPipelineRecord, RawArrayPipelineRecord> {
    // INTENTION: hoisted configuration references.
    const useSmartTypes = options.useSmartTypes;
    const smartCastSchema = options.smartCastSchema;
    const dateFormat = options.dateFormat;
    const onError = options.onError;
    const logLevel = options.logLevel;

    /** Transforms typed native values (Dates, booleans, numbers) into standardized RIS string representations. */
    function processItem(
        rawItem: RisStringifyValue,
        tag: string,
        payload: StringifyPipelineRecord,
        fallbackYearResolver?: () => string | null | undefined,
    ): RisRawValue {
        if (rawItem === null) {
            return null;
        }

        let item: string;

        if (typeof rawItem === 'string') {
            item = rawItem;
        } else if (isDate(rawItem)) {
            // `''` for invalid dates or years outside `0000-9999`.
            const formatted = formatRisDate(rawItem, dateFormat);
            if (!formatted) {
                emitError(
                    { onError, logLevel },
                    {
                        error: new RisWarning(ERROR_MESSAGES.INVALID_DATE_FALLBACK),
                        rawLine: `${tag} - ${String(rawItem)}`,
                        tag,
                        recordContext: payload,
                    },
                );
                // INTENTION: return to prevent smartType casting.
                return null;
            }
            // INTENTION: return to prevent smartType casting.
            return formatted;
        } else if (typeof rawItem === 'object') {
            if ('year' in rawItem || 'month' in rawItem || 'day' in rawItem) {
                const rawDate = rawItem as RawDate;
                // `''` for impossible or malformed dates (e.g. month `13`, February `30`, year `abc`).
                let formatted = '';
                let fallbackYear: string | null | undefined;
                if (rawDate.year) {
                    formatted = formatRisDate(rawDate, dateFormat);
                } else if (rawDate.month != null && String(rawDate.month) !== '') {
                    fallbackYear = fallbackYearResolver?.();
                    if (fallbackYear) {
                        formatted = formatRisDate({ ...rawDate, year: fallbackYear }, dateFormat);
                    }
                }
                if (formatted) {
                    // INTENTION: return to prevent smartType casting.
                    return formatted;
                }
                // impossible or partial dates are written unvalidated instead of dropped.
                const unchecked = formatRawDateUnchecked(
                    fallbackYear ? { ...rawDate, year: fallbackYear } : rawDate,
                    dateFormat,
                );
                emitError(
                    { onError, logLevel },
                    {
                        error: new RisWarning(ERROR_MESSAGES.INVALID_DATE_FALLBACK),
                        rawLine: `${tag} - ${safeStringify(rawItem)}`,
                        tag,
                        recordContext: payload,
                    },
                );
                // INTENTION: return to prevent smartType casting.
                return unchecked || null;
            }
            emitError(
                { onError, logLevel },
                {
                    error: new RisError('Unsupported object type passed as value'),
                    rawLine: `${tag} - ${safeStringify(rawItem)}`,
                    tag,
                    recordContext: payload,
                },
            );
            // INTENTION: return to prevent smartType casting.
            return null;
        } else if (typeof rawItem === 'function' || typeof rawItem === 'symbol') {
            // untyped callers only; rejected like unsupported objects instead of serializing source code.
            emitError(
                { onError, logLevel },
                {
                    error: new RisError('Unsupported value type passed as value'),
                    rawLine: `${tag} - ${String(rawItem)}`,
                    tag,
                    recordContext: payload,
                },
            );
            return null;
        } else {
            // INTENTION: convert number/boolean to string.
            item = String(rawItem);
        }

        if (useSmartTypes) {
            if (smartCastSchema[tag as ContentRisTag] === 'date') {
                const parsedDate = heuristicallyParseDateString(item, fallbackYearResolver);
                if (parsedDate?.year) {
                    item = formatRisDate(parsedDate, dateFormat);
                } else {
                    emitError(
                        { onError, logLevel },
                        {
                            error: new RisWarning(ERROR_MESSAGES.INVALID_DATE_FALLBACK),
                            rawLine: `${tag} - ${item}`,
                            tag,
                            recordContext: payload,
                        },
                    );
                }
            }
        }

        return item;
    }

    return (payload: StringifyPipelineRecord): RawArrayPipelineRecord => {
        // INTENTION: type guard alias.
        // INTENTION: in-place mutation of pipeline record for runtime performance and zero GC allocation.
        const out: RawArrayPipelineRecord = payload as RawArrayPipelineRecord;
        let getFallbackYear: ((currentTag: string) => string | null) | undefined;

        for (const tag in payload) {
            // INTENTION: cached dictionary lookup.
            const value = payload[tag];
            if (value === null) {
                continue;
            }

            const fallbackYearResolver = DATE_YEAR_FALLBACK_TAGS.has(tag)
                ? () => {
                      if (!getFallbackYear) {
                          getFallbackYear = createFallbackYearResolver(payload, DATE_YEAR_SUPPLIER_TAGS);
                      }
                      return getFallbackYear(tag);
                  }
                : undefined;

            for (let i = 0; i < value.length; i++) {
                // INTENTION: mutation of array elements in-place for pipeline efficiency.
                (value as RisRawValue[])[i] = processItem(value[i], tag, payload, fallbackYearResolver);
            }
        }

        return out;
    };
}
