// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { EolType } from '@smart-ris/core';
import { stringify } from '../../src/index.js';

describe('stringify - integration > array-merge-strategy-eol', () => {
    describe('Option: arrayMergeStrategy and eol combination', () => {
        it.each([
            ['\\n', '\n' as EolType],
            ['\\r\\n', '\r\n' as EolType],
            ['\\r', '\r' as EolType],
        ])(
            'should format merged multiline scalar tags with uniform eol %s when arrayMergeStrategy is join-newline',
            (_label, eol) => {
                const record = {
                    TY: 'JOUR',
                    TI: ['Title Line 1', 'Title Line 2'],
                    ER: '',
                };

                const output = stringify(record, {
                    arrayMergeStrategy: 'join-newline',
                    eol,
                });

                const expected = `TY  - JOUR${eol}TI  - Title Line 1${eol}Title Line 2${eol}ER  - ${eol}`;
                expect(output).toBe(expected);

                // Confirm no foreign newlines exist in the output
                if (eol === '\r\n') {
                    // All \r must be followed by \n and no lone \n exists
                    expect(output.includes('\r\n')).toBe(true);
                    expect(output.replace(/\r\n/g, '').includes('\n')).toBe(false);
                    expect(output.replace(/\r\n/g, '').includes('\r')).toBe(false);
                } else if (eol === '\n') {
                    expect(output.includes('\r')).toBe(false);
                } else if (eol === '\r') {
                    expect(output.includes('\n')).toBe(false);
                }
            },
        );

        it('should join scalar entries with space when strategy is join-space regardless of eol', () => {
            const record = {
                TY: 'JOUR',
                TI: ['Title Line 1', 'Title Line 2'],
                ER: '',
            };

            const output = stringify(record, {
                arrayMergeStrategy: 'join-space',
                eol: '\r\n',
            });

            expect(output).toBe(`TY  - JOUR\r\nTI  - Title Line 1 Title Line 2\r\nER  - \r\n`);
        });
    });
});
