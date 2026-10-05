// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { RisErrorContext } from '@smart-ris/core';
import { type ParseOptions, parse, parseStream } from '../../src/index.js';

type Chunk = string | Uint8Array;
type Incident = { message: string; tag: string | null; rawLine: string };

const TAGS = ['TY', 'AU', 'TI', 'KW', 'PY', 'DA', 'VL', 'N1', 'AB', 'UR', 'C1', 'X1', 'ZZ', 'ty', 'au', 'A', 'ABC', 'A-'];
const SEPARATORS = ['  - ', '  - ', '  - ', ' - ', '- ', '  -', '-', '   -  '];
const VALUES = ['', ' ', 'Smith, J.', '  padded  value  ', '2020', '2020/03/05/', 'true', '12', 'Äöü 漢字 😀', 'a - b'];
const CONTINUATIONS = ['  continued text', 'plain continuation', '', '   ', 'ÄÖÜ 😀 more'];
const EOLS = ['\n', '\r\n', '\r'];

const OPTION_SETS: ParseOptions[] = [
    {},
    { repairTags: true },
    { skipInvalidTags: true },
    { cleanWhitespace: false },
    { mergeMultiline: true },
    { useSmartTypes: true },
];

/** Deterministic pseudo-random RIS-like sources with mixed EOLs, malformed tags and continuations. */
function createSources(count: number): string[] {
    let seed = 1337;
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
            if (rnd(5) > 0) {
                lines.push('TY  - JOUR');
            }
            const entries = 1 + rnd(6);
            for (let i = 0; i < entries; i++) {
                lines.push(`${pick(TAGS)}${pick(SEPARATORS)}${pick(VALUES)}`);
                if (rnd(4) === 0) {
                    lines.push(pick(CONTINUATIONS));
                }
            }
            if (rnd(6) > 0) {
                lines.push(pick(['ER  - ', 'ER  -', 'ER  - ignored']));
            }
            if (rnd(3) === 0) {
                lines.push('');
            }
        }
        let src = '';
        for (const line of lines) {
            src += line + pick(EOLS);
        }
        // unterminated last line
        sources.push(rnd(4) === 0 ? src.replace(/(\r\n|\r|\n)$/, '') : src);
    }
    return sources;
}

const fixedChunks = (size: number) => (src: string) => {
    const chunks: Chunk[] = [];
    for (let i = 0; i < src.length; i += size) {
        chunks.push(src.slice(i, i + size));
    }
    return chunks;
};

const byteChunks = (size: number) => (src: string) => {
    const bytes = new TextEncoder().encode(src);
    const chunks: Chunk[] = [];
    for (let i = 0; i < bytes.length; i += size) {
        chunks.push(bytes.slice(i, i + size));
    }
    return chunks;
};

const CHUNKERS: [string, (src: string) => Chunk[]][] = [
    ...[1, 2, 3, 5, 7, 12, 64].map((size): [string, (src: string) => Chunk[]] => [`size ${size}`, fixedChunks(size)]),
    ['split after every CR', (src) => src.split(/(?<=\r)/)],
    ['empty chunks interleaved', (src) => fixedChunks(3)(src).flatMap((chunk) => ['', chunk, ''])],
    ['bytes size 1', byteChunks(1)],
    ['bytes size 5', byteChunks(5)],
];

async function* toStream(chunks: Chunk[]): AsyncIterable<Chunk> {
    for (const chunk of chunks) {
        yield chunk;
    }
}

const collector = () => {
    const incidents: Incident[] = [];
    const onError = (incident: RisErrorContext) => {
        incidents.push({ message: incident.error.message, tag: incident.tag, rawLine: incident.rawLine });
    };
    return { incidents, onError };
};

const SOURCES = createSources(60);

describe('parse - integration > sync-stream differential', () => {
    for (const options of OPTION_SETS) {
        describe(`Options: ${JSON.stringify(options)}`, () => {
            it.each(SOURCES.map((src, index) => [index, src]))(
                'should yield the same records and incidents from parseStream as from parse | Source #%p',
                async (_, src) => {
                    const sync = collector();
                    const expected = parse(src, { ...options, logLevel: 'info', onError: sync.onError });

                    for (const [name, chunker] of CHUNKERS) {
                        const streamed = collector();
                        const records: Record<string, unknown>[] = [];
                        for await (const record of parseStream(toStream(chunker(src)), {
                            ...options,
                            logLevel: 'info',
                            onError: streamed.onError,
                        })) {
                            records.push(record);
                        }

                        expect({ chunker: name, records }).toStrictEqual({ chunker: name, records: expected });
                        expect({ chunker: name, incidents: streamed.incidents }).toStrictEqual({
                            chunker: name,
                            incidents: sync.incidents,
                        });
                    }
                },
            );
        });
    }
});
