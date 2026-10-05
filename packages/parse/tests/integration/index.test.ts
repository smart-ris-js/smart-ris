// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { ris } from '@smart-ris/core';
import { parse, parseStream } from '../../src/index.js';

describe('parse - integration > index', () => {
    describe('Function: parse() and parseStream()', () => {
        const risContent = `TY  - JOUR
DA  - 2026-01-01
AU  - Author One
AU  - Author Two
C1  - Custom Data
ER  - 
`;

        it('should correctly cast default semantic fields when both useSmartTypes and toSemantic are true (CRIT-P2)', () => {
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: true,
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as any;
            expect(record.typeOfReference).toBe('JOUR');
            expect(record.date).toBe('2026-01-01'); // Should be type-casted to string format from DA
            expect(record.author).toEqual(['Author One', 'Author Two']);
        });

        it('should correctly handle custom semantic array maps (CRIT-P3)', () => {
            const customContent = `TY  - JOUR
XX  - Custom One
XX  - Custom Two
ER  - 
`;
            const result = parse(customContent, {
                toSemantic: true,
                customSemanticMap: { XX: 'customArrayField' },
                customArrayTags: ['XX'],
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as any;
            expect(record.customArrayField).toEqual(['Custom One', 'Custom Two']);
        });

        it('should resolve streams correctly without proxy crashing (HIGH-P1)', async () => {
            // Simulate a stream yielding chunks
            async function* stringStream() {
                yield 'TY  - JOUR\n';
                yield 'DA  - 2026-01-01\n';
                yield 'ER  - \n';
            }

            const results = [];
            for await (const record of parseStream(stringStream(), { useSmartTypes: true, toSemantic: true })) {
                results.push(record);
            }

            expect(results).toBeArrayOfSize(1);
            const record = results[0] as any;
            expect(record.typeOfReference).toBe('JOUR');
            expect(record.date).toBe('2026-01-01');
        });

        it('should safely interact with Promise resolution and JSON.stringify (HIGH-P1)', async () => {
            // Using the builder proxy in an async context
            const record = await Promise.resolve(ris().TY('JOUR').DA(new Date('2026-01-01T00:00:00Z')).build());

            expect(record).toBeDefined();
            expect(record.TY).toBe('JOUR');
            expect(record.DA).toBeInstanceOf(Date);

            // Ensure JSON stringify doesn't crash
            const jsonString = JSON.stringify(ris().TY('JOUR').build());
            expect(typeof jsonString).toBe('string');
        });
    });
});
