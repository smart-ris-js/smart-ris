// Copyright 2026 Martin Winkler

import type { EolType } from '@smart-ris/core';
import type { Equal, Expect, Extends } from '../../../../tests/types/type-utils.js';
import type {
    Anomaly,
    AnomalySeverity,
    DatePrecisionStats,
    EolReport,
    ParseInspectionReport,
    TagStats,
} from '../../src/inspect-parse.types.js';
import type { EolState } from '../../src/inspectors/eol.inspector.js';

// -------------------------------------------------------------------
// 1. Positive Cases: Inspection Report Structural Interfaces
// -------------------------------------------------------------------

// 1.1 DatePrecisionStats interface validation
export type Test_DatePrecisionStats_Shape = Expect<
    Equal<
        DatePrecisionStats,
        {
            fullDateCount: number;
            yearMonthCount: number;
            yearOnlyCount: number;
            monthOnlyCount: number;
        }
    >
>;

// 1.2 Anomaly interface validation and type discriminator union
export type Test_Anomaly_Type = Expect<Equal<Anomaly['type'], 'parse_diagnostic' | 'invalid_tag_format'>>;
export type Test_AnomalySeverity = Expect<Equal<Anomaly['severity'], AnomalySeverity>>;
export type Test_AnomalySeverity_Union = Expect<Equal<AnomalySeverity, 'error' | 'warn' | 'info'>>;

export type Test_Anomaly_Shape = Expect<
    Extends<
        {
            type: Anomaly['type'];
            severity: AnomalySeverity;
            message: string;
            rawLine?: string;
            rawTag?: string;
            isRepairable?: boolean;
        },
        Anomaly
    >
>;

// 1.3 TagStats interface validation
export type Test_TagStats_Shape = Expect<
    Extends<
        {
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
        },
        TagStats
    >
>;

// 1.4 EolReport and EolState shape validation
export type Test_EolReport_Shape = Expect<Equal<EolReport, { styles: EolType[] }>>;
export type Test_EolState_Shape = Expect<
    Equal<
        EolState,
        {
            hasCrlf: boolean;
            hasLf: boolean;
            hasCr: boolean;
            pendingCr: boolean;
        }
    >
>;

// 1.5 ParseInspectionReport root shape validation
export type Test_ParseInspectionReport_Shape = Expect<
    Equal<
        ParseInspectionReport,
        {
            totalRecords: number;
            totalAnomalies: number;
            eol: EolReport;
            anomalies: Anomaly[];
            tags: Record<string, TagStats>;
        }
    >
>;
