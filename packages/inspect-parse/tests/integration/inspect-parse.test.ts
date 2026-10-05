// Copyright 2026 Martin Winkler

import { afterAll, beforeAll, describe, expect, it, spyOn } from 'bun:test';
import { formatInspectionReport, inspectParse } from '../../src/index.js';

const SAMPLE_RIS_DATA = [
    'TY  - JOUR',
    'AU  - Shannon, Claude E.',
    'AU  - Turing, Alan M.',
    'TI  - A Mathematical Theory of Communication',
    'JO  - Bell System Technical Journal',
    'VL  - 27',
    'IS  - 3',
    'SP  - 379',
    'EP  - 423',
    'PY  - 1948',
    'DA  - 1948/07/01',
    'KW  - Information Theory',
    'KW  - Cryptography',
    'UR  - https://example.com/shannon1948',
    'ER  - ',
    '',
    'TY  - BOOK',
    'AU  - Knuth, Donald E.',
    'TI  - The Art of Computer Programming',
    'PB  - Addison-Wesley',
    'PY  - 1968',
    'CUSTOMTAG  - Non standard tag content',
    'ER  - ',
    '',
    'TY  - RPRT',
    'AU  - Hopper, Grace',
    'TI  -   Compiling and Software Architecture   ',
    'PY  - In Press / Summer Season',
    'DA  - Invalid Date String 99/99/9999',
    'N1  - Multi-line notes entry line 1',
    '      Multi-line notes entry line 2',
    'KW  - ',
    'BROKENTAGNAME  - Malformed key entry',
    'ER  - ',
    '',
    'text outside record',
    'TY  - CHAP',
    'AU  - Lovelace, Ada',
    'TI  - Analytical Engine Notes',
    'AB  -     ',
    'PY  - 1843',
    'ER  - ',
].join('\n');

describe('inspect-parse - integration > inspect-parse', () => {
    let logSpy: ReturnType<typeof spyOn>;

    beforeAll(() => {
        // Intercept and silence all console.log output across this test suite
        logSpy = spyOn(console, 'log').mockImplementation(() => {});
    });

    afterAll(() => {
        // Restore standard console.log behavior after tests finish
        logSpy.mockRestore();
    });

    describe('Function: inspectParse()', () => {
        it('should inspect RIS string synchronously and produce a human-readable report', () => {
            const report = inspectParse(SAMPLE_RIS_DATA);

            expect(report).toBeDefined();
            expect(report.totalRecords).toBe(4);
            expect(report.tags.TY).toBeDefined();
            expect(report.tags.TY.count).toBe(4);

            const textOutput = formatInspectionReport(report);
            expect(textOutput).toContain('RIS Parse Inspection Report');
            expect(textOutput).toContain('Records         4');

            console.log('\n========================================');
            console.log('=== HUMAN READABLE INSPECTION REPORT ===');
            console.log('========================================\n');
            console.log(textOutput);
            console.log('\n========================================\n');
        });

        it('should group anomalies, count them and name the cases to verify in the text report', () => {
            const report = inspectParse(SAMPLE_RIS_DATA);
            const textOutput = formatInspectionReport(report);

            expect(textOutput).not.toMatch(/\bundefined\b|\bNaN\b|\[object Object\]/);
            expect(report.totalAnomalies).toBe(report.anomalies.length);
            expect(textOutput).toContain(`Anomalies       ${report.anomalies.length} · 🟡 ${report.anomalies.length} warn\n`);
            expect(textOutput).toContain(
                '🟡 warn   2  Invalid tag keys, not repairable: CUSTOMTAG ×1, BROKENTAGNAME ×1\n',
            );
            expect(textOutput).toContain('🟡 warn   1  Content found outside of record.\n');
            expect(textOutput).toContain(
                "🟠 Tag key 'BROKENTAGNAME' is invalid and not repairable (1×), line 33\n" +
                    '     "BROKENTAGNAME  - Malformed key entry"',
            );
            expect(textOutput).toContain("🟠 Tag key 'CUSTOMTAG' is invalid and not repairable (1×), line 22");
            expect(textOutput).toContain('DA             standard  2  date cast 1/2 · 1 full\n');
            expect(textOutput).toContain('🟠 DA: 1 of 2 date values failed to cast');
        });
    });
});
