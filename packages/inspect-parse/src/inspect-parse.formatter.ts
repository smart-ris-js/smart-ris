// Copyright 2026 Martin Winkler

import { repairTag } from '@smart-ris/core';
import type { AnomalySeverity, DatePrecisionStats, ParseInspectionReport, TagStats } from './inspect-parse.types.js';

/** Render order: lowest severity first, errors last. */
const SEVERITY_ORDER: readonly AnomalySeverity[] = ['info', 'warn', 'error'];
const SEVERITY_RANK: Readonly<Record<AnomalySeverity, number>> = { info: 0, warn: 1, error: 2 };
const SEVERITY_BLOB: Readonly<Record<AnomalySeverity, string>> = { info: '🔵', warn: '🟡', error: '🔴' };
const RULE = '---------------------------';
/** Maximum listed items (tag keys, line numbers, findings) before `+N more`. */
const LIST_LIMIT = 5;
const SAMPLE_LENGTH = 60;
const BAR_WIDTH = 20;
const LABEL_WIDTH = 16;

/** Anomalies sharing severity and label. */
type AnomalyGroup = {
    severity: AnomalySeverity;
    label: string;
    count: number;
    /** Occurrences per raw tag key; filled for `invalid_tag_format` only. */
    tags: Map<string, number>;
};

/** Occurrences of one unrepairable tag key. */
type InvalidTagCase = {
    count: number;
    lines: number[];
    sample: string | undefined;
};

/** Cast verdict of one tag; date counters take precedence over type counters. */
type CastVerdict = {
    kind: 'date' | 'type';
    success: number;
    failure: number;
};

type QualityCounts = Pick<
    TagStats,
    | 'emptyCount'
    | 'multilineCount'
    | 'whitespacePaddedCount'
    | 'multipleInternalSpacesCount'
    | 'excessiveLinebreaksCount'
    | 'multipleOccurrencesCount'
>;

function limitList(items: readonly string[]): string {
    if (items.length <= LIST_LIMIT) {
        return items.join(', ');
    }
    return `${items.slice(0, LIST_LIMIT).join(', ')} (+${items.length - LIST_LIMIT} more)`;
}

function sampleLine(rawLine: string): string {
    return `\n     "${rawLine.length > SAMPLE_LENGTH ? `${rawLine.slice(0, SAMPLE_LENGTH)}…` : rawLine}"`;
}

function labeled(label: string, value: string): string {
    return `${label.padEnd(LABEL_WIDTH)}${value}\n`;
}

function escapeEol(style: string): string {
    return style.replace('\r', '\\r').replace('\n', '\\n');
}

/** Success rate bar; full and percentage only when every value succeeded. */
function rateBar(success: number, total: number): string {
    const isComplete = success === total;
    const filled = isComplete ? BAR_WIDTH : Math.min(BAR_WIDTH - 1, Math.round((success / total) * BAR_WIDTH));
    const percent = isComplete ? 100 : Math.min(99, Math.floor((success / total) * 100));
    const blob = isComplete ? '🟢' : percent >= 80 ? '🟡' : '🔴';
    return `${blob} ${'█'.repeat(filled)}${'░'.repeat(BAR_WIDTH - filled)} ${String(percent).padStart(3)}%  ${success}/${total}`;
}

function getCastVerdict(stats: TagStats): CastVerdict | undefined {
    // counters are created lazily on first success/failure; a missing one means 0.
    if (stats.dateCastSuccessCount !== undefined || stats.dateCastFailureCount !== undefined) {
        return { kind: 'date', success: stats.dateCastSuccessCount ?? 0, failure: stats.dateCastFailureCount ?? 0 };
    }
    if (stats.castSuccessCount !== undefined || stats.castFailureCount !== undefined) {
        return { kind: 'type', success: stats.castSuccessCount ?? 0, failure: stats.castFailureCount ?? 0 };
    }
    return undefined;
}

function getTagClass(stats: TagStats): string {
    if (stats.isStandard) {
        return 'standard';
    }
    return stats.isCustom ? 'custom' : 'unknown';
}

