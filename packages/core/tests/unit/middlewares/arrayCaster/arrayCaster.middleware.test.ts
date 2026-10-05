// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { DEFAULT_ARRAY_TAGS, invertedTag } from '../../../../src/core.constants.js';
import type { RawArrayPipelineRecord, RawPipelineRecord } from '../../../../src/core.types.js';
import {
    type ArrayCasterOptions,
    createArrayCaster,
} from '../../../../src/middlewares/arrayCaster/arrayCaster.middleware.js';

const defaultOptions: ArrayCasterOptions = {
    arrayTags: [...DEFAULT_ARRAY_TAGS] as any,
    arrayMergeStrategy: 'join-space',
    forStringify: true,
    semanticMap: { ...invertedTag },
};

describe('core - unit > middlewares > arrayCaster > arrayCaster.middleware', () => {
    describe('Function: createArrayCaster() - Initialization', () => {
        it('should successfully initialize when provided options', () => {
            const middleware = createArrayCaster(defaultOptions);
            expect(middleware).toBeTypeOf('function');
        });

        it('should successfully initialize with forStringify: false and custom strategies', () => {
            const middleware = createArrayCaster({
                ...defaultOptions,
                forStringify: false,
                arrayMergeStrategy: 'last',
            });
            expect(middleware).toBeTypeOf('function');
        });
    });

    describe('Middleware Logic - Payload Processing', () => {
        interface ArrayCasterTestCase {
            name: string;
            options: Partial<ArrayCasterOptions>;
            semanticMap?: Record<string, string>;
            payload: RawArrayPipelineRecord;
            expected: RawPipelineRecord;
        }

        const PAYLOAD_SCENARIOS: ArrayCasterTestCase[] = [
            {
                name: 'preserve array structure for registered RIS tags (ignoring merge strategy)',
                options: { arrayTags: ['A1'] as any, arrayMergeStrategy: 'join-space' },
                payload: { A1: ['Author 1', 'Author 2'] },
                expected: { A1: ['Author 1', 'Author 2'] },
            },
            {
                name: 'wrap scalar values in an array for registered RIS tags',
                options: { arrayTags: ['A1'] as any },
                payload: { A1: ['Author 1'] },
                expected: { A1: ['Author 1'] },
            },
            {
                name: 'keep array in array for registered RIS tags',
                options: { arrayTags: ['A1'] as any },
                payload: { A1: ['Author 1'] },
                expected: { A1: ['Author 1'] },
            },
            {
                name: 'preserve array structure for semantic equivalents of registered RIS tags',
                options: { arrayTags: ['A1'] as any, forStringify: false },
                payload: { primaryAuthor: ['Author 1', 'Author 2'] },
                expected: { primaryAuthor: ['Author 1', 'Author 2'] },
            },
            {
                name: 'preserve array structure for custom semantic equivalents passed in semanticMap',
                options: { arrayTags: ['XY'] as any, forStringify: false },
                semanticMap: { XY: 'customSemantic' },
                payload: { customSemantic: ['Val 1', 'Val 2'] },
                expected: { customSemantic: ['Val 1', 'Val 2'] },
            },
            {
                name: "merge non-array tags using 'join-space' strategy",
                options: { arrayTags: [], arrayMergeStrategy: 'join-space', forStringify: false },
                payload: { TI: ['Title', 'Part 2'] },
                expected: { TI: 'Title Part 2' as any },
            },
            {
                name: "merge non-array tags using 'join-newline' strategy",
                options: { arrayTags: [], arrayMergeStrategy: 'join-newline', forStringify: false },
                payload: { TI: ['Title', 'Part 2'] },
                expected: { TI: 'Title\nPart 2' as any },
            },
            {
                name: "merge non-array tags using 'join-newline' strategy with custom eol (\\r\\n)",
                options: { arrayTags: [], arrayMergeStrategy: 'join-newline', forStringify: false, eol: '\r\n' },
                payload: { TI: ['Title', 'Part 2'] },
                expected: { TI: 'Title\r\nPart 2' as any },
            },
            {
                name: "merge non-array tags using 'first' strategy",
                options: { arrayTags: [], arrayMergeStrategy: 'first', forStringify: false },
                payload: { TI: ['Title', 'Part 2'] },
                expected: { TI: 'Title' as any },
            },
            {
                name: "merge non-array tags using 'last' strategy",
                options: { arrayTags: [], arrayMergeStrategy: 'last', forStringify: false },
                payload: { TI: ['Title', 'Part 2'] },
                expected: { TI: 'Part 2' as any },
            },
            {
                name: 'filter out null elements before applying merge strategies',
                options: { arrayTags: [], arrayMergeStrategy: 'join-space', forStringify: false },
                payload: { TI: ['Title', null, 'Part 2'] },
                expected: { TI: 'Title Part 2' as any },
            },
            {
                name: 'return null if the array only contained null elements',
                options: { arrayTags: [], forStringify: false },
                payload: { TI: [null, null] },
                expected: { TI: null },
            },
            {
                name: "return null if the array only contained null elements with 'first' strategy",
                options: { arrayTags: [], arrayMergeStrategy: 'first', forStringify: false },
                payload: { TI: [null, null] },
                expected: { TI: null },
            },
            {
                name: "return null if the array only contained null elements with 'last' strategy",
                options: { arrayTags: [], arrayMergeStrategy: 'last', forStringify: false },
                payload: { TI: [null, null] },
                expected: { TI: null },
            },
            {
                name: 'return the single valid element directly without joining',
                options: { arrayTags: [], arrayMergeStrategy: 'join-space', forStringify: false },
                payload: { TI: [null, 'Title'] },
                expected: { TI: 'Title' as any },
            },
            {
                name: 'wrap the final merged primitive inside an array when forStringify is true',
                options: { arrayTags: [], arrayMergeStrategy: 'join-space', forStringify: true },
                payload: { TI: ['Title', 'Part 2'] },
                expected: { TI: ['Title Part 2'] },
            },
            {
                name: 'wrap single primitive values inside an array when forStringify is true and it is not an array tag',
                options: { arrayTags: [], forStringify: true },
                payload: { TI: ['Title'] },
                expected: { TI: ['Title'] },
            },
            {
                name: 'unwrap primitive values when forStringify is false and it is not an array tag',
                options: { arrayTags: [], forStringify: false },
                payload: { TI: ['Title'] },
                expected: { TI: 'Title' as any },
            },
        ];

        it.each(PAYLOAD_SCENARIOS)('should $name', ({ options, semanticMap, payload, expected }) => {
            const middleware = createArrayCaster({
                ...defaultOptions,
                ...options,
                semanticMap: semanticMap || defaultOptions.semanticMap,
            });
            const result = middleware(payload);
            expect(result).toEqual(expected);
        });
    });
});
