// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { remapRecordKeys } from '../../../src/utils/record.js';

describe('core - unit > utils > record', () => {
    describe('Function: remapRecordKeys()', () => {
        it('should return empty dictionary for empty payload', () => {
            const result = remapRecordKeys({}, { AA: 'BB' });
            expect(result).toEqual({});
        });

        it('should shallow clone unmapped keys', () => {
            const payload = { TY: ['JOUR'], AU: ['Author 1'] };
            const result = remapRecordKeys(payload, {});
            expect(result).toEqual({ TY: ['JOUR'], AU: ['Author 1'] });
            expect(result.TY).not.toBe(payload.TY);
        });

        it('should remap keys according to mapping', () => {
            const payload = { AA: ['Val A'] };
            const result = remapRecordKeys(payload, { AA: 'BB' });
            expect(result).toEqual({ BB: ['Val A'] });
        });

        it('should preserve primary target precedence when native key is visited after alias', () => {
            const payload = { AA: ['Alias Val'], BB: ['Native Val'] };
            const result = remapRecordKeys(payload, { AA: 'BB' });
            expect(result).toEqual({ BB: ['Native Val', 'Alias Val'] });
        });

        it('should preserve primary target precedence when native key is visited before alias', () => {
            const payload = { BB: ['Native Val'], AA: ['Alias Val'] };
            const result = remapRecordKeys(payload, { AA: 'BB' });
            expect(result).toEqual({ BB: ['Native Val', 'Alias Val'] });
        });

        it('should consolidate multiple aliases mapping to single target', () => {
            const payload = { AA: ['Val 1'], BB: ['Val 2'], CC: ['Val 3'] };
            const result = remapRecordKeys(payload, { AA: 'DD', BB: 'DD', CC: 'DD' });
            expect(result).toEqual({ DD: ['Val 1', 'Val 2', 'Val 3'] });
        });

        it('should consolidate multiple aliases with native key present', () => {
            const payload = { AA: ['Val 1'], DD: ['Native'], BB: ['Val 2'] };
            const result = remapRecordKeys(payload, { AA: 'DD', BB: 'DD' });
            expect(result).toEqual({ DD: ['Native', 'Val 1', 'Val 2'] });
        });

        it('should keep native target values when mapping contains a self-mapping of the target', () => {
            const aliasFirst = remapRecordKeys({ A1: ['Alice'], AU: ['Bob'] }, { A1: 'AU', AU: 'AU' });
            const nativeFirst = remapRecordKeys({ AU: ['Bob'], A1: ['Alice'] }, { A1: 'AU', AU: 'AU' });
            expect(aliasFirst).toEqual({ AU: ['Bob', 'Alice'] });
            expect(nativeFirst).toEqual({ AU: ['Bob', 'Alice'] });
        });

        it('should correctly handle cross-swapped keys', () => {
            const payload = { AU: ['AU Val'], A1: ['A1 Val'] };
            const result = remapRecordKeys(payload, { AU: 'A1', A1: 'AU' });
            expect(result).toEqual({ A1: ['AU Val'], AU: ['A1 Val'] });
        });
    });
});
