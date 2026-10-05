// Copyright 2026 Martin Winkler

import { describe, expect, it, mock } from 'bun:test';
import { ERROR_MESSAGES, type EolType, RIS_ERROR, type RisErrorContext } from '@smart-ris/core';
import { stringify } from '../../src/index.js';

describe('stringify - integration > embedded-eol', () => {
    describe('Option: eol with line breaks embedded in values', () => {
        it.each([
            ['\\n', '\n' as EolType],
            ['\\r\\n', '\r\n' as EolType],
            ['\\r', '\r' as EolType],
        ])('should use only eol %s when cleanWhitespace and mergeMultiline are false', (_label, eol) => {
            const output = stringify(
                { TY: 'JOUR', AB: 'a\rb\nc\r\nd' },
                { eol, cleanWhitespace: false, mergeMultiline: false },
            );

            expect(output).toBe(`TY  - JOUR${eol}AB  - a${eol}b${eol}c${eol}d${eol}ER  - ${eol}`);
        });

        it.each([
            ['\\n', '\n' as EolType],
            ['\\r\\n', '\r\n' as EolType],
            ['\\r', '\r' as EolType],
        ])('should use only eol %s with default whitespace options', (_label, eol) => {
            const output = stringify({ TY: 'JOUR', AB: 'a\rb\nc\r\nd' }, { eol });

            expect(output).toBe(`TY  - JOUR${eol}AB  - a${eol}b${eol}c${eol}d${eol}ER  - ${eol}`);
        });

        it('should use only eol for every record when serializing an array of records', () => {
            const output = stringify(
                [
                    { TY: 'JOUR', AB: 'x\ny' },
                    { TY: 'BOOK', N1: 'p\rq' },
                ],
                { eol: '\r\n', cleanWhitespace: false, mergeMultiline: false },
            );

            expect(output.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
        });
    });

    describe('Embedded lines starting like a tag header', () => {
        it('should indent tag-like embedded lines by one space and warn once per line', () => {
            const onError = mock((_incident: RisErrorContext) => {});
            const output = stringify(
                { TY: 'JOUR', AB: 'Quote:\nAU  - Smith, John\nER  - \nPlain - text' },
                { eol: '\r\n', cleanWhitespace: false, logLevel: 'warn', onError },
            );

            expect(output).toBe(
                'TY  - JOUR\r\nAB  - Quote:\r\n AU  - Smith, John\r\n ER  - \r\nPlain - text\r\nER  - \r\n',
            );
            expect(onError.mock.calls.map(([incident]) => [incident.error.message, incident.tag, incident.rawLine])).toEqual([
                [ERROR_MESSAGES[RIS_ERROR.TAG_LIKE_CONTINUATION_INDENTED], 'AB', 'AU  - Smith, John'],
                [ERROR_MESSAGES[RIS_ERROR.TAG_LIKE_CONTINUATION_INDENTED], 'AB', 'ER  - '],
            ]);
        });

        it('should not indent a tag-like value start on the tag line itself', () => {
            const onError = mock((_incident: RisErrorContext) => {});
            const output = stringify({ TY: 'JOUR', N1: 'AU  - not a header' }, { logLevel: 'warn', onError });

            expect(output).toBe('TY  - JOUR\nN1  - AU - not a header\nER  - \n');
            expect(onError).not.toHaveBeenCalled();
        });
    });
});
