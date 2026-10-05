// Copyright 2026 Martin Winkler

import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import type { RisErrorContext } from '@smart-ris/core';
import { ERROR_MESSAGES, RIS_ERROR, RisError, RisInfo, RisWarning } from '@smart-ris/core';
import { createParseEngine } from '../../src/engine/parse.engine.js';
import { buildParsePipeline } from '../../src/middlewares/parse.pipeline.js';
import { resolveParseOptions } from '../../src/parse.resolver.js';

function createTestEngine(opts: any = {}) {
    const fullOpts = { logLevel: 'info', ...opts };
    const resolvedOpts = resolveParseOptions(fullOpts);
    const middlewares = buildParsePipeline(resolvedOpts);
    return createParseEngine({
        ...resolvedOpts,
        middlewares,
    });
}

describe('parse - integration > onError', () => {
    describe('Logic', () => {
        describe('Unsupported Format Validations', () => {
            it('should call onError for FN ISI Export format', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisError);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.UNSUPPORTED_FORMAT]);
                });

                const engine = createTestEngine({ onError });
                engine.processLine('FN ISI Export Format');
                expect(onError).toHaveBeenCalledTimes(1);
                expect(engine.isAborted).toBe(true);
            });

            it('should call onError for FN Clarivate Analytics format', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisError);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.UNSUPPORTED_FORMAT]);
                });

                const engine = createTestEngine({ onError });
                engine.processLine('FN Clarivate Analytics');
                expect(onError).toHaveBeenCalledTimes(1);
                expect(engine.isAborted).toBe(true);
            });

            it('should call onError when MAX_RECORD_LINES limit is exceeded', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisError);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.RECORD_EXCEEDS_MAX_LINES]);
                });

                const engine = createTestEngine({ onError });
                engine.processLine('TY  - JOUR');
                for (let i = 0; i < 1001; i++) {
                    engine.processLine(`AU  - Author ${i}`);
                }
                expect(onError).toHaveBeenCalledTimes(1);
                expect(engine.isAborted).toBe(true);
            });
        });

        describe('Outside Record Validations', () => {
            it('should call onError for duplicate ER tag outside of a record', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.DUPLICATE_ER_TAG]);
                });

                const engine = createTestEngine({ onError, logLevel: 'warn' });
                engine.processLine('ER  - ');
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should call onError for valid tags outside of a record', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.VALID_TAG_OUTSIDE_RECORD]);
                });

                const engine = createTestEngine({ onError, logLevel: 'warn' });
                engine.processLine('AU  - Smith, J.');
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should call onError for invalid tags outside of a record', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.CONTENT_OUTSIDE_RECORD]);
                });

                const engine = createTestEngine({ onError, logLevel: 'warn' });
                engine.processLine('INVALID_TAG  - value');
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should call onError for arbitrary content (continuation) outside of a record', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.CONTENT_OUTSIDE_RECORD]);
                });

                const engine = createTestEngine({ onError, logLevel: 'warn' });
                engine.processLine('Just some text line outside record');
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should not call onError for empty or whitespace-only lines outside of a record', () => {
                const onError = mock();
                const engine = createTestEngine({ onError });
                engine.processLine('');
                engine.processLine('   ');
                expect(onError).not.toHaveBeenCalled();
            });
        });

        describe('Inside Record Validations', () => {
            it('should call onError for invalid tags skipped inside a record', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.INVALID_TAG_FORMAT_SKIPPED]);
                    expect(incident.tag).toBe('BADTAG');
                });

                const engine = createTestEngine({ onError, repairTags: true, skipInvalidTags: true, logLevel: 'warn' });
                engine.processLine('TY  - JOUR');
                engine.processLine('BADTAG  - value');
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should call onError with RisWarning for invalid tags retained inside a record', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.INVALID_TAG_FORMAT_BASE]);
                    expect(incident.tag).toBe('BADTAG');
                    expect(incident.lineNumber).toBe(2);
                    expect(incident.rawLine).toBe('BADTAG  - value');
                });

                const engine = createTestEngine({ onError, repairTags: true, skipInvalidTags: false, logLevel: 'warn' });
                engine.processLine('TY  - JOUR');
                engine.processLine('BADTAG  - value');
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should report retained invalid tags with empty values even when skipEmptyTags drops them', () => {
                const onError = mock();
                const engine = createTestEngine({
                    onError,
                    repairTags: true,
                    skipInvalidTags: false,
                    skipEmptyTags: true,
                    logLevel: 'warn',
                });
                engine.processLine('TY  - JOUR');
                engine.processLine('BADTAG  - ');
                expect(onError).toHaveBeenCalledTimes(1);
                expect(onError.mock.calls[0][0].error.message).toBe(ERROR_MESSAGES[RIS_ERROR.INVALID_TAG_FORMAT_BASE]);
            });

            it.each([
                [false, RIS_ERROR.INVALID_TAG_FORMAT_BASE],
                [true, RIS_ERROR.INVALID_TAG_FORMAT_SKIPPED],
            ] as const)(
                'should hide invalid tag warnings at logLevel error (skipInvalidTags: %p)',
                (skipInvalidTags, code) => {
                    const onError = mock();
                    const engine = createTestEngine({ onError, repairTags: true, skipInvalidTags, logLevel: 'error' });
                    engine.processLine('TY  - JOUR');
                    engine.processLine('BADTAG  - value');
                    expect(onError).not.toHaveBeenCalled();

                    const visible = mock();
                    const warnEngine = createTestEngine({ onError: visible, repairTags: true, skipInvalidTags, logLevel: 'warn' });
                    warnEngine.processLine('TY  - JOUR');
                    warnEngine.processLine('BADTAG  - value');
                    expect(visible).toHaveBeenCalledTimes(1);
                    expect(visible.mock.calls[0][0].error.message).toBe(ERROR_MESSAGES[code]);
                },
            );

            it('should report every retained invalid tag occurrence', () => {
                const onError = mock();
                const engine = createTestEngine({ onError, repairTags: true, skipInvalidTags: false, logLevel: 'warn' });
                engine.processLine('TY  - JOUR');
                engine.processLine('BADTAG  - a');
                engine.processLine('BADTAG  - b');
                engine.processLine('TI  - valid');
                engine.processLine('ti  - repairable');
                expect(onError).toHaveBeenCalledTimes(2);
            });

            it('should treat non-strict tag lines as silent continuation lines by default (repairTags: false)', () => {
                const onError = mock();
                const engine = createTestEngine({ onError, logLevel: 'info' });
                engine.processLine('TY  - JOUR');
                engine.processLine('BADTAG  - value');
                engine.processLine('The results  - significant');
                engine.processLine('ti  - lowercase');
                engine.processLine('TI- lax spacing');
                expect(onError).not.toHaveBeenCalled();
            });
        });

        describe('Missing Record Enclosure (ER) Validations', () => {
            it('should call onError for missing ER at EOF (flush)', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.MISSING_ER_AT_EOF]);
                });

                const engine = createTestEngine({ onError, logLevel: 'warn' });
                engine.processLine('TY  - JOUR');
                engine.processLine('AU  - Smith, J.');
                engine.flush();
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should call onError for missing ER before new TY tag', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisWarning);
                    expect(incident.error.message).toBe(ERROR_MESSAGES[RIS_ERROR.MISSING_ER_IMPLICIT_START]);
                });

                const engine = createTestEngine({ onError, logLevel: 'warn' });
                engine.processLine('TY  - JOUR');
                engine.processLine('AU  - Smith, J.');
                engine.processLine('TY  - BOOK');
                expect(onError).toHaveBeenCalledTimes(1);
            });
        });

        describe('Diagnostic RisInfo Diagnostics', () => {
            it('should call onError with RisInfo for lowercase tag normalization', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisInfo);
                    expect(incident.error.message).toBe('Lowercase tag normalized');
                });

                const engine = createTestEngine({ onError, repairTags: true, logLevel: 'info' });
                engine.processLine('ty  - JOUR');
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should call onError with RisInfo for lax spacing normalization', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisInfo);
                    expect(incident.error.message).toBe('Lax spacing normalized');
                });

                const engine = createTestEngine({ onError, repairTags: true, logLevel: 'info' });
                engine.processLine('TY- JOUR');
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it('should call onError with RisInfo for tag key repair', () => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error).toBeInstanceOf(RisInfo);
                    expect(incident.error.message).toBe('Tag key repaired');
                });

                const engine = createTestEngine({ onError, repairTags: true, logLevel: 'info' });
                engine.processLine('TY  - JOUR');
                engine.processLine('T_1  - Title');
                expect(onError).toHaveBeenCalledTimes(1);
            });

            it.each([
                ['T_1  - Title', 'T_1'],
                ['t.1  - Title', 't.1'],
            ])('should pass the original un-repaired tag on tag key repair | Line: %p', (line, rawTag) => {
                const onError = mock((incident: RisErrorContext) => {
                    expect(incident.error.message).toBe('Tag key repaired');
                    expect(incident.tag).toBe(rawTag);
                });

                const engine = createTestEngine({ onError, repairTags: true, logLevel: 'info' });
                engine.processLine('TY  - JOUR');
                engine.processLine(line);
                expect(onError).toHaveBeenCalledTimes(1);
            });
        });

        describe('Silent Ignoral', () => {
            it('should not throw on Unsupported Format after abort', () => {
                const engine = createTestEngine();
                engine.processLine('FN ISI Export Format');
                expect(() => engine.processLine('TY  - JOUR')).not.toThrow();
            });

            it('should not throw on Invalid tag inside record when skipInvalidTags is false', () => {
                const engine = createTestEngine({ repairTags: true, skipInvalidTags: false });
                engine.processLine('TY  - JOUR');
                expect(() => engine.processLine('BADTAG  - value')).not.toThrow();
            });
        });
    });
});
