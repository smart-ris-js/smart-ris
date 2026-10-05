// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { StringifyPipelineRecord } from '@smart-ris/core';
import { DEFAULT_UPPERCASE_TAG_MAP } from '@smart-ris/core';

import { createSemanticUnmapper } from '../../../../src/middlewares/semanticUnmapper/semanticUnmapper.middleware.js';

describe('stringify - unit > middlewares > semanticUnmapper > semanticUnmapper.middleware', () => {
    describe('Function: createSemanticUnmapper()', () => {
        it('should map semantic keys to RIS tags', () => {
            const middleware = createSemanticUnmapper({ computedSemanticMap: DEFAULT_UPPERCASE_TAG_MAP });
            const payload: StringifyPipelineRecord = {
                TYPEOFREFERENCE: ['JOUR'],
                TITLE: ['Test Title'],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                TY: ['JOUR'],
                TI: ['Test Title'],
            });
        });

        it('should support custom semantic mappings', () => {
            const customMap = { ...DEFAULT_UPPERCASE_TAG_MAP, MYCUSTOMFIELD: 'XX' };
            const middleware = createSemanticUnmapper({
                computedSemanticMap: customMap,
            });
            const payload: StringifyPipelineRecord = {
                MYCUSTOMFIELD: ['Custom Value'],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                XX: ['Custom Value'],
            });
        });

        it('should correctly handle merging array values and existing target values', () => {
            const customMap = { ...DEFAULT_UPPERCASE_TAG_MAP, MYCUSTOMFIELD: 'XX' };
            const middleware = createSemanticUnmapper({
                computedSemanticMap: customMap,
            });
            const payload: StringifyPipelineRecord = {
                MYCUSTOMFIELD: ['Val 1', 'Val 2'],
                XX: ['Existing Value'], // Already exists as RIS tag
            };
            const result = middleware(payload);
            expect(result).toEqual({
                XX: ['Existing Value', 'Val 1', 'Val 2'],
            });
        });
    });
});
