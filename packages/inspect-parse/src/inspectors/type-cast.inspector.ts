// Copyright 2026 Martin Winkler

import {
    type ActiveArrayMergeStrategy,
    type CastType,
    createFallbackYearResolver,
    createStringSanitizer,
    DATE_YEAR_FALLBACK_TAGS,
    DATE_YEAR_SUPPLIER_TAGS,
    type EolType,
    type Middleware,
    parseDecimalNumber,
    type RawPipelineRecord,
} from '@smart-ris/core';
import type { ResolvedParseOptions } from '@smart-ris/parse';
import type { ParseInspectionReport, TagStats } from '../inspect-parse.types.js';
import { inspectDateValue } from './date.inspector.js';

/** Resolved casting configuration mirroring the parse middleware pipeline (`tagMapper` -> `arrayCaster` -> `stringSanitizer` -> `typeCaster`). */
export type CastPlan = {
    /** Cast schema keyed by (mapped) target tag; source tags of `tagMapping` never inherit into targets. */
    castSchema: Record<string, CastType>;
    /** Tags inheriting a fallback year for year-less dates. */
    fallbackTags: ReadonlySet<string>;
    /** Tags supplying the fallback year in priority order. */
    supplierTags: readonly string[];
    /** Tags kept as arrays by `arrayCaster`. */
    arrayTags: ReadonlySet<string>;
    /** Resolved tag mapping (source -> target). */
    tagMapping: Record<string, string>;
    /** Merge strategy for repeated scalar tags. */
    arrayMergeStrategy: ActiveArrayMergeStrategy | false;
    /** Line ending used by `join-newline` merges and multiline reconstruction. */
    eol: EolType;
    /** String sanitizer applied by the parser before casting, if enabled. */
    sanitizer?: Middleware<RawPipelineRecord, RawPipelineRecord> | undefined;
};

/** Single tag value tracked back to the raw record key it originates from. */
type CastEntry = {
    key: string;
    value: string | null;
};

/** Creates the casting plan for the given parse options. */
export function createCastPlan(options: ResolvedParseOptions): CastPlan {
    // like the parse `typeCaster`: mapped values only exist under the target tag and use its cast/date role.
    return {
        castSchema: options.smartCastSchema,
        fallbackTags: DATE_YEAR_FALLBACK_TAGS,
        supplierTags: DATE_YEAR_SUPPLIER_TAGS,
        arrayTags: new Set<string>(options.customArrayTags),
        tagMapping: options.tagMapping as Record<string, string>,
        arrayMergeStrategy: options.arrayMergeStrategy,
        eol: options.eol,
        sanitizer:
            options.cleanWhitespace || options.mergeMultiline
                ? createStringSanitizer({
                      cleanWhitespace: options.cleanWhitespace,
                      mergeMultiline: options.mergeMultiline,
                      eol: options.eol,
                  })
                : undefined,
    };
}

/** Inspects a value against its cast type and records casting success and failure counts. */
export function inspectTypeCasting(
    val: string,
    castType: CastType,
    stats: TagStats,
    fallbackYearResolver?: () => string | null | undefined,
): void {
    let isSuccess: boolean;

    switch (castType) {
        case 'date':
            isSuccess = inspectDateValue(val, stats, fallbackYearResolver);
            break;
        case 'number':
            if (val.trim() === '') {
                return;
            }
            isSuccess = parseDecimalNumber(val) !== null;
            break;
        case 'boolean': {
            if (val.trim() === '') {
                return;
            }
            // INTENTION: trim like number/date casts - mirrors parse `smartCast`.
            const lower = val.trim().toLowerCase();
            isSuccess = lower === 'true' || lower === 'false';
            break;
        }
        default:
            isSuccess = true;
    }

    if (isSuccess) {
        stats.castSuccessCount = (stats.castSuccessCount ?? 0) + 1;
    } else {
        stats.castFailureCount = (stats.castFailureCount ?? 0) + 1;
    }
}

