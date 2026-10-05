// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { safeStringify } from '../../../src/utils/json.js';
import { ris } from '../../../src/builder/builder.js';

describe('core - unit > utils > json', () => {
    describe('Function: safeStringify()', () => {
        it('should return valid JSON for simple primitives', () => {
            expect(safeStringify(123)).toBe('123');
            expect(safeStringify('string')).toBe('"string"');
            expect(safeStringify(true)).toBe('true');
            expect(safeStringify(null)).toBe('null');
        });

        it('should correctly stringify bigint values', () => {
            expect(safeStringify(123n)).toBe('"123n"');
        });

        it('should correctly stringify valid Date objects', () => {
            const date = new Date('2023-01-01T00:00:00.000Z');
            expect(safeStringify(date)).toBe('"2023-01-01T00:00:00.000Z"');
        });

        it('should return [Invalid Date] for invalid Date objects', () => {
            const invalidDate = new Date('invalid');
            expect(safeStringify(invalidDate)).toBe('"[Invalid Date]"');
        });

        it('should successfully stringify nested objects and arrays', () => {
            const obj = { arr: [1, 'two', false], nested: { key: 'value' } };
            expect(safeStringify(obj)).toBe('{"arr":[1,"two",false],"nested":{"key":"value"}}');
        });

        it('should detect and handle circular references in objects', () => {
            const obj: any = { a: 1 };
            obj.self = obj;
            expect(safeStringify(obj)).toBe('{"a":1,"self":"[Circular]"}');
        });

        it('should detect and handle circular references in arrays', () => {
            const arr: any[] = [1, 2];
            arr.push(arr);
            expect(safeStringify(arr)).toBe('[1,2,"[Circular]"]');
        });

        it('should apply spacing for pretty printing', () => {
            const obj = { a: 1 };
            expect(safeStringify(obj, 2)).toBe('{\n  "a": 1\n}');
        });

        it('should safely handle prototype pollution and collision keys', () => {
            const obj = Object.create(null) as Record<string, unknown>;
            Object.defineProperty(obj, '__proto__', {
                value: 'safe_proto',
                enumerable: true,
                writable: true,
                configurable: true,
            });
            obj.toString = 'safe_toString';
            obj.valueOf = 'safe_valueOf';
            expect(safeStringify(obj)).toBe(
                '{"__proto__":"safe_proto","toString":"safe_toString","valueOf":"safe_valueOf"}',
            );
        });

        it('should return a string for top-level values without JSON representation', () => {
            expect(safeStringify(undefined)).toBe('undefined');
            expect(safeStringify(() => {})).toMatch(/=>/);
            expect(safeStringify(Symbol('token'))).toBe('Symbol(token)');
            expect(safeStringify({ toJSON: () => undefined })).toBe('[object Object]');
        });

        it('should return a placeholder when the fallback string coercion throws', () => {
            const obj = Object.create(null) as Record<string, unknown>;
            obj.toJSON = () => undefined;
            expect(safeStringify(obj)).toBe('[Unserializable]');
        });

        it('should serialize values through their toJSON method', () => {
            expect(safeStringify({ a: { toJSON: () => ({ b: 1n }) } })).toBe('{"a":{"b":"1n"}}');
            expect(safeStringify(ris().TI('Hello'))).toBe('{"TI":"Hello","TY":"GEN"}');
        });

        it('should mark a toJSON method returning its own object as circular', () => {
            const obj = {
                toJSON() {
                    return this;
                },
            };
            expect(safeStringify(obj)).toBe('"[Circular]"');
        });

        it('should exclude inherited prototype properties', () => {
            const proto = { inherited: 'hidden' };
            const obj = Object.create(proto) as Record<string, unknown>;
            obj.own = 'visible';
            expect(safeStringify(obj)).toBe('{"own":"visible"}');
        });
    });
});
