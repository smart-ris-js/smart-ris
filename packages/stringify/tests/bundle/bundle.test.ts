// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { runDistScenario } from '../../../../tests/bundle/run-in-node.js';
import * as src from '../../src/index.js';

// every stringify middleware active: semanticUnmapper, tagMapper, arrayCaster, stringSanitizer, typeCaster
const SCENARIO = `
    const records = [
        {
            typeOfReference: 'JOUR',
            author: ['Doe,   John', 'Smith, Anna'],
            title: 'A title\\n   spanning lines',
            publicationYear: new Date(2020, 2, 5),
            date: { month: 3 },
            volume: 12,
            isReviewed: true,
            A1: 'Mapped, Author',
            keywords: ['one', 'two'],
        },
        m.ris.typeOfReference('BOOK').title('Built').build(),
    ];
    const options = {
        fromSemantic: true,
        customSemanticMap: { C1: 'isReviewed' },
        tagMapping: { A1: 'AU' },
        arrayMergeStrategy: 'join-space',
        cleanWhitespace: true,
        mergeMultiline: true,
        useSmartTypes: true,
        smartCastSchema: { C1: 'boolean' },
        dateFormat: 'YYYY/MM/DD',
        eol: '\\r\\n',
        logLevel: 'info',
    };
    const incidents = [];
    const output = m.stringify(records, { ...options, onError: (i) => incidents.push(i.error.message) });
    async function* stream() {
        yield* records;
    }
    let streamed = '';
    for await (const chunk of m.stringifyStream(stream(), options)) {
        streamed += chunk;
    }
    return { output, streamed, incidents, pipeline: m.buildStringifyPipeline(m.resolveStringifyOptions(options)).length };
`;

describe('stringify - bundle > built dist in Node', () => {
    it('should expose every source export and stringify with all middlewares active like src', async () => {
        const scenario = `m = { ...m, ris: (await import('@smart-ris/core')).ris };\n${SCENARIO}`;
        const { dist, src: expected, distExports } = await runDistScenario('stringify', src, scenario);

        expect(distExports).toEqual(Object.keys(src).sort());
        expect(dist).toEqual(expected);
        const { output, streamed } = dist as { output: string; streamed: string };
        expect(streamed).toBe(output);
        expect(output).toStartWith('TY  - JOUR\r\n');
        expect(output).toContain('AU  - Doe, John\r\n');
        expect(output).toContain('TI  - A title spanning lines\r\n');
        expect(output).toContain('PY  - 2020/03/05\r\n');
        expect(output).toContain('C1  - true\r\n');
        expect(output).toContain('ER  - \r\n\r\nTY  - BOOK\r\n');
    });
});
