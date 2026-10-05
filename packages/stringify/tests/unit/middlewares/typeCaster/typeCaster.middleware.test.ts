// Copyright 2026 Martin Winkler

import { describe, expect, it, mock } from 'bun:test';
import { ERROR_MESSAGES, LOG_LEVEL, type StringifyPipelineRecord } from '@smart-ris/core';

import {
    createStringifyTypeCaster,
    type TypeCasterOptions,
} from '../../../../src/middlewares/typeCaster/typeCaster.middleware.js';

const defaultOptions: TypeCasterOptions = {
    useSmartTypes: false,
    smartCastSchema: {},
    dateFormat: 'YYYY-MM-DD',
    logLevel: LOG_LEVEL.warn,
};

describe('stringify - unit > middlewares > typeCaster > typeCaster.middleware', () => {
    describe('Function: createStringifyTypeCaster()', () => {
        it('should coerce primitive booleans and numbers to strings', () => {
            const middleware = createStringifyTypeCaster(defaultOptions);
            const payload: StringifyPipelineRecord = {
                A0: [null],
                A1: [1234],
                A2: [true],
                A3: [false],
                A4: [0],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                A0: [null],
                A1: ['1234'],
                A2: ['true'],
                A3: ['false'],
                A4: ['0'],
            });
        });

        it('should format native Date objects using dateFormat', () => {
            const middleware = createStringifyTypeCaster({ ...defaultOptions, dateFormat: 'YYYY/MM/DD' });
            const payload: StringifyPipelineRecord = {
                Y1: [new Date(2020, 4, 10)],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                Y1: ['2020/05/10'],
            });
        });

        it('should trigger onError and set field to null for Invalid Date objects', () => {
            const onError = mock();
            const middleware = createStringifyTypeCaster({ ...defaultOptions, onError, logLevel: LOG_LEVEL.warn });
            const payload: StringifyPipelineRecord = {
                Y1: [new Date('invalid-date')],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                Y1: [null],
            });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0][0].error.message).toBe(ERROR_MESSAGES.INVALID_DATE_FALLBACK);
        });

        it('should format RawDate objects correctly', () => {
            const middleware = createStringifyTypeCaster({ ...defaultOptions, dateFormat: 'YYYY/MM' });
            const payload: StringifyPipelineRecord = {
                Y1: [{ year: '2021', month: '12' }],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                Y1: ['2021/12'],
            });
        });

        it('should resolve fallback year from supplier tags for RawDate with month or month and day', () => {
            const middleware = createStringifyTypeCaster({ ...defaultOptions, dateFormat: 'YYYY-MM-DD' });
            const payload: StringifyPipelineRecord = {
                DA: [{ month: '05', day: '12' }],
                Y1: [{ month: '08' }],
                PY: ['2024'],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                DA: ['2024-05-12'],
                Y1: ['2024-08'],
                PY: ['2024'],
            });
        });

        it('should trigger onError and write yearless RawDate unvalidated when fallback year is missing', () => {
            const onError = mock();
            const middleware = createStringifyTypeCaster({ ...defaultOptions, onError });
            const payload: StringifyPipelineRecord = {
                DA: [{ month: '05', day: '12' }],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                DA: ['05-12'],
            });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0][0].error.message).toBe(ERROR_MESSAGES.INVALID_DATE_FALLBACK);
        });

        it('should NOT resolve fallback year and write day-only RawDate unvalidated with onError', () => {
            const onError = mock();
            const middleware = createStringifyTypeCaster({ ...defaultOptions, onError });
            const payload: StringifyPipelineRecord = {
                DA: [{ day: '15' }],
                PY: ['2024'],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                DA: ['15'],
                PY: ['2024'],
            });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0][0].error.message).toBe(ERROR_MESSAGES.INVALID_DATE_FALLBACK);
        });

        it.each([
            [{ year: '2024', month: '05', day: '15' }, '2024', '2024-05-15', false],
            [{ year: '2024', month: '05', day: '15' }, undefined, '2024-05-15', false],
            [{ year: '2024', month: '05' }, '2024', '2024-05', false],
            [{ year: '2024', month: '05' }, undefined, '2024-05', false],
            [{ year: '2024' }, '2024', '2024', false],
            [{ year: '2024' }, undefined, '2024', false],
            [{ year: '2024', day: '15' }, '2024', '2024--15', false],
            [{ year: '2024', day: '15' }, undefined, '2024--15', false],
            [{ month: '05', day: '15' }, '2024', '2024-05-15', false],
            [{ month: '05', day: '15' }, undefined, '05-15', true],
            [{ month: '05' }, '2024', '2024-05', false],
            [{ month: '05' }, undefined, '05', true],
            [{ day: '15' }, '2024', '15', true],
            [{ day: '15' }, undefined, '15', true],
            // Validation: impossible or malformed parts, leap days checked against own or fallback year; written unvalidated with a warning.
            [{ year: '2024', month: '13', day: '45' }, '2024', '2024-13-45', true],
            [{ year: 'abc' }, '2024', 'abc', true],
            [{ year: '2024', month: '04', day: '31' }, undefined, '2024-04-31', true],
            [{ year: '2024', day: '32' }, undefined, '2024--32', true],
            [{ year: '2024', month: '02', day: '29' }, undefined, '2024-02-29', false],
            [{ year: '2023', month: '02', day: '29' }, '2024', '2023-02-29', true],
            [{ month: '02', day: '29' }, '2024', '2024-02-29', false],
            [{ month: '02', day: '29' }, '2023', '2023-02-29', true],
            [{ month: '13' }, '2024', '2024-13', true],
            [{ month: '', day: '15' }, '2024', '15', true],
            [{ month: '5', day: '1' }, '2024', '2024-05-01', false],
        ])('should handle RawDate combination %j with supplier %s', (rawDate, supplierYear, expected, warns) => {
            const onError = mock();
            const middleware = createStringifyTypeCaster({ ...defaultOptions, onError, dateFormat: 'YYYY-MM-DD' });
            const payload: StringifyPipelineRecord = {
                DA: [rawDate as any],
            };
            if (supplierYear !== undefined) {
                payload.PY = [supplierYear];
            }
            const result = middleware(payload);
            expect(result.DA[0]).toBe(expected);
            expect(onError).toHaveBeenCalledTimes(warns ? 1 : 0);
            if (warns) {
                expect(onError.mock.calls[0][0].error.message).toBe(ERROR_MESSAGES.INVALID_DATE_FALLBACK);
            }
        });

        it('should trigger onError and set field to null for unsupported objects', () => {
            const onError = mock();
            const middleware = createStringifyTypeCaster({ ...defaultOptions, onError });
            const payload: StringifyPipelineRecord = {
                A1: [{ unsupported: true } as any],
                A2: ['valid'],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                A1: [null],
                A2: ['valid'],
            });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0][0].error.message).toBe('Unsupported object type passed as value');
        });

        it.each([
            ['function', () => 1],
            ['symbol', Symbol('x')],
        ])('should trigger onError and set field to null for unsupported %s values', (_label, value) => {
            const onError = mock();
            const middleware = createStringifyTypeCaster({ ...defaultOptions, onError });
            const payload: StringifyPipelineRecord = {
                // @ts-expect-error invalid runtime input from untyped callers
                A1: ['valid', value],
            };
            const result = middleware(payload);
            expect(result).toEqual({ A1: ['valid', null] });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0][0].error.message).toBe('Unsupported value type passed as value');
            expect(onError.mock.calls[0][0].rawLine).toBe(`A1 - ${String(value)}`);
        });

        it('should keep non-finite numbers and bigints as text without errors', () => {
            const onError = mock();
            const middleware = createStringifyTypeCaster({ ...defaultOptions, onError });
            const payload: StringifyPipelineRecord = {
                // @ts-expect-error bigint is not a RisStringifyValue; untyped callers
                A1: [NaN, Infinity, -Infinity, 10n],
            };
            const result = middleware(payload);
            expect(result).toEqual({ A1: ['NaN', 'Infinity', '-Infinity', '10'] });
            expect(onError).not.toHaveBeenCalled();
        });

        it('should heuristically parse and format messy date strings when useSmartTypes is true and castType is date', () => {
            const middleware = createStringifyTypeCaster({
                ...defaultOptions,
                useSmartTypes: true,
                dateFormat: 'YYYY/MM/DD',
                smartCastSchema: { Y1: 'date' },
            });
            const payload: StringifyPipelineRecord = {
                Y1: ['2020-05-10'], // string that gets heuristically parsed
            };
            const result = middleware(payload);
            expect(result).toEqual({
                Y1: ['2020/05/10'],
            });
        });

        it('should fallback to string and trigger onError if heuristic parsing fails on a date field', () => {
            const onError = mock();
            const middleware = createStringifyTypeCaster({
                ...defaultOptions,
                useSmartTypes: true,
                dateFormat: 'YYYY/MM/DD',
                smartCastSchema: { Y1: 'date' },
                onError,
                logLevel: LOG_LEVEL.warn,
            });
            const payload: StringifyPipelineRecord = {
                Y1: ['Not a date'],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                Y1: ['Not a date'],
            });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0][0].error.message).toBe(ERROR_MESSAGES.INVALID_DATE_FALLBACK);
        });

        it('should correctly process arrays, converting invalid elements to null and preserving all null elements', () => {
            const onError = mock();
            const middleware = createStringifyTypeCaster({
                ...defaultOptions,
                useSmartTypes: true,
                smartCastSchema: { Y1: 'date' },
                onError,
            });
            const payload: StringifyPipelineRecord = {
                A1: [123, { unsupported: true } as any, true],
                A2: [{ unsupported: true } as any, { also: false } as any],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                A1: ['123', null, 'true'],
                A2: [null, null],
            });
            expect(onError).toHaveBeenCalledTimes(3); // one for array 1, two for array 2
        });

        it('should extract fallback year from Date object, RawDate, number, or Y1 tag for DA enrichment', () => {
            const middleware = createStringifyTypeCaster({
                ...defaultOptions,
                useSmartTypes: true,
                dateFormat: 'YYYY-MM-DD',
                smartCastSchema: { DA: 'date', Y1: 'date' },
            });

            // 1. From Date object in PY (order-independent)
            const payload1: StringifyPipelineRecord = {
                DA: ['JAN'],
                PY: [new Date(2026, 0, 1)],
            };
            const result1 = middleware(payload1);
            expect(result1.DA).toEqual(['2026-01']);

            // 2. From RawDate object in PY
            const payload2: StringifyPipelineRecord = {
                DA: ['FEB'],
                PY: [{ year: 2025, month: 5 }],
            };
            const result2 = middleware(payload2);
            expect(result2.DA).toEqual(['2025-02']);

            // 3. From Y1 tag when PY is absent
            const payload3: StringifyPipelineRecord = {
                DA: ['MAR'],
                Y1: ['2024-03-15'],
            };
            const result3 = middleware(payload3);
            expect(result3.DA).toEqual(['2024-03']);

            // 4. Fallback when PY/Y1 is invalid object without year
            const payload4: StringifyPipelineRecord = {
                DA: ['APR'],
                PY: [{ noYearHere: true } as any],
            };
            const result4 = middleware(payload4);
            expect(result4.DA).toEqual(['APR']);

            // 5. From numeric year in PY
            const payload5: StringifyPipelineRecord = {
                DA: ['MAY'],
                PY: [2023],
            };
            const result5 = middleware(payload5);
            expect(result5.DA).toEqual(['2023-05']);

            // 6. From invalid Date object in PY
            const payload6: StringifyPipelineRecord = {
                DA: ['JUN'],
                PY: [new Date('invalid-date')],
            };
            const result6 = middleware(payload6);
            expect(result6.DA).toEqual(['JUN']);
        });

        it('should apply smart type casting to RIS tags supplied via smartCastSchema', () => {
            const middleware = createStringifyTypeCaster({
                ...defaultOptions,
                useSmartTypes: true,
                dateFormat: 'YYYY/MM/DD',
                smartCastSchema: { DA: 'date' },
            });
            const payload: StringifyPipelineRecord = {
                DA: ['2020-05-10'],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                DA: ['2020/05/10'],
            });
        });

        it('should preserve positional null elements alongside valid string items in array values', () => {
            const middleware = createStringifyTypeCaster(defaultOptions);
            const payload: StringifyPipelineRecord = {
                AU: ['Author 1', null, 'Author 2'],
                A1: [Symbol('fallbackSymbol') as any],
            };
            const result = middleware(payload);
            expect(result.AU).toEqual(['Author 1', null, 'Author 2']);
            expect(result.A1).toEqual([null]);
        });

        it('should mutate array elements in-place preserving array reference for empty, single, and multiple elements', () => {
            const middleware = createStringifyTypeCaster(defaultOptions);
            const emptyArr: any[] = [];
            const singleElemArr = [1234];
            const multiElemArr = [true, false, 0];
            const payload: StringifyPipelineRecord = {
                A0: emptyArr,
                A1: singleElemArr,
                A2: multiElemArr,
            };
            const result = middleware(payload);
            expect(result.A0).toEqual([]);
            expect(result.A1).toEqual(['1234']);
            expect(result.A2).toEqual(['true', 'false', '0']);
            expect(result.A0).toBe(emptyArr);
            expect(result.A1).toBe(singleElemArr);
            expect(result.A2).toBe(multiElemArr);
        });

        it('should resolve fallback year and cast messy date strings in-place for array values', () => {
            const middleware = createStringifyTypeCaster({
                ...defaultOptions,
                useSmartTypes: true,
                dateFormat: 'YYYY/MM/DD',
                smartCastSchema: { DA: 'date' },
            });
            const inputDates = ['15 Jan', '20 Feb'];
            const inputYears = ['2026'];
            const payload: StringifyPipelineRecord = {
                PY: inputYears,
                DA: inputDates,
            };
            const result = middleware(payload);
            expect(result.DA).toEqual(['2026/01/15', '2026/02/20']);
            expect(result.DA).toBe(inputDates);
            expect(result.PY).toBe(inputYears);
        });

        it('should cast mixed array containing dates, nulls, and numbers in-place', () => {
            const middleware = createStringifyTypeCaster({
                ...defaultOptions,
                dateFormat: 'YYYY/MM/DD',
            });
            const mixedArray = [new Date(2026, 0, 15), null, 42];
            const payload: StringifyPipelineRecord = {
                Y1: mixedArray,
            };
            const result = middleware(payload);
            expect(result.Y1).toEqual(['2026/01/15', null, '42']);
            expect(result.Y1).toBe(mixedArray);
        });
    });
});
