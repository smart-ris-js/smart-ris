// Copyright 2026 Martin Winkler

import { describe, expect, it, mock } from 'bun:test';
import { RisError, RisWarning } from '@smart-ris/core';
import { stringify } from '../../../src/index.js';

describe('stringify - unit > engine > onError & logLevel', () => {
    describe('logLevel Filtering & Error Callback Routing', () => {
        it('should dispatch RisError when logLevel is error (default)', () => {
            const onErrorMock = mock();
            stringify(null as any, { onError: onErrorMock });

            expect(onErrorMock).toHaveBeenCalledTimes(1);
            const [incident] = onErrorMock.mock.calls[0];
            expect(incident.error).toBeInstanceOf(RisError);
        });

        it.each([false, true])(
            'should suppress invalid tag RisWarning at logLevel error and dispatch at warn (skipInvalidTags: %p)',
            (skipInvalidTags) => {
                const errorLevel = mock();
                stringify(
                    { TY: 'JOUR', INVALID_TAG: 'Some Value' },
                    { onError: errorLevel, repairTags: false, skipInvalidTags },
                );
                expect(errorLevel).not.toHaveBeenCalled();

                const warnLevel = mock();
                stringify(
                    { TY: 'JOUR', INVALID_TAG: 'Some Value' },
                    { onError: warnLevel, repairTags: false, skipInvalidTags, logLevel: 'warn' },
                );
                expect(warnLevel).toHaveBeenCalledTimes(1);
                expect(warnLevel.mock.calls[0][0].error).toBeInstanceOf(RisWarning);
            },
        );

        it('should suppress RisWarning when logLevel is error (default)', () => {
            const onErrorMock = mock();
            stringify({ TY: 'JOUR', ER: 'Extra ignored data' }, { onError: onErrorMock });

            expect(onErrorMock).toHaveBeenCalledTimes(0);
        });

        it('should dispatch RisWarning when logLevel is warn or info', () => {
            const onErrorMock = mock();
            stringify({ TY: 'JOUR', ER: 'Extra ignored data' }, { onError: onErrorMock, logLevel: 'warn' });

            expect(onErrorMock).toHaveBeenCalledTimes(1);
            const [incident] = onErrorMock.mock.calls[0];
            expect(incident.error).toBeInstanceOf(RisWarning);
        });

        it('should suppress all calls when logLevel is silent', () => {
            const onErrorMock = mock();
            stringify(
                { TY: 'JOUR', INVALID_TAG: 'Some Value', ER: 'Extra ignored data' },
                { onError: onErrorMock, logLevel: 'silent', repairTags: false },
            );

            expect(onErrorMock).toHaveBeenCalledTimes(0);
        });

        it('should suppress missing TY tag warning when logLevel is error or silent', () => {
            const onErrorErrorLevel = mock();
            stringify({ TI: 'No TY' }, { onError: onErrorErrorLevel, logLevel: 'error' });
            expect(onErrorErrorLevel).not.toHaveBeenCalled();

            const onErrorSilent = mock();
            stringify({ TI: 'No TY' }, { onError: onErrorSilent, logLevel: 'silent' });
            expect(onErrorSilent).not.toHaveBeenCalled();
        });

        it('should dispatch missing TY tag warning when logLevel is warn or info', () => {
            const onErrorWarn = mock();
            stringify({ TI: 'No TY' }, { onError: onErrorWarn, logLevel: 'warn' });
            expect(onErrorWarn).toHaveBeenCalledTimes(1);
            expect(onErrorWarn.mock.calls[0][0].error).toBeInstanceOf(RisWarning);
        });

        it('should suppress duplicate TY tag warning when logLevel is error or silent', () => {
            const onErrorErrorLevel = mock();
            stringify({ TY: ['JOUR', 'BOOK'] } as any, { onError: onErrorErrorLevel, logLevel: 'error' });
            expect(onErrorErrorLevel).not.toHaveBeenCalled();

            const onErrorSilent = mock();
            stringify({ TY: ['JOUR', 'BOOK'] } as any, { onError: onErrorSilent, logLevel: 'silent' });
            expect(onErrorSilent).not.toHaveBeenCalled();
        });

        it.each([
            ['undefined', undefined, 'undefined'],
            ['symbol', Symbol('token'), 'Symbol(token)'],
        ])('should pass a string rawLine for non-serializable invalid record: %s', (_label, value, expected) => {
            const onError = mock();
            // @ts-expect-error invalid runtime input from untyped callers
            stringify([value], { onError });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0][0].rawLine).toBe(expected);
        });

        it('should pass a string rawLine for a function as invalid record', () => {
            const onError = mock();
            stringify([() => {}], { onError });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(typeof onError.mock.calls[0][0].rawLine).toBe('string');
        });

        it('should suppress invalid record type error when logLevel is silent', () => {
            const onErrorSilent = mock();
            stringify(null as any, { onError: onErrorSilent, logLevel: 'silent' });
            expect(onErrorSilent).not.toHaveBeenCalled();
        });
    });
});
