// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { ParseInspectionReport } from '../../../src/inspect-parse.types.js';
import { inspectTagKeyFormat } from '../../../src/inspectors/tag-format.inspector.js';

function createMockReport(): ParseInspectionReport {
    return {
        totalRecords: 0,
        totalAnomalies: 0,
        eol: { styles: [] },
        anomalies: [],
        tags: {},
    };
}

describe('inspect-parse - unit > inspectors > tag-format.inspector.ts', () => {
    describe('Function: inspectTagKeyFormat()', () => {
        it.each([['AU'], ['TI'], ['PY'], ['T1'], ['ER'], ['99']])(
            'should record no anomalies for valid tag key: %s',
            (validTag) => {
                const report = createMockReport();

                inspectTagKeyFormat(validTag, report, 'warn', `${validTag}  - Sample value`, 1);

                expect(report.anomalies.length).toBe(0);
                expect(report.totalAnomalies).toBe(0);
            },
        );

        it('should detect repairable malformed tag keys and record repairable anomaly', () => {
            const report = createMockReport();
            const rawLine = 'T_1  - Some Title';

            inspectTagKeyFormat('T_1', report, 'info', rawLine, 4);

            expect(report.totalAnomalies).toBe(1);
            expect(report.anomalies).toEqual([
                {
                    type: 'invalid_tag_format',
                    severity: 'info',
                    message: "Invalid tag format detected: 'T_1' (can be repaired to 'T1')",
                    rawTag: 'T_1',
                    rawLine,
                    lineNumber: 4,
                    isRepairable: true,
                },
            ]);
        });

        it('should detect unrepairable invalid tag keys and record unrepairable anomaly', () => {
            const report = createMockReport();
            const rawLine = 'INVALID_LONG_TAG  - Content';

            inspectTagKeyFormat('INVALID_LONG_TAG', report, 'warn', rawLine, 2);

            expect(report.totalAnomalies).toBe(1);
            expect(report.anomalies).toEqual([
                {
                    type: 'invalid_tag_format',
                    severity: 'warn',
                    message: "Invalid tag format detected: 'INVALID_LONG_TAG'",
                    rawTag: 'INVALID_LONG_TAG',
                    rawLine,
                    lineNumber: 2,
                    isRepairable: false,
                },
            ]);
        });

        it('should record anomaly without rawLine and lineNumber when omitted', () => {
            const report = createMockReport();

            inspectTagKeyFormat('1', report, 'warn');

            expect(report.totalAnomalies).toBe(1);
            expect(report.anomalies[0]).not.toHaveProperty('rawLine');
            expect(report.anomalies[0]).not.toHaveProperty('lineNumber');
            expect(report.anomalies[0].rawTag).toBe('1');
        });
    });
});
