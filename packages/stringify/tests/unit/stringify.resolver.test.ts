// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { LOG_LEVEL } from '@smart-ris/core';
import { resolveStringifyOptions } from '../../src/stringify.resolver.js';

describe('stringify - unit > stringify.resolver', () => {
    describe('Function: resolveStringifyOptions()', () => {
        it('should resolve default options when undefined is passed', () => {
            const opts = resolveStringifyOptions();
            expect(opts.repairTags).toBe(true);
            expect(opts.skipInvalidTags).toBe(false);
            expect(opts.fromSemantic).toBe(false);
            expect(opts.useSmartTypes).toBe(false);
            expect(opts.eol).toBe('\n');
            expect(opts.logLevel).toBe(LOG_LEVEL.error);
        });

        it('should resolve custom options correctly', () => {
            const opts = resolveStringifyOptions({
                fromSemantic: true,
                useSmartTypes: true,
                cleanWhitespace: true,
                tagMapping: { A1: 'AU' },
                customArrayTags: ['C1'],
            });
            expect(opts.fromSemantic).toBe(true);
            expect(opts.useSmartTypes).toBe(true);
            expect(opts.cleanWhitespace).toBe(true);
            expect(opts.tagMapping).toEqual({ A1: 'AU' });
            expect(opts.customArrayTags).toContain('C1');
        });

        it('should throw TypeError when options is not an object', () => {
            expect(() => resolveStringifyOptions(123 as any)).toThrow('Options must be an object.');
        });

        it('should throw TypeError when onError option is not a function', () => {
            expect(() => resolveStringifyOptions({ onError: 'invalid' as any })).toThrow(
                "Option 'onError' must be a function.",
            );
        });
    });
});
