// Copyright 2026 Martin Winkler

import { describe, expect, test } from 'bun:test';
import { type StringifyOptions, stringify } from '../../../src/index.js';
import { allFixtures } from '../fixtures/index.js';
import { stringifyFixtureOptions } from './settings.js';

export function runStringifyFixtures(
    suiteName: string,
    settingsOverride: Partial<StringifyOptions>,
    expectedKey: string,
) {
    const currentSettings = { ...stringifyFixtureOptions, ...settingsOverride };

    describe(`Stringify Settings: ${suiteName}`, () => {
        for (const fixture of allFixtures) {
            test(fixture.desc, () => {
                const expectedResult =
                    fixture.expected[expectedKey as keyof typeof fixture.expected] ?? fixture.expected.default;

                const clonedInput =
                    typeof fixture.input === 'object' &&
                    fixture.input !== null &&
                    'raw' in fixture.input &&
                    typeof (fixture.input as any).raw === 'function'
                        ? fixture.input
                        : structuredClone(fixture.input);
                const data = Array.isArray(clonedInput) ? clonedInput : [clonedInput];
                const result = stringify(data as any, currentSettings);

                if (expectedResult === '') {
                    expect(result).toBe('');
                } else {
                    expect(result).toEqual(expectedResult);
                }
            });
        }
    });
}
