// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { runDistScenario } from '../../../../tests/bundle/run-in-node.js';
import * as src from '../../src/index.js';

// every parse middleware active: tagMapper, semanticMapper, arrayCaster, stringSanitizer, typeCaster
const SCENARIO = `
    const input = [
        'TY  - JOUR',
        'A1  - Doe,   John',
        'AU  - Smith, Anna',
        'TI  - A title',
        '      spanning lines',
        'PY  - 2020',
        'DA  - March',
        'VL  - 12',
        'C1  - true',
        'KW  - one',
        'KW  - two',
        'AB  - part one',
        'AB  - part two',
        'ER  - ',
        '',
    ].join('\\r\\n');
    const options = {
        tagMapping: { A1: 'AU' },
        toSemantic: true,
        customSemanticMap: { C1: 'isReviewed' },
        arrayMergeStrategy: 'join-newline',
        cleanWhitespace: true,
        mergeMultiline: true,
        useSmartTypes: true,
        smartCastSchema: { C1: 'boolean' },
        dateFormat: 'YYYY/MM/DD',
        eol: '\\r\\n',
        logLevel: 'info',
    };
    const incidents = [];
    const records = m.parse(input, { ...options, onError: (i) => incidents.push(i.error.message) });
    const streamed = [];
    async function* chunks() {
        yield input.slice(0, 17);
        yield new TextEncoder().encode(input.slice(17));
    }
    for await (const record of m.parseStream(chunks(), options)) {
        streamed.push(record);
    }
    return { records, streamed, incidents, pipeline: m.buildParsePipeline(m.resolveParseOptions(options)).length };
`;

describe('parse - bundle > built dist in Node', () => {
    it('should expose every source export and parse with all middlewares active like src', async () => {
        const { dist, src: expected, distExports } = await runDistScenario('parse', src, SCENARIO);

        expect(distExports).toEqual(Object.keys(src).sort());
        expect(dist).toEqual(expected);
        expect(dist).toMatchObject({
            pipeline: 5,
            records: [
                {
                    typeOfReference: 'JOUR',
                    author: ['Smith, Anna', 'Doe, John'],
                    title: 'A title spanning lines',
                    publicationYear: '2020',
                    date: '2020/03',
                    volume: 12,
                    isReviewed: true,
                    keywords: ['one', 'two'],
                    abstract: 'part one part two',
                },
            ],
        });
    });
});
