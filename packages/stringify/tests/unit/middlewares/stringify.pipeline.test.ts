// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { buildStringifyPipeline } from '../../../src/middlewares/stringify.pipeline.js';
import { resolveStringifyOptions } from '../../../src/stringify.resolver.js';

describe('stringify - unit > middlewares > stringify.pipeline', () => {
    describe('Function: buildStringifyPipeline()', () => {
        it('should build default stringify pipeline with standard middlewares when default options are provided', () => {
            const opts = resolveStringifyOptions();
            const pipeline = buildStringifyPipeline(opts);
            expect(Array.isArray(pipeline)).toBe(true);
            expect(pipeline.length).toBeGreaterThan(0);
        });

        it('should build pipeline with custom resolved options', () => {
            const opts = resolveStringifyOptions({
                fromSemantic: true,
                cleanWhitespace: true,
                useSmartTypes: true,
                tagMapping: { A1: 'AU' },
                customArrayTags: ['C1'],
            });
            const pipeline = buildStringifyPipeline(opts);
            expect(Array.isArray(pipeline)).toBe(true);
            expect(pipeline.length).toBeGreaterThan(0);
        });

        it('should skip arrayCaster middleware when arrayMergeStrategy is false', () => {
            const opts = resolveStringifyOptions({ arrayMergeStrategy: false });
            const pipeline = buildStringifyPipeline(opts);
            expect(Array.isArray(pipeline)).toBe(true);
        });
    });
});
