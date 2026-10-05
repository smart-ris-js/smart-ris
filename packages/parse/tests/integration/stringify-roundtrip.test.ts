// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { type StringifyOptions, stringify } from '../../../stringify/src/index.js';
import { type ParseOptions, parse } from '../../src/index.js';

const TYPES = ['JOUR', 'BOOK', 'CHAP', 'GEN', 'CONF'];
const TAGS = ['AU', 'A2', 'TI', 'T2', 'KW', 'PY', 'DA', 'VL', 'IS', 'SP', 'EP', 'N1', 'AB', 'UR', 'C1', 'M1', 'X1'];
const VALUES = [
    'Smith, J.',
    'Müller, Ä.',
    'Deep Learning: A Survey',
    '2020',
    '2020/03/05/',
    '12',
    'a - b',
    'Äöü 漢字 😀',
    'multiple   internal   spaces',
    'http://example.com/?q=1&r=2',
];
const CONTINUATIONS = ['second line', 'Äöü 😀 third'];

const OPTION_PAIRS: [string, ParseOptions, StringifyOptions][] = [
    ['default', {}, {}],
    ['arrayMergeStrategy: false', { arrayMergeStrategy: false }, { arrayMergeStrategy: false }],
    ['toSemantic / fromSemantic', { toSemantic: true }, { fromSemantic: true }],
];

/** Deterministic pseudo-random well-formed RIS sources. */
function createSources(count: number): string[] {
    let seed = 2024;
    const rnd = (n: number) => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed % n;
    };
    const pick = <T>(list: readonly T[]): T => list[rnd(list.length)];
    const sources: string[] = [];
    for (let s = 0; s < count; s++) {
        const lines: string[] = [];
        const records = 1 + rnd(3);
        for (let r = 0; r < records; r++) {
            lines.push(`TY  - ${pick(TYPES)}`);
            const entries = 1 + rnd(8);
            for (let i = 0; i < entries; i++) {
                lines.push(`${pick(TAGS)}  - ${pick(VALUES)}`);
                if (rnd(5) === 0) {
                    lines.push(pick(CONTINUATIONS));
                }
            }
            lines.push('ER  - ', '');
        }
        sources.push(lines.join('\n'));
    }
    return sources;
}

const SOURCES = createSources(80);

describe('parse - integration > stringify-roundtrip', () => {
    for (const [name, parseOptions, stringifyOptions] of OPTION_PAIRS) {
        describe(`Options: ${name}`, () => {
            it.each(SOURCES.map((src, index) => [index, src]))(
                'should keep parsed records stable across stringify and re-parse | Source #%p',
                (_, src) => {
                    const records = parse(src, parseOptions);
                    const reparsed = parse(stringify(records, stringifyOptions), parseOptions);

                    expect(reparsed).toStrictEqual(records);
                },
            );

            it.each(SOURCES.map((src, index) => [index, src]))(
                'should reach a stringify fixed point after one round-trip | Source #%p',
                (_, src) => {
                    const once = stringify(parse(src, parseOptions), stringifyOptions);
                    const twice = stringify(parse(once, parseOptions), stringifyOptions);

                    expect(twice).toBe(once);
                },
            );
        });
    }
});