function qualityParts(counts: QualityCounts): string[] {
    const parts: string[] = [];
    if (counts.emptyCount) {
        parts.push(`${counts.emptyCount} empty`);
    }
    if (counts.multilineCount) {
        parts.push(`${counts.multilineCount} multiline`);
    }
    if (counts.whitespacePaddedCount) {
        parts.push(`${counts.whitespacePaddedCount} padded`);
    }
    // INTENTION: zero-valued optional counters are omitted; only present-and-non-zero metrics are rendered.
    if (counts.multipleInternalSpacesCount) {
        parts.push(`${counts.multipleInternalSpacesCount} multi-space`);
    }
    if (counts.excessiveLinebreaksCount) {
        parts.push(`${counts.excessiveLinebreaksCount} excess linebreaks`);
    }
    if (counts.multipleOccurrencesCount) {
        parts.push(`${counts.multipleOccurrencesCount} repeated`);
    }
    return parts;
}

function precisionParts(precision: DatePrecisionStats): string[] {
    const parts: string[] = [];
    if (precision.fullDateCount) {
        parts.push(`${precision.fullDateCount} full`);
    }
    if (precision.yearMonthCount) {
        parts.push(`${precision.yearMonthCount} year-month`);
    }
    if (precision.yearOnlyCount) {
        parts.push(`${precision.yearOnlyCount} year only`);
    }
    if (precision.monthOnlyCount) {
        parts.push(`${precision.monthOnlyCount} month only`);
    }
    return parts;
}

function groupAnomalies(report: ParseInspectionReport): AnomalyGroup[] {
    const groups = new Map<string, AnomalyGroup>();
    for (let i = 0; i < report.anomalies.length; i++) {
        const anomaly = report.anomalies[i];
        const isInvalidTag = anomaly.type === 'invalid_tag_format';
        const label = isInvalidTag
            ? `Invalid tag keys, ${anomaly.isRepairable ? 'repairable' : 'not repairable'}`
            : anomaly.message;
        const id = `${anomaly.severity}\n${label}`;
        let group = groups.get(id);
        if (!group) {
            group = { severity: anomaly.severity, label, count: 0, tags: new Map() };
            groups.set(id, group);
        }
        group.count++;
        if (isInvalidTag && anomaly.rawTag !== undefined) {
            group.tags.set(anomaly.rawTag, (group.tags.get(anomaly.rawTag) ?? 0) + 1);
        }
    }
    return [...groups.values()].sort(
        (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.count - a.count,
    );
}

function formatAnomalyGroups(groups: readonly AnomalyGroup[]): string {
    const countWidth = String(Math.max(...groups.map((group) => group.count))).length;
    let output = '';
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        output += `${SEVERITY_BLOB[group.severity]} ${group.severity.padEnd(5)}  ${String(group.count).padStart(countWidth)}  ${group.label}`;
        if (group.tags.size > 0) {
            const keys = [...group.tags]
                .sort((a, b) => b[1] - a[1])
                .map(([key, count]) => {
                    const repaired = repairTag(key);
                    return `${repaired === null ? key : `${key}→${repaired}`} ×${count}`;
                });
            output += `: ${limitList(keys)}`;
        }
        output += '\n';
    }
    return output;
}

function formatTags(report: ParseInspectionReport, keys: readonly string[]): string {
    const keyWidth = Math.max(...keys.map((key) => key.length));
    const countWidth = String(Math.max(...keys.map((key) => report.tags[key].count))).length;
    let output = '';
    for (let i = 0; i < keys.length; i++) {
        // INTENTION: cached dictionary lookup.
        const stats = report.tags[keys[i]];
        const parts = qualityParts(stats);
        const verdict = getCastVerdict(stats);
        if (verdict) {
            parts.push(`${verdict.kind} cast ${verdict.success}/${verdict.success + verdict.failure}`);
        }
        if (stats.datePrecision) {
            parts.push(...precisionParts(stats.datePrecision));
        }
        output += `${keys[i].padEnd(keyWidth)}  ${getTagClass(stats).padEnd(8)}  ${String(stats.count).padStart(countWidth)}`;
        output += parts.length > 0 ? `  ${parts.join(' · ')}\n` : '\n';
    }
    return output;
}

