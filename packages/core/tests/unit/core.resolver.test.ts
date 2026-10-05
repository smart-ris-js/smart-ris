// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { DEFAULT_UPPERCASE_TAG_MAP, invertedTag } from '../../src/core.constants.js';
import {
    resolveArrayTags,
    resolveCastSchema,
    resolveParseSemanticMap,
    resolveStringifySemanticMap,
    resolveTagMapping,
} from '../../src/core.resolver.js';
import type { CastType, RisTag } from '../../src/core.types.js';

describe('core - unit > core.resolver', () => {
    describe('Function: resolveTagMapping()', () => {
        it('should return empty object when tagMapping is undefined', () => {
            expect(resolveTagMapping(undefined)).toEqual({});
        });

        it.each([[null], [123], ['invalid'], [true], [['AU', 'KW']]])(
            'should throw TypeError when tagMapping is not a valid object | Input: %p',
            (val) => {
                expect(() => resolveTagMapping(val)).toThrow("Option 'tagMapping' is invalid. Must be a valid object.");
            },
        );

        it('should trim and uppercase tagMapping keys and values', () => {
            const result = resolveTagMapping({ ' a1 ': '  au  ', ' ti ': ' ab ' });
            expect(result).toEqual({ A1: 'AU', TI: 'AB' });
        });

        it('should ignore tag mapping pairs where upperFromTag equals upperToTag', () => {
            const result = resolveTagMapping({ ' au ': '  AU  ', ' ti ': ' ab ' });
            expect(result).toEqual({ TI: 'AB' });
        });

        it('should ignore inherited prototype properties on user-supplied tagMapping object', () => {
            const proto = { INVALID_LONG_KEY: 'AU', INHERITED: 'XX' };
            const customMapping = Object.create(proto);
            customMapping.A1 = 'AU';
            expect(resolveTagMapping(customMapping)).toEqual({ A1: 'AU' });
        });

        it.each([
            [{ A1: 123 }, 'Values must be strings.'],
            [{ INVALID_TAG: 'AU' }, 'Keys must be valid 2-character RIS tags.'],
            [{ A1: 'INVALID_TAG' }, 'Values must be valid 2-character RIS tags.'],
            [{ TY: 'AU' }, "Cannot remap 'TY' or 'ER' tags."],
            [{ ER: 'AU' }, "Cannot remap 'TY' or 'ER' tags."],
            [{ A1: 'TY' }, "Cannot map to 'TY' or 'ER' tags."],
            [{ A1: 'ER' }, "Cannot map to 'TY' or 'ER' tags."],
        ])('should throw error for invalid tagMapping entries | Input: %p', (val, expectedMsg) => {
            expect(() => resolveTagMapping(val)).toThrow(expectedMsg);
        });
    });

    describe('Function: resolveArrayTags()', () => {
        const defaultTags: RisTag[] = ['AU', 'A1', 'KW'];

        it('should return defaultArrayTags when customArrayTags is undefined', () => {
            expect(resolveArrayTags(undefined, defaultTags)).toEqual(defaultTags);
        });

        it('should return defaultArrayTags when customArrayTags is empty array', () => {
            expect(resolveArrayTags([], defaultTags)).toEqual(defaultTags);
        });

        it('should trim and uppercase custom array tags and append to defaultArrayTags', () => {
            const result = resolveArrayTags([' c1 ', ' c2 '], defaultTags);
            expect(result).toEqual(['AU', 'A1', 'KW', 'C1', 'C2']);
        });

        it.each([
            [123, 'Must be an array.'],
            ['AU', 'Must be an array.'],
            [{ tag: 'AU' }, 'Must be an array.'],
            [[123], 'Items must be strings.'],
            [['INVALID_LONG_TAG'], 'Items must be valid 2-character RIS tags.'],
            [['TY'], "Cannot include structural tags 'TY' or 'ER' in customArrayTags."],
            [['ER'], "Cannot include structural tags 'TY' or 'ER' in customArrayTags."],
        ])('should throw error for invalid customArrayTags input | Input: %p', (val, expectedMsg) => {
            expect(() => resolveArrayTags(val, defaultTags)).toThrow(expectedMsg);
        });
    });

    describe('Function: resolveParseSemanticMap()', () => {
        it('should return invertedTag when customSemanticMap is undefined', () => {
            expect(resolveParseSemanticMap(undefined)).toEqual(invertedTag);
        });

        it('should merge customSemanticMap into invertedTag (rawTag -> semanticKey)', () => {
            const result = resolveParseSemanticMap({ XX: 'customField' });
            expect(result.XX).toBe('customField');
            expect(result.AU).toBe('author');
            expect(result.TI).toBe('title');
        });

        it('should trim and uppercase custom tag keys and trim semantic values', () => {
            const result = resolveParseSemanticMap({ ' xx ': '  customNotes  ' });
            expect(result.XX).toBe('customNotes');
        });

        it('should ignore inherited prototype properties on user-supplied customSemanticMap object', () => {
            const proto = { INVALID_LONG_KEY: 'customVal', INHERITED: 'anotherVal' };
            const customMap = Object.create(proto);
            customMap.XX = 'myField';
            const result = resolveParseSemanticMap(customMap);
            expect(result.XX).toBe('myField');
            expect((result as Record<string, string | undefined>).INVALID_LONG_KEY).toBeUndefined();
        });

        it.each([
            [{ C1: 'author' }, 'Cannot override core semantic keys.'],
            [{ C1: 'AUTHOR' }, 'Cannot override core semantic keys.'],
            [{ XX: 'date' }, 'Cannot override core semantic keys.'],
            [{ XX: 'publicationYear' }, 'Cannot override core semantic keys.'],
            [{ XX: 'primaryDate' }, 'Cannot override core semantic keys.'],
            [{ XX: 'accessDate' }, 'Cannot override core semantic keys.'],
            [{ C1: 'AU' }, 'Values cannot be 2-character RIS tags.'],
            [{ C1: 'au' }, 'Values cannot be 2-character RIS tags.'],
            [{ TY: 'customType' }, "Cannot remap 'TY' or 'ER' tags."],
            [{ ER: 'customEnd' }, "Cannot remap 'TY' or 'ER' tags."],
            [{ C1: 123 }, 'Values must be strings.'],
            [{ C1: '' }, 'Values must be non-empty strings.'],
            [{ C1: '   ' }, 'Values must be non-empty strings.'],
            [{ INVALID_TAG: 'custom' }, 'Keys must be valid 2-character RIS tags.'],
            [{ C1: 'foo', C2: 'foo' }, 'Duplicate semantic value.'],
            [{ C1: 'foo', C2: 'FOO' }, 'Duplicate semantic value.'],
            [{ C1: 'foo', C2: '  foo  ' }, 'Duplicate semantic value.'],
            [{ C1: 'build' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'Build' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'toJSON' }, 'Cannot override builder reserved methods.'],
            [{ C1: ' raw ' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'GET' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'then' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'toString' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'constructor' }, 'Cannot override builder reserved methods.'],
            [{ C1: '__proto__' }, 'Cannot override builder reserved methods.'],
            [123, 'Must be a valid object.'],
            ['invalid', 'Must be a valid object.'],
        ])('should throw error when customSemanticMap is invalid | Input: %p', (customMap, expectedMsg) => {
            expect(() => resolveParseSemanticMap(customMap)).toThrow(expectedMsg);
        });
    });

    describe('Function: resolveStringifySemanticMap()', () => {
        it('should return DEFAULT_UPPERCASE_TAG_MAP when customSemanticMap is undefined', () => {
            expect(resolveStringifySemanticMap(undefined)).toEqual(DEFAULT_UPPERCASE_TAG_MAP);
        });

        it('should merge customSemanticMap into baseTagMap (uppercase semanticKey -> rawTag)', () => {
            const result = resolveStringifySemanticMap({ XX: 'customField' });
            expect(result.CUSTOMFIELD).toBe('XX');
            expect(result.AUTHOR).toBe('AU');
            expect(result.TITLE).toBe('TI');
        });

        it('should trim and uppercase custom tag keys and uppercase semantic values', () => {
            const result = resolveStringifySemanticMap({ ' xx ': '  customNotes  ' });
            expect(result.CUSTOMNOTES).toBe('XX');
        });

        it('should ignore inherited prototype properties on user-supplied customSemanticMap object', () => {
            const proto = { INVALID_LONG_KEY: 'customVal', INHERITED: 'anotherVal' };
            const customMap = Object.create(proto);
            customMap.XX = 'myField';
            const result = resolveStringifySemanticMap(customMap);
            expect(result.MYFIELD).toBe('XX');
            expect((result as Record<string, string | undefined>).CUSTOMVAL).toBeUndefined();
        });

        it.each([
            [{ C1: 'author' }, 'Cannot override core semantic keys.'],
            [{ C1: 'AUTHOR' }, 'Cannot override core semantic keys.'],
            [{ XX: 'date' }, 'Cannot override core semantic keys.'],
            [{ XX: 'publicationYear' }, 'Cannot override core semantic keys.'],
            [{ XX: 'primaryDate' }, 'Cannot override core semantic keys.'],
            [{ XX: 'accessDate' }, 'Cannot override core semantic keys.'],
            [{ C1: 'AU' }, 'Values cannot be 2-character RIS tags.'],
            [{ C1: 'au' }, 'Values cannot be 2-character RIS tags.'],
            [{ TY: 'customType' }, "Cannot remap 'TY' or 'ER' tags."],
            [{ ER: 'customEnd' }, "Cannot remap 'TY' or 'ER' tags."],
            [{ C1: 123 }, 'Values must be strings.'],
            [{ C1: '' }, 'Values must be non-empty strings.'],
            [{ C1: '   ' }, 'Values must be non-empty strings.'],
            [{ INVALID_TAG: 'custom' }, 'Keys must be valid 2-character RIS tags.'],
            [{ C1: 'foo', C2: 'foo' }, 'Duplicate semantic value.'],
            [{ C1: 'foo', C2: 'FOO' }, 'Duplicate semantic value.'],
            [{ C1: 'foo', C2: '  foo  ' }, 'Duplicate semantic value.'],
            [{ C1: 'build' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'Build' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'toJSON' }, 'Cannot override builder reserved methods.'],
            [{ C1: ' raw ' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'GET' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'then' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'toString' }, 'Cannot override builder reserved methods.'],
            [{ C1: 'constructor' }, 'Cannot override builder reserved methods.'],
            [{ C1: '__proto__' }, 'Cannot override builder reserved methods.'],
            [123, 'Must be a valid object.'],
            ['invalid', 'Must be a valid object.'],
        ])('should throw error when customSemanticMap is invalid | Input: %p', (customMap, expectedMsg) => {
            expect(() => resolveStringifySemanticMap(customMap)).toThrow(expectedMsg);
        });
    });

    describe('Function: resolveCastSchema()', () => {
        const defaultSchema: Record<string, CastType> = { DA: 'date', Y1: 'date' };

        it('should return defaultSchema when smartCastSchema is undefined', () => {
            expect(resolveCastSchema(undefined, defaultSchema)).toEqual(defaultSchema);
        });

        it('should merge custom smartCastSchema into defaultSchema', () => {
            const result = resolveCastSchema({ VL: 'number', IS: 'number' }, defaultSchema);
            expect(result).toEqual({ DA: 'date', Y1: 'date', VL: 'number', IS: 'number' });
        });

        it('should trim and uppercase custom keys', () => {
            const result = resolveCastSchema({ ' vl ': 'number' }, defaultSchema);
            expect(result.VL).toBe('number');
        });

        it('should ignore inherited prototype properties on user-supplied smartCastSchema object', () => {
            const proto = { INVALID_LONG_KEY: 'date', INHERITED: 'number' };
            const customSchema = Object.create(proto);
            customSchema.VL = 'number';
            const result = resolveCastSchema(customSchema, defaultSchema);
            expect(result.VL).toBe('number');
            expect((result as Record<string, CastType | undefined>).INVALID_LONG_KEY).toBeUndefined();
        });

        it.each([
            [{ TY: 'string' }, "Cannot cast structural tags 'TY' or 'ER'."],
            [{ ER: 'string' }, "Cannot cast structural tags 'TY' or 'ER'."],
            [{ VL: 'unsupportedType' }, 'Must be one of string, number, boolean, date'],
            [{ VL: 123 }, 'Must be one of string, number, boolean, date'],
            [{ INVALID_TAG: 'number' }, 'Keys must be valid 2-character RIS tags.'],
            [123, 'Must be a valid object.'],
            ['invalid', 'Must be a valid object.'],
        ])('should throw error when smartCastSchema is invalid | Input: %p', (schema, expectedMsg) => {
            expect(() => resolveCastSchema(schema, defaultSchema)).toThrow(expectedMsg);
        });
    });
});
