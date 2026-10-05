// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { TagStats } from '../../../src/inspect-parse.types.js';
import { inspectStringValue } from '../../../src/inspectors/string.inspector.js';

describe('inspect-parse - unit > inspectors > string.inspector.ts', () => {
    describe('Function: inspectStringValue()', () => {
        it('should detect internal multi-spaces in string value', () => {
            const stats: TagStats = {
                count: 0,
                emptyCount: 0,
                multilineCount: 0,
                whitespacePaddedCount: 0,
                isStandard: true,
            };
            const isNonEmpty = inspectStringValue('Word   Word', stats);

            expect(isNonEmpty).toBe(true);
            expect(stats.count).toBe(1);
            expect(stats.multipleInternalSpacesCount).toBe(1);
        });

        it('should detect excessive linebreaks (>= 2 consecutive newlines) in multiline string', () => {
            const stats: TagStats = {
                count: 0,
                emptyCount: 0,
                multilineCount: 0,
                whitespacePaddedCount: 0,
                isStandard: true,
            };
            const isNonEmpty = inspectStringValue('Line1\n\n\nLine2', stats);

            expect(isNonEmpty).toBe(true);
            expect(stats.multilineCount).toBe(1);
            expect(stats.excessiveLinebreaksCount).toBe(1);
        });

        it('should detect empty or null values and bounding whitespace padding', () => {
            const stats: TagStats = {
                count: 0,
                emptyCount: 0,
                multilineCount: 0,
                whitespacePaddedCount: 0,
                isStandard: true,
            };
            const isNonEmpty1 = inspectStringValue(null, stats);
            expect(isNonEmpty1).toBe(false);
            expect(stats.emptyCount).toBe(1);

            const isNonEmpty2 = inspectStringValue('   ', stats);
            expect(isNonEmpty2).toBe(false);
            expect(stats.emptyCount).toBe(2);

            const isNonEmpty3 = inspectStringValue('   Padded Text   ', stats);
            expect(isNonEmpty3).toBe(true);
            expect(stats.whitespacePaddedCount).toBe(1);
        });
    });
});
