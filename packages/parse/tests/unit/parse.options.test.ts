// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { DEFAULT_PARSE_OPTIONS, MAX_BUFFER_SIZE, MAX_RECORD_LINES } from '../../src/parse.options.js';

describe('parse - unit > parse.options', () => {
    describe('Constants & Types', () => {
        it('should export MAX_RECORD_LINES constant', () => {
            expect(MAX_RECORD_LINES).toBe(1000);
        });

        it('should export MAX_BUFFER_SIZE constant', () => {
            expect(MAX_BUFFER_SIZE).toBe(10 * 1024 * 1024);
        });

        it('should export valid DEFAULT_PARSE_OPTIONS baseline', () => {
            expect(Object.isFrozen(DEFAULT_PARSE_OPTIONS)).toBe(true);
            expect(DEFAULT_PARSE_OPTIONS.repairTags).toBe(false);
            expect(DEFAULT_PARSE_OPTIONS.skipInvalidTags).toBe(false);
            expect(DEFAULT_PARSE_OPTIONS.skipEmptyTags).toBe(true);
            expect(DEFAULT_PARSE_OPTIONS.eol).toBe('\n');
            expect(DEFAULT_PARSE_OPTIONS.logLevel).toBe('error');
            expect(DEFAULT_PARSE_OPTIONS.cleanWhitespace).toBe(true);
            expect(DEFAULT_PARSE_OPTIONS.mergeMultiline).toBe(false);
            expect(DEFAULT_PARSE_OPTIONS.arrayMergeStrategy).toBe('join-space');
            expect(DEFAULT_PARSE_OPTIONS.toSemantic).toBe(false);
            expect(DEFAULT_PARSE_OPTIONS.useSmartTypes).toBe(false);
            expect(DEFAULT_PARSE_OPTIONS.dateFormat).toBe('YYYY-MM-DD');
        });
    });
});
