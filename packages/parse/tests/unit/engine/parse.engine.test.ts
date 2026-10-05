// Copyright 2026 Martin Winkler

import { describe, expect, it, mock } from 'bun:test';
import { ERROR_MESSAGES, LOG_LEVEL, RIS_ERROR } from '@smart-ris/core';
import { createParseEngine, type ParseEngineOptions } from '../../../src/engine/parse.engine.js';

const defaultOptions: ParseEngineOptions = {
    repairTags: false,
    skipInvalidTags: false,
    skipEmptyTags: true,
    eol: '\n',
    logLevel: LOG_LEVEL.error,
    middlewares: [],
};

function helperCreateEngine(opts: Partial<any> = {}) {
    const rawLevel = opts.logLevel ?? defaultOptions.logLevel;
    const logLevel = typeof rawLevel === 'number' ? rawLevel : LOG_LEVEL[rawLevel as keyof typeof LOG_LEVEL];
    return createParseEngine({ ...defaultOptions, ...opts, logLevel });
}

describe('parse - unit > engine > parse.engine', () => {
    describe('Function: createParseEngine()', () => {
        it('should return an engine with exposed functions when initialized with valid arguments', () => {
            const engine = helperCreateEngine();
            expect(engine).toBeTypeOf('object');
            expect(engine.processLine).toBeTypeOf('function');
            expect(engine.flush).toBeTypeOf('function');
        });

        it('should execute custom middlewares passed in engine options when record is finalized', () => {
            const customMiddleware = (payload: Record<string, unknown>) => ({
                ...payload,
                CUSTOM: ['VALUE'],
            });
            const engine = helperCreateEngine({
                middlewares: [customMiddleware],
            });
            engine.processLine('TY  - JOUR');
            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], CUSTOM: ['VALUE'] });
        });
    });

    describe('Property: isAborted', () => {
        it('should reflect engine abort status before and after processing unsupported format line and after flush', () => {
            const engine = helperCreateEngine();
            expect(engine.isAborted).toBeFalse();

            engine.processLine('FN Clarivate Analytics');
            expect(engine.isAborted).toBeTrue();

            engine.flush();
            expect(engine.isAborted).toBeFalse();
        });
    });

    describe('Function: processLine() - state machine', () => {
        it('should strip BOM, start record, and buffer TY when first line is a valid TY', () => {
            const engine = helperCreateEngine();
            const result = engine.processLine('\uFEFFTY  - JOUR');
            expect(result).toBeNull(); // No record finalized yet

            // Prove it entered record by flushing
            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'] });
        });

        it('should finalize and return the previous record when processing a new TY tag inside a record', () => {
            const engine = helperCreateEngine();
            engine.processLine('TY  - JOUR');
            engine.processLine('TI  - First Title');

            const result = engine.processLine('TY  - BOOK');
            expect(result).toEqual({ TY: ['JOUR'], TI: ['First Title'] });

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['BOOK'] });
        });

        it('should finalize and return the current record when processing an ER tag', () => {
            const engine = helperCreateEngine();
            engine.processLine('TY  - JOUR');
            engine.processLine('TI  - First Title');

            const result = engine.processLine('ER  - ');
            expect(result).toEqual({ TY: ['JOUR'], TI: ['First Title'] });

            const flushed = engine.flush();
            expect(flushed).toBeNull(); // Record already finalized, state reset
        });

        it('should return null and drop valid tags processed outside of a record', () => {
            const engine = helperCreateEngine();
            const result = engine.processLine('A1  - Author');

            expect(result).toBeNull();
            const flushed = engine.flush();
            expect(flushed).toBeNull(); // Nothing buffered
        });

        it('should trigger warning when ER tag is processed outside of a record', () => {
            const engine = helperCreateEngine();
            const result = engine.processLine('ER  - ');

            expect(result).toBeNull();
            expect(engine.flush()).toBeNull();
        });

        it('should trigger warning when invalid tag is processed outside of a record', () => {
            const engine = helperCreateEngine({ repairTags: true });
            const result = engine.processLine('###  - Value');

            expect(result).toBeNull();
            expect(engine.flush()).toBeNull();
        });

        it('should trigger warning when non-tag content is processed outside of a record', () => {
            const engine = helperCreateEngine();
            const result = engine.processLine('Plain text without tag format');

            expect(result).toBeNull();
            expect(engine.flush()).toBeNull();
        });

        it('should silently ignore empty or whitespace-only lines outside of a record', () => {
            const onError = mock();
            const engine = helperCreateEngine({ onError, logLevel: 'info' });

            expect(engine.processLine('')).toBeNull();
            expect(engine.processLine('   ')).toBeNull();
            expect(engine.processLine('\t')).toBeNull();

            expect(onError).not.toHaveBeenCalled();
            expect(engine.flush()).toBeNull();
        });

        it('should trigger abortParsing lock on unsupported format and ignore subsequent lines', () => {
            const engine = helperCreateEngine();
            const result1 = engine.processLine('FN Clarivate Analytics');
            const result2 = engine.processLine('TY  - JOUR'); // This would normally start a record

            expect(result1).toBeNull();
            expect(result2).toBeNull();

            const flushed = engine.flush();
            expect(flushed).toBeNull(); // Nothing buffered because engine is locked
        });

        it('should detect an unsupported format header after leading blank lines', () => {
            const onError = mock();
            const engine = helperCreateEngine({ onError });
            engine.processLine('﻿');
            engine.processLine('  ');
            engine.processLine('FN Clarivate Analytics');

            expect(engine.isAborted).toBeTrue();
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0]?.[0]).toMatchObject({
                error: { message: ERROR_MESSAGES[RIS_ERROR.UNSUPPORTED_FORMAT] },
                lineNumber: 3,
            });
        });

        it('should check the format header only on the first non-blank line', () => {
            const engine = helperCreateEngine();
            engine.processLine('');
            engine.processLine('TY  - JOUR');
            engine.processLine('FN Clarivate Analytics');

            expect(engine.isAborted).toBeFalse();
        });

        it('should check the format header again after flush', () => {
            const engine = helperCreateEngine();
            engine.processLine('');
            engine.processLine('TY  - JOUR');
            engine.flush();
            engine.processLine('');
            engine.processLine('FN ISI Export Format');

            expect(engine.isAborted).toBeTrue();
        });
    });

    describe('Function: processLine() - tag extraction & options', () => {
        it('should buffer empty tags as [null] when skipEmptyTags is false', () => {
            const engine = helperCreateEngine({ skipEmptyTags: false });
            engine.processLine('TY  - JOUR');
            engine.processLine('A1  - ');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], A1: [null] });
        });

        it('should drop empty tags completely when skipEmptyTags is true', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true });
            engine.processLine('TY  - JOUR');
            engine.processLine('A1  - ');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'] });
        });

        it('should successfully repair dirty tags and use them as valid boundaries when repairTags is true', () => {
            const engine = helperCreateEngine({ repairTags: true });
            engine.processLine('TY  - JOUR');
            engine.processLine('T_Y  - BOOK'); // Should be repaired to TY and finalize first record

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['BOOK'] });
        });

        it('should drop unrepairable tags completely when skipInvalidTags is true and repairTags is true', () => {
            const engine = helperCreateEngine({ skipInvalidTags: true, repairTags: true });
            engine.processLine('TY  - JOUR');
            engine.processLine('###  - Value'); // Extracts ###, fails repair, gets skipped entirely
            engine.processLine('Continuation text'); // Should be ignored, not appended to TY

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'] }); // No ### tag or continuation text added
        });

        it('should treat extracted tag as continuation string when repairTags is false (Strict Mode)', () => {
            const engine = helperCreateEngine({ repairTags: false, skipInvalidTags: false });
            engine.processLine('TY  - JOUR');
            engine.processLine('T_Y - Value'); // Fails strict extraction, treated as continuation

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR\nT_Y - Value'] });
        });

        it('should fallback to GEN when TY is empty (skipEmptyTags: false)', () => {
            const engine = helperCreateEngine({ skipEmptyTags: false });
            engine.processLine('TY  - ');
            engine.processLine('A1  - Author');
            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['GEN'], A1: ['Author'] });
        });

        it('should fallback to GEN when TY is empty (skipEmptyTags: true)', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true });
            engine.processLine('TY  - ');
            engine.processLine('A1  - Author');
            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['GEN'], A1: ['Author'] });
        });

        it('should register invalid empty tags as [null] when skipEmptyTags and skipInvalidTags are false', () => {
            const engine = helperCreateEngine({ repairTags: true, skipInvalidTags: false, skipEmptyTags: false });
            engine.processLine('TY  - JOUR');
            engine.processLine('###  - ');
            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], '###': [null] });
        });

        it('should return null and drop empty value for invalid tag inside record when skipInvalidTags is false and skipEmptyTags is true', () => {
            const engine = helperCreateEngine({ repairTags: true, skipInvalidTags: false, skipEmptyTags: true });
            engine.processLine('TY  - JOUR');
            const result = engine.processLine('###  - ');
            expect(result).toBeNull();

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'] });
        });

        it('should handle empty TY tags inside an existing record', () => {
            const engine = helperCreateEngine({ skipEmptyTags: false });
            engine.processLine('TY  - JOUR');

            const result = engine.processLine('TY  - ');
            expect(result).toEqual({ TY: ['JOUR'] });

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['GEN'] });
        });

        it('should register invalid tags with values when skipInvalidTags is false', () => {
            const engine = helperCreateEngine({ repairTags: true, skipInvalidTags: false });
            engine.processLine('TY  - JOUR');
            engine.processLine('###  - Some value');
            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], '###': ['Some value'] });
        });

        it.each([
            [false, RIS_ERROR.INVALID_TAG_FORMAT_BASE, { TY: ['JOUR'], '###': ['Some value'] }],
            [true, RIS_ERROR.INVALID_TAG_FORMAT_SKIPPED, { TY: ['JOUR'] }],
        ] as const)(
            'should emit RisWarning for invalid tags (skipInvalidTags: %p)',
            (skipInvalidTags, code, expected) => {
                const onError = mock();
                const engine = helperCreateEngine({ repairTags: true, skipInvalidTags, logLevel: 'warn', onError });
                engine.processLine('TY  - JOUR');
                engine.processLine('###  - Some value');

                expect(engine.processLine('ER  - ')).toEqual(expected);
                expect(onError).toHaveBeenCalledTimes(1);
                const incident = onError.mock.calls[0][0];
                expect(incident.error.name).toBe('RisWarning');
                expect(incident.error.message).toBe(ERROR_MESSAGES[code]);
                expect(incident.tag).toBe('###');
                expect(incident.lineNumber).toBe(2);
            },
        );
    });

    describe('Function: processLine() - continuation lines', () => {
        it('should append subsequent text lines to the active tag with newlines', () => {
            const engine = helperCreateEngine();
            engine.processLine('TY  - JOUR');
            engine.processLine('TI  - First Line');
            engine.processLine('Second Line');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], TI: ['First Line\nSecond Line'] });
        });

        it('should join multiline continuation text using custom eol option', () => {
            const engine = helperCreateEngine({ eol: '\r\n' });
            engine.processLine('TY  - JOUR');
            engine.processLine('TI  - First Line');
            engine.processLine('Second Line');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], TI: ['First Line\r\nSecond Line'] });
        });

        it('should overwrite buffered nulls with continuation text for initially empty tags without leading newline', () => {
            const engine = helperCreateEngine({ skipEmptyTags: false });
            engine.processLine('TY  - JOUR');
            engine.processLine('AB  - ');
            engine.processLine('Continuation text');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], AB: ['Continuation text'] });
        });

        it('should append continuation text without leading newline for dropped empty tags when skipEmptyTags is true', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true });
            engine.processLine('TY  - JOUR');
            engine.processLine('AB  - '); // Dropped
            engine.processLine('Continuation text');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], AB: ['Continuation text'] });
        });

        it('should skip multiple leading empty continuation lines and return clean continuation text', () => {
            const engine = helperCreateEngine({ skipEmptyTags: false });
            engine.processLine('TY  - JOUR');
            engine.processLine('AB  - ');
            engine.processLine('');
            engine.processLine('3rd-line');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], AB: ['3rd-line'] });
        });

        it('should start a new entry for continuation text after a dropped empty tag when the tag already has entries', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true });
            engine.processLine('TY  - JOUR');
            engine.processLine('AU  - Smith, J.');
            engine.processLine('AU  - '); // Dropped
            engine.processLine('Doe, J.');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], AU: ['Smith, J.', 'Doe, J.'] });
        });

        it('should append further continuation lines to the new entry after a dropped empty tag', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true });
            engine.processLine('TY  - JOUR');
            engine.processLine('AB  - First');
            engine.processLine('AB  - '); // Dropped
            engine.processLine('Second A');
            engine.processLine('Second B');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], AB: ['First', 'Second A\nSecond B'] });
        });

        it('should skip empty continuation lines before starting a new entry after a dropped empty tag', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true });
            engine.processLine('TY  - JOUR');
            engine.processLine('AB  - First');
            engine.processLine('AB  - '); // Dropped
            engine.processLine('');
            engine.processLine('   ');
            engine.processLine('Second');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], AB: ['First', 'Second'] });
        });

        it('should not create an entry when a dropped empty tag is only followed by empty continuation lines', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true });
            engine.processLine('TY  - JOUR');
            engine.processLine('AB  - First');
            engine.processLine('AB  - '); // Dropped
            engine.processLine('');
            engine.processLine('TI  - Title');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], AB: ['First'], TI: ['Title'] });
        });

        it('should append continuation text to the next valid tag when a dropped empty tag is followed by another tag', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true });
            engine.processLine('TY  - JOUR');
            engine.processLine('AU  - Smith, J.');
            engine.processLine('AU  - '); // Dropped
            engine.processLine('TI  - Title');
            engine.processLine('continued');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], AU: ['Smith, J.'], TI: ['Title\ncontinued'] });
        });

        it('should start a new entry for continuation text after a dropped empty invalid tag retained by skipInvalidTags false', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true, skipInvalidTags: false, repairTags: true });
            engine.processLine('TY  - JOUR');
            engine.processLine('BROKENTAG  - First');
            engine.processLine('BROKENTAG  - '); // Dropped
            engine.processLine('Second');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], BROKENTAG: ['First', 'Second'] });
        });

        it('should not carry a pending empty entry over into the next record', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true });
            engine.processLine('TY  - JOUR');
            engine.processLine('AU  - Smith, J.');
            engine.processLine('AU  - '); // Dropped
            engine.processLine('ER  - ');
            engine.processLine('TY  - BOOK');
            engine.processLine('AU  - Roe, R.');
            engine.processLine('continued');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['BOOK'], AU: ['Roe, R.\ncontinued'] });
        });

        it('should not carry a pending empty entry over an implicit TY record start', () => {
            const engine = helperCreateEngine({ skipEmptyTags: true });
            engine.processLine('TY  - JOUR');
            engine.processLine('AU  - Smith, J.');
            engine.processLine('AU  - '); // Dropped
            engine.processLine('TY  - BOOK'); // Implicit new record
            engine.processLine('continued');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['BOOK\ncontinued'] });
        });

        it('should overwrite the buffered null of a repeated empty tag with continuation text when skipEmptyTags is false', () => {
            const engine = helperCreateEngine({ skipEmptyTags: false });
            engine.processLine('TY  - JOUR');
            engine.processLine('AU  - Smith, J.');
            engine.processLine('AU  - ');
            engine.processLine('Doe, J.');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'], AU: ['Smith, J.', 'Doe, J.'] });
        });
    });

    describe('Function: flush()', () => {
        it('should return the finalized record when a record is currently pending', () => {
            const engine = helperCreateEngine();
            engine.processLine('TY  - JOUR');

            const flushed = engine.flush();
            expect(flushed).toEqual({ TY: ['JOUR'] });
        });

        it('should return null when no record is pending', () => {
            const engine = helperCreateEngine();
            const flushed = engine.flush();
            expect(flushed).toBeNull();
        });

        it('should completely reset engine states (like abortParsing) after flushing', () => {
            const engine = helperCreateEngine();
            engine.processLine('FN Clarivate Analytics'); // Triggers abortParsing = true
            engine.processLine('TY  - JOUR'); // Ignored due to abort

            expect(engine.flush()).toBeNull(); // First flush returns null

            // State should be reset now, can process new records
            engine.processLine('TY  - BOOK');
            expect(engine.flush()).toEqual({ TY: ['BOOK'] });
        });

        it('should abort parsing and emit RECORD_EXCEEDS_MAX_LINES when MAX_RECORD_LINES limit is exceeded by tag lines', () => {
            const onErrorMock = mock();
            const engine = helperCreateEngine({ onError: onErrorMock });

            engine.processLine('TY  - JOUR');
            for (let i = 0; i < 999; i++) {
                engine.processLine(`AU  - Author ${i}`);
            }
            expect(engine.isAborted).toBeFalse();

            // 1001st line exceeds MAX_RECORD_LINES limit of 1000
            const overflowResult = engine.processLine('TI  - Exceeding Title');
            expect(overflowResult).toBeNull();
            expect(engine.isAborted).toBeTrue();
            expect(onErrorMock).toHaveBeenCalledTimes(1);
            expect(onErrorMock.mock.calls[0][0].error.message).toBe(ERROR_MESSAGES[RIS_ERROR.RECORD_EXCEEDS_MAX_LINES]);

            // Subsequent lines return null while aborted
            expect(engine.processLine('AU  - Post Abort Author')).toBeNull();
        });

        it('should abort parsing and emit RECORD_EXCEEDS_MAX_LINES when continuation lines exceed MAX_RECORD_LINES limit', () => {
            const onErrorMock = mock();
            const engine = helperCreateEngine({ onError: onErrorMock });

            engine.processLine('TY  - JOUR');
            engine.processLine('AB  - Initial abstract');
            for (let i = 0; i < 998; i++) {
                engine.processLine(`continuation line ${i}`);
            }
            expect(engine.isAborted).toBeFalse();

            // 1001st line exceeds MAX_RECORD_LINES limit of 1000
            const overflowResult = engine.processLine('exceeding continuation line');
            expect(overflowResult).toBeNull();
            expect(engine.isAborted).toBeTrue();
            expect(onErrorMock).toHaveBeenCalledTimes(1);
            expect(onErrorMock.mock.calls[0][0].error.message).toBe(ERROR_MESSAGES[RIS_ERROR.RECORD_EXCEEDS_MAX_LINES]);

            // Subsequent lines return null while aborted
            expect(engine.processLine('more continuation')).toBeNull();
        });

        it('should reset recordLineCount per record so multiple large records under 1000 lines each pass cleanly without aborting', () => {
            const onErrorMock = mock();
            const engine = helperCreateEngine({ onError: onErrorMock });

            // Record 1: 601 lines (TY + 599 AU tags + ER)
            engine.processLine('TY  - JOUR');
            for (let i = 0; i < 599; i++) {
                engine.processLine(`AU  - Record1 Author ${i}`);
            }
            const rec1 = engine.processLine('ER  - ');
            expect(rec1).not.toBeNull();
            expect(engine.isAborted).toBeFalse();

            // Record 2: 601 lines (TY + 599 AU tags + ER) — Total 1202 lines across 2 records
            // If recordLineCount were NOT reset, record 2 would fail at line 1001
            engine.processLine('TY  - BOOK');
            for (let i = 0; i < 599; i++) {
                engine.processLine(`AU  - Record2 Author ${i}`);
            }
            const rec2 = engine.processLine('ER  - ');
            expect(rec2).not.toBeNull();
            expect(engine.isAborted).toBeFalse();
            expect(onErrorMock).not.toHaveBeenCalled();
        });

        it('should successfully complete a record of exactly 1000 lines (TY + 998 tags + ER) without aborting', () => {
            const onErrorMock = mock();
            const engine = helperCreateEngine({ onError: onErrorMock });

            // Exactly 1000 lines: line 1 (TY) + lines 2..999 (998 tags) + line 1000 (ER)
            engine.processLine('TY  - JOUR');
            for (let i = 0; i < 998; i++) {
                engine.processLine(`AU  - Author ${i}`);
            }
            const record = engine.processLine('ER  - ');

            expect(record).not.toBeNull();
            expect(record?.TY).toEqual(['JOUR']);
            expect(record?.AU).toHaveLength(998);
            expect(engine.isAborted).toBeFalse();
            expect(onErrorMock).not.toHaveBeenCalled();
        });

        it('should abort parsing when interleaved tags and continuation lines exceed MAX_RECORD_LINES', () => {
            const onErrorMock = mock();
            const engine = helperCreateEngine({ onError: onErrorMock });

            // 1000 lines: line 1 (TY) + 499 tags (lines 2..500) + 500 continuations (lines 501..1000)
            engine.processLine('TY  - JOUR');
            for (let i = 0; i < 499; i++) {
                engine.processLine(`AU  - Author ${i}`);
            }
            for (let i = 0; i < 500; i++) {
                engine.processLine(`continuation line ${i}`);
            }
            expect(engine.isAborted).toBeFalse();

            // Line 1001: exceeds MAX_RECORD_LINES limit of 1000
            const overflowResult = engine.processLine('exceeding line 1001');
            expect(overflowResult).toBeNull();
            expect(engine.isAborted).toBeTrue();
            expect(onErrorMock).toHaveBeenCalledTimes(1);
            expect(onErrorMock.mock.calls[0][0].error.message).toBe(ERROR_MESSAGES[RIS_ERROR.RECORD_EXCEEDS_MAX_LINES]);
        });

        it('should maintain monotonic absolute line numbers across multiple records in stream', () => {
            const incidents: { lineNumber: number; rawLine: string }[] = [];
            const engine = helperCreateEngine({
                logLevel: LOG_LEVEL.warn,
                skipInvalidTags: true,
                repairTags: true,
                onError: (incident: any) => {
                    incidents.push({ lineNumber: incident.lineNumber, rawLine: incident.rawLine });
                },
            });

            // Line 1-3: Record 1
            engine.processLine('TY  - JOUR');
            engine.processLine('TI  - Record 1');
            engine.processLine('ER  - ');

            // Line 4-7: Record 2 (warning on line 5)
            engine.processLine('TY  - BOOK');
            engine.processLine('###  - Invalid 1'); // Line 5
            engine.processLine('TI  - Record 2'); // Line 6
            engine.processLine('ER  - '); // Line 7

            // Line 8-12: Record 3 (multiline + warning on line 10)
            engine.processLine('TY  - CONF'); // Line 8
            engine.processLine('TI  - Conference Title'); // Line 9
            engine.processLine('   continuation line 1'); // Line 10
            engine.processLine('$$$  - Invalid 2'); // Line 11
            engine.processLine('ER  - '); // Line 12

            expect(incidents).toEqual([
                { lineNumber: 5, rawLine: '###  - Invalid 1' },
                { lineNumber: 11, rawLine: '$$$  - Invalid 2' },
            ]);
        });

        it('should reset lineNumber back to 0 on flush() allowing recycled engine instance to restart counting from line 1', () => {
            const incidents: number[] = [];
            const engine = helperCreateEngine({
                logLevel: LOG_LEVEL.warn,
                skipInvalidTags: true,
                repairTags: true,
                onError: (incident: any) => {
                    incidents.push(incident.lineNumber);
                },
            });

            // First file run: 3 lines (warning on line 2)
            engine.processLine('TY  - JOUR');
            engine.processLine('###  - Bad tag in file 1'); // Line 2
            engine.processLine('ER  - '); // Line 3
            engine.flush();

            // Second file run: should restart counting from 1
            engine.processLine('TY  - BOOK'); // Line 1 of file 2
            engine.processLine('$$$  - Bad tag in file 2'); // Line 2 of file 2
            engine.processLine('ER  - '); // Line 3 of file 2

            expect(incidents).toEqual([2, 2]);
        });

        it('should report accurate EOF line number when flush() finalizes an unclosed record missing ER', () => {
            const incidents: { message: string; lineNumber: number }[] = [];
            const engine = helperCreateEngine({
                logLevel: LOG_LEVEL.warn,
                onError: (incident: any) => {
                    incidents.push({ message: incident.error.message, lineNumber: incident.lineNumber });
                },
            });

            // Lines 1-3: Record 1 (properly closed)
            engine.processLine('TY  - JOUR');
            engine.processLine('TI  - Record 1');
            engine.processLine('ER  - ');

            // Lines 4-5: Record 2 (unclosed, missing ER before EOF)
            engine.processLine('TY  - BOOK'); // Line 4
            engine.processLine('TI  - Record 2'); // Line 5
            const flushed = engine.flush(); // Line 6 (EOF)

            expect(flushed).toEqual({ TY: ['BOOK'], TI: ['Record 2'] });
            expect(incidents).toEqual([{ message: ERROR_MESSAGES[RIS_ERROR.MISSING_ER_AT_EOF], lineNumber: 6 }]);
        });
    });
});
