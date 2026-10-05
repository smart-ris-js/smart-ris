// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { DEFAULT_STRINGIFY_OPTIONS } from '../../src/stringify.options.js';

describe('stringify - unit > stringify.options', () => {
    describe('Constants & Types', () => {
        it('should export valid DEFAULT_STRINGIFY_OPTIONS baseline', () => {
            expect(Object.isFrozen(DEFAULT_STRINGIFY_OPTIONS)).toBe(true);
            expect(DEFAULT_STRINGIFY_OPTIONS.repairTags).toBe(true);
            expect(DEFAULT_STRINGIFY_OPTIONS.skipInvalidTags).toBe(false);
            expect(DEFAULT_STRINGIFY_OPTIONS.skipEmptyTags).toBe(true);
            expect(DEFAULT_STRINGIFY_OPTIONS.eol).toBe('\n');
            expect(DEFAULT_STRINGIFY_OPTIONS.logLevel).toBe('error');
            expect(DEFAULT_STRINGIFY_OPTIONS.cleanWhitespace).toBe(true);
            expect(DEFAULT_STRINGIFY_OPTIONS.mergeMultiline).toBe(false);
            expect(DEFAULT_STRINGIFY_OPTIONS.arrayMergeStrategy).toBe('join-space');
            expect(DEFAULT_STRINGIFY_OPTIONS.fromSemantic).toBe(false);
            expect(DEFAULT_STRINGIFY_OPTIONS.useSmartTypes).toBe(false);
            expect(DEFAULT_STRINGIFY_OPTIONS.dateFormat).toBe('YYYY-MM-DD');
        });
    });
});
