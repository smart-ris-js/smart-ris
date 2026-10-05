// Copyright 2026 Martin Winkler

import { describe, expect, it, mock } from 'bun:test';
import { LOG_LEVEL } from '@smart-ris/core';
import { createStringifyEngine, type StringifyEngineOptions } from '../../../src/engine/stringify.engine.js';
import { buildStringifyPipeline } from '../../../src/middlewares/stringify.pipeline.js';
import { resolveStringifyOptions } from '../../../src/stringify.resolver.js';

const defaultOptions: StringifyEngineOptions = {
    repairTags: true,
    skipInvalidTags: false,
    skipEmptyTags: true,
    fromSemantic: false,
    eol: '\n',
    logLevel: LOG_LEVEL.error,
    middlewares: [],
};

function helperCreateEngine(opts: Partial<any> = {}) {
    const rawLevel = opts.logLevel ?? defaultOptions.logLevel;
    const logLevel = typeof rawLevel === 'number' ? rawLevel : LOG_LEVEL[rawLevel as keyof typeof LOG_LEVEL];
    const fullOpts = { ...defaultOptions, ...opts, logLevel };
    return createStringifyEngine(fullOpts);
}

function createEngineWithPipeline(opts: any = {}) {
    const resolvedOpts = resolveStringifyOptions(opts);
    const middlewares = buildStringifyPipeline(resolvedOpts);
    return createStringifyEngine({ ...defaultOptions, ...resolvedOpts, middlewares });
}

