// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { LOG_LEVEL } from '@smart-ris/core';
import { resolveParseOptions } from '../../src/parse.resolver.js';

describe('parse - unit > parse.resolver', () => {
    describe('Function: resolveParseOptions()', () => {
        it('should resolve default options when undefined is passed', () => {
            const opts = resolveParseOptions();
            expect(opts.repairTags).toBe(false);
            expect(opts.skipInvalidTags).toBe(false);
            expect(opts.toSemantic).toBe(false);
            expect(opts.useSmartTypes).toBe(false);
            expect(opts.eol).toBe('\n');
            expect(opts.logLevel).toBe(LOG_LEVEL.error);
        });

        it('should resolve custom options correctly', () => {
            const opts = resolveParseOptions({
                toSemantic: true,
                useSmartTypes: true,
                cleanWhitespace: true,
                tagMapping: { A1: 'AU' },
                customArrayTags: ['C1'],
            });
            expect(opts.toSemantic).toBe(true);
            expect(opts.useSmartTypes).toBe(true);
            expect(opts.cleanWhitespace).toBe(true);
            expect(opts.tagMapping).toEqual({ A1: 'AU' });
            expect(opts.customArrayTags).toContain('C1');
        });

        it('should throw TypeError when options is not an object', () => {
            expect(() => resolveParseOptions(123 as any)).toThrow('Options must be an object.');
        });

        it('should throw TypeError when onError option is not a function', () => {
            expect(() => resolveParseOptions({ onError: 'invalid' as any })).toThrow(
                "Option 'onError' must be a function.",
            );
        });

        it('should throw TypeError for invalid structured options', () => {
            expect(() => resolveParseOptions({ tagMapping: { A1: 5 as never } })).toThrow(TypeError);
            expect(() => resolveParseOptions({ customSemanticMap: { XX: 'title' } })).toThrow(TypeError);
        });
    });
});
