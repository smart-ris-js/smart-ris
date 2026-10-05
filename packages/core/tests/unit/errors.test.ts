// Copyright 2026 Martin Winkler

import { describe, expect, it, mock } from 'bun:test';
import { LOG_LEVEL } from '../../src/core.options.js';
import type { LogLevel, RisErrorContext } from '../../src/core.types.js';
import { ERROR_MESSAGES, emitError, RIS_ERROR, RisError, RisInfo, RisWarning } from '../../src/errors.js';

describe('core - unit > errors', () => {
    describe('RisError', () => {
        it('should extends Error correctly and sets correct name', () => {
            const err = new RisError('Test Error Message');
            expect(err).toBeInstanceOf(Error);
            expect(err).toBeInstanceOf(RisError);
            expect(err.name).toBe('RisError');
            expect(err.message).toBe('Test Error Message');
            expect(err.stack).toBeDefined();
        });
    });

    describe('RisWarning', () => {
        it('should extends Error correctly and sets correct name', () => {
            const warn = new RisWarning('Test Warning Message');
            expect(warn).toBeInstanceOf(Error);
            expect(warn).toBeInstanceOf(RisWarning);
            expect(warn.name).toBe('RisWarning');
            expect(warn.message).toBe('Test Warning Message');
            expect(warn.stack).toBeDefined();
        });
    });

    describe('RisInfo', () => {
        it('should extends Error correctly and sets correct name', () => {
            const info = new RisInfo('Test Info Message');
            expect(info).toBeInstanceOf(Error);
            expect(info).toBeInstanceOf(RisInfo);
            expect(info.name).toBe('RisInfo');
            expect(info.message).toBe('Test Info Message');
            expect(info.stack).toBeDefined();
        });
    });

    describe('ERROR_MESSAGES structure and values', () => {
        it('should eRROR_MESSAGES and RIS_ERROR are frozen at runtime', () => {
            expect(Object.isFrozen(ERROR_MESSAGES)).toBe(true);
            expect(Object.isFrozen(RIS_ERROR)).toBe(true);
        });

        it('should have null prototype on ERROR_MESSAGES and RIS_ERROR', () => {
            expect(Object.getPrototypeOf(ERROR_MESSAGES)).toBeNull();
            expect(Object.getPrototypeOf(RIS_ERROR)).toBeNull();
        });

        const flatKeys = Object.entries(ERROR_MESSAGES).filter(([, val]) => typeof val === 'string');
        it.each(flatKeys)('should flat error message %p is a non-empty string', (_, value) => {
            expect(typeof value).toBe('string');
            expect((value as string).length).toBeGreaterThan(0);
        });

        const nestedObjects = Object.entries(ERROR_MESSAGES).filter(
            ([, val]) => typeof val === 'object' && val !== null,
        );
        it.each(nestedObjects)('should nested error category %p contains only non-empty strings', (_, categoryObj) => {
            Object.values(categoryObj).forEach((message) => {
                expect(typeof message).toBe('string');
                expect((message as string).length).toBeGreaterThan(0);
            });
        });

        it('should specific known error messages exist', () => {
            expect(ERROR_MESSAGES[RIS_ERROR.VALID_TAG_OUTSIDE_RECORD]).toBe('Valid tag found outside of record.');
            expect(ERROR_MESSAGES[RIS_ERROR.MISSING_TY_TAG]).toBe('Missing TY tag.');
            expect(ERROR_MESSAGES[RIS_ERROR.INVALID_TAG_FORMAT_BASE]).toBe(
                'Invalid tag format. Tag must be exactly 2 (A-Z, 0-9) characters.',
            );
            expect(ERROR_MESSAGES[RIS_ERROR.UNSUPPORTED_FORMAT]).toBe('Unsupported file format or header detected.');
            expect(ERROR_MESSAGES[RIS_ERROR.LINE_EXCEEDS_MAX_BUFFER_SIZE]).toBe(
                'Line exceeds maximum buffer size (10 MiB) without line break.',
            );
        });
    });

    describe('Function: emitError()', () => {
        it('should do nothing when no onError callback is provided in options', () => {
            const err = new RisError('Test Error');
            expect(() => {
                emitError(
                    { logLevel: LOG_LEVEL.info },
                    { error: err, rawLine: 'TY  - JOUR', lineNumber: 1, tag: 'TY' },
                );
            }).not.toThrow();
        });

        it('should not call callback when severity is higher than logLevel', () => {
            const callback = mock();
            const warning = new RisWarning('Warning msg'); // severity 1
            emitError(
                { onError: callback, logLevel: LOG_LEVEL.error }, // logLevel 0
                { error: warning, rawLine: 'TY  - JOUR', lineNumber: 1, tag: 'TY' },
            );
            expect(callback).not.toHaveBeenCalled();
        });

        describe('RisError handling', () => {
            it.each<[LogLevel, boolean]>([
                ['silent', false],
                ['error', true],
                ['warn', true],
                ['info', true],
            ])('should respect logLevel %p for RisError (shouldCall: %p)', (logLevel, shouldCall) => {
                const callback = mock();
                const err = new RisError('Test RisError');
                const incident: RisErrorContext = {
                    error: err,
                    rawLine: 'TY  - JOUR',
                    lineNumber: 1,
                    tag: 'TY',
                    recordContext: { primaryAuthor: ['Author 1'] },
                };

                emitError({ onError: callback, logLevel: LOG_LEVEL[logLevel] }, incident);

                if (shouldCall) {
                    expect(callback).toHaveBeenCalledTimes(1);
                    expect(callback).toHaveBeenCalledWith({
                        ...incident,
                        tag: 'TY',
                    });
                } else {
                    expect(callback).not.toHaveBeenCalled();
                }
            });
        });

        describe('RisWarning handling', () => {
            it.each<[LogLevel, boolean]>([
                ['silent', false],
                ['error', false],
                ['warn', true],
                ['info', true],
            ])('should respect logLevel %p for RisWarning (shouldCall: %p)', (logLevel, shouldCall) => {
                const callback = mock();
                const warning = new RisWarning('Test RisWarning');
                const incident: RisErrorContext = { error: warning, rawLine: 'AU  - Author', lineNumber: 2, tag: 'AU' };

                emitError({ onError: callback, logLevel: LOG_LEVEL[logLevel] }, incident);

                if (shouldCall) {
                    expect(callback).toHaveBeenCalledTimes(1);
                    expect(callback).toHaveBeenCalledWith({
                        ...incident,
                        tag: 'AU',
                    });
                } else {
                    expect(callback).not.toHaveBeenCalled();
                }
            });
        });

        describe('RisInfo handling', () => {
            it.each<[LogLevel, boolean]>([
                ['silent', false],
                ['error', false],
                ['warn', false],
                ['info', true],
            ])('should respect logLevel %p for RisInfo (shouldCall: %p)', (logLevel, shouldCall) => {
                const callback = mock();
                const info = new RisInfo('Test RisInfo');
                const incident: RisErrorContext = { error: info, rawLine: 'au  - Author', lineNumber: 3, tag: 'au' };

                emitError({ onError: callback, logLevel: LOG_LEVEL[logLevel] }, incident);

                if (shouldCall) {
                    expect(callback).toHaveBeenCalledTimes(1);
                    expect(callback).toHaveBeenCalledWith({
                        ...incident,
                        tag: 'au',
                    });
                } else {
                    expect(callback).not.toHaveBeenCalled();
                }
            });
        });
    });
});