describe('stringify - unit > engine > stringify.engine', () => {
    describe('Function: createStringifyEngine()', () => {
        it('should merge values when normalized tag keys collide (" AU" before "AU") during ingestion', () => {
            const engine = helperCreateEngine();

            const result = engine.serializeRecord({
                TY: 'JOUR',
                ' AU': 'Alpha, A.',
                AU: 'Beta, B.',
            });

            expect(result).toBe('TY  - JOUR\nAU  - Alpha, A.\nAU  - Beta, B.\nER  - \n');
        });

        it('should merge values when normalized tag keys collide ("AU" before " AU") during ingestion', () => {
            const engine = helperCreateEngine();

            const result = engine.serializeRecord({
                TY: 'JOUR',
                AU: 'Alpha, A.',
                ' AU': 'Beta, B.',
            });

            expect(result).toBe('TY  - JOUR\nAU  - Alpha, A.\nAU  - Beta, B.\nER  - \n');
        });

        it('should not mutate caller input array when normalized tag keys collide during ingestion', () => {
            const engine = helperCreateEngine();
            const callerArray = ['Alpha, A.'];
            const inputObject = {
                TY: 'JOUR',
                AU: callerArray,
                ' au': 'Beta, B.',
            };

            const result = engine.serializeRecord(inputObject);

            expect(result).toBe('TY  - JOUR\nAU  - Alpha, A.\nAU  - Beta, B.\nER  - \n');
            expect(callerArray).toEqual(['Alpha, A.']); // Must NOT have 'Beta, B.' appended
        });

        it('should safely merge very large arrays without exceeding call stack limits when tag keys collide', () => {
            const engine = helperCreateEngine();
            const largeArray = new Array(150_000).fill('Keyword');
            const inputObject = {
                TY: 'JOUR',
                KW: largeArray,
                ' kw': ['ExtraKeyword'],
            };

            const result = engine.serializeRecord(inputObject);
            expect(result.startsWith('TY  - JOUR\nKW  - Keyword\n')).toBe(true);
            expect(result.endsWith('KW  - ExtraKeyword\nER  - \n')).toBe(true);
        });

        it('should output two empty tag lines when colliding empty tags are provided with skipEmptyTags: false', () => {
            const engine = helperCreateEngine({ skipEmptyTags: false });

            const result = engine.serializeRecord({
                TY: 'JOUR',
                ' XX': null,
                XX: null,
            });

            // Both null entries kept — each produces a blank line
            expect(result).toBe('TY  - JOUR\nXX  - \nXX  - \nER  - \n');
        });

        it('should fallback empty TY value to GEN and emit warning even with skipEmptyTags: false', () => {
            const onError = mock();
            const engine = helperCreateEngine({ skipEmptyTags: false, logLevel: 'warn', onError });

            const result = engine.serializeRecord({
                TY: null,
                AU: 'Smith, J.',
            });

            expect(result).toBe('TY  - GEN\nAU  - Smith, J.\nER  - \n');
            expect(onError).toHaveBeenCalledTimes(1);
        });

        it('should preserve multiple lines for array-tags when mapped via tagMapping', () => {
            const engine = createEngineWithPipeline({
                tagMapping: {
                    A1: 'AU',
                },
            });

            const result = engine.serializeRecord({
                TY: 'JOUR',
                AU: 'Direct Author',
                A1: 'Mapped Author',
            });

            expect(result).toBe('TY  - JOUR\nAU  - Direct Author\nAU  - Mapped Author\nER  - \n');
        });

        it('should clean arrays containing null or non-string elements during ingestion', () => {
            const engine = helperCreateEngine();

            const result = engine.serializeRecord({
                TY: 'JOUR',
                AU: ['Author 1', null, 2026, '  Author 2  '],
            });

            expect(result).toBe('TY  - JOUR\nAU  - Author 1\nAU  - 2026\nAU  - Author 2\nER  - \n');
        });
    });

    describe('Function: serializeRecord() - input validation & builders', () => {
        it.each([[null], [undefined], [123], ['invalid-string'], [[1, 2, 3]]])(
            'should return empty string and trigger onError for non-object inputs | Input: %p',
            (input) => {
                let errorMsg = '';
                const engine = helperCreateEngine({
                    onError: (incident) => {
                        errorMsg = incident.error.message;
                    },
                });

                const result = engine.serializeRecord(input as unknown as Record<string, unknown>);
                expect(result).toBe('');
                expect(errorMsg).toContain('Input to stringifier must be');
            },
        );

        it.each([[null], [123], ['invalid-string'], [[1, 2, 3]]])(
            'should omit recordContext for non-record inputs | Input: %p',
            (input) => {
                const onError = mock();
                helperCreateEngine({ onError }).serializeRecord(input as unknown as Record<string, unknown>);
                expect(onError).toHaveBeenCalledTimes(1);
                expect(onError.mock.calls[0][0]).not.toHaveProperty('recordContext');
            },
        );

        it('should return empty string without error when input is non-object and onError is undefined', () => {
            const engine = helperCreateEngine();
            const result = engine.serializeRecord(null as unknown as Record<string, unknown>);
            expect(result).toBe('');
        });

        it('should return empty string without error when input is an empty object', () => {
            const engine = helperCreateEngine();
            const result = engine.serializeRecord({});
            expect(result).toBe('');
        });

        it('should serialize record created via RisBuilder object', () => {
            const engine = helperCreateEngine();
            const builderInput = {
                raw: () => ({
                    TY: ['JOUR'],
                    TI: ['Builder Title'],
                }),
            };

            const result = engine.serializeRecord(builderInput as any);
            expect(result).toBe('TY  - JOUR\nTI  - Builder Title\nER  - \n');
        });

        it.each([['so'], [['x']], [null]])(
            'should serialize the record itself when its raw() returns a non-record | raw(): %p',
            (rawResult) => {
                const onError = mock();
                const result = createEngineWithPipeline({ onError }).serializeRecord({
                    TY: 'JOUR',
                    TI: 'Title',
                    raw: () => rawResult,
                } as unknown as Record<string, unknown>);
                expect(result).toBe('TY  - JOUR\nTI  - Title\nER  - \n');
                expect(onError.mock.calls[0][0].tag).toBe('RAW');
            },
        );
    });

    describe('Function: serializeRecord() - array & scalar ingestion', () => {
        it('should trim string values and filter out inherited prototype properties', () => {
            const engine = helperCreateEngine();
            const protoObj = Object.create({ INHERITED: 'Should Be Ignored' });
            protoObj.TY = 'JOUR';
            protoObj.TI = '  Padded Title  ';

            const result = engine.serializeRecord(protoObj);
            expect(result).toBe('TY  - JOUR\nTI  - Padded Title\nER  - \n');
        });

        it('should handle empty string values according to skipEmptyTags option', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true });
            const result = engine.serializeRecord({
                TY: 'JOUR',
                TI: '   ',
            });
            expect(result).toBe('TY  - JOUR\nER  - \n');
        });

        it('should handle empty array and array with only null/whitespace elements', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true });
            const result = engine.serializeRecord({
                TY: 'JOUR',
                AU: [],
                A1: [null, '   '],
            });
            expect(result).toBe('TY  - JOUR\nER  - \n');
        });

        it('should execute slow path array cleaning for arrays with mixed whitespace and null elements', () => {
            const engine = helperCreateEngine();
            const result = engine.serializeRecord({
                TY: 'JOUR',
                AU: ['  Author 1  ', null, '   ', 'Author 2'],
            });
            expect(result).toBe('TY  - JOUR\nAU  - Author 1\nAU  - Author 2\nER  - \n');
        });

        it('should replace existing null value when colliding tag key is ingested with non-null value', () => {
            const engine = helperCreateEngine();
            const result = engine.serializeRecord({
                TY: 'JOUR',
                XX: null,
                ' XX ': 'NonNullValue',
            });
            expect(result).toBe('TY  - JOUR\nXX  - NonNullValue\nER  - \n');
        });

        it('should append null when colliding tag key is ingested with null value — null handled downstream by skipEmptyTags', () => {
            const engine = helperCreateEngine({ skipEmptyTags: false });
            const result = engine.serializeRecord({
                TY: 'JOUR',
                XX: 'NonNullValue',
                ' XX ': null,
            });
            // keep-all: ['NonNullValue', null] → 'NonNullValue' line + blank line
            expect(result).toBe('TY  - JOUR\nXX  - NonNullValue\nXX  - \nER  - \n');
        });

        it('should merge incoming values when colliding tag keys are ingested with non-null values', () => {
            const engine = helperCreateEngine();
            const result = engine.serializeRecord({
                TY: 'JOUR',
                AU: 'Author 1',
                ' AU ': ['Author 2', 'Author 3'],
            });
            expect(result).toBe('TY  - JOUR\nAU  - Author 1\nAU  - Author 2\nAU  - Author 3\nER  - \n');
        });

        it('should merge incoming scalar into existing array when colliding tag keys are ingested', () => {
            const engine = helperCreateEngine();
            const result = engine.serializeRecord({
                TY: 'JOUR',
                AU: ['Author 1', 'Author 2'],
                ' AU ': 'Author 3',
            });
            expect(result).toBe('TY  - JOUR\nAU  - Author 1\nAU  - Author 2\nAU  - Author 3\nER  - \n');
        });
    });

    describe('Function: serializeRecord() - TY tag handling & fallbacks', () => {
        it('should fallback to default reference type (GEN) and trigger warning when TY tag is missing', () => {
            let warningMsg = '';
            const engine = helperCreateEngine({
                logLevel: 'info',
                onError: (incident) => {
                    warningMsg = incident.error.message;
                },
            });

            const result = engine.serializeRecord({
                TI: 'Title Without TY',
            });

            expect(warningMsg).toBe('Missing TY tag.');
            expect(result).toBe('TY  - GEN\nTI  - Title Without TY\nER  - \n');
        });

        it('should fallback to default reference type (GEN) quietly when TY tag is missing and onError is undefined', () => {
            const engine = helperCreateEngine();
            const result = engine.serializeRecord({
                TI: 'Title Without TY',
            });

            expect(result).toBe('TY  - GEN\nTI  - Title Without TY\nER  - \n');
        });

        it('should select known TY value when multiple TY tags are provided and trigger warning', () => {
            let warningTriggered = false;
            const engine = helperCreateEngine({
                logLevel: 'info',
                onError: () => {
                    warningTriggered = true;
                },
            });

            const result = engine.serializeRecord({
                TY: ['CUSTOM_TYPE', 'JOUR'],
            });

            expect(warningTriggered).toBeTrue();
            expect(result).toBe('TY  - JOUR\nER  - \n');
        });

        it('should select known TY value quietly when multiple TY tags are provided and onError is undefined', () => {
            const engine = helperCreateEngine();
            const result = engine.serializeRecord({
                TY: ['CUSTOM_TYPE', 'BOOK'],
            });

            expect(result).toBe('TY  - BOOK\nER  - \n');
        });

        it('should select first TY value when multiple unknown TY tags are provided', () => {
            const engine = helperCreateEngine();
            const result = engine.serializeRecord({
                TY: ['CUSTOM_ONE', 'CUSTOM_TWO'],
            });

            expect(result).toBe('TY  - CUSTOM_ONE\nER  - \n');
        });
    });

    describe('Function: serializeRecord() - tag sorting & EOL formatting', () => {
        it('should sort standard RIS tags according to specification and custom tags alphabetically', () => {
            const engine = helperCreateEngine();
            const result = engine.serializeRecord({
                ZZ: 'Custom Z',
                AA: 'Custom A',
                TI: 'Sample Title',
                TY: 'JOUR',
                AU: 'Sample Author',
            });

            expect(result).toBe(
                'TY  - JOUR\nAU  - Sample Author\nTI  - Sample Title\nAA  - Custom A\nZZ  - Custom Z\nER  - \n',
            );
        });

        it('should output string using custom eol separator', () => {
            const engine = helperCreateEngine({ eol: '\r\n' });
            const result = engine.serializeRecord({
                TY: 'JOUR',
                TI: 'Sample Title',
            });

            expect(result).toBe('TY  - JOUR\r\nTI  - Sample Title\r\nER  - \r\n');
        });

        it('should normalize LF embedded in values to custom eol separator', () => {
            const engine = helperCreateEngine({ eol: '\r\n' });
            const result = engine.serializeRecord({
                TY: 'JOUR',
                AB: 'Line 1\nLine 2',
            });

            expect(result).toBe('TY  - JOUR\r\nAB  - Line 1\r\nLine 2\r\nER  - \r\n');
        });

        it('should normalize CRLF embedded in values to CR eol separator', () => {
            const engine = helperCreateEngine({ eol: '\r' });
            const result = engine.serializeRecord({
                TY: 'JOUR',
                AB: 'Line 1\r\nLine 2',
            });

            expect(result).toBe('TY  - JOUR\rAB  - Line 1\rLine 2\rER  - \r');
        });

        it('should normalize mixed CR, LF and CRLF embedded in values to LF eol separator', () => {
            const engine = helperCreateEngine({ eol: '\n' });
            const result = engine.serializeRecord({
                TY: 'JOUR',
                AB: 'a\rb\nc\r\nd',
            });

            expect(result).toBe('TY  - JOUR\nAB  - a\nb\nc\nd\nER  - \n');
        });

        it('should normalize embedded line breaks in every array element and in TY value', () => {
            const engine = helperCreateEngine({ eol: '\r\n' });
            const result = engine.serializeRecord({
                TY: 'JOUR\nBOOK',
                AU: ['Alpha\nA.', 'Beta\rB.'],
            });

            expect(result).toBe('TY  - JOUR\r\nBOOK\r\nAU  - Alpha\r\nA.\r\nAU  - Beta\r\nB.\r\nER  - \r\n');
        });
    });

    describe('Option: repairTags', () => {
        it('should repair non-standard tags to valid RIS tags when repairTags is true', () => {
            const engine = helperCreateEngine({ repairTags: true });

            const result = engine.serializeRecord({
                t_y: 'JOUR',
                'a.u': 'John Doe',
            });

            expect(result).toBe('TY  - JOUR\nAU  - John Doe\nER  - \n');
        });

        it('should repair tags during ingestion ("T_1" before "T1") so arrayCaster applies arrayMergeStrategy to scalar tags', () => {
            const engine = createEngineWithPipeline({
                repairTags: true,
                arrayMergeStrategy: 'join-space',
            });

            const result = engine.serializeRecord({
                TY: 'JOUR',
                T_1: 'Title One',
                T1: 'Title Two',
            });

            expect(result).toBe('TY  - JOUR\nT1  - Title One Title Two\nER  - \n');
        });

        it('should repair tags during ingestion ("T1" before "T_1") so arrayCaster applies arrayMergeStrategy to scalar tags', () => {
            const engine = createEngineWithPipeline({
                repairTags: true,
                arrayMergeStrategy: 'join-space',
            });

            const result = engine.serializeRecord({
                TY: 'JOUR',
                T1: 'Title One',
                T_1: 'Title Two',
            });

            expect(result).toBe('TY  - JOUR\nT1  - Title One Title Two\nER  - \n');
        });

        it('should repair tags in Step 3 if a middleware mapping outputs an invalid tag format', () => {
            const engine = helperCreateEngine({
                repairTags: true,
                middlewares: [(payload) => ({ ...payload, T_1: 'Mapped Title' })],
            });

            const result = engine.serializeRecord({
                TY: 'JOUR',
            });

            expect(result).toBe('TY  - JOUR\nT1  - Mapped Title\nER  - \n');
        });

        it('should accumulate tagMap values in Step 3 when middleware outputs repaired tag colliding with existing tag', () => {
            const engine = helperCreateEngine({
                repairTags: true,
                middlewares: [(payload) => ({ ...payload, T_1: 'Title Two' })],
            });

            const result = engine.serializeRecord({
                TY: 'JOUR',
                T1: 'Title One',
            });

            expect(result).toBe('TY  - JOUR\nT1  - Title One\nT1  - Title Two\nER  - \n');
        });

        it('should not repair non-standard tags when repairTags is false', () => {
            const engine = helperCreateEngine({ repairTags: false });

            const result = engine.serializeRecord({
                TY: 'JOUR',
                A_U: 'John Doe',
            });

            expect(result).toBe('TY  - JOUR\nA_U  - John Doe\nER  - \n');
        });

        it('should drop unrepairable tags when repairTags is false and skipInvalidTags is true', () => {
            const engine = helperCreateEngine({ repairTags: false, skipInvalidTags: true });

            const result = engine.serializeRecord({
                TY: 'JOUR',
                A_U: 'John Doe',
            });

            expect(result).toBe('TY  - JOUR\nER  - \n');
        });

        it('should trigger onError and handle unrepairable invalid tag lengths (e.g. 1 or 3 chars)', () => {
            let errorTriggered = false;
            const engine = helperCreateEngine({
                repairTags: true,
                skipInvalidTags: true,
                logLevel: 'warn',
                onError: () => {
                    errorTriggered = true;
                },
            });

            const result = engine.serializeRecord({
                TY: 'JOUR',
                A: 'Invalid Tag A',
                ABC: 'Invalid Tag ABC',
            });

            expect(errorTriggered).toBe(true);
            expect(result).toBe('TY  - JOUR\nER  - \n');
        });
    });

    describe('Option: skipEmptyTags', () => {
        it('should output empty tag lines when skipEmptyTags is false', () => {
            const engine = helperCreateEngine({ skipEmptyTags: false });
            const result = engine.serializeRecord({
                TY: 'JOUR',
                TI: null,
            });

            expect(result).toBe('TY  - JOUR\nTI  - \nER  - \n');
        });

        it('should output empty tag lines for null/empty elements in array when skipEmptyTags is false', () => {
            const engine = helperCreateEngine({ skipEmptyTags: false });
            const result = engine.serializeRecord({
                TY: 'JOUR',
                AU: ['Author 1', null, '   '],
            });

            expect(result).toBe('TY  - JOUR\nAU  - Author 1\nAU  - \nAU  - \nER  - \n');
        });

        it('should collapse array containing only null values to single empty tag line when skipEmptyTags is false', () => {
            const engine = helperCreateEngine({ skipEmptyTags: false });
            const result = engine.serializeRecord({
                TY: 'JOUR',
                AU: [null, null],
            });

            expect(result).toBe('TY  - JOUR\nAU  - \nER  - \n');
        });

        it('should omit empty tag lines when skipEmptyTags is true', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true });
            const result = engine.serializeRecord({
                TY: 'JOUR',
                TI: null,
            });

            expect(result).toBe('TY  - JOUR\nER  - \n');
        });
    });

    describe('Option: skipInvalidTags', () => {
        it('should trigger INVALID_TAG_FORMAT_SEMANTIC message when fromSemantic is true and tag is invalid', () => {
            let errorMsg = '';
            const engine = helperCreateEngine({
                fromSemantic: true,
                skipInvalidTags: false,
                repairTags: false,
                logLevel: 'warn',
                onError: (incident) => {
                    errorMsg = incident.error.message;
                },
            });

            engine.serializeRecord({
                TY: 'JOUR',
                INVALID_TAG: 'Value',
            });

            expect(errorMsg).toContain('semantic');
        });

        it('should trigger INVALID_TAG_FORMAT_BASE message when fromSemantic is false and tag is invalid', () => {
            let errorMsg = '';
            const engine = helperCreateEngine({
                fromSemantic: false,
                skipInvalidTags: false,
                repairTags: false,
                logLevel: 'warn',
                onError: (incident) => {
                    errorMsg = incident.error.message;
                },
            });

            engine.serializeRecord({
                TY: 'JOUR',
                INVALID_TAG: 'Value',
            });

            expect(errorMsg).not.toContain('semantic');
        });

        it.each([
            [false, 'Invalid tag format. Tag must be exactly 2', 'TY  - JOUR\nINVALID_TAG  - Value\nER  - \n'],
            [true, 'Invalid tag omitted due to option skipInvalidTags:true', 'TY  - JOUR\nER  - \n'],
        ] as const)(
            'should emit RisWarning for invalid tags (skipInvalidTags: %p)',
            (skipInvalidTags, message, output) => {
                const onError = mock();
                const engine = helperCreateEngine({ skipInvalidTags, repairTags: false, logLevel: 'warn', onError });

                expect(engine.serializeRecord({ TY: 'JOUR', INVALID_TAG: 'Value' })).toBe(output);
                expect(onError).toHaveBeenCalledTimes(1);
                const incident = onError.mock.calls[0][0];
                expect(incident.error.name).toBe('RisWarning');
                expect(incident.error.message).toStartWith(message);
                expect(incident.tag).toBe('INVALID_TAG');
            },
        );

        it('should return empty string when all tags in record are invalid and skipped', () => {
            const engine = helperCreateEngine({
                repairTags: false,
                skipInvalidTags: true,
            });

            const result = engine.serializeRecord({
                '###': 'Invalid',
            });

            expect(result).toBe('');
        });
    });

    describe('Option: onError', () => {
        it('should trigger warning callback when ER tag contains data and ignore ER tag value', () => {
            let warningTriggered = false;
            const engine = helperCreateEngine({
                logLevel: 'info',
                onError: (incident) => {
                    warningTriggered = true;
                    expect(incident.error.message).toContain('Data provided for ER tag is ignored');
                },
            });

            const result = engine.serializeRecord({
                TY: 'JOUR',
                ER: 'Custom End Data',
            });

            expect(warningTriggered).toBeTrue();
            expect(result).toBe('TY  - JOUR\nER  - \n');
        });

        it('should ignore ER tag quietly when ER tag is null or empty', () => {
            let warningTriggered = false;
            const engine = helperCreateEngine({
                onError: () => {
                    warningTriggered = true;
                },
            });

            const result = engine.serializeRecord({
                TY: 'JOUR',
                ER: null,
            });

            expect(warningTriggered).toBeFalse();
            expect(result).toBe('TY  - JOUR\nER  - \n');
        });

        it('should ignore ER tag quietly when ER tag contains only empty or whitespace strings', () => {
            let warningTriggered = false;
            const engine = helperCreateEngine({
                skipEmptyTags: false,
                onError: () => {
                    warningTriggered = true;
                },
            });

            const result = engine.serializeRecord({
                TY: 'JOUR',
                ER: ['   ', ''] as any,
            });

            expect(warningTriggered).toBeFalse();
            expect(result).toBe('TY  - JOUR\nER  - \n');
        });

        it('should throw error when tagMapping maps to reserved tags ER or TY', () => {
            expect(() => createEngineWithPipeline({ tagMapping: { XX: 'ER' } })).toThrow(
                "Cannot map to 'TY' or 'ER' tags.",
            );
            expect(() => createEngineWithPipeline({ tagMapping: { XX: 'TY' } })).toThrow(
                "Cannot map to 'TY' or 'ER' tags.",
            );
        });
    });
});