/** Cases worth checking in the source: parser aborts, unrepairable tag keys, cast failures, no records. */
function collectFindings(report: ParseInspectionReport, keys: readonly string[]): string[] {
    const findings: string[] = [];
    const invalidTags = new Map<string, InvalidTagCase>();
    for (let i = 0; i < report.anomalies.length; i++) {
        const anomaly = report.anomalies[i];
        if (anomaly.severity === 'error') {
            findings.push(
                `🔴 Parsing aborted${anomaly.lineNumber === undefined ? '' : ` at line ${anomaly.lineNumber}`}: ${anomaly.message}${anomaly.rawLine === undefined ? '' : sampleLine(anomaly.rawLine)}`,
            );
        } else if (anomaly.type === 'invalid_tag_format' && !anomaly.isRepairable && anomaly.rawTag !== undefined) {
            let tagCase = invalidTags.get(anomaly.rawTag);
            if (!tagCase) {
                tagCase = { count: 0, lines: [], sample: anomaly.rawLine };
                invalidTags.set(anomaly.rawTag, tagCase);
            }
            tagCase.count++;
            if (anomaly.lineNumber !== undefined) {
                tagCase.lines.push(anomaly.lineNumber);
            }
        }
    }

    const tagCases = [...invalidTags].sort((a, b) => b[1].count - a[1].count);
    for (let i = 0; i < Math.min(tagCases.length, LIST_LIMIT); i++) {
        const [key, tagCase] = tagCases[i];
        let finding = `🟠 Tag key '${key}' is invalid and not repairable (${tagCase.count}×)`;
        if (tagCase.lines.length > 0) {
            finding += `, ${tagCase.lines.length === 1 ? 'line' : 'lines'} ${limitList(tagCase.lines.map(String))}`;
        }
        findings.push(tagCase.sample === undefined ? finding : finding + sampleLine(tagCase.sample));
    }
    if (tagCases.length > LIST_LIMIT) {
        findings.push(`🟠 +${tagCases.length - LIST_LIMIT} more unrepairable tag keys`);
    }

    for (let i = 0; i < keys.length; i++) {
        const verdict = getCastVerdict(report.tags[keys[i]]);
        if (verdict?.failure) {
            findings.push(
                `🟠 ${keys[i]}: ${verdict.failure} of ${verdict.success + verdict.failure} ${verdict.kind === 'date' ? 'date values' : 'values'} failed to cast`,
            );
        }
    }

    if (report.totalRecords === 0) {
        findings.push('🟠 No records found');
    }
    return findings;
}

