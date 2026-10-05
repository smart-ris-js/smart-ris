// Copyright 2026 Martin Winkler

import { describe, expect, it, mock } from 'bun:test';
import type { RisErrorContext } from '@smart-ris/core';
import { inspectParse, inspectParseStream } from '../../src/index.js';

describe('inspect-parse - unit > index.ts', () => {
    const SAMPLE_RIS = 'TY  - JOUR\r\nAU  - Smith, J.\r\nPY  - 2023\r\nER  - \r\n';

    describe('Function: inspectParse()', () => {
        it('should synchronously inspect RIS string and detect EOL and records', () => {
            const report = inspectParse(SAMPLE_RIS);
            expect(report.totalRecords).toBe(1);
            expect(report.eol.styles).toEqual(['\r\n']);
            expect(report.tags.TY).toBeDefined();
            expect(report.tags.TY.count).toBe(1);
        });

        it('should capture parse anomalies via onError handler', () => {
            const invalidRis = 'INVALID LINE WITHOUT TAG\nTY  - JOUR\nER  - \n';
            const report = inspectParse(invalidRis);
            expect(report.totalAnomalies).toBeGreaterThan(0);
            expect(report.anomalies.some((a) => a.type === 'parse_diagnostic')).toBe(true);
            expect(report.anomalies[0].lineNumber).toBe(1);
        });

        it('should report each retained invalid tag once as invalid_tag_format, not also as parse_diagnostic', () => {
            const report = inspectParse('TY  - JOUR\nBADTAG  - a\nBADTAG  - b\nER  - \n');
            expect(report.anomalies.map((a) => a.type)).toEqual(['invalid_tag_format', 'invalid_tag_format']);
            expect(report.totalAnomalies).toBe(2);
        });

        it('should report invalid tags with line number and raw line from the parser diagnostic', () => {
            const report = inspectParse('TY  - JOUR\nBADTAG  - a\nTI  - ok\nBADTAG  - b\nER  - \n');
            expect(report.anomalies).toEqual([
                {
                    type: 'invalid_tag_format',
                    severity: 'warn',
                    message: "Invalid tag format detected: 'BADTAG'",
                    rawTag: 'BADTAG',
                    rawLine: 'BADTAG  - a',
                    lineNumber: 2,
                    isRepairable: false,
                },
                {
                    type: 'invalid_tag_format',
                    severity: 'warn',
                    message: "Invalid tag format detected: 'BADTAG'",
                    rawTag: 'BADTAG',
                    rawLine: 'BADTAG  - b',
                    lineNumber: 4,
                    isRepairable: false,
                },
            ]);
        });

        it('should report repaired tags as repairable invalid_tag_format with the original key', () => {
            const report = inspectParse('TY  - JOUR\nT_1  - Title\nER  - \n');
            expect(report.anomalies).toEqual([
                {
                    type: 'invalid_tag_format',
                    severity: 'info',
                    message: "Invalid tag format detected: 'T_1' (can be repaired to 'T1')",
                    rawTag: 'T_1',
                    rawLine: 'T_1  - Title',
                    lineNumber: 2,
                    isRepairable: true,
                },
            ]);
            expect(report.totalAnomalies).toBe(1);
        });

        it('should evaluate casting against the passed parse options', () => {
            const src = 'TY  - JOUR\nC1  - 2020\nDA  - March\nVL  - 12\nVL  - 13\nER  - \n';
            const report = inspectParse(src, { tagMapping: { C1: 'PY' }, arrayMergeStrategy: 'first' });
            expect(report.tags.C1.dateCastSuccessCount).toBe(1);
            expect(report.tags.DA.datePrecision?.yearMonthCount).toBe(1);
            expect(report.tags.VL.castSuccessCount).toBe(1);
            expect(report.tags.VL.castFailureCount).toBeUndefined();
        });

        it('should repair lax and malformed tag lines by default', () => {
            const report = inspectParse('TY  - JOUR\nPY  - 2020\nT1 -foo\nT_1  - Title\nER  - \n');
            expect(report.tags.T1.count).toBe(2);
            expect(report.tags.PY.dateCastSuccessCount).toBe(1);
            expect(report.anomalies.some((a) => a.type === 'invalid_tag_format' && a.rawTag === 'T_1')).toBe(true);
        });

        it('should read lax and malformed tag lines as continuation text like parse() when repairTags is false', () => {
            const src = 'TY  - JOUR\nPY  - 2020\nT1 -foo\nT_1  - Title\nER  - \n';
            const report = inspectParse(src, { repairTags: false });
            expect(Object.keys(report.tags)).toEqual(['TY', 'PY']);
            expect(report.tags.PY.multilineCount).toBe(1);
            expect(report.tags.PY.dateCastFailureCount).toBe(1);
            expect(report.anomalies).toEqual([]);
        });

        it.each([
            ['error', []],
            ['warn', ['Content found outside of record.']],
            ['info', ['Content found outside of record.', 'Lowercase tag normalized']],
        ] as const)('should forward parser incidents to the caller onError filtered by logLevel | logLevel: %p', (logLevel, expected) => {
            const onError = mock((_incident: RisErrorContext) => {});
            const report = inspectParse('INVALID LINE\nTY  - JOUR\nt1  - x\nER  - \n', { logLevel, onError });
            expect(onError.mock.calls.map(([incident]) => incident.error.message)).toEqual([...expected]);
            expect(report.anomalies.some((a) => a.message === 'Content found outside of record.')).toBe(true);
        });
    });

    describe('Function: inspectParseStream()', () => {
        it('should asynchronously inspect string stream chunks and detect EOL', async () => {
            async function* stringStream() {
                yield 'TY  - JOUR\r';
                yield '\nAU  - Smith, J.\r\nPY  - 2023\r\nER  - \r\n';
            }

            const report = await inspectParseStream(stringStream());
            expect(report.totalRecords).toBe(1);
            expect(report.eol.styles).toEqual(['\r\n']);
            expect(report.tags.AU).toBeDefined();
            expect(report.tags.AU.count).toBe(1);
        });

        it('should asynchronously inspect Uint8Array stream chunks', async () => {
            const encoder = new TextEncoder();
            async function* bufferStream() {
                yield encoder.encode('TY  - JOUR\n');
                yield encoder.encode('AU  - Doe, A.\nER  - \n');
            }

            const report = await inspectParseStream(bufferStream());
            expect(report.totalRecords).toBe(1);
            expect(report.eol.styles).toEqual(['\n']);
            expect(report.tags.AU.count).toBe(1);
        });

        it('should capture parse anomalies during stream inspection via onError handler', async () => {
            async function* invalidStream() {
                yield 'INVALID STREAM LINE WITHOUT TAG\nTY  - JOUR\nER  - \n';
            }

            const report = await inspectParseStream(invalidStream());
            expect(report.totalAnomalies).toBeGreaterThan(0);
            expect(report.anomalies.some((a) => a.type === 'parse_diagnostic')).toBe(true);
            expect(report.anomalies[0].lineNumber).toBe(1);
        });

        it('should report invalid tags and fallback years during stream inspection', async () => {
            async function* stream() {
                yield 'TY  - JOUR\nPY  - 2020\nBAD';
                yield 'TAG  - x\nDA  - March\nER  - \n';
            }

            const report = await inspectParseStream(stream());
            expect(report.anomalies).toHaveLength(1);
            expect(report.anomalies[0]).toMatchObject({ type: 'invalid_tag_format', rawTag: 'BADTAG', lineNumber: 3 });
            expect(report.tags.DA.datePrecision?.yearMonthCount).toBe(1);
        });

        it('should pass repairTags through during stream inspection', async () => {
            async function* stream() {
                yield 'TY  - JOUR\nPY  - 2020\nT_1  - Title\nER  - \n';
            }

            const repaired = await inspectParseStream(stream());
            const strict = await inspectParseStream(stream(), { repairTags: false });
            expect(repaired.tags.T1.count).toBe(1);
            expect(strict.tags.T1).toBeUndefined();
            expect(strict.tags.PY.multilineCount).toBe(1);
        });

        it('should forward parser incidents to the caller onError during stream inspection', async () => {
            async function* stream() {
                yield 'INVALID LINE\nTY  - JOUR\nER  - \n';
            }

            const onError = mock((_incident: RisErrorContext) => {});
            await inspectParseStream(stream(), { logLevel: 'warn', onError });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0][0]).toMatchObject({ lineNumber: 1, rawLine: 'INVALID LINE' });
        });

        it('should correctly process stream with multi-byte UTF-8 split across chunk boundary', async () => {
            const encoder = new TextEncoder();
            // 'ä' is 2 bytes: [0xC3, 0xA4]
            const fullBytes = encoder.encode('TY  - JOUR\nAU  - Müller, M.\nER  - \n');
            const splitIdx = fullBytes.indexOf(0xc3) + 1;
            const chunk1 = fullBytes.subarray(0, splitIdx);
            const chunk2 = fullBytes.subarray(splitIdx);

            async function* chunkStream() {
                yield chunk1;
                yield chunk2;
            }

            const report = await inspectParseStream(chunkStream());
            expect(report.totalRecords).toBe(1);
            expect(report.eol.styles).toEqual(['\n']);
            expect(report.tags.AU).toBeDefined();
            expect(report.tags.AU.count).toBe(1);
        });

        it('should flush and inspect trailing incomplete multi-byte bytes at stream completion', async () => {
            const encoder = new TextEncoder();
            const validBytes = encoder.encode('TY  - JOUR\nTI  - Incomplete Char\nER  - \n');
            const incompleteStreamChunk = new Uint8Array([...validBytes, 0xc3]);

            async function* stream() {
                yield incompleteStreamChunk;
            }

            const report = await inspectParseStream(stream());
            expect(report.totalRecords).toBe(1);
            expect(report.eol.styles).toEqual(['\n']);
        });

        it('should preserve EOL inspection report when parsing aborts early', async () => {
            async function* earlyAbortingStream() {
                yield 'TY  - JOUR\r\n';
                for (let i = 0; i < 1005; i++) {
                    yield 'N1  - note line\r\n';
                }
                yield 'ER  - \r\n';
            }

            const report = await inspectParseStream(earlyAbortingStream());
            expect(report.eol.styles).toEqual(['\r\n']);
            expect(report.anomalies.some((a) => a.message.includes('exceeds maximum allowed lines'))).toBe(true);
        });

        it('should not report a lone CR when parsing aborts on a chunk ending with \\r', async () => {
            // CRLF split across chunks; abort happens on a chunk whose `\n` is never read
            async function* splitCrlfAbortingStream() {
                yield 'TY  - JOUR\r';
                for (let i = 0; i < 1005; i++) {
                    yield '\nN1  - note line\r';
                }
                yield '\nER  - \r\n';
            }

            const report = await inspectParseStream(splitCrlfAbortingStream());
            expect(report.eol.styles).toEqual(['\r\n']);
            expect(report.anomalies.some((a) => a.message.includes('exceeds maximum allowed lines'))).toBe(true);
        });

        it('should return the partial report with a parse_diagnostic anomaly when the source stream throws', async () => {
            async function* failingStream() {
                yield 'TY  - JOUR\r\nAU  - Smith\r\nER  - \r\n';
                throw new Error('connection reset');
            }

            const report = await inspectParseStream(failingStream());
            expect(report.totalRecords).toBe(1);
            expect(report.tags.AU.count).toBe(1);
            expect(report.eol.styles).toEqual(['\r\n']);
            expect(report.totalAnomalies).toBe(1);
            expect(report.anomalies).toEqual([{ type: 'parse_diagnostic', severity: 'error', message: 'Stream aborted: connection reset' }]);
        });
    });
});
