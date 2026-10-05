// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { tag as DEFAULT_SEMANTIC_TAGS_MAP } from '@smart-ris/core';
import { createSemanticMapper } from '../../../../src/middlewares/semanticMapper/semanticMapper.middleware.js';

const defaultComputedMap: Record<string, string> = Object.create(null);
for (const semantic in DEFAULT_SEMANTIC_TAGS_MAP) {
    defaultComputedMap[DEFAULT_SEMANTIC_TAGS_MAP[semantic as keyof typeof DEFAULT_SEMANTIC_TAGS_MAP]] = semantic;
}

describe('parse - unit > middlewares > semanticMapper > semanticMapper.middleware', () => {
    describe('Factory: createSemanticMapper() Configuration', () => {
        it('should successfully initialize when provided options', () => {
            const middleware = createSemanticMapper({ computedSemanticMap: defaultComputedMap });
            expect(middleware).toBeTypeOf('function');
        });
    });

    describe('Middleware: (payload) => payload Execution', () => {
        it('should pass-through payload unmodified if no map matches', () => {
            const middleware = createSemanticMapper({ computedSemanticMap: defaultComputedMap });
            const payload = { XX: ['Unknown'] };
            const result = middleware(payload);
            expect(result).toEqual({ XX: ['Unknown'] });
        });

        it('should apply default mappings correctly and delete original source keys', () => {
            const middleware = createSemanticMapper({ computedSemanticMap: defaultComputedMap });
            const payload = { AU: ['Smith'], TI: ['Title'] };
            const result = middleware(payload);
            expect(result).toEqual({ author: ['Smith'], title: ['Title'] });
            expect('AU' in result).toBe(false);
            expect('TI' in result).toBe(false);
        });

        it('should apply custom mappings correctly', () => {
            const customMap = { ...defaultComputedMap, XX: 'customField', YY: 'anotherField' };
            const middleware = createSemanticMapper({
                computedSemanticMap: customMap,
            });
            const payload = { XX: ['Value 1'], YY: ['Value 2'] };
            const result = middleware(payload);
            expect(result).toEqual({ customField: ['Value 1'], anotherField: ['Value 2'] });
        });

        it('should handle merging source into an undefined target', () => {
            const middleware = createSemanticMapper({ computedSemanticMap: defaultComputedMap });
            const payload = { AU: ['Smith'] };
            const result = middleware(payload);
            expect(result).toEqual({ author: ['Smith'] });
        });

        it('should handle merging an array source into an existing array target', () => {
            const middleware = createSemanticMapper({ computedSemanticMap: defaultComputedMap });
            const payload = { AU: ['Smith', 'Williams'], author: ['Doe', 'Jones'] };
            const result = middleware(payload);
            expect(result).toEqual({ author: ['Doe', 'Jones', 'Smith', 'Williams'] });
        });

        it('should map uppercase semantic names directly to target semantic keys', () => {
            const middleware = createSemanticMapper({ computedSemanticMap: defaultComputedMap });
            const payload = { AUTHOR: ['Smith'], TITLE: ['My Paper'] };
            const result = middleware(payload);
            expect(result).toEqual({ author: ['Smith'], title: ['My Paper'] });
            expect('AUTHOR' in result).toBe(false);
            expect('TITLE' in result).toBe(false);
        });

        it('should merge both raw RIS tag and uppercase semantic tag into the same target key', () => {
            const middleware = createSemanticMapper({ computedSemanticMap: defaultComputedMap });
            const payload = { AU: ['Alpha'], AUTHOR: ['Beta', 'Gamma'] };
            const result = middleware(payload);
            expect(result).toEqual({ author: ['Alpha', 'Beta', 'Gamma'] });
            expect('AU' in result).toBe(false);
            expect('AUTHOR' in result).toBe(false);
        });

        it('should keep native values of an uppercase semantic key when its alias tag is visited first', () => {
            const middleware = createSemanticMapper({ computedSemanticMap: { XX: 'ISBN' } });
            const result = middleware({ XX: ['Alias'], ISBN: ['Native'] });
            expect(result).toEqual({ ISBN: ['Native', 'Alias'] });
        });

        it('should process mappings in a single pass without entering infinite loops on newly added keys', () => {
            const customMap = { XX: 'author', AU: 'title' };
            const middleware = createSemanticMapper({ computedSemanticMap: customMap });
            const payload = { XX: ['Custom Author'], AU: ['Main Title'] };
            const result = middleware(payload);
            expect(result).toEqual({ author: ['Custom Author'], title: ['Main Title'] });
        });
    });
});
