// Copyright 2026 Martin Winkler

import { REGEX_TAG_FORMAT, repairTag } from '@smart-ris/core';
import type { ResolvedParseOptions } from '@smart-ris/parse';
import type { ParseInspectionReport } from './inspect-parse.types.js';
import { inspectSemanticAndClassification } from './inspectors/semantic.inspector.js';
import { inspectStringValue } from './inspectors/string.inspector.js';
import { type CastPlan, createCastPlan, inspectRecordCasting } from './inspectors/type-cast.inspector.js';

/** Cached casting plans per resolved options object (one plan per inspection run). */
const castPlanCache = new WeakMap<ResolvedParseOptions, CastPlan>();

/** Initializes an empty diagnostic report structure for accumulative parsing inspections. */
export function createInitialReport(): ParseInspectionReport {
    return {
        totalRecords: 0,
        totalAnomalies: 0,
        eol: { styles: [] },
        anomalies: [],
        tags: Object.create(null),
    };
}

/** Inspects a single parsed RIS record against all sub-inspector modules. */
export function inspectRecord(
    record: Record<string, unknown>,
    report: ParseInspectionReport,
    options: ResolvedParseOptions,
): void {
    for (const key in record) {
        // INTENTION: cached dictionary lookup.
        const value = record[key];

        // 1. lazy initialize tag statistics.
        // INTENTION: cached dictionary lookup.
        let stats = report.tags[key];
        if (!stats) {
            stats = {
                count: 0,
                emptyCount: 0,
                multilineCount: 0,
                whitespacePaddedCount: 0,
                isStandard: true,
            };

            inspectSemanticAndClassification(key, stats, options);
            // INTENTION: invalid tag anomalies are reported per occurrence from the parser diagnostic (with line number).
            if (!REGEX_TAG_FORMAT.test(key)) {
                stats.canBeRepaired = repairTag(key) !== null;
            }

            report.tags[key] = stats;
        }

        // 2. string quality metrics per raw entry.
        if (Array.isArray(value)) {
            if (value.length > 1) {
                stats.multipleOccurrencesCount = (stats.multipleOccurrencesCount ?? 0) + 1;
            }
            for (let i = 0; i < value.length; i++) {
                // INTENTION: type guard alias.
                const element: unknown = value[i];
                inspectStringValue(typeof element === 'string' ? element : null, stats);
            }
        } else {
            inspectStringValue(typeof value === 'string' ? value : null, stats);
        }
    }

    // 3. cast verdicts on the values the parse `typeCaster` would receive.
    let plan = castPlanCache.get(options);
    if (!plan) {
        plan = createCastPlan(options);
        castPlanCache.set(options, plan);
    }
    inspectRecordCasting(record, report, plan);
}
