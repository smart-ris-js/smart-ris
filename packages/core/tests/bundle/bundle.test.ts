// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { runDistScenario } from '../../../../tests/bundle/run-in-node.js';
import * as src from '../../src/index.js';

// all core middlewares, builder and date utils through the package entry
const SCENARIO = `
    const pipeline = [
        m.createTagMapper({ tagMapping: { A1: 'AU' } }),
        m.createArrayCaster({
            forStringify: false,
            arrayMergeStrategy: 'join-space',
            arrayTags: ['AU'],
            semanticMap: m.resolveParseSemanticMap(),
            eol: '\\n',
        }),
        m.createStringSanitizer({ cleanWhitespace: true, mergeMultiline: true, eol: '\\n' }),
    ];
    const payload = { TY: ['JOUR'], A1: ['  Doe,   J.  '], TI: ['First', 'Second\\n  line'] };
    return {
        pipeline: m.executePipeline(payload, pipeline),
        builder: m.ris.typeOfReference('BOOK').title('Built').author('A', 'B').build(),
        date: m.formatRisDate(m.heuristicallyParseDateString('05 March 2019'), 'YYYY/MM/DD'),
        error: new m.RisWarning('x').severity,
    };
`;

describe('core - bundle > built dist in Node', () => {
    it('should expose every source export and run all core middlewares like src', async () => {
        const { dist, src: expected, distExports } = await runDistScenario('core', src, SCENARIO);

        expect(distExports).toEqual(Object.keys(src).sort());
        expect(dist).toEqual(expected);
        expect(dist).toMatchObject({ pipeline: { TY: 'JOUR', AU: ['Doe, J.'] }, date: '2019/03/05' });
    });
});
