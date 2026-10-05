// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { runDistScenario } from '../../../../tests/bundle/run-in-node.js';
import * as src from '../../src/index.js';

// forensic parse plus cast plan with tagMapping, merging, sanitizing and date fallback
const SCENARIO = `
    const input = [
        'TY  - JOUR',
        'Z1  - 2020',
        'DA  - March',
        'VL  - 12',
        'VL  - 13',
        'C1  - true ',
        'BROKENTAGNAME  - x',
        'AU  - Doe,   John',
        'ER  - ',
        'stray line',
        '',
    ].join('\\r\\n');
    const options = {
        tagMapping: { Z1: 'PY' },
        arrayMergeStrategy: 'first',
        cleanWhitespace: true,
        mergeMultiline: true,
        smartCastSchema: { C1: 'boolean' },
    };
    const report = m.inspectParse(input, options);
    async function* chunks() {
        yield input.slice(0, 20);
        yield input.slice(20);
    }
    const streamed = await m.inspectParseStream(chunks(), options);
    return { report, streamed, text: m.formatInspectionReport(report) };
`;

describe('inspect-parse - bundle > built dist in Node', () => {
    it('should expose every source export and inspect with parse options like src', async () => {
        const { dist, src: expected, distExports } = await runDistScenario('inspect-parse', src, SCENARIO);

        expect(distExports).toEqual(Object.keys(src).sort());
        expect(dist).toEqual(expected);
        const { report, streamed, text } = dist as {
            report: Record<string, any>;
            streamed: Record<string, any>;
            text: string;
        };
        expect(streamed).toEqual(report);
        expect(report.tags.Z1.dateCastSuccessCount).toBe(1);
        expect(report.tags.DA.datePrecision.yearMonthCount).toBe(1);
        expect(report.tags.VL.castSuccessCount).toBe(1);
        expect(report.tags.C1.castSuccessCount).toBe(1);
        expect(text).toContain("🟠 Tag key 'BROKENTAGNAME' is invalid and not repairable (1×), line 7");
        expect(text).toContain('🟡 warn   1  Content found outside of record.');
    });
});
