// Copyright 2026 Martin Winkler

import { describe, expect, test } from 'bun:test';
import { tag as DEFAULT_SEMANTIC_TAGS_MAP } from '@smart-ris/core';
import { type ParseOptions, parse, parseStream } from '../../../src/index.js';
import { allFixtures, type ParseFixtures } from '../fixtures/index.js';
import { parseFixtureOptions } from './settings.js';

export async function* createMockStream(data: string, chunkSize: number = 12): AsyncIterable<string> {
    for (let i = 0; i < data.length; i += chunkSize) {
        yield data.slice(i, i + chunkSize);
    }
}

const semanticReverseMap: Record<string, string> = Object.create(null);
for (const sem in DEFAULT_SEMANTIC_TAGS_MAP) {
    semanticReverseMap[DEFAULT_SEMANTIC_TAGS_MAP[sem as keyof typeof DEFAULT_SEMANTIC_TAGS_MAP]] = sem;
}
semanticReverseMap.EE = 'EETag';

function mapExpectedToSemantic(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(mapExpectedToSemantic);
    }
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
        const semKey = semanticReverseMap[k] ?? k;
        res[semKey] = v;
    }
    return res;
}

type ExpectedKey = keyof ParseFixtures['expected'];

/**
 * `expectedKeys`: fallback chain, first defined key wins, then `default`.
 * With `toSemantic: true`, fallbacks from non-`toSemantic` keys are mapped to semantic keys.
 */
export function runParseFixtures(
    suiteName: string,
    settingsOverride: Partial<ParseOptions>,
    expectedKeys: ExpectedKey | ExpectedKey[],
) {
    const currentSettings = { ...parseFixtureOptions, ...settingsOverride };
    const keyChain: ExpectedKey[] = Array.isArray(expectedKeys) ? expectedKeys : [expectedKeys];

    describe(`Parse Settings: ${suiteName}`, () => {
        for (const fixture of allFixtures) {
            const resolvedKey = keyChain.find((key) => fixture.expected[key] !== undefined) ?? 'default';
            let expectedResult = fixture.expected[resolvedKey] ?? fixture.expected.default;
            if (settingsOverride.toSemantic === true && !resolvedKey.includes('toSemantic')) {
                expectedResult = mapExpectedToSemantic(expectedResult);
            }
            // single-object fixtures are a shorthand for one record; the full output is always asserted
            const expectedRecords = Array.isArray(expectedResult) ? expectedResult : [expectedResult];

            test(`[Sync] ${fixture.desc}`, () => {
                const result = parse(fixture.input, currentSettings as any);

                expect(result).toStrictEqual(expectedRecords);
                for (const record of result) {
                    expect(Object.getPrototypeOf(record)).toBeNull();
                }
            });

            test(`[Stream] ${fixture.desc}`, async () => {
                const stream = createMockStream(fixture.input, 12);
                const results = [];
                for await (const record of parseStream(stream, currentSettings as any)) {
                    results.push(record);
                }

                expect(results).toStrictEqual(expectedRecords);
                for (const record of results) {
                    expect(Object.getPrototypeOf(record)).toBeNull();
                }
            });
        }
    });
}
