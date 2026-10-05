// Copyright 2026 Martin Winkler

import { describe, expect, it, mock } from 'bun:test';
import { ERROR_MESSAGES, RIS_ERROR, RisError } from '@smart-ris/core';
import { parse, parseStream } from '../../src/index.js';
import { MAX_BUFFER_SIZE } from '../../src/parse.options.js';

describe('parse - unit > index.ts', () => {
    describe('Function: parse()', () => {
        const sampleRis = 'TY  - JOUR\nAU  - Smith, J.\nTI  - Test Article\nER  - ';

        it('should parse a basic RIS string into records', () => {
            const results = parse(sampleRis);
            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({
                TY: 'JOUR',
                AU: ['Smith, J.'],
                TI: 'Test Article',
            });
        });

        it('should handle Windows CRLF (\\r\\n), legacy Mac (\\r), and odd (\\n\\r) line endings', () => {
            const crlfRis = 'TY  - JOUR\r\nAU  - Smith, J.\r\nER  - ';
            const crRis = 'TY  - JOUR\rAU  - Smith, J.\rER  - ';
            const lfCrRis = 'TY  - JOUR\n\rAU  - Smith, J.\n\rER  - ';

            const res1 = parse(crlfRis);
            const res2 = parse(crRis);
            const res3 = parse(lfCrRis);

            expect(res1[0]).toEqual({ TY: 'JOUR', AU: ['Smith, J.'] });
            expect(res2[0]).toEqual({ TY: 'JOUR', AU: ['Smith, J.'] });
            expect(res3[0]).toEqual({ TY: 'JOUR', AU: ['Smith, J.'] });
        });

        it('should correctly ignore empty trailing line at the end of input', () => {
            const inputWithTrailingNewline = 'TY  - JOUR\nAU  - Smith, J.\nER  - \n';
            const results = parse(inputWithTrailingNewline);
            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ TY: 'JOUR', AU: ['Smith, J.'] });
        });

        it('should respect toSemantic option', () => {
            const results = parse(sampleRis, { toSemantic: true });
            expect(results[0]).toEqual({
                typeOfReference: 'JOUR',
                author: ['Smith, J.'],
                title: 'Test Article',
            });
        });

        it('should respect useSmartTypes option', () => {
            const sampleWithDate = 'TY  - JOUR\nPY  - 2023\nER  - ';
            const results = parse(sampleWithDate, { useSmartTypes: true });
            expect(results[0]).toEqual({
                TY: 'JOUR',
                PY: '2023',
            });
        });

        it('should respect both toSemantic and useSmartTypes combined', () => {
            const sample = 'TY  - JOUR\nAU  - Doe, J.\nPY  - 2023\nER  - ';
            const results = parse(sample, { toSemantic: true, useSmartTypes: true });
            expect(results[0]).toEqual({
                typeOfReference: 'JOUR',
                author: ['Doe, J.'],
                publicationYear: '2023',
            });
        });

        it('should enrich partial date (DA / date) with fallback year from publicationYear (PY) or primaryDate (Y1) when toSemantic and useSmartTypes are enabled', () => {
            const risWithPy = ['TY  - JOUR', 'DA  - 15 Jan', 'PY  - 2026', 'ER  - '].join('\n');

            const res1 = parse(risWithPy, { toSemantic: true, useSmartTypes: true });
            expect(res1[0]).toEqual({
                typeOfReference: 'JOUR',
                date: '2026-01-15',
                publicationYear: '2026',
            });

            const risWithY1 = ['TY  - JOUR', 'DA  - Feb', 'Y1  - 2025/03/10', 'ER  - '].join('\n');

            const res2 = parse(risWithY1, { toSemantic: true, useSmartTypes: true });
            expect(res2[0]).toEqual({
                typeOfReference: 'JOUR',
                date: '2025-02',
                primaryDate: '2025-03-10',
            });
        });

        it('should dynamically infer custom semantic mappings and smart types on parsed records', () => {
            const ris = ['TY  - JOUR', 'AU  - Smith, J.', 'C1  - 42', 'ER  - '].join('\n');
            const [record] = parse(ris, {
                toSemantic: true,
                useSmartTypes: true,
                customSemanticMap: { C1: 'citationCount' },
                smartCastSchema: { C1: 'number' },
            });

            expect(record.typeOfReference).toBe('JOUR');
            expect(record.author).toEqual(['Smith, J.']);
            expect(record.citationCount).toBe(42);
        });

        it('should flush and return unclosed record when input terminates without ER tag', () => {
            const onError = mock();
            const unclosedRis = 'TY  - JOUR\nTI  - Unclosed Title';
            const records = parse(unclosedRis, { onError, logLevel: 'warn' });
            expect(records).toHaveLength(1);
            expect(records[0].TY).toBe('JOUR');
            expect(records[0].TI).toBe('Unclosed Title');
            expect(onError).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        message: ERROR_MESSAGES[RIS_ERROR.MISSING_ER_AT_EOF],
                    }),
                }),
            );
        });

        it('should report correct absolute line numbers in onError across multi-record RIS documents', () => {
            const incidents: { lineNumber: number; rawLine: string }[] = [];
            const multiRecordRis = [
                'TY  - JOUR', // Line 1
                'TI  - First Record', // Line 2
                'ER  - ', // Line 3
                'TY  - BOOK', // Line 4
                '###  - Invalid Tag In Rec 2', // Line 5
                'TI  - Second Record', // Line 6
                'ER  - ', // Line 7
                'TY  - CONF', // Line 8
                'TI  - Third Record', // Line 9
                '   continuation line', // Line 10
                '$$$  - Invalid Tag In Rec 3', // Line 11
                'ER  - ', // Line 12
            ].join('\n');

            parse(multiRecordRis, {
                logLevel: 'warn',
                skipInvalidTags: true,
                repairTags: true,
                onError: (incident) => {
                    if (incident.lineNumber !== null && incident.lineNumber !== undefined) {
                        incidents.push({ lineNumber: incident.lineNumber, rawLine: incident.rawLine });
                    }
                },
            });

            expect(incidents).toEqual([
                { lineNumber: 5, rawLine: '###  - Invalid Tag In Rec 2' },
                { lineNumber: 11, rawLine: '$$$  - Invalid Tag In Rec 3' },
            ]);
        });

        it('should abort parse when record exceeds MAX_RECORD_LINES, keeping only records completed before it', () => {
            const onError = mock();
            const ris = [
                'TY  - BOOK\nTI  - Before\nER  - \n',
                `TY  - JOUR\n${'AU  - Author\n'.repeat(1001)}ER  - \n`,
                'TY  - GEN\nTI  - After\nER  - \n',
            ].join('');

            const results = parse(ris, { onError });

            expect(results).toEqual([{ TY: 'BOOK', TI: 'Before' }]);
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0][0].error.message).toBe(ERROR_MESSAGES[RIS_ERROR.RECORD_EXCEEDS_MAX_LINES]);
        });

        it('should abort parse without throwing when record exceeds MAX_RECORD_LINES and onError is undefined', () => {
            const ris = `TY  - JOUR\n${'AU  - Author\n'.repeat(1001)}ER  - \nTY  - GEN\nTI  - After\nER  - \n`;

            expect(() => parse(ris)).not.toThrow();
            expect(parse(ris)).toEqual([]);
        });

        it.each([
            [123, 'number'],
            [null, 'null'],
            [undefined, 'undefined'],
        ])('should throw TypeError for non-string input | Input: %p', (input, received) => {
            expect(() => parse(input as never)).toThrow(TypeError);
            expect(() => parse(input as never)).toThrow(`Input must be a string. Received: ${received}`);
        });
    });

    describe('Function: parseStream()', () => {
        it('should stream-parse string chunks', async () => {
            async function* stringStream() {
                yield 'TY  - ';
                yield 'JOUR\nAU  - ';
                yield 'Smith, J.\nER  - ';
            }

            const results = [];
            for await (const rec of parseStream(stringStream())) {
                results.push(rec);
            }

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ TY: 'JOUR', AU: ['Smith, J.'] });
        });

        it('should stream-parse Uint8Array chunks', async () => {
            const encoder = new TextEncoder();
            async function* bufferStream() {
                yield encoder.encode('TY  - JOUR\n');
                yield encoder.encode('AU  - Smith, J.\nER  - ');
            }

            const results = [];
            for await (const rec of parseStream(bufferStream())) {
                results.push(rec);
            }

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ TY: 'JOUR', AU: ['Smith, J.'] });
        });

        it('should flush incomplete multi-byte UTF-8 bytes at stream EOF without data loss', async () => {
            const encoder = new TextEncoder();
            async function* incompleteUtf8Stream() {
                yield encoder.encode('TY  - JOUR\nTI  - Test ');
                // Incomplete 2-byte UTF-8 sequence (0xC3 without continuation byte) at stream EOF
                yield new Uint8Array([0xc3]);
            }

            const results = [];
            for await (const rec of parseStream(incompleteUtf8Stream())) {
                results.push(rec);
            }

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ TY: 'JOUR', TI: 'Test \uFFFD' });
        });

        it.each([
            ['2-byte (1 of 2 bytes)', new Uint8Array([0xc3])],
            ['3-byte (1 of 3 bytes)', new Uint8Array([0xe2])],
            ['3-byte (2 of 3 bytes)', new Uint8Array([0xe2, 0x82])],
            ['4-byte (1 of 4 bytes)', new Uint8Array([0xf0])],
            ['4-byte (2 of 4 bytes)', new Uint8Array([0xf0, 0x9f])],
            ['4-byte (3 of 4 bytes)', new Uint8Array([0xf0, 0x9f, 0x9a])],
        ])(
            'should flush replacement character for incomplete multi-byte UTF-8 at stream EOF | Variant: %s',
            async (_label, trailingBytes) => {
                const encoder = new TextEncoder();
                async function* stream() {
                    yield encoder.encode('TY  - JOUR\nTI  - Truncated ');
                    yield trailingBytes;
                }

                const results = [];
                for await (const rec of parseStream(stream())) {
                    results.push(rec);
                }

                expect(results).toHaveLength(1);
                expect(results[0]).toEqual({ TY: 'JOUR', TI: 'Truncated \uFFFD' });
            },
        );

        it.each([
            ['2-byte character (é)', [0xc3], [0xa9], 'é'],
            ['3-byte character (€)', [0xe2, 0x82], [0xac], '€'],
            ['4-byte character (🚀)', [0xf0, 0x9f], [0x9a, 0x80], '🚀'],
        ])(
            'should correctly decode valid multi-byte character split across Uint8Array chunk boundaries | Character: %s',
            async (_label, chunk1Bytes, chunk2Bytes, expectedChar) => {
                const encoder = new TextEncoder();
                async function* splitCharStream() {
                    const prefix = encoder.encode('TY  - JOUR\nTI  - Prefix ');
                    const chunk1 = new Uint8Array(prefix.length + chunk1Bytes.length);
                    chunk1.set(prefix, 0);
                    chunk1.set(chunk1Bytes, prefix.length);
                    yield chunk1;

                    const suffix = encoder.encode('\nER  - ');
                    const chunk2 = new Uint8Array(chunk2Bytes.length + suffix.length);
                    chunk2.set(chunk2Bytes, 0);
                    chunk2.set(suffix, chunk2Bytes.length);
                    yield chunk2;
                }

                const results = [];
                for await (const rec of parseStream(splitCharStream())) {
                    results.push(rec);
                }

                expect(results).toHaveLength(1);
                expect(results[0]).toEqual({ TY: 'JOUR', TI: `Prefix ${expectedChar}` });
            },
        );

        it('should handle mixed string, empty Uint8Array, and non-empty Uint8Array chunks', async () => {
            const encoder = new TextEncoder();
            async function* mixedStream() {
                yield 'TY  - JOUR\n';
                yield new Uint8Array([]);
                yield encoder.encode('TI  - Mixed Chunks\n');
                yield '';
                yield encoder.encode('ER  - ');
            }

            const results = [];
            for await (const rec of parseStream(mixedStream())) {
                results.push(rec);
            }

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ TY: 'JOUR', TI: 'Mixed Chunks' });
        });

        it('should strip UTF-8 BOM when binary Uint8Array stream starts with BOM bytes', async () => {
            const encoder = new TextEncoder();
            async function* bomBinaryStream() {
                yield new Uint8Array([0xef, 0xbb, 0xbf, ...encoder.encode('TY  - JOUR\n')]);
                yield encoder.encode('TI  - With BOM\nER  - ');
            }

            const results = [];
            for await (const rec of parseStream(bomBinaryStream())) {
                results.push(rec);
            }

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ TY: 'JOUR', TI: 'With BOM' });
        });

        it('should handle binary CRLF split across Uint8Array chunk boundaries', async () => {
            const encoder = new TextEncoder();
            async function* splitBinaryCrlfStream() {
                yield encoder.encode('TY  - JOUR\r');
                yield encoder.encode('\nTI  - Binary CRLF\r\nER  - ');
            }

            const results = [];
            for await (const rec of parseStream(splitBinaryCrlfStream())) {
                results.push(rec);
            }

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ TY: 'JOUR', TI: 'Binary CRLF' });
        });

        it('should keep CR state across empty chunks between \\r and \\n', async () => {
            async function* emptyChunkStream() {
                yield 'TY  - JOUR\r';
                yield '';
                yield '\nAB  - a\r';
                yield '';
                yield '';
                yield '\nb\r\nER  - \r\n';
            }

            const results = [];
            for await (const rec of parseStream(emptyChunkStream(), { cleanWhitespace: false })) {
                results.push(rec);
            }

            expect(results).toEqual([{ TY: 'JOUR', AB: 'a\nb' }]);
        });

        it('should keep CR state across empty binary chunks between \\r and \\n', async () => {
            const encoder = new TextEncoder();
            async function* emptyBinaryChunkStream() {
                yield encoder.encode('TY  - JOUR\r');
                yield new Uint8Array(0);
                yield encoder.encode('\nAB  - a\r');
                yield new Uint8Array(0);
                yield encoder.encode('\nb\r\nER  - \r\n');
            }

            const results = [];
            for await (const rec of parseStream(emptyBinaryChunkStream(), { cleanWhitespace: false })) {
                results.push(rec);
            }

            expect(results).toEqual([{ TY: 'JOUR', AB: 'a\nb' }]);
        });

        it('should handle \r\n split across chunk boundaries (\r at chunk1 end, \n at chunk2 start)', async () => {
            async function* splitCrlfStream() {
                yield 'TY  - JOUR\r';
                yield '\nAU  - Smith, J.\r\nER  - ';
            }

            const results = [];
            for await (const rec of parseStream(splitCrlfStream())) {
                results.push(rec);
            }

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ TY: 'JOUR', AU: ['Smith, J.'] });
        });

        it('should handle odd \\n\\r split across chunk boundaries (\\n at chunk1 end, \\r at chunk2 start)', async () => {
            async function* splitLfCrStream() {
                yield 'TY  - JOUR\n';
                yield '\rAU  - Smith, J.\n\rER  - ';
            }

            const results = [];
            for await (const rec of parseStream(splitLfCrStream())) {
                results.push(rec);
            }

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ TY: 'JOUR', AU: ['Smith, J.'] });
        });

        it('should handle un-terminated buffer remaining at stream completion', async () => {
            async function* unterminatedStream() {
                yield 'TY  - JOUR\nAU  - Smith, J.\nER  - ';
            }

            const results = [];
            for await (const rec of parseStream(unterminatedStream())) {
                results.push(rec);
            }

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ TY: 'JOUR', AU: ['Smith, J.'] });
        });

        it('should abort via onError without throwing when an unterminated line exceeds MAX_BUFFER_SIZE', async () => {
            const onError = mock();
            async function* hugeStream() {
                yield 'TY  - BOOK\nTI  - Before\nER  - \n';
                yield 'A'.repeat(MAX_BUFFER_SIZE + 1);
                yield '\nTY  - GEN\nTI  - After\nER  - \n';
            }

            const results = [];
            for await (const rec of parseStream(hugeStream(), { onError })) {
                results.push(rec);
            }

            expect(results).toEqual([{ TY: 'BOOK', TI: 'Before' }]);
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0][0].error).toBeInstanceOf(RisError);
            expect(onError.mock.calls[0][0].error.message).toBe(ERROR_MESSAGES[RIS_ERROR.LINE_EXCEEDS_MAX_BUFFER_SIZE]);
        });

        it('should abort without throwing when an unterminated line exceeds MAX_BUFFER_SIZE and onError is undefined', async () => {
            async function* hugeStream() {
                yield 'A'.repeat(MAX_BUFFER_SIZE + 1);
            }

            const results = [];
            for await (const rec of parseStream(hugeStream())) {
                results.push(rec);
            }

            expect(results).toEqual([]);
        });

        it('should abort when an unterminated remainder split across chunks exceeds MAX_BUFFER_SIZE', async () => {
            const onError = mock();
            const half = 'A'.repeat(Math.ceil(MAX_BUFFER_SIZE / 2) + 1);
            async function* splitStream() {
                yield half;
                yield half;
                yield '\nTY  - GEN\nER  - \n';
            }

            const results = [];
            for await (const rec of parseStream(splitStream(), { onError })) {
                results.push(rec);
            }

            expect(results).toEqual([]);
            expect(onError).toHaveBeenCalledTimes(1);
        });

        it('should parse a single well-formed chunk larger than MAX_BUFFER_SIZE completely', async () => {
            const onError = mock();
            const record = 'TY  - JOUR\nTI  - x\nER  - \n';
            const count = Math.ceil((MAX_BUFFER_SIZE + 1) / record.length);
            async function* bigStream() {
                yield record.repeat(count);
            }

            let results = 0;
            for await (const _ of parseStream(bigStream(), { onError })) {
                results++;
            }

            expect(results).toBe(count);
            expect(onError).not.toHaveBeenCalled();
        });

        it('should propagate stream error directly to caller without invoking onError', async () => {
            const onErrorMock = mock();

            async function* faultyStream() {
                yield 'TY  - JOUR\n';
                throw new Error('Stream read failure');
            }

            const consume = async () => {
                for await (const _ of parseStream(faultyStream(), { onError: onErrorMock })) {
                    // do nothing
                }
            };

            expect(consume()).rejects.toThrow('Stream read failure');
            expect(onErrorMock).not.toHaveBeenCalled();
        });

        it('should rethrow stream error even if onError callback is not provided', async () => {
            async function* faultyStream() {
                yield 'TY  - JOUR\n';
                throw new Error('Stream read failure without handler');
            }

            const consume = async () => {
                for await (const _ of parseStream(faultyStream())) {
                    // do nothing
                }
            };

            expect(consume()).rejects.toThrow('Stream read failure without handler');
        });

        it('should report correct absolute line numbers in onError across multi-record streamed chunks', async () => {
            const incidents: { lineNumber: number; rawLine: string }[] = [];
            async function* chunkStream() {
                yield 'TY  - JOUR\nTI  - Rec 1\nER  - \n'; // Lines 1-3
                yield 'TY  - BOOK\n###  - Bad Tag Rec 2\n'; // Lines 4-5
                yield 'TI  - Rec 2\nER  - \nTY  - CONF\n'; // Lines 6-8
                yield 'TI  - Rec 3\n   continuation line\n$$$  - Bad Tag Rec 3\nER  - \n'; // Lines 9-12
            }

            const results = [];
            for await (const rec of parseStream(chunkStream(), {
                logLevel: 'warn',
                skipInvalidTags: true,
                repairTags: true,
                onError: (incident) => {
                    if (incident.lineNumber !== null && incident.lineNumber !== undefined) {
                        incidents.push({ lineNumber: incident.lineNumber, rawLine: incident.rawLine });
                    }
                },
            })) {
                results.push(rec);
            }

            expect(results).toHaveLength(3);
            expect(incidents).toEqual([
                { lineNumber: 5, rawLine: '###  - Bad Tag Rec 2' },
                { lineNumber: 11, rawLine: '$$$  - Bad Tag Rec 3' },
            ]);
        });

        it('should abort and stop yielding in parseStream when record exceeds MAX_RECORD_LINES', async () => {
            const onError = mock();
            async function* overflowingStream() {
                yield 'TY  - JOUR\n';
                for (let i = 0; i < 1001; i++) {
                    yield `AU  - Author ${i}\n`;
                }
                yield 'ER  - \n';
                yield 'TY  - BOOK\nTI  - Next Book\nER  - \n';
            }

            const results = [];
            for await (const rec of parseStream(overflowingStream(), { onError })) {
                results.push(rec);
            }

            expect(results).toHaveLength(0);
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0][0].error.message).toBe(ERROR_MESSAGES[RIS_ERROR.RECORD_EXCEEDS_MAX_LINES]);
        });
    });

    describe('Public Exports', () => {
        it('should export low-level engines, pipeline builders, and options resolvers', async () => {
            const indexModule = await import('../../src/index.js');
            expect(typeof indexModule.parse).toBe('function');
            expect(typeof indexModule.parseStream).toBe('function');
            expect(typeof indexModule.createParseEngine).toBe('function');
            expect(typeof indexModule.buildParsePipeline).toBe('function');
            expect(typeof indexModule.resolveParseOptions).toBe('function');
            expect(typeof indexModule.DEFAULT_PARSE_OPTIONS).toBe('object');
        });
    });
});
