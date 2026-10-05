// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { RawArrayPipelineRecord } from '../../../../src/core.types.js';
import { createTagMapper } from '../../../../src/middlewares/tagMapper/tagMapper.middleware.js';

describe('core - unit > middlewares > tagMapper > tagMapper.middleware', () => {
    describe('Function: createTagMapper()', () => {
        it('should successfully initialize when provided options', () => {
            const middleware = createTagMapper({ tagMapping: {} });
            expect(middleware).toBeTypeOf('function');
        });

        it('should successfully initialize with a valid tagMapping object', () => {
            const middleware = createTagMapper({ tagMapping: { A1: 'AU' } });
            expect(middleware).toBeTypeOf('function');
        });
    });

    describe('Middleware Logic', () => {
        it('should return payload unmodified when tagMapping is empty', () => {
            const middleware = createTagMapper({ tagMapping: {} });
            const payload: RawArrayPipelineRecord = { TY: ['JOUR'], A1: ['Author'] };

            const result = middleware(payload);

            expect(result).toEqual({ TY: ['JOUR'], A1: ['Author'] });
        });

        it('should skip redundant mappings preventing unnecessary mutations', () => {
            const middleware = createTagMapper({ tagMapping: { A1: 'A1', A2: 'A2' } });
            const payload: RawArrayPipelineRecord = { A1: ['Author'], A2: ['Author 2'] };

            const result = middleware(payload);

            expect(result).toEqual({ A1: ['Author'], A2: ['Author 2'] });
        });

        it('should rename source tag and move its values to unpopulated target tag', () => {
            const middleware = createTagMapper({ tagMapping: { A1: 'AU' } });
            const payload: RawArrayPipelineRecord = { TY: ['JOUR'], A1: ['Author'] };

            const result = middleware(payload);

            expect(result).toEqual({ TY: ['JOUR'], AU: ['Author'] });
        });

        it('should append source values to existing target values', () => {
            const middleware = createTagMapper({ tagMapping: { A1: 'AU' } });
            const payload: RawArrayPipelineRecord = { TY: ['JOUR'], AU: ['Author 1'], A1: ['Author 2'] };

            const result = middleware(payload);

            expect(result).toEqual({ TY: ['JOUR'], AU: ['Author 1', 'Author 2'] });
        });

        it('should remap uppercase source tag to target tag', () => {
            const middleware = createTagMapper({ tagMapping: { A1: 'AU' } });
            const payload: RawArrayPipelineRecord = { TY: ['JOUR'], A1: ['Author'] };

            const result = middleware(payload);

            expect(result).toEqual({ TY: ['JOUR'], AU: ['Author'] });
        });

        it('should ignore mapping if source tag is missing from payload', () => {
            const middleware = createTagMapper({ tagMapping: { A1: 'AU' } });
            const payload: RawArrayPipelineRecord = { TY: ['JOUR'], AU: ['Author'] };

            const result = middleware(payload);

            expect(result).toEqual({ TY: ['JOUR'], AU: ['Author'] });
        });

        it('should delete the original source key from the payload', () => {
            const middleware = createTagMapper({ tagMapping: { A1: 'AU' } });
            const payload: RawArrayPipelineRecord = { TY: ['JOUR'], A1: ['Author'] };

            const result = middleware(payload);

            expect(result).not.toHaveProperty('A1');
            expect(result).toHaveProperty('AU');
        });

        it('should remap source tag to target tag in a single pass without re-evaluating target keys created during iteration', () => {
            const middleware = createTagMapper({ tagMapping: { AU: 'A1', A1: 'AU' } as any });
            const payload: RawArrayPipelineRecord = { AU: ['Original AU'] };

            const result = middleware(payload);

            // Verifies single-pass remapping: AU is remapped to A1 without entering an infinite loop or re-processing A1 back to AU
            expect(result).toEqual({ A1: ['Original AU'] });
        });

        it('should correctly cross-swap tags when both are present in payload', () => {
            const middleware = createTagMapper({ tagMapping: { AU: 'A1', A1: 'AU' } as any });
            const payload: RawArrayPipelineRecord = { AU: ['AU Val'], A1: ['A1 Val'] };

            const result = middleware(payload);

            expect(result).toEqual({ A1: ['AU Val'], AU: ['A1 Val'] });
        });
    });
});
