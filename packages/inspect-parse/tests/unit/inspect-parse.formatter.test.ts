// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { createInitialReport } from '../../src/inspect-parse.engine.js';
import { formatInspectionReport } from '../../src/inspect-parse.formatter.js';
import type { Anomaly, ParseInspectionReport, TagStats } from '../../src/inspect-parse.types.js';

function tag(overrides: Partial<TagStats> = {}): TagStats {
    return { count: 1, emptyCount: 0, multilineCount: 0, whitespacePaddedCount: 0, isStandard: true, ...overrides };
}

function withAnomalies(...anomalies: Anomaly[]): ParseInspectionReport {
    const report = createInitialReport();
    report.totalRecords = 1;
    report.anomalies.push(...anomalies);
    report.totalAnomalies = anomalies.length;
    return report;
}

function section(text: string, title: string): string {
    const start = text.indexOf(`\n${title}\n`);
    if (start === -1) {
        return '';
    }
    const end = text.indexOf('\n\n', start + 1);
    return text.slice(start + 1, end === -1 ? undefined : end);
}

describe('inspect-parse - unit > inspect-parse.formatter.ts', () => {
    describe('Function: formatInspectionReport()', () => {
        it('should report a clean status and omit anomaly and verify sections for a clean report', () => {
            const report = createInitialReport();
            report.totalRecords = 2;
            report.eol.styles.push('\n');
            report.tags.TY = tag({ count: 2 });

            const text = formatInspectionReport(report);

            expect(text).toContain('Status          🟢 Clean\n');
            expect(text).not.toContain('\nAnomalies\n');
            expect(text).not.toContain('\nVerify\n');
            expect(text).toContain('Records         2 · 1.0 entries per record\n');
            expect(text).toContain('EOL             \\n\n');
        });

        it('should group anomalies by severity and label, info first and errors last, with counts', () => {
            const text = formatInspectionReport(
                withAnomalies(
                    { type: 'parse_diagnostic', severity: 'error', message: 'Record exceeds max lines.', lineNumber: 9 },
                    { type: 'parse_diagnostic', severity: 'warn', message: 'Content found outside of record.' },
                    { type: 'parse_diagnostic', severity: 'info', message: 'Lowercase tag normalized' },
                    { type: 'parse_diagnostic', severity: 'warn', message: 'Content found outside of record.' },
                    { type: 'parse_diagnostic', severity: 'warn', message: 'ER tag found outside of record.' },
                ),
            );

            expect(section(text, 'Anomalies')).toBe(
                'Anomalies\n---------------------------\n' +
                    '🔵 info   1  Lowercase tag normalized\n' +
                    '🟡 warn   2  Content found outside of record.\n' +
                    '🟡 warn   1  ER tag found outside of record.\n' +
                    '🔴 error  1  Record exceeds max lines.',
            );
            expect(text).toContain('Anomalies       5 · 🔵 1 info · 🟡 3 warn · 🔴 1 error\n');
        });

        it('should group invalid tag keys by repairability and list keys with repair target and count', () => {
            const text = formatInspectionReport(
                withAnomalies(
                    { type: 'invalid_tag_format', severity: 'info', message: 'm', rawTag: 'T_1', isRepairable: true },
                    { type: 'invalid_tag_format', severity: 'info', message: 'm', rawTag: 'T_1', isRepairable: true },
                    { type: 'invalid_tag_format', severity: 'warn', message: 'm', rawTag: 'BAD', isRepairable: false },
                ),
            );

            expect(text).toContain('🔵 info   2  Invalid tag keys, repairable: T_1→T1 ×2\n');
            expect(text).toContain('🟡 warn   1  Invalid tag keys, not repairable: BAD ×1\n');
        });

        it('should cap listed tag keys and mention the remainder', () => {
            const anomalies: Anomaly[] = [];
            for (const key of ['K1X', 'K2X', 'K3X', 'K4X', 'K5X', 'K6X', 'K7X']) {
                anomalies.push({ type: 'invalid_tag_format', severity: 'warn', message: 'm', rawTag: key });
            }

            expect(formatInspectionReport(withAnomalies(...anomalies))).toContain(
                'not repairable: K1X ×1, K2X ×1, K3X ×1, K4X ×1, K5X ×1 (+2 more)\n',
            );
        });

        it('should mark the report as partial and name each parser abort with line and raw line sample', () => {
            const text = formatInspectionReport(
                withAnomalies(
                    {
                        type: 'parse_diagnostic',
                        severity: 'error',
                        message: 'Record exceeds max lines.',
                        lineNumber: 12,
                        rawLine: `AB  - ${'x'.repeat(80)}`,
                    },
                    { type: 'parse_diagnostic', severity: 'error', message: 'Stream aborted: boom' },
                ),
            );

            expect(text).toContain('Status          🔴 Parsing aborted, report is partial\n');
            expect(text).toContain(
                `🔴 Parsing aborted at line 12: Record exceeds max lines.\n     "AB  - ${'x'.repeat(54)}…"\n`,
            );
            expect(text).toContain('🔴 Parsing aborted: Stream aborted: boom');
        });

        it('should name unrepairable tag keys with lines and a sample in the verify section', () => {
            const text = formatInspectionReport(
                withAnomalies(
                    {
                        type: 'invalid_tag_format',
                        severity: 'warn',
                        message: 'm',
                        rawTag: 'BROKEN',
                        rawLine: 'BROKEN  - a',
                        lineNumber: 7,
                    },
                    {
                        type: 'invalid_tag_format',
                        severity: 'warn',
                        message: 'm',
                        rawTag: 'BROKEN',
                        rawLine: 'BROKEN  - b',
                        lineNumber: 12,
                    },
                    { type: 'invalid_tag_format', severity: 'info', message: 'm', rawTag: 'T_1', isRepairable: true },
                ),
            );

            expect(text).toContain('Status          🟠 1 finding to verify\n');
            expect(section(text, 'Verify')).toBe(
                'Verify\n---------------------------\n' +
                    "🟠 Tag key 'BROKEN' is invalid and not repairable (2×), lines 7, 12\n" +
                    '     "BROKEN  - a"\n',
            );
        });

        it('should render one line per tag sorted by count with class and only non-zero metrics', () => {
            const report = createInitialReport();
            report.totalRecords = 2;
            report.tags.C1 = tag({ isStandard: false, isCustom: true });
            report.tags.AU = tag({
                count: 3,
                multilineCount: 1,
                whitespacePaddedCount: 1,
                multipleInternalSpacesCount: 2,
                excessiveLinebreaksCount: 1,
                multipleOccurrencesCount: 1,
            });
            report.tags.XYZ = tag({ isStandard: false, isUnknown: true });
            report.tags.TY = tag({ count: 2 });

            expect(section(formatInspectionReport(report), 'Tags')).toBe(
                'Tags\n---------------------------\n' +
                    'AU   standard  3  1 multiline · 1 padded · 2 multi-space · 1 excess linebreaks · 1 repeated\n' +
                    'TY   standard  2\n' +
                    'C1   custom    1\n' +
                    'XYZ  unknown   1',
            );
        });

        it('should render date casts with non-zero precision and prefer date over type counters', () => {
            const report = createInitialReport();
            report.totalRecords = 1;
            report.tags.DA = tag({
                count: 2,
                dateCastSuccessCount: 1,
                dateCastFailureCount: 1,
                castSuccessCount: 1,
                castFailureCount: 1,
                datePrecision: { fullDateCount: 0, yearMonthCount: 0, yearOnlyCount: 0, monthOnlyCount: 1 },
            });

            const text = formatInspectionReport(report);

            expect(text).toContain('DA  standard  2  date cast 1/2 · 1 month only\n');
            expect(text).not.toContain('type cast');
            expect(text).not.toContain('Type casts');
            expect(text).toContain('🟠 DA: 1 of 2 date values failed to cast');
        });

        it('should treat a missing cast counter as zero', () => {
            const report = createInitialReport();
            report.totalRecords = 1;
            report.tags.Y1 = tag({ dateCastFailureCount: 1 });
            report.tags.VL = tag({ count: 2, castFailureCount: 2 });

            const text = formatInspectionReport(report);

            expect(text).not.toMatch(/\bundefined\b|\bNaN\b/);
            expect(text).toContain('Y1  standard  1  date cast 0/1\n');
            expect(text).toContain('VL  standard  2  type cast 0/2\n');
            expect(text).toContain('🟠 VL: 2 of 2 values failed to cast');
        });

        it('should aggregate entries, tag classes, cast rates and precision in the overview', () => {
            const report = createInitialReport();
            report.totalRecords = 2;
            report.eol.styles.push('\r\n', '\n');
            report.tags.PY = tag({
                count: 5,
                emptyCount: 1,
                dateCastSuccessCount: 4,
                dateCastFailureCount: 1,
                datePrecision: { fullDateCount: 1, yearMonthCount: 0, yearOnlyCount: 3, monthOnlyCount: 0 },
            });
            report.tags.C1 = tag({ isStandard: false, isCustom: true, castSuccessCount: 1 });
            report.tags.ZZZ = tag({ isStandard: false, isUnknown: true, multipleOccurrencesCount: 1 });

            expect(section(formatInspectionReport(report), 'Overview')).toBe(
                'Overview\n---------------------------\n' +
                    'Records         2 · 3.5 entries per record\n' +
                    'EOL             🟡 mixed: \\r\\n, \\n\n' +
                    'Anomalies       0\n' +
                    'Tags            3 distinct · 1 standard · 1 custom · 1 unknown (ZZZ)\n' +
                    'Entries         7 · 1 empty · 1 repeated\n' +
                    'Date casts      🟡 ████████████████░░░░  80%  4/5\n' +
                    'Type casts      🟢 ████████████████████ 100%  1/1\n' +
                    'Date precision  1 full · 3 year only',
            );
        });

        it('should never round a partial cast rate up to a full bar or 100 percent', () => {
            const report = createInitialReport();
            report.totalRecords = 1;
            report.tags.PY = tag({ count: 1000, dateCastSuccessCount: 999, dateCastFailureCount: 1 });

            expect(formatInspectionReport(report)).toContain('Date casts      🟡 ███████████████████░  99%  999/1000\n');
        });

        it('should flag a report without records and without EOL', () => {
            const text = formatInspectionReport(createInitialReport());

            expect(text).toContain('Status          🟠 1 finding to verify\n');
            expect(text).toContain('Records         0\n');
            expect(text).toContain('EOL             none detected\n');
            expect(text).not.toContain('\nTags\n');
            expect(text).toContain('🟠 No records found');
        });
    });
});
