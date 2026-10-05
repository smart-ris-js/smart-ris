// Copyright 2026 Martin Winkler

import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import type { RisErrorContext } from '@smart-ris/core';
import { ERROR_MESSAGES, RIS_ERROR, RisError, RisWarning } from '@smart-ris/core';
import { createStringifyEngine } from '../../src/engine/stringify.engine.js';
import { buildStringifyPipeline } from '../../src/middlewares/stringify.pipeline.js';
import { resolveStringifyOptions } from '../../src/stringify.resolver.js';

function createTestEngine(opts: any = {}) {
    const resolvedOpts = resolveStringifyOptions({ logLevel: 'info', ...opts });
    return createStringifyEngine({ ...resolvedOpts, middlewares: buildStringifyPipeline(resolvedOpts) });
}

describe('stringify - integration > onError', () => {
    describe('Logic', () => {
        const executedLines = new Set<number>();
        const expectedLines: number[] = [];
        let engineLines: string[] = [];

        // 1. Static Analysis Phase
        beforeAll(async () => {
            const enginePath = `${import.meta.dir}/../../src/engine/stringify.engine.ts`;
            const engineCode = await Bun.file(enginePath).text();
            engineLines = engineCode.split('\n');

            engineLines.forEach((line, index) => {
                if (line.match(/emitError\s*\(/) && !line.trim().startsWith('//')) {
                    expectedLines.push(index + 1);
                }
            });
        });

        // 2. Runtime Tracking Helper
        const trackExecution = (err: Error) => {
            const match = err.stack?.match(/stringify\.engine\.ts:(\d+)/);
            if (match) {
                let lineNum = parseInt(match[1], 10);

                // Find actual line nr
                while (
                    lineNum > 0 &&
                    (!engineLines[lineNum - 1]?.match(/emitError\s*\(/) ||
                        engineLines[lineNum - 1]?.trim().startsWith('//'))
                ) {
                    lineNum--;
                }
                executedLines.add(lineNum);
            }
        };

        // 3. Test Execution
        describe('Invalid Input Objects', () => {
            it('should call onError for Invalid Record Type (null)', () => {
                const onError = mock((incident: RisErrorContext) => {
                    trackExecution(incident.error);
                    expect(incident.error).toBeInstanceOf(RisError);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.INVALID_RECORD_TYPE]);
                });

                const engine = createTestEngine({ onError });
                engine.serializeRecord(null as any);
                expect(onError).toHaveBeenCalledTimes(1);
            });
        });

        describe('ER Tag Validations', () => {
            it('should call onError when ER tag contains data', () => {
                const onError = mock((incident: RisErrorContext) => {
                    trackExecution(incident.error);
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe('Data provided for ER tag is ignored');
                    expect(incident.tag).toBe('ER');
                });

                const engine = createTestEngine({ onError });
                engine.serializeRecord({ TY: 'JOUR', ER: 'Some data' });
                expect(onError).toHaveBeenCalledTimes(1);
            });
        });

        describe('Invalid Tag Format Validations', () => {
            it('should call onError for INVALID_TAG_FORMAT_BASE when a bad tag is encountered by default', () => {
                const onError = mock((incident: RisErrorContext) => {
                    trackExecution(incident.error);
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.INVALID_TAG_FORMAT_BASE]);
                });

                const engine = createTestEngine({ onError });
                engine.serializeRecord({ TY: 'JOUR', '@@': 'Value' });
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should call onError for INVALID_TAG_FORMAT_SKIPPED when skipInvalidTags is true', () => {
                const onError = mock((incident: RisErrorContext) => {
                    trackExecution(incident.error);
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.INVALID_TAG_FORMAT_SKIPPED]);
                });

                const engine = createTestEngine({ onError, skipInvalidTags: true });
                engine.serializeRecord({ TY: 'JOUR', '@@': 'Value' });
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should call onError for INVALID_TAG_FORMAT_SEMANTIC when fromSemantic is true', () => {
                const onError = mock((incident: RisErrorContext) => {
                    trackExecution(incident.error);
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.INVALID_TAG_FORMAT_SEMANTIC]);
                });

                const engine = createTestEngine({ onError, fromSemantic: true });
                engine.serializeRecord({ typeOfReference: 'JOUR', 'invalidKey@@': 'Value' });
                expect(onError).toHaveBeenCalledTimes(1);
            });
        });

        describe('TY Tag Validations', () => {
            it('should call onError for missing TY tag', () => {
                const onError = mock((incident: RisErrorContext) => {
                    trackExecution(incident.error);
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.MISSING_TY_TAG]);
                    expect(incident.tag).toBe('TY');
                });

                const engine = createTestEngine({ onError });
                engine.serializeRecord({ TI: 'Title' });
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should call onError for multiple TY tag values', () => {
                const onError = mock((incident: RisErrorContext) => {
                    trackExecution(incident.error);
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.INVALID_TY_VALUE]);
                    expect(incident.tag).toBe('TY');
                });

                const engine = createTestEngine({ onError });
                engine.serializeRecord({ TY: ['JOUR', 'BOOK'] });
                expect(onError).toHaveBeenCalledTimes(1);
            });
        });

        describe('Embedded Line Validations', () => {
            it('should call onError for an embedded line starting like a tag header', () => {
                const onError = mock((incident: RisErrorContext) => {
                    trackExecution(incident.error);
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.TAG_LIKE_CONTINUATION_INDENTED]);
                    expect(incident.tag).toBe('AB');
                    expect(incident.rawLine).toBe('AU - Smith');
                });

                const engine = createTestEngine({ onError });
                engine.serializeRecord({ TY: 'JOUR', AB: 'Quote:\nAU - Smith' });
                expect(onError).toHaveBeenCalledTimes(1);
            });
        });

        describe('Value Formats Validations', () => {
            it('should call onError for native invalid Date object', () => {
                const onError = mock((incident: RisErrorContext) => {
                    trackExecution(incident.error);
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.INVALID_DATE_FALLBACK]);
                    expect(incident.tag).toBe('Y1');
                });

                const engine = createTestEngine({ onError, logLevel: 'warn' });
                engine.serializeRecord({ TY: 'JOUR', Y1: new Date('invalid') });
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should call onError for unparseable date string when useSmartTypes is true', () => {
                const onError = mock((incident: RisErrorContext) => {
                    trackExecution(incident.error);
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.INVALID_DATE_FALLBACK]);
                    expect(incident.tag).toBe('Y1');
                });

                const engine = createTestEngine({ onError, useSmartTypes: true, logLevel: 'warn' });
                // We must use a tag that has 'date' type in smart cast schema, e.g., Y1
                engine.serializeRecord({ TY: 'JOUR', Y1: 'not a date' });
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should call onError for unsupported object types', () => {
                const onError = mock((incident: RisErrorContext) => {
                    trackExecution(incident.error);
                    expect(incident.error).toBeInstanceOf(RisError);
                    expect(incident.error.message).toBe('Unsupported object type passed as value');
                    expect(incident.tag).toBe('A1');
                });

                const engine = createTestEngine({ onError });
                engine.serializeRecord({ TY: 'JOUR', A1: { nested: 'object' } as any });
                expect(onError).toHaveBeenCalledTimes(1);
            });
        });

        describe('Unsupported Value Types', () => {
            it.each([
                ['function', () => 1],
                ['symbol', Symbol('x')],
            ])('should call onError for %s values and omit the tag', (_label, value) => {
                const record = { TY: 'JOUR', AU: value, TI: 'Title' };
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisError);
                    expect(incident.error.message).toBe('Unsupported value type passed as value');
                    expect(incident.tag).toBe('AU');
                    expect(incident.rawLine).toBe(`AU - ${String(value)}`);
                    expect(incident.recordContext).toBeDefined();
                });

                const engine = createTestEngine({ onError });
                const output = engine.serializeRecord(record as any);
                expect(onError).toHaveBeenCalledTimes(1);
                expect(output).not.toContain('AU  -');
                expect(output).toContain('TI  - Title');
            });
        });

        // 4. Check if all `onError` calls in stringify.engine.ts were actually tested
        afterAll(() => {
            const untestedLines = expectedLines.filter((line) => !executedLines.has(line));
            expect(untestedLines).toEqual([]);
        });
    });
});
