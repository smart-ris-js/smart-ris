// Copyright 2026 Martin Winkler

import type {
    CastType,
    ContentRisTag,
    DateFormatType,
    LogLevelValue,
    MaybeArray,
    Middleware,
    OnErrorCallback,
    ParseRisRecord,
    RawPipelineRecord,
    RisParseValue,
    RisRawValue,
} from '@smart-ris/core';
import {
    createFallbackYearResolver,
    DATE_YEAR_FALLBACK_TAGS,
    DATE_YEAR_SUPPLIER_TAGS,
    ERROR_MESSAGES,
    emitError,
    formatRisDate,
    heuristicallyParseDateString,
    parseDecimalNumber,
    RisWarning,
} from '@smart-ris/core';

/** Configuration options for the parse type caster middleware. */
export type TypeCasterOptions = {
    /** Custom schema defining field-level cast targets. */
    smartCastSchema: Partial<Record<ContentRisTag, CastType>>;
    /** Target date formatting pattern. */
    dateFormat: DateFormatType;
    /** Logging threshold severity level. */
    logLevel: LogLevelValue;
    /** Optional callback invoked on non-fatal warnings or casting errors. */
    onError?: OnErrorCallback | undefined;
    /** Flag indicating whether semantic property mapping is active. */
    toSemantic: boolean;
    /** Map of raw RIS tags to semantic property names. */
    computedSemanticMap: Record<string, string>;
};

// INVARIANT: export for unit testing only.
/** @internal - for testing only. */
export function smartCast(
    val: string,
    castType: CastType,
    dateFormat: DateFormatType,
    onErrorFallback?: () => void,
    fallbackYearResolver?: () => string | null | undefined,
): string | number | boolean {
    if (castType === 'date') {
        const rawDate = heuristicallyParseDateString(val, fallbackYearResolver);

        // INTENTION: `heuristicallyParseDateString` intentionally returns partial RawDate without year for detailed `inspect-parse` reporting.
        if (rawDate?.year) {
            return formatRisDate(rawDate, dateFormat);
        }

        if (onErrorFallback) {
            onErrorFallback();
        }

        return val;
    }

    if (castType === 'number') {
        const num = parseDecimalNumber(val);
        return num === null ? val : num;
    }

    if (castType === 'boolean') {
        const trimmed = val.trim();
        if (trimmed === '') {
            return val;
        }
        const lower = trimmed.toLowerCase();
        if (lower === 'true') {
            return true;
        }
        if (lower === 'false') {
            return false;
        }
        return val;
    }

    return val;
}

/** Creates middleware casting parsed RIS string fields to configured types. */
export function createParseTypeCaster(options: TypeCasterOptions): Middleware<RawPipelineRecord, ParseRisRecord> {
    // INTENTION: create isolated copy of `smartCastSchema` to avoid mutating input options when registering semantic key variants.
    const mergedSmartCastSchema: Record<string, CastType> = Object.assign(Object.create(null), options.smartCastSchema);

    // INTENTION: hoisted configuration references.
    const dateFormat = options.dateFormat;
    const onError = options.onError;
    const logLevel = options.logLevel;
    const toSemantic = options.toSemantic;

    // INTENTION: create dynamic fallback tag set containing canonical RIS tags and resolved semantic keys.
    // `tagMapper` runs earlier: mapped values only exist under the target tag and use its cast/date role.
    const dynamicFallbackTagsSet = new Set<string>(DATE_YEAR_FALLBACK_TAGS);

    // INVARIANT: computedSemanticMap is strictly validated upstream in resolver; all entries are guaranteed non-empty strings.
    if (toSemantic) {
        for (const rawTag in options.computedSemanticMap) {
            // INTENTION: cached dictionary lookup.
            const semanticKey = options.computedSemanticMap[rawTag];
            // INTENTION: cached dictionary lookup.
            const cast = mergedSmartCastSchema[rawTag];
            // INTENTION: add castSchema for default-casing (from semanticMapper) AND uppercase (fallback for faulty stringify output).
            if (cast) {
                mergedSmartCastSchema[semanticKey] = cast;
                mergedSmartCastSchema[semanticKey.toUpperCase()] = cast;
            }
            if (dynamicFallbackTagsSet.has(rawTag)) {
                dynamicFallbackTagsSet.add(semanticKey);
                dynamicFallbackTagsSet.add(semanticKey.toUpperCase());
            }
        }
    }

    // INTENTION: resolve dynamic supplier tags in priority order preserving canonical and semantic keys.
    const dynamicSupplierTags: string[] = [];
    for (let i = 0; i < DATE_YEAR_SUPPLIER_TAGS.length; i++) {
        const rawSupplierTag = DATE_YEAR_SUPPLIER_TAGS[i];
        dynamicSupplierTags.push(rawSupplierTag);
        if (toSemantic) {
            const semanticKey = options.computedSemanticMap[rawSupplierTag];
            if (semanticKey) {
                dynamicSupplierTags.push(semanticKey);
                dynamicSupplierTags.push(semanticKey.toUpperCase());
            }
        }
    }

    function processValue(
        val: RisRawValue,
        tag: string,
        castType: CastType,
        payload: RawPipelineRecord,
        fallbackYearResolver?: () => string | null | undefined,
    ): RisParseValue {
        if (val === null || typeof val !== 'string') {
            return val;
        }
        if (castType !== 'date') {
            return smartCast(val, castType, dateFormat);
        }
        return smartCast(
            val,
            'date',
            dateFormat,
            () => {
                emitError(
                    { onError, logLevel },
                    {
                        error: new RisWarning(ERROR_MESSAGES.INVALID_DATE_FALLBACK),
                        rawLine: `${tag} - ${val}`,
                        tag,
                        recordContext: payload,
                    },
                );
            },
            fallbackYearResolver,
        );
    }

    return (payload: RawPipelineRecord): ParseRisRecord => {
        // INTENTION: type guard alias.
        const out = payload as unknown as Record<string, MaybeArray<RisParseValue>>;
        let getFallbackYear: ((currentTag: string) => string | null) | undefined;

        for (const tag in payload) {
            // INTENTION: cached dictionary lookup.
            const castType = mergedSmartCastSchema[tag];
            // INTENTION: fallback castType `string` - output from parse.engine is already string - skip.
            if (!castType) {
                continue;
            }

            // INTENTION: cached dictionary lookup.
            const value = payload[tag];
            // INTENTION: `undefined` omitted or converted to `null` in `parse.engine`.
            if (value === null) {
                continue;
            }

            const fallbackYearResolver =
                castType === 'date' && dynamicFallbackTagsSet.has(tag)
                    ? () => {
                          if (!getFallbackYear) {
                              getFallbackYear = createFallbackYearResolver(payload, dynamicSupplierTags);
                          }
                          return getFallbackYear(tag);
                      }
                    : undefined;

            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    // INTENTION: mutation of array elements in-place for pipeline efficiency.
                    (value as RisParseValue[])[i] = processValue(
                        value[i],
                        tag,
                        castType,
                        payload,
                        fallbackYearResolver,
                    );
                }
            } else {
                out[tag] = processValue(value as RisRawValue, tag, castType, payload, fallbackYearResolver);
            }
        }

        return out as unknown as ParseRisRecord;
    };
}
