// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { buildParsePipeline } from '../../../src/middlewares/parse.pipeline.js';
import { resolveParseOptions } from '../../../src/parse.resolver.js';

describe('parse - unit > middlewares > parse.pipeline', () => {
    describe('Function: buildParsePipeline()', () => {
        it('should return default pipeline of length 2 (ArrayCaster, StringSanitizer) when default options provided', () => {
            const opts = resolveParseOptions();
            const pipeline = buildParsePipeline(opts);
            expect(Array.isArray(pipeline)).toBe(true);
            expect(pipeline.length).toBe(2);
        });

        it('should include TagMapper when tagMapping is provided and not empty', () => {
            const opts = resolveParseOptions({ tagMapping: { A1: 'AU' } });
            const pipeline = buildParsePipeline(opts);
            expect(pipeline.length).toBe(3);
        });

        it('should NOT include TagMapper when tagMapping is empty object', () => {
            const opts = resolveParseOptions({ tagMapping: {} });
            const pipeline = buildParsePipeline(opts);
            expect(pipeline.length).toBe(2);
        });

        it('should include SemanticMapper when toSemantic is true', () => {
            const opts = resolveParseOptions({ toSemantic: true });
            const pipeline = buildParsePipeline(opts);
            expect(pipeline.length).toBe(3);
        });

        it('should NOT include ArrayCaster when arrayMergeStrategy is false', () => {
            const opts = resolveParseOptions({ arrayMergeStrategy: false });
            const pipeline = buildParsePipeline(opts);
            expect(pipeline.length).toBe(1);
        });

        it('should include ArrayCaster and merge custom tags when customArrayTags provided', () => {
            const opts = resolveParseOptions({ customArrayTags: ['C1'] });
            const pipeline = buildParsePipeline(opts);
            expect(pipeline.length).toBe(2);
        });

        it('should NOT include StringSanitizer when BOTH cleanWhitespace and mergeMultiline are false', () => {
            const opts = resolveParseOptions({ cleanWhitespace: false, mergeMultiline: false });
            const pipeline = buildParsePipeline(opts);
            expect(pipeline.length).toBe(1);
        });

        it('should omit StringSanitizer when cleanWhitespace is false but include when cleanWhitespace is default true', () => {
            const opts1 = resolveParseOptions({ cleanWhitespace: false });
            expect(buildParsePipeline(opts1).length).toBe(1);

            const opts2 = resolveParseOptions({ mergeMultiline: false });
            expect(buildParsePipeline(opts2).length).toBe(2);
        });

        it('should include TypeCaster when useSmartTypes is true', () => {
            const opts = resolveParseOptions({ useSmartTypes: true });
            const pipeline = buildParsePipeline(opts);
            expect(pipeline.length).toBe(3);
        });

        it('should handle ALL options enabled simultaneously', () => {
            const opts = resolveParseOptions({
                tagMapping: { A1: 'AU' },
                toSemantic: true,
                cleanWhitespace: true,
                useSmartTypes: true,
            });
            const pipeline = buildParsePipeline(opts);
            expect(pipeline.length).toBe(5);
        });
    });
});
