// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import {
    DEFAULT_ARRAY_TAGS,
    DEFAULT_ARRAY_TAGS_SET,
    DEFAULT_REFERENCE_TYPE,
    DEFAULT_SMART_CAST_SCHEMA,
    DEFAULT_UPPERCASE_TAG_MAP,
    invertedTag,
    REGEX_INTERNAL_SPACES,
    REGEX_SPLIT_LINES,
    REGEX_TAG_FORMAT,
    recordType,
    tag,
} from '../../src/core.constants.js';
import {
    LOG_LEVEL,
    VALID_ARRAY_MERGE_STRATEGIES,
    VALID_ARRAY_MERGE_STRATEGIES_SET,
    VALID_CAST_TYPES,
    VALID_CAST_TYPES_SET,
    VALID_DATE_FORMATS,
    VALID_DATE_FORMATS_SET,
    VALID_EOL,
    VALID_EOL_SET,
    VALID_LOG_LEVELS,
    VALID_LOG_LEVELS_SET,
} from '../../src/core.options.js';

describe('core - unit > constants', () => {
    describe('Type Map', () => {
        it('should recordType mapping is strictly typed and has correct structure', () => {
            expect(Object.keys(recordType)).toHaveLength(56);
            expect(Object.isFrozen(recordType)).toBe(true);
        });

        it('should DEFAULT_REFERENCE_TYPE is generic GEN', () => {
            expect(DEFAULT_REFERENCE_TYPE).toBe('GEN');
            expect(DEFAULT_REFERENCE_TYPE).toBe(recordType.generic);
        });

        it('should map every recordType key to an uppercase alphanumeric value', () => {
            for (const value of Object.values(recordType)) {
                expect(value).toMatch(/^[A-Z0-9]+$/);
            }
        });

        it('should specific known types are mapped correctly', () => {
            expect(recordType.journal).toBe('JOUR');
            expect(recordType.book).toBe('BOOK');
            expect(recordType.editedBook).toBe('EDBOOK');
            expect(recordType.computerProgram).toBe('COMP');
            expect(recordType.standard).toBe('STAND');
        });
    });

    describe('Tag Map', () => {
        it('should tag mapping is strictly typed and has correct structure', () => {
            expect(Object.keys(tag)).toHaveLength(93);
            expect(Object.isFrozen(tag)).toBe(true);
        });

        it('should map every tag key to exactly 2 uppercase alphanumeric characters', () => {
            for (const value of Object.values(tag)) {
                expect(value).toMatch(/^[A-Z0-9]{2}$/);
            }
        });

        it('should specific known tags are mapped correctly', () => {
            expect(tag.title).toBe('TI');
            expect(tag.author).toBe('AU');
            expect(tag.date).toBe('DA');
            expect(tag.typeOfReference).toBe('TY');
            expect(tag.endOfReference).toBe('ER');
        });

        it('should contain completely unique RIS tag values across all keys', () => {
            const values = Object.values(tag).flat();
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });

        it('should invertedTag is frozen and has null prototype', () => {
            expect(Object.isFrozen(invertedTag)).toBe(true);
            expect(Object.getPrototypeOf(invertedTag)).toBeNull();
            expect(invertedTag.TI).toBe('title');
            expect(invertedTag.AU).toBe('author');
        });

        it('should DEFAULT_UPPERCASE_TAG_MAP is frozen and has null prototype', () => {
            expect(Object.isFrozen(DEFAULT_UPPERCASE_TAG_MAP)).toBe(true);
            expect(Object.getPrototypeOf(DEFAULT_UPPERCASE_TAG_MAP)).toBeNull();
            expect(DEFAULT_UPPERCASE_TAG_MAP.TITLE).toBe('TI');
            expect(DEFAULT_UPPERCASE_TAG_MAP.AUTHOR).toBe('AU');
        });
    });

    describe('Default Arrays and Schemas', () => {
        it('should dEFAULT_ARRAY_TAGS contains exact standard 2-char tags and is frozen', () => {
            expect(Array.isArray(DEFAULT_ARRAY_TAGS)).toBe(true);
            expect(DEFAULT_ARRAY_TAGS).toHaveLength(17);
            expect(Object.isFrozen(DEFAULT_ARRAY_TAGS)).toBe(true);

            DEFAULT_ARRAY_TAGS.forEach((t) => {
                expect(typeof t).toBe('string');
                expect(t).toMatch(/^[A-Z0-9]{2}$/);
            });

            expect(DEFAULT_ARRAY_TAGS).toContain('AU');
            expect(DEFAULT_ARRAY_TAGS).toContain('KW');
            expect(DEFAULT_ARRAY_TAGS).toContain('UR');
        });

        it('should DEFAULT_ARRAY_TAGS_SET is a Set containing all default array tags', () => {
            expect(DEFAULT_ARRAY_TAGS_SET instanceof Set).toBe(true);
            expect(DEFAULT_ARRAY_TAGS_SET.size).toBe(DEFAULT_ARRAY_TAGS.length);
            expect(DEFAULT_ARRAY_TAGS_SET.has('AU')).toBe(true);
            expect(DEFAULT_ARRAY_TAGS_SET.has('KW')).toBe(true);
            expect(DEFAULT_ARRAY_TAGS_SET.has('UR')).toBe(true);
        });

        it('should dEFAULT_SMART_CAST_SCHEMA maps 2-char tags to specific cast types and is frozen with null prototype', () => {
            expect(typeof DEFAULT_SMART_CAST_SCHEMA).toBe('object');
            expect(DEFAULT_SMART_CAST_SCHEMA).not.toBeNull();
            expect(Object.isFrozen(DEFAULT_SMART_CAST_SCHEMA)).toBe(true);
            expect(Object.getPrototypeOf(DEFAULT_SMART_CAST_SCHEMA)).toBeNull();

            Object.entries(DEFAULT_SMART_CAST_SCHEMA).forEach(([key, value]) => {
                expect(key).toMatch(/^[A-Z0-9]{2}$/);
                expect(['date', 'number']).toContain(value);
            });

            expect(DEFAULT_SMART_CAST_SCHEMA.DA).toBe('date');
            expect(DEFAULT_SMART_CAST_SCHEMA.VL).toBe('number');
        });
    });

    describe('Validation Constants (Unions)', () => {
        it('should vALID_EOL contains exact EOL characters and is frozen with companion Set', () => {
            expect(VALID_EOL).toEqual(['\n', '\r\n', '\r']);
            expect(Object.isFrozen(VALID_EOL)).toBe(true);
            expect(VALID_EOL_SET instanceof Set).toBe(true);
            expect(VALID_EOL_SET.size).toBe(VALID_EOL.length);
            expect(VALID_EOL_SET.has('\n')).toBe(true);
        });

        it('should vALID_ARRAY_MERGE_STRATEGIES contains expected strategies and is frozen with companion Set', () => {
            expect(VALID_ARRAY_MERGE_STRATEGIES).toEqual(['first', 'last', 'join-space', 'join-newline']);
            expect(Object.isFrozen(VALID_ARRAY_MERGE_STRATEGIES)).toBe(true);
            expect(VALID_ARRAY_MERGE_STRATEGIES_SET instanceof Set).toBe(true);
            expect(VALID_ARRAY_MERGE_STRATEGIES_SET.size).toBe(VALID_ARRAY_MERGE_STRATEGIES.length);
            expect(VALID_ARRAY_MERGE_STRATEGIES_SET.has('first')).toBe(true);
        });

        it('should vALID_DATE_FORMATS contains expected formats and is frozen with companion Set', () => {
            expect(VALID_DATE_FORMATS).toEqual(['YYYY-MM-DD', 'YYYY-MM', 'YYYY/MM/DD', 'YYYY/MM', 'YYYY']);
            expect(Object.isFrozen(VALID_DATE_FORMATS)).toBe(true);
            expect(VALID_DATE_FORMATS_SET instanceof Set).toBe(true);
            expect(VALID_DATE_FORMATS_SET.size).toBe(VALID_DATE_FORMATS.length);
            expect(VALID_DATE_FORMATS_SET.has('YYYY-MM-DD')).toBe(true);
        });

        it('should vALID_CAST_TYPES contains exact valid types and is frozen with companion Set', () => {
            expect(VALID_CAST_TYPES).toEqual(['string', 'number', 'boolean', 'date']);
            expect(Object.isFrozen(VALID_CAST_TYPES)).toBe(true);
            expect(VALID_CAST_TYPES_SET instanceof Set).toBe(true);
            expect(VALID_CAST_TYPES_SET.size).toBe(VALID_CAST_TYPES.length);
            expect(VALID_CAST_TYPES_SET.has('string')).toBe(true);
        });

        it('should vALID_LOG_LEVELS contains valid log levels and is frozen with companion Set', () => {
            expect(VALID_LOG_LEVELS).toEqual(['silent', 'error', 'warn', 'info']);
            expect(Object.isFrozen(VALID_LOG_LEVELS)).toBe(true);
            expect(VALID_LOG_LEVELS_SET instanceof Set).toBe(true);
            expect(VALID_LOG_LEVELS_SET.size).toBe(VALID_LOG_LEVELS.length);
            expect(VALID_LOG_LEVELS_SET.has('error')).toBe(true);
        });

        it('should LOG_LEVEL is frozen and has null prototype', () => {
            expect(Object.isFrozen(LOG_LEVEL)).toBe(true);
            expect(Object.getPrototypeOf(LOG_LEVEL)).toBeNull();
            expect(LOG_LEVEL.silent).toBe(-1);
            expect(LOG_LEVEL.error).toBe(0);
            expect(LOG_LEVEL.warn).toBe(1);
            expect(LOG_LEVEL.info).toBe(2);
        });
    });

    describe('Regex Patterns', () => {
        describe('Regex: REGEX_TAG_FORMAT', () => {
            it.each(['A1', 'TY', 'ER', '00', '99', 'ZZ', 'AU', 'TI', 'KW', 'C1', 'U9', '1A'])(
                'should match valid 2-character uppercase alphanumeric RIS tags | Input: %p',
                (input) => {
                    expect(REGEX_TAG_FORMAT.test(input)).toBe(true);
                },
            );

            it.each([
                '',
                'A',
                '1',
                'A12',
                'ABC',
                'a1',
                'ty',
                'au',
                'A-',
                'A_',
                'A ',
                ' A',
                'A\n',
                'A\t',
                'A#',
                'A$',
                'A@',
                'A.',
                '1-',
                '-- ',
                'Ä1',
                'ß2',
            ])('should reject invalid or non-2-character tags | Input: %p', (input) => {
                expect(REGEX_TAG_FORMAT.test(input)).toBe(false);
            });
        });

        describe('Regex: REGEX_SPLIT_LINES', () => {
            it.each([
                ['a\nb', ['a', 'b']],
                ['a\r\nb', ['a', 'b']],
                ['a\rb', ['a', 'b']],
                ['line1\nline2\r\nline3\rline4', ['line1', 'line2', 'line3', 'line4']],
                ['single', ['single']],
                ['\nleading', ['', 'leading']],
                ['trailing\n', ['trailing', '']],
            ])('should split across all standard newline characters | Input: %p', (input, expected) => {
                expect(input.split(REGEX_SPLIT_LINES)).toEqual(expected);
            });
        });

        describe('Regex: REGEX_INTERNAL_SPACES', () => {
            it('should match multiple consecutive whitespace characters following a non-whitespace character', () => {
                expect('a  b'.replace(REGEX_INTERNAL_SPACES, ' ')).toBe('a b');
                expect('hello   world  test'.replace(REGEX_INTERNAL_SPACES, ' ')).toBe('hello world test');
            });

            it('should not match leading whitespace or single spaces', () => {
                expect('  leading'.replace(REGEX_INTERNAL_SPACES, ' ')).toBe('  leading');
                expect('single space'.replace(REGEX_INTERNAL_SPACES, ' ')).toBe('single space');
            });
        });
    });
});
