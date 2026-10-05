// Copyright 2026 Martin Winkler

import type { EolType } from '@smart-ris/core';

/** Date precision distribution statistics. */
export type DatePrecisionStats = {
    fullDateCount: number;
    yearMonthCount: number;
    yearOnlyCount: number;
    monthOnlyCount: number;
};

/** Aggregate statistics and heuristics for an individual RIS tag. */
export type TagStats = {
    count: number;
    emptyCount: number;
    multilineCount: number;
    whitespacePaddedCount: number;
    isStandard: boolean;
    canBeRepaired?: boolean;
    isCustom?: boolean;
    isUnknown?: boolean;
    hasSemanticMapping?: boolean;
    multipleInternalSpacesCount?: number;
    excessiveLinebreaksCount?: number;
    multipleOccurrencesCount?: number;
    dateCastSuccessCount?: number;
    dateCastFailureCount?: number;
    datePrecision?: DatePrecisionStats;
    castSuccessCount?: number;
    castFailureCount?: number;
};

/** Anomaly severity; mirrors the parser incident class (`RisError`, `RisWarning`, `RisInfo`). */
export type AnomalySeverity = 'error' | 'warn' | 'info';

/** Diagnostic anomaly detected during parsing inspection. */
export type Anomaly = {
    type: 'parse_diagnostic' | 'invalid_tag_format';
    severity: AnomalySeverity;
    message: string;
    rawLine?: string | undefined;
    rawTag?: string | undefined;
    lineNumber?: number | undefined;
    isRepairable?: boolean | undefined;
};

/** Line ending inspection summary. */
export type EolReport = {
    styles: EolType[];
};

/** Complete inspection report for parsed RIS input. */
export type ParseInspectionReport = {
    totalRecords: number;
    totalAnomalies: number;
    eol: EolReport;
    anomalies: Anomaly[];
    tags: Record<string, TagStats>;
};
