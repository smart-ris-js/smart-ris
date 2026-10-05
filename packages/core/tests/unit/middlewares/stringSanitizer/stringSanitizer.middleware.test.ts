// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { RawPipelineRecord } from '../../../../src/core.types.js';
import {
    createStringSanitizer,
    type StringSanitizerOptions,
} from '../../../../src/middlewares/stringSanitizer/stringSanitizer.middleware.js';
import {
    cleanWhitespace,
    mergeMultilineString,
} from '../../../../src/middlewares/stringSanitizer/stringSanitizer.utils.js';

type CleanWhitespaceCase = [string, string];
const runCleanWhitespace = (input: string, expected: string) => {
    const lines = input.split(/\r?\n/);
    const expectedLines = expected === '' ? [] : expected.split('\n');
    expect(cleanWhitespace(lines)).toEqual(expectedLines);
};

type MergeMultilineCase = [string, string];
const runMergeMultiline = (input: string, expected: string) => {
    const lines = input.split(/\r?\n/);
    const expectedLines = expected === '' ? [] : expected.split('\n');
    expect(mergeMultilineString(lines)).toEqual(expectedLines);
};

const defaultOptions: StringSanitizerOptions = {
    cleanWhitespace: true,
    mergeMultiline: false,
    eol: '\n',
};

