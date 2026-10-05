// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { parse } from '../../src/index.js';

describe('parse - integration > custom-semantic-date-fallback', () => {
    describe('Function: parse() date fallback with custom semantic mapping', () => {
        it('should resolve fallback year for custom-mapped date tags from custom-mapped publication year', () => {
            const risContent = `TY  - JOUR
DA  - 15 Jan
PY  - 2024
ER  - 
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: true,
                customSemanticMap: {
                    DA: 'publicationDate',
                    PY: 'releaseYear',
                },
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.publicationDate).toBe('2024-01-15');
            expect(record.releaseYear).toBe('2024');
        });

        it('should resolve fallback year for custom-mapped date tags from custom-mapped primary date', () => {
            const risContent = `TY  - JOUR
DA  - May 15
Y1  - 2025-10-01
ER  - 
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: true,
                customSemanticMap: {
                    DA: 'publishedOn',
                    Y1: 'primaryDateCustom',
                },
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.publishedOn).toBe('2025-05-15');
            expect(record.primaryDateCustom).toBe('2025-10-01');
        });

        it('should resolve fallback year with default semantic names', () => {
            const risContent = `TY  - JOUR
DA  - 15 Jan
PY  - 2026
ER  - 
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: true,
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.date).toBe('2026-01-15');
            expect(record.publicationYear).toBe('2026');
        });

        it('should resolve fallback year with raw tags when toSemantic is false', () => {
            const risContent = `TY  - JOUR
DA  - 15 Jan
PY  - 2026
ER  - 
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: false,
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.DA).toBe('2026-01-15');
            expect(record.PY).toBe('2026');
        });

        it('should resolve fallback year when tagMapping is applied and toSemantic is false', () => {
            const risContent = `TY  - JOUR
D1  - 15 Jan
P1  - 2026
ER  - 
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: false,
                tagMapping: { D1: 'DA', P1: 'PY' },
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.DA).toBe('2026-01-15');
            expect(record.PY).toBe('2026');
        });

        it('should ignore customSemanticMap and resolve fallback year under raw tags when toSemantic is false', () => {
            const risContent = `TY  - JOUR
DA  - 15 Jan
PY  - 2026
ER  - 
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: false,
                customSemanticMap: { DA: 'customDate', PY: 'customYear' },
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.DA).toBe('2026-01-15');
            expect(record.PY).toBe('2026');
            expect(record.customDate).toBeUndefined();
            expect(record.customYear).toBeUndefined();
        });

        it('should apply tagMapping but ignore customSemanticMap when toSemantic is false', () => {
            const risContent = `TY  - JOUR
D1  - 15 Jan
P1  - 2026
ER  - 
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: false,
                tagMapping: { D1: 'DA', P1: 'PY' },
                customSemanticMap: { DA: 'customDate', PY: 'customYear' },
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.DA).toBe('2026-01-15');
            expect(record.PY).toBe('2026');
            expect(record.customDate).toBeUndefined();
            expect(record.customYear).toBeUndefined();
        });

        it('should resolve fallback year under default semantic keys of tagMapped targets when toSemantic is true', () => {
            const risContent = `TY  - JOUR
D1  - 15 Jan
P1  - 2026
ER  -
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: true,
                tagMapping: { D1: 'DA', P1: 'PY' },
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.date).toBe('2026-01-15');
            expect(record.publicationYear).toBe('2026');
        });

        it('should not pass the date cast or fallback role of a source tag to an uncast target tag', () => {
            const risContent = `TY  - JOUR
DA  - 15 Jan
PY  - 2026
ER  -
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: false,
                tagMapping: { DA: 'D1', PY: 'P1' },
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.D1).toBe('15 Jan');
            expect(record.P1).toBe('2026');
        });

        it('should ignore customSemanticMap entries of mapped source tags', () => {
            const risContent = `TY  - JOUR
D1  - 15 Jan
P1  - 2026
ER  - 
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: true,
                tagMapping: { D1: 'DA', P1: 'PY' },
                customSemanticMap: { D1: 'customDate', P1: 'customYear' },
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.date).toBe('2026-01-15');
            expect(record.publicationYear).toBe('2026');
            expect(record.customDate).toBeUndefined();
            expect(record.customYear).toBeUndefined();
        });

        it('should resolve fallback year when tagMapping and customSemanticMap are chained (D1 -> DA -> customDate, P1 -> PY -> customYear)', () => {
            const risContent = `TY  - JOUR
D1  - 15 Jan
P1  - 2024
ER  - 
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: true,
                tagMapping: { D1: 'DA', P1: 'PY' },
                customSemanticMap: { DA: 'customDate', PY: 'customYear' },
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.customDate).toBe('2024-01-15');
            expect(record.customYear).toBe('2024');
        });

        it('should resolve fallback year from canonical publicationYear when only date tag is chained (D1 -> DA -> customDate)', () => {
            const risContent = `TY  - JOUR
D1  - 15 Jan
PY  - 2026
ER  - 
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: true,
                tagMapping: { D1: 'DA' },
                customSemanticMap: { DA: 'customDate' },
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.customDate).toBe('2026-01-15');
            expect(record.publicationYear).toBe('2026');
        });

        it('should resolve fallback year from chained customYear when date tag is default semantic (P1 -> PY -> customYear)', () => {
            const risContent = `TY  - JOUR
DA  - 15 Jan
P1  - 2026
ER  - 
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: true,
                tagMapping: { P1: 'PY' },
                customSemanticMap: { PY: 'customYear' },
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.date).toBe('2026-01-15');
            expect(record.customYear).toBe('2026');
        });

        it('should resolve fallback year from chained primaryDateCustom when both D1 and Y2 are chained (D1 -> DA -> publishedOn, Y2 -> Y1 -> primaryDateCustom)', () => {
            const risContent = `TY  - JOUR
D1  - May 15
Y2  - 2025-10-01
ER  - 
`;
            const result = parse(risContent, {
                useSmartTypes: true,
                toSemantic: true,
                tagMapping: { D1: 'DA', Y2: 'Y1' },
                customSemanticMap: { DA: 'publishedOn', Y1: 'primaryDateCustom' },
            });

            expect(result).toBeArrayOfSize(1);
            const record = result[0] as Record<string, unknown>;
            expect(record.publishedOn).toBe('2025-05-15');
            expect(record.primaryDateCustom).toBe('2025-10-01');
        });
    });
});