function formatOverview(
    report: ParseInspectionReport,
    keys: readonly string[],
    severityCounts: Readonly<Record<AnomalySeverity, number>>,
): string {
    let entries = 0;
    let empty = 0;
    let multiline = 0;
    let padded = 0;
    let internalSpaces = 0;
    let linebreaks = 0;
    let repeated = 0;
    let standard = 0;
    let custom = 0;
    const unknownKeys: string[] = [];
    let dateSuccess = 0;
    let dateFailure = 0;
    let typeSuccess = 0;
    let typeFailure = 0;
    const precision: DatePrecisionStats = { fullDateCount: 0, yearMonthCount: 0, yearOnlyCount: 0, monthOnlyCount: 0 };

    for (let i = 0; i < keys.length; i++) {
        // INTENTION: cached dictionary lookup.
        const stats = report.tags[keys[i]];
        entries += stats.count;
        empty += stats.emptyCount;
        multiline += stats.multilineCount;
        padded += stats.whitespacePaddedCount;
        internalSpaces += stats.multipleInternalSpacesCount ?? 0;
        linebreaks += stats.excessiveLinebreaksCount ?? 0;
        repeated += stats.multipleOccurrencesCount ?? 0;
        if (stats.isStandard) {
            standard++;
        } else if (stats.isCustom) {
            custom++;
        } else {
            unknownKeys.push(keys[i]);
        }
        const verdict = getCastVerdict(stats);
        if (verdict?.kind === 'date') {
            dateSuccess += verdict.success;
            dateFailure += verdict.failure;
        } else if (verdict) {
            typeSuccess += verdict.success;
            typeFailure += verdict.failure;
        }
        if (stats.datePrecision) {
            precision.fullDateCount += stats.datePrecision.fullDateCount;
            precision.yearMonthCount += stats.datePrecision.yearMonthCount;
            precision.yearOnlyCount += stats.datePrecision.yearOnlyCount;
            precision.monthOnlyCount += stats.datePrecision.monthOnlyCount;
        }
    }

    let records = String(report.totalRecords);
    if (report.totalRecords > 0 && entries > 0) {
        records += ` · ${(entries / report.totalRecords).toFixed(1)} entries per record`;
    }

    let eol = 'none detected';
    if (report.eol.styles.length === 1) {
        eol = escapeEol(report.eol.styles[0]);
    } else if (report.eol.styles.length > 1) {
        eol = `🟡 mixed: ${report.eol.styles.map(escapeEol).join(', ')}`;
    }

    const anomalies = [String(report.totalAnomalies)];
    for (let i = 0; i < SEVERITY_ORDER.length; i++) {
        if (severityCounts[SEVERITY_ORDER[i]] > 0) {
            anomalies.push(
                `${SEVERITY_BLOB[SEVERITY_ORDER[i]]} ${severityCounts[SEVERITY_ORDER[i]]} ${SEVERITY_ORDER[i]}`,
            );
        }
    }

    const tags = [`${keys.length} distinct`];
    if (standard > 0) {
        tags.push(`${standard} standard`);
    }
    if (custom > 0) {
        tags.push(`${custom} custom`);
    }
    if (unknownKeys.length > 0) {
        tags.push(`${unknownKeys.length} unknown (${limitList(unknownKeys)})`);
    }

    let output = labeled('Records', records);
    output += labeled('EOL', eol);
    output += labeled('Anomalies', anomalies.join(' · '));
    output += labeled('Tags', tags.join(' · '));
    output += labeled(
        'Entries',
        [
            String(entries),
            ...qualityParts({
                emptyCount: empty,
                multilineCount: multiline,
                whitespacePaddedCount: padded,
                multipleInternalSpacesCount: internalSpaces,
                excessiveLinebreaksCount: linebreaks,
                multipleOccurrencesCount: repeated,
            }),
        ].join(' · '),
    );
    if (dateSuccess + dateFailure > 0) {
        output += labeled('Date casts', rateBar(dateSuccess, dateSuccess + dateFailure));
    }
    if (typeSuccess + typeFailure > 0) {
        output += labeled('Type casts', rateBar(typeSuccess, typeSuccess + typeFailure));
    }
    const precisionSummary = precisionParts(precision);
    if (precisionSummary.length > 0) {
        output += labeled('Date precision', precisionSummary.join(' · '));
    }
    return output;
}

function formatStatus(severityCounts: Readonly<Record<AnomalySeverity, number>>, findingCount: number): string {
    if (severityCounts.error > 0) {
        return '🔴 Parsing aborted, report is partial';
    }
    if (findingCount > 0) {
        return `🟠 ${findingCount} ${findingCount === 1 ? 'finding' : 'findings'} to verify`;
    }
    if (severityCounts.warn > 0) {
        return '🟡 Parsed with warnings';
    }
    return severityCounts.info > 0 ? '🔵 Parsed with notices' : '🟢 Clean';
}

/**
 * **Converts the report into a compact console overview**.
 *
 * Sections: status, anomalies grouped by severity (info first, errors last) with counts, one line per tag,
 * aggregated overview, and a verify list naming the exact source cases that need a manual check.
 */
export function formatInspectionReport(report: ParseInspectionReport): string {
    const keys = Object.keys(report.tags).sort(
        (a, b) => report.tags[b].count - report.tags[a].count || (a < b ? -1 : 1),
    );
    const severityCounts: Record<AnomalySeverity, number> = { info: 0, warn: 0, error: 0 };
    for (let i = 0; i < report.anomalies.length; i++) {
        severityCounts[report.anomalies[i].severity]++;
    }
    const findings = collectFindings(report, keys);

    let output = 'RIS Parse Inspection Report\n';
    output += '===========================\n';
    output += labeled('Status', formatStatus(severityCounts, findings.length));
    if (report.anomalies.length > 0) {
        output += `\nAnomalies\n${RULE}\n${formatAnomalyGroups(groupAnomalies(report))}`;
    }
    if (keys.length > 0) {
        output += `\nTags\n${RULE}\n${formatTags(report, keys)}`;
    }
    output += `\nOverview\n${RULE}\n${formatOverview(report, keys, severityCounts)}`;
    if (findings.length > 0) {
        output += `\nVerify\n${RULE}\n${findings.join('\n')}\n`;
    }
    return output;
}
