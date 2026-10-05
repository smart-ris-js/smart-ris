// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { comprehensiveTagMap } from '../../src/mappings.js';

describe('core - unit > mappings', () => {
    describe('comprehensiveTagMap', () => {
        it('should be a strictly typed object that is frozen with null prototype', () => {
            expect(typeof comprehensiveTagMap).toBe('object');
            expect(comprehensiveTagMap).not.toBeNull();
            expect(Object.isFrozen(comprehensiveTagMap)).toBe(true);
            expect(Object.getPrototypeOf(comprehensiveTagMap)).toBeNull();
        });

        it('should contain exact canonical tag mappings for common vendor aliases', () => {
            expect(comprehensiveTagMap.A1).toBe('AU');
            expect(comprehensiveTagMap.T1).toBe('TI');
            expect(comprehensiveTagMap.N2).toBe('AB');
            expect(comprehensiveTagMap.DI).toBe('DO');
            expect(comprehensiveTagMap.DA).toBe('Y1');
            expect(comprehensiveTagMap.JO).toBe('JF');
            expect(comprehensiveTagMap.J1).toBe('JA');
            expect(comprehensiveTagMap.K1).toBe('KW');
            expect(comprehensiveTagMap.CP).toBe('CY');
            expect(comprehensiveTagMap.LK).toBe('UR');
        });

        it.each(Object.entries(comprehensiveTagMap))(
            'should map vendor alias key %p to valid standard 2-char RIS tag %p',
            (key, value) => {
                expect(typeof key).toBe('string');
                expect(key.length).toBe(2);
                expect(key).toMatch(/^[A-Z0-9]{2}$/);

                expect(typeof value).toBe('string');
                expect(value.length).toBe(2);
                expect(value).toMatch(/^[A-Z0-9]{2}$/);
            },
        );
    });
});
