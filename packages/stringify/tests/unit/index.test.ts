// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { RisRecord } from '@smart-ris/core';
import { stringify, stringifyStream } from '../../src/index.js';

describe('stringify - unit > index', () => {
    describe('Function: stringify() Multi-Record Joining & EOL Handling', () => {
        it('should stringify a single record object directly without wrapping in array', () => {
            const record: RisRecord = { TY: 'JOUR', AU: 'Doe, J.' };
            const result = stringify(record);
            expect(result).toBe('TY  - JOUR\nAU  - Doe, J.\nER  - \n');
        });

        it('should merge mixed case semantic keys into array without losing values', () => {
            const input: any = {
                typeOfReference: 'JOUR',
                author: 'Alpha, A.',
                AUTHOR: 'Beta, B.',
                Author: 'Gamma, C.',
                aUthor: 'Delta, D.',
            };
            const result = stringify(input, { fromSemantic: true });
            expect(result).toContain('AU  - Alpha, A.');
            expect(result).toContain('AU  - Beta, B.');
            expect(result).toContain('AU  - Gamma, C.');
            expect(result).toContain('AU  - Delta, D.');
        });

        it.each([
            { eol: '\n', label: 'LF (\\n)', sep: '\n\n' },
            { eol: '\r\n', label: 'CRLF (\\r\\n)', sep: '\r\n\r\n' },
            { eol: '\r', label: 'CR (\\r)', sep: '\r\r' },
        ])('should join multi-record output using correct EOL separator | EOL: $label', ({ eol, sep }) => {
            const records: RisRecord[] = [
                { TY: 'JOUR', AU: 'Doe, J.' },
                { TY: 'BOOK', AU: 'Smith, A.' },
            ];
            const result = stringify(records, { eol: eol as any });
            expect(result).toContain(`ER  - ${sep}TY  - BOOK`);
            expect(result.endsWith(`ER  - ${eol}`)).toBe(true);
        });

        it('should handle empty input array correctly', () => {
            expect(stringify([])).toBe('');
            expect(stringify([], { eol: '\r\n' })).toBe('');
        });

        it('should not produce stray separators when array contains empty records', () => {
            expect(stringify([{} as any, { TY: 'JOUR' }])).toBe('TY  - JOUR\nER  - \n');
            expect(stringify([{ TY: 'JOUR' }, {} as any])).toBe('TY  - JOUR\nER  - \n');
            expect(stringify([{ TY: 'JOUR' }, {} as any, { TY: 'BOOK' }])).toBe(
                'TY  - JOUR\nER  - \n\nTY  - BOOK\nER  - \n',
            );
            expect(stringify([{} as any, {} as any])).toBe('');
        });

        it('should throw TypeError when invalid eol is provided', () => {
            const record: RisRecord = { TY: 'JOUR' };
            expect(() => stringify(record, { eol: 'invalid_eol' as any })).toThrow(`Option 'eol' must be one of`);
        });
    });

    describe('Function: stringifyStream()', () => {
        it('should stream record chunks with custom eol', async () => {
            async function* generateRecords() {
                yield { TY: 'JOUR', AU: 'Doe, J.' } as RisRecord;
                yield { TY: 'BOOK', AU: 'Smith, A.' } as RisRecord;
            }

            const chunks: string[] = [];
            for await (const chunk of stringifyStream(generateRecords(), { eol: '\r\n' })) {
                chunks.push(chunk);
            }

            expect(chunks).toEqual([
                'TY  - JOUR\r\nAU  - Doe, J.\r\nER  - \r\n',
                '\r\n',
                'TY  - BOOK\r\nAU  - Smith, A.\r\nER  - \r\n',
            ]);
        });

        it('should yield zero chunks when stream is empty', async () => {
            async function* emptyStream() {}

            const chunks: string[] = [];
            for await (const chunk of stringifyStream(emptyStream())) {
                chunks.push(chunk);
            }
            expect(chunks).toEqual([]);
        });

        it('should yield zero chunks without stray delimiters when stream yields only empty records', async () => {
            async function* emptyRecords() {
                yield {} as any;
                yield {} as any;
            }

            const chunks: string[] = [];
            for await (const chunk of stringifyStream(emptyRecords())) {
                chunks.push(chunk);
            }
            expect(chunks).toEqual([]);
        });

        it('should stream multi-record chunks with default eol delimiters', async () => {
            async function* generateRecords() {
                yield { TY: 'JOUR', AU: 'Doe, J.' } as RisRecord;
                yield { TY: 'BOOK', AU: 'Smith, A.' } as RisRecord;
            }

            const chunks: string[] = [];
            for await (const chunk of stringifyStream(generateRecords())) {
                chunks.push(chunk);
            }
            expect(chunks).toEqual([
                'TY  - JOUR\nAU  - Doe, J.\nER  - \n',
                '\n',
                'TY  - BOOK\nAU  - Smith, A.\nER  - \n',
            ]);
        });
    });

    describe('Public Exports', () => {
        it('should export low-level engines, pipeline builders, and options resolvers', async () => {
            const indexModule = await import('../../src/index.js');
            expect(typeof indexModule.stringify).toBe('function');
            expect(typeof indexModule.stringifyStream).toBe('function');
            expect(typeof indexModule.createStringifyEngine).toBe('function');
            expect(typeof indexModule.buildStringifyPipeline).toBe('function');
            expect(typeof indexModule.resolveStringifyOptions).toBe('function');
            expect(typeof indexModule.DEFAULT_STRINGIFY_OPTIONS).toBe('object');
        });
    });
});
