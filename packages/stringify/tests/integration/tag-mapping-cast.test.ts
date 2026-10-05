// Copyright 2026 Martin Winkler

import { describe, expect, it, mock } from 'bun:test';
import { ERROR_MESSAGES, RIS_ERROR } from '@smart-ris/core';
import { type StringifyOptions, stringify } from '../../src/index.js';

/** Stringifies a single record and collects `onError` messages. */
function run(record: Record<string, unknown>, options: StringifyOptions) {
    const onError = mock();
    const output = stringify([record], { useSmartTypes: true, logLevel: 'warn', onError, ...options });
    return { lines: output.split('\n'), messages: onError.mock.calls.map((call) => call[0].error.message) };
}

describe('stringify - integration > tag-mapping-cast', () => {
    describe('Option: tagMapping + smartCastSchema (mapped values adopt the target cast only)', () => {
        it('should not cast target values with the cast type of a mapped source tag', () => {
            const { lines, messages } = run(
                { TY: 'JOUR', PY: '2020', N1: 'June 5' },
                { tagMapping: { DA: 'N1' } },
            );
            expect(lines).toContain('N1  - June 5');
            expect(messages).toEqual([]);
        });

        it('should leave mapped source values uncast when the target has no cast type', () => {
            const { lines, messages } = run(
                { TY: 'JOUR', C1: '2025/12/31' },
                { tagMapping: { C1: 'C2' }, smartCastSchema: { C1: 'date' } },
            );
            expect(lines).toContain('C2  - 2025/12/31');
            expect(messages).toEqual([]);
        });

        it('should cast mapped source values with the target cast type', () => {
            const { lines } = run({ TY: 'JOUR', C1: '2025/12/31' }, { tagMapping: { C1: 'C2' }, smartCastSchema: { C2: 'date' } });
            expect(lines).toContain('C2  - 2025-12-31');
        });

        it('should keep the target cast type when source and target cast types conflict', () => {
            const { lines } = run(
                { TY: 'JOUR', C1: '2025/12/31', C2: '2024/01/02' },
                { tagMapping: { C1: 'C2' }, smartCastSchema: { C1: 'number', C2: 'date' } },
            );
            expect(lines).toContain('C2  - 2024-01-02 2025-12-31');
        });

        it('should cast swapped tags with the cast type of their target tag', () => {
            const { lines, messages } = run(
                { TY: 'JOUR', DA: 'draft', C1: '2025/12/31' },
                { tagMapping: { DA: 'C1', C1: 'DA' }, smartCastSchema: { C1: 'number' } },
            );
            expect(lines).toContain('DA  - 2025-12-31');
            expect(lines).toContain('C1  - draft');
            expect(messages).toEqual([]);
        });
    });

    describe('Option: tagMapping + date fallback year', () => {
        it('should resolve the fallback year for values mapped into a fallback tag', () => {
            const { lines } = run({ TY: 'JOUR', PY: '2028', D9: '20 Feb' }, { tagMapping: { D9: 'DA' } });
            expect(lines).toContain('DA  - 2028-02-20');
        });

        it('should resolve the fallback year from values mapped into a supplier tag', () => {
            const { lines } = run({ TY: 'JOUR', P9: '2027', DA: '15 Jan' }, { tagMapping: { P9: 'PY' } });
            expect(lines).toContain('DA  - 2027-01-15');
        });

        it('should not resolve a fallback year from a supplier tag mapped to a non-supplier target', () => {
            const { lines, messages } = run({ TY: 'JOUR', PY: '2027', DA: '15 Jan' }, { tagMapping: { PY: 'P9' } });
            expect(lines).toContain('DA  - 15 Jan');
            expect(messages).toEqual([ERROR_MESSAGES[RIS_ERROR.INVALID_DATE_FALLBACK]]);
        });

        it('should not resolve a fallback year for a fallback tag mapped to a non-fallback target', () => {
            const { lines } = run(
                { TY: 'JOUR', PY: '2028', DA: { month: '02', day: '20' } },
                { tagMapping: { DA: 'D9' } },
            );
            expect(lines).toContain('D9  - 02-20');
        });
    });
});