describe('core - unit > middlewares > stringSanitizer > stringSanitizer.middleware', () => {
    describe('cleanWhitespace()', () => {
        describe('Basic Trimming', () => {
            it.each<CleanWhitespaceCase>([
                ['   hello   ', 'hello'],
                ['\n\nhello\r\n', 'hello'],
                ['\t\nhello\t\n', 'hello'],
                ['\r\n  hello  \n\t', 'hello'],
                ['   ', ''],
                ['\n \t \r\n', ''],
                ['', ''],
            ])('should handles basic trimming | Input: %p', runCleanWhitespace);
        });

        describe('Internal Whitespace Condensation', () => {
            it.each<CleanWhitespaceCase>([
                ['hello    world', 'hello world'],
                ['hello \t \t world', 'hello world'],
                ['hello ,   world !', 'hello , world !'],
                ['hello world', 'hello world'],
            ])('should handles internal whitespace condensation | Input: %p', runCleanWhitespace);
        });

        describe('Multiline Behavior & Indentation', () => {
            it.each<CleanWhitespaceCase>([
                ['   First line   \nSecond line', 'First line\nSecond line'],
                ['Line 1\n   Line 2\n\tLine 3\n  \t  Line 4', 'Line 1\n   Line 2\n\tLine 3\n  \t  Line 4'],
                ['Line 1\n   Line   2   with   spaces\n\tLine   3', 'Line 1\n   Line 2 with spaces\n\tLine 3'],
                ['Line 1   \n  Line 2   \n\tLine 3 \t ', 'Line 1\n  Line 2\n\tLine 3'],
            ])('should handles multiline behavior & indentation | Input: %p', runCleanWhitespace);
        });

        describe('Newline Normalization', () => {
            it.each<CleanWhitespaceCase>([
                ['Line 1\r\nLine 2', 'Line 1\nLine 2'],
                ['Line 1\n\n\nLine 2', 'Line 1\n\nLine 2'],
                ['Line 1\n\n\n\n\nLine 2', 'Line 1\n\nLine 2'],
                ['Line 1\n\nLine 2', 'Line 1\n\nLine 2'],
                ['Line 1\n\n\n', 'Line 1'],
                ['Line 1\n   \nLine 2', 'Line 1\n\nLine 2'],
                ['Line 1\n \t \n \nLine 2', 'Line 1\n\nLine 2'],
                ['Line 1\n\n\n\nLine 2\n\n\n\nLine 3', 'Line 1\n\nLine 2\n\nLine 3'],
                ['\n\n\nLine 1\n\n\nLine 2\n\n\n', 'Line 1\n\nLine 2'],
            ])('should handles newline normalization | Input: %p', runCleanWhitespace);
        });

        describe('Edge Cases & Special Characters', () => {
            it.each<CleanWhitespaceCase>([
                ['hello\u00A0\u00A0world', 'hello world'],
                ['hello\0world', 'hello\0world'],
                [`a ${' '.repeat(10000)}b`, 'a b'],
                ['!@#$%^&*()_+', '!@#$%^&*()_+'],
            ])('should handles edge cases & special characters | Input: %p', runCleanWhitespace);
        });
    });

    describe('mergeMultilineString()', () => {
        describe('Basic Merging', () => {
            it.each<MergeMultilineCase>([
                ['Line 1\nLine 2\nLine 3', 'Line 1 Line 2 Line 3'],
                ['Line 1\r\nLine 2\r\nLine 3', 'Line 1 Line 2 Line 3'],
                ['   Single Line   ', 'Single Line'],
            ])('should handles basic merging | Input: %p', runMergeMultiline);
        });

        describe('Empty and Whitespace-only Lines', () => {
            it.each<MergeMultilineCase>([
                ['Line 1\n\nLine 2', 'Line 1 Line 2'],
                ['Line 1\n\n\n\nLine 2', 'Line 1 Line 2'],
                ['Line 1\n   \n\t\nLine 2', 'Line 1 Line 2'],
                ['\n   \n\t\n', ''],
                ['   ', ''],
                ['', ''],
            ])('should handles empty and whitespace-only lines | Input: %p', runMergeMultiline);
        });

        describe('Line Content Trimming vs Internal Spacing', () => {
            it.each<MergeMultilineCase>([
                ['  Line 1  \n  Line 2  ', 'Line 1 Line 2'],
                ['Line   1\nLine \t 2', 'Line   1 Line \t 2'],
            ])('should handles line content trimming vs internal spacing | Input: %p', runMergeMultiline);
        });

        describe('Edge Cases', () => {
            it.each<MergeMultilineCase>([
                ['\n\n\n\r\n\r\n', ''],
                ['One\nTwo\nThree', 'One Two Three'],
                ['\tWord1\t\n\tWord2\r\nWord3', 'Word1 Word2 Word3'],
            ])('should handles edge cases | Input: %p', runMergeMultiline);
        });
    });

    describe('Function: createStringSanitizer() - Initialization', () => {
        it('should successfully initialize when provided options', () => {
            const middleware = createStringSanitizer({ ...defaultOptions, eol: '\n' });
            expect(middleware).toBeTypeOf('function');
        });

        it('should successfully initialize with explicit valid options', () => {
            const middleware = createStringSanitizer({
                ...defaultOptions,
                cleanWhitespace: false,
                mergeMultiline: true,
                eol: '\n',
            });
            expect(middleware).toBeTypeOf('function');
        });
    });

    describe('Middleware Logic - Payload Processing', () => {
        interface StringSanitizerTestCase {
            name: string;
            options: Partial<StringSanitizerOptions>;
            payload: RawPipelineRecord;
            expected: RawPipelineRecord;
        }

        const PAYLOAD_SCENARIOS: StringSanitizerTestCase[] = [
            {
                name: 'pass-through non-strings and nulls completely unchanged',
                options: {},
                payload: { n: null as any, num: 123 as any, bool: true as any },
                expected: { n: null, num: 123, bool: true },
            },
            {
                name: 'process string scalar - cleanWhitespace only (default behavior)',
                options: { cleanWhitespace: true, mergeMultiline: false },
                payload: { str: '  line 1  \n\n   line 2  ' },
                expected: { str: 'line 1\n\n   line 2' },
            },
            {
                name: 'process string scalar - mergeMultiline only',
                options: { cleanWhitespace: false, mergeMultiline: true },
                payload: { str: 'line 1\nline 2' },
                expected: { str: 'line 1 line 2' },
            },
            {
                name: 'process string scalar - both options enabled',
                options: { cleanWhitespace: true, mergeMultiline: true },
                payload: { str: '  line 1  \n  line 2  ' },
                expected: { str: 'line 1 line 2' },
            },
            {
                name: 'process string scalar - neither option enabled (only base split/join/trim happens)',
                options: { cleanWhitespace: false, mergeMultiline: false },
                payload: { str: '  line 1  \n  line 2  ' },
                expected: { str: 'line 1  \n  line 2' },
            },
            {
                name: 'process arrays - iterate and sanitize individual elements while respecting type safety',
                options: { cleanWhitespace: true, mergeMultiline: true },
                payload: { arr: ['  first  ', null as any, 123 as any, '  second  \n  line  '] },
                expected: { arr: ['first', null, 123, 'second line'] },
            },
        ];

        it.each(PAYLOAD_SCENARIOS)('should $name', ({ options, payload, expected }) => {
            const middleware = createStringSanitizer({ ...defaultOptions, ...options, eol: '\n' });
            const result = middleware(payload);
            expect(result).toEqual(expected);
        });
    });
});
