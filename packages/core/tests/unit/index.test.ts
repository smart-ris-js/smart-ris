// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import * as core from '../../src/index.js';

describe('core - unit > index', () => {
    it('should exports builder components', () => {
        expect(core.createRisBuilder).toBeDefined();
        expect(typeof core.createRisBuilder).toBe('function');
    });

    it('should exports constants', () => {
        expect(core.recordType).toBeDefined();
        expect(core.tag).toBeDefined();
        expect(core.DEFAULT_ARRAY_TAGS).toBeDefined();
        expect(core.DEFAULT_SMART_CAST_SCHEMA).toBeDefined();
        expect(core.DEFAULT_REFERENCE_TYPE).toBeDefined();
    });

    it('should exports errors', () => {
        expect(core.ERROR_MESSAGES).toBeDefined();
        expect(core.RisError).toBeDefined();
        expect(core.RisWarning).toBeDefined();
    });

    it('should exports mappings', () => {
        expect(core.comprehensiveTagMap).toBeDefined();
    });

    it('should exports utils', () => {
        expect(core.heuristicallyParseDateString).toBeDefined();
        expect(typeof core.heuristicallyParseDateString).toBe('function');
        expect(core.repairTag).toBeDefined();
    });

    it('should does not export undefined values', () => {
        Object.entries(core).forEach(([_key, value]) => {
            expect(value).toBeDefined();
        });
    });
});
