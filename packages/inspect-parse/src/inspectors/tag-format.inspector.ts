// Copyright 2026 Martin Winkler

import { REGEX_TAG_FORMAT, repairTag } from '@smart-ris/core';
import type { Anomaly, AnomalySeverity, ParseInspectionReport } from '../inspect-parse.types.js';

/** Validates tag key format and tests whether malformed keys can be repaired via `repairTag()`. */
export function inspectTagKeyFormat(
    key: string,
    report: ParseInspectionReport,
    severity: AnomalySeverity,
    rawLine?: string,
    lineNumber?: number,
): void {
    if (REGEX_TAG_FORMAT.test(key)) {
        return;
    }

    const repaired = repairTag(key);
    const canBeRepaired = repaired !== null;

    const anomaly: Anomaly = {
        type: 'invalid_tag_format',
        severity,
        message: `Invalid tag format detected: '${key}'${canBeRepaired ? ` (can be repaired to '${repaired}')` : ''}`,
        rawTag: key,
    };
    if (rawLine !== undefined) {
        anomaly.rawLine = rawLine;
    }
    if (lineNumber !== undefined) {
        anomaly.lineNumber = lineNumber;
    }
    anomaly.isRepairable = canBeRepaired;

    report.anomalies.push(anomaly);
    report.totalAnomalies++;
}