/** Inspects casting of a raw record exactly as the parse pipeline would cast it. */
export function inspectRecordCasting(
    record: Record<string, unknown>,
    report: ParseInspectionReport,
    plan: CastPlan,
): void {
    const groups = remapEntries(record, plan.tagMapping);
    // INTENTION: pipeline payload as seen by the parse `typeCaster` for fallback year resolution.
    const payload: Record<string, unknown> = Object.create(null);

    for (const tag in groups) {
        let entries = groups[tag];
        const keepArray = plan.arrayMergeStrategy === false || plan.arrayTags.has(tag);
        if (!keepArray) {
            entries = [mergeEntries(entries, plan.arrayMergeStrategy as ActiveArrayMergeStrategy, plan.eol)];
            groups[tag] = entries;
        }
        if (plan.sanitizer) {
            for (let i = 0; i < entries.length; i++) {
                // INTENTION: type guard alias.
                const value = entries[i].value;
                if (value !== null) {
                    entries[i].value = plan.sanitizer({ value }).value as string;
                }
            }
        }
        payload[tag] = keepArray ? entries.map((entry) => entry.value) : entries[0].value;
    }

    let getFallbackYear: ((currentTag: string) => string | null) | undefined;

    for (const tag in groups) {
        // INTENTION: cached dictionary lookup.
        const castType = plan.castSchema[tag];
        if (!castType) {
            continue;
        }

        const fallbackYearResolver =
            castType === 'date' && plan.fallbackTags.has(tag)
                ? () => {
                      if (!getFallbackYear) {
                          getFallbackYear = createFallbackYearResolver(payload, plan.supplierTags);
                      }
                      return getFallbackYear(tag);
                  }
                : undefined;

        // INTENTION: cached dictionary lookup.
        const entries = groups[tag];
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const stats = report.tags[entry.key];
            if (entry.value !== null && stats) {
                inspectTypeCasting(entry.value, castType, stats, fallbackYearResolver);
            }
        }
    }
}

// -------------------------------------------------------------------
// 1. Internal Helper Functions
// -------------------------------------------------------------------

/** Converts a raw record value into entries tracked back to their raw key. */
function toEntries(key: string, value: unknown): CastEntry[] {
    const values = Array.isArray(value) ? value : [value];
    const entries: CastEntry[] = new Array(values.length);
    for (let i = 0; i < values.length; i++) {
        entries[i] = { key, value: typeof values[i] === 'string' ? values[i] : null };
    }
    return entries;
}

/** Remaps record keys with value provenance; mirrors `remapRecordKeys` target precedence and merge order. */
function remapEntries(
    record: Record<string, unknown>,
    tagMapping: Record<string, string>,
): Record<string, CastEntry[]> {
    const out: Record<string, CastEntry[]> = Object.create(null);

    for (const sourceKey in record) {
        const targetTag = tagMapping[sourceKey] ?? sourceKey;
        let existing = out[targetTag];

        if (targetTag === sourceKey) {
            if (existing === undefined) {
                out[targetTag] = toEntries(sourceKey, record[sourceKey]);
            }
            continue;
        }

        if (existing === undefined) {
            // INTENTION: cached dictionary lookup.
            const targetMapping = tagMapping[targetTag];
            const primaryTargetVal =
                (targetMapping !== undefined && targetMapping !== targetTag) || !Object.hasOwn(record, targetTag)
                    ? undefined
                    : record[targetTag];
            if (primaryTargetVal === undefined) {
                out[targetTag] = toEntries(sourceKey, record[sourceKey]);
                continue;
            }
            existing = toEntries(targetTag, primaryTargetVal);
            out[targetTag] = existing;
        }

        const sourceEntries = toEntries(sourceKey, record[sourceKey]);
        for (let i = 0; i < sourceEntries.length; i++) {
            existing.push(sourceEntries[i]);
        }
    }

    return out;
}

/** Merges entries of a scalar tag; mirrors `arrayCaster` merge strategies and attributes the result to its first contributor. */
function mergeEntries(entries: CastEntry[], strategy: ActiveArrayMergeStrategy, eol: EolType): CastEntry {
    if (entries.length === 1) {
        return entries[0];
    }

    if (strategy === 'first' || strategy === 'last') {
        const step = strategy === 'first' ? 1 : -1;
        for (let i = strategy === 'first' ? 0 : entries.length - 1; i >= 0 && i < entries.length; i += step) {
            if (entries[i].value !== null) {
                return entries[i];
            }
        }
        return { key: entries[0].key, value: null };
    }

    const valid: CastEntry[] = [];
    for (let i = 0; i < entries.length; i++) {
        if (entries[i].value !== null) {
            valid.push(entries[i]);
        }
    }
    if (valid.length === 0) {
        return { key: entries[0].key, value: null };
    }
    if (valid.length === 1) {
        return valid[0];
    }

    const separator = strategy === 'join-newline' ? eol : ' ';
    return { key: valid[0].key, value: valid.map((entry) => entry.value).join(separator) };
}
