// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { resolveParseOptions } from '@smart-ris/parse';
import type { TagStats } from '../../../src/inspect-parse.types.js';
import { inspectSemanticAndClassification } from '../../../src/inspectors/semantic.inspector.js';

function createMockStats(): TagStats {
    return {
        count: 1,
        emptyCount: 0,
        multilineCount: 0,
        whitespacePaddedCount: 0,
        isStandard: false,
    };
}

describe('inspect-parse - unit > inspectors > semantic.inspector.ts', () => {
    describe('Function: inspectSemanticAndClassification()', () => {
        it('should classify standard RIS tags correctly', () => {
            const options = resolveParseOptions({});
            const stats = createMockStats();

            inspectSemanticAndClassification('AU', stats, options);

            expect(stats.isStandard).toBe(true);
            expect(stats.isCustom).toBeUndefined();
            expect(stats.isUnknown).toBeUndefined();
            expect(stats.hasSemanticMapping).toBe(true);
        });

        it('should classify non-standard tags with custom semantic mappings as custom', () => {
            const options = resolveParseOptions({
                customSemanticMap: { EE: 'extraField' },
            });
            const stats = createMockStats();

            inspectSemanticAndClassification('EE', stats, options);

            expect(stats.isStandard).toBe(false);
            expect(stats.isCustom).toBe(true);
            expect(stats.isUnknown).toBeUndefined();
            expect(stats.hasSemanticMapping).toBe(true);
        });

        it('should classify non-standard tags declared in customArrayTags as custom', () => {
            const options = resolveParseOptions({
                customArrayTags: ['X1'],
            });
            const stats = createMockStats();

            inspectSemanticAndClassification('X1', stats, options);

            expect(stats.isStandard).toBe(false);
            expect(stats.isCustom).toBe(true);
            expect(stats.isUnknown).toBeUndefined();
        });

        it('should classify non-standard tags declared in smartCastSchema as custom', () => {
            const options = resolveParseOptions({
                smartCastSchema: { Z9: 'number' },
            });
            const stats = createMockStats();

            inspectSemanticAndClassification('Z9', stats, options);

            expect(stats.isStandard).toBe(false);
            expect(stats.isCustom).toBe(true);
            expect(stats.isUnknown).toBeUndefined();
        });

        it('should classify unmapped non-standard tags as unknown', () => {
            const options = resolveParseOptions({});
            const stats = createMockStats();

            inspectSemanticAndClassification('ZZ', stats, options);

            expect(stats.isStandard).toBe(false);
            expect(stats.isCustom).toBeUndefined();
            expect(stats.isUnknown).toBe(true);
            expect(stats.hasSemanticMapping).toBeUndefined();
        });

        it('should classify non-standard tags used as tagMapping source or target as custom', () => {
            const options = resolveParseOptions({ tagMapping: { Z1: 'AU', AB: 'Z2' } });

            const source = createMockStats();
            inspectSemanticAndClassification('Z1', source, options);
            expect(source.isCustom).toBe(true);
            expect(source.isUnknown).toBeUndefined();

            const target = createMockStats();
            inspectSemanticAndClassification('Z2', target, options);
            expect(target.isCustom).toBe(true);
            expect(target.isUnknown).toBeUndefined();
        });

        it('should resolve semantic mapping through the tagMapping target like the parse pipeline', () => {
            const mappedToStandard = createMockStats();
            inspectSemanticAndClassification('Z1', mappedToStandard, resolveParseOptions({ tagMapping: { Z1: 'AU' } }));
            expect(mappedToStandard.hasSemanticMapping).toBe(true);

            const mappedAway = createMockStats();
            inspectSemanticAndClassification('AB', mappedAway, resolveParseOptions({ tagMapping: { AB: 'Z2' } }));
            expect(mappedAway.isStandard).toBe(true);
            expect(mappedAway.hasSemanticMapping).toBeUndefined();
        });

        it('should detect semantic mapping for standard tag even with empty custom options', () => {
            const options = resolveParseOptions({});
            const stats = createMockStats();

            inspectSemanticAndClassification('TI', stats, options);

            expect(stats.isStandard).toBe(true);
            expect(stats.hasSemanticMapping).toBe(true);
        });
    });
});
