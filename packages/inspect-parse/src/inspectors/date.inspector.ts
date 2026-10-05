// Copyright 2026 Martin Winkler

import { heuristicallyParseDateString } from '@smart-ris/core';
import type { TagStats } from '../inspect-parse.types.js';

/** Inspects tag values against the date heuristic parser and collects precision statistics. */
export function inspectDateValue(
    val: string,
    stats: TagStats,
    fallbackYearResolver?: () => string | null | undefined,
): boolean {
    const parsedDate = heuristicallyParseDateString(val, fallbackYearResolver);

    if (parsedDate === null) {
        stats.dateCastFailureCount = (stats.dateCastFailureCount ?? 0) + 1;
        return false;
    }

    if (!stats.datePrecision) {
        stats.datePrecision = {
            fullDateCount: 0,
            yearMonthCount: 0,
            yearOnlyCount: 0,
            monthOnlyCount: 0,
        };
    }

    // INTENTION: cached dictionary lookup.
    const precision = stats.datePrecision;

    if (!parsedDate.year) {
        if (parsedDate.month) {
            precision.monthOnlyCount++;
        }
        // INVARIANT: parse `smartCast` refuses year-less dates and falls back to the raw string.
        stats.dateCastFailureCount = (stats.dateCastFailureCount ?? 0) + 1;
        return false;
    }

    if (parsedDate.month) {
        if (parsedDate.day) {
            precision.fullDateCount++;
        } else {
            precision.yearMonthCount++;
        }
    } else {
        precision.yearOnlyCount++;
    }

    stats.dateCastSuccessCount = (stats.dateCastSuccessCount ?? 0) + 1;
    return true;
}
