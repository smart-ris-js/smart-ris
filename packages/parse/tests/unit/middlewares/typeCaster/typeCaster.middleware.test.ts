// Copyright 2026 Martin Winkler

import { describe, expect, it, mock } from 'bun:test';
import { LOG_LEVEL, type RawPipelineRecord } from '@smart-ris/core';
import {
    createParseTypeCaster,
    smartCast,
    type TypeCasterOptions,
} from '../../../../src/middlewares/typeCaster/typeCaster.middleware.js';

const defaultOptions: TypeCasterOptions = {
    smartCastSchema: {},
    dateFormat: 'YYYY-MM-DD',
    logLevel: LOG_LEVEL.error,
    toSemantic: false,
    computedSemanticMap: {},
};

describe('parse - unit > middlewares > typeCaster > typeCaster.middleware', () => {
    describe('Function: smartCast()', () => {
        it('should return parsed date string when castType is date and input is valid', () => {
            const result = smartCast('2026-01-15', 'date', 'YYYY-MM-DD');
            expect(result).toBe('2026-01-15');
        });

        it('should use fallbackYear when date string lacks year', () => {
            const result = smartCast('15 Jan', 'date', 'YYYY-MM-DD', undefined, () => '2026');
            expect(result).toBe('2026-01-15');
        });

        it('should invoke onErrorFallback and return raw value when date parsing fails', () => {
            const onErrorFallback = mock();
            const result = smartCast('invalid date string', 'date', 'YYYY-MM-DD', onErrorFallback);
            expect(onErrorFallback).toHaveBeenCalled();
            expect(result).toBe('invalid date string');
        });

        it('should cast numeric string to number when castType is number', () => {
            expect(smartCast('42', 'number')).toBe(42);
            expect(smartCast('3.14', 'number')).toBe(3.14);
            expect(smartCast('-10', 'number')).toBe(-10);
        });

        it.each(['0x10', '0X1F', '0b101', '0o17', '1e3', '1E-3', '1.5e3', 'Infinity', '-Infinity', '+Infinity', 'NaN'])(
            'should keep non-decimal number syntax %p as raw string',
            (input) => {
                expect(smartCast(input, 'number')).toBe(input);
            },
        );

        it('should keep numbers not exactly representable as a double as raw string', () => {
            expect(smartCast('12345678901234567890', 'number')).toBe('12345678901234567890');
            expect(smartCast('0.1234567890123456', 'number')).toBe('0.1234567890123456');
        });

        it('should cast plain decimals with sign, dot forms and surrounding whitespace', () => {
            expect(smartCast('+7', 'number')).toBe(7);
            expect(smartCast('.5', 'number')).toBe(0.5);
            expect(smartCast(' 12 ', 'number')).toBe(12);
            expect(smartCast('007', 'number')).toBe(7);
        });

        it('should return raw string when castType is number but input is empty or non-numeric', () => {
            expect(smartCast('', 'number')).toBe('');
            expect(smartCast('   ', 'number')).toBe('   ');
            expect(smartCast('abc', 'number')).toBe('abc');
        });

        it('should cast boolean strings correctly when castType is boolean', () => {
            expect(smartCast('true', 'boolean')).toBe(true);
            expect(smartCast('TRUE', 'boolean')).toBe(true);
            expect(smartCast('false', 'boolean')).toBe(false);
            expect(smartCast('FALSE', 'boolean')).toBe(false);
        });

        it('should trim surrounding whitespace before casting booleans like numbers and dates', () => {
            expect(smartCast(' true', 'boolean')).toBe(true);
            expect(smartCast('False\t\n', 'boolean')).toBe(false);
            expect(smartCast(' 12 ', 'number')).toBe(12);
        });

        it('should return raw string when castType is boolean but input is empty or non-boolean', () => {
            expect(smartCast('  ', 'boolean')).toBe('  ');
            expect(smartCast('maybe', 'boolean')).toBe('maybe');
            expect(smartCast('123', 'boolean')).toBe('123');
        });

        it('should return raw string for unknown castType', () => {
            expect(smartCast('foo', 'unknown' as any)).toBe('foo');
        });

        it('should format date string with provided dateFormat', () => {
            expect(smartCast('2026-01-15', 'date', 'YYYY-MM-DD')).toBe('2026-01-15');
        });

        it('should cast RIS other info and ISO timestamp dates without calling onErrorFallback', () => {
            const onErrorFallback = mock();
            expect(smartCast('1998/12/31/Winter', 'date', 'YYYY-MM-DD', onErrorFallback)).toBe('1998-12-31');
            expect(smartCast('1998///Spring', 'date', 'YYYY-MM-DD', onErrorFallback)).toBe('1998');
            expect(smartCast('2021-03-04T12:00:00Z', 'date', 'YYYY/MM/DD', onErrorFallback)).toBe('2021/03/04');
            expect(onErrorFallback).not.toHaveBeenCalled();
        });
    });

    describe('Function: createParseTypeCaster()', () => {
        it('should skip tags not present in mergedSmartCastSchema or tags with null value', () => {
            const middleware = createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { YY: 'number' },
            });
            const payload: RawPipelineRecord = { UNKNOWN: '123', YY: null };
            const result = middleware(payload);
            expect(result).toEqual({ UNKNOWN: '123', YY: null });
        });

        it('should cast scalar values according to mergedSmartCastSchema', () => {
            const middleware = createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { YY: 'number', ZZ: 'boolean' },
            });
            const payload: RawPipelineRecord = { YY: '42', ZZ: 'true' };
            const result = middleware(payload);
            expect(result).toEqual({ YY: 42, ZZ: true });
        });

        it('should trigger opts.onError callback when date casting fails', () => {
            const onError = mock();
            const middleware = createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { DA: 'date' },
                logLevel: LOG_LEVEL.info,
                onError,
            });
            const payload: RawPipelineRecord = {
                DA: 'invalid-date',
            };
            const result = middleware(payload);
            expect(result).toEqual({
                DA: 'invalid-date',
            });
            expect(onError).toHaveBeenCalledTimes(1);
        });

        it('should cast array values element-by-element when tag value is an array', () => {
            const middleware = createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { DA: 'date' },
            });
            const payload: RawPipelineRecord = {
                DA: ['2020-05-10', '2021-06-15'],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                DA: ['2020-05-10', '2021-06-15'],
            });
            expect(result.DA).toBe(payload.DA);
        });

        it('should mutate array elements in-place preserving array reference for empty, single, and multiple elements', () => {
            const middleware = createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { DA: 'date', Y1: 'date', M1: 'date' },
            });
            const emptyArr: string[] = [];
            const singleElemArr = ['2020-05-10'];
            const multiElemArr = ['2020-05-10', '2021-06-15'];
            const payload: RawPipelineRecord = {
                M1: emptyArr,
                DA: singleElemArr,
                Y1: multiElemArr,
            };
            const result = middleware(payload);
            expect(result.M1).toBe(emptyArr);
            expect(result.DA).toBe(singleElemArr);
            expect(result.Y1).toBe(multiElemArr);
        });

        it('should resolve fallback year for each element when date tag value is an array', () => {
            const middleware = createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { DA: 'date' },
            });
            const inputDates = ['15 Jan', '20 Feb'];
            const payload: RawPipelineRecord = {
                PY: '2026',
                DA: inputDates,
            };
            const result = middleware(payload);
            expect(result.DA).toEqual(['2026-01-15', '2026-02-20']);
            expect(result.DA).toBe(inputDates);
        });

        it('should cast numeric and boolean array values element-by-element in-place', () => {
            const middleware = createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { SN: 'number', IS: 'boolean' },
            });
            const inputNumbers = ['10', '20', '30'];
            const inputBooleans = ['true', 'false'];
            const payload: RawPipelineRecord = {
                SN: inputNumbers,
                IS: inputBooleans,
            };
            const result = middleware(payload);
            expect(result.SN).toEqual([10, 20, 30]);
            expect(result.IS).toEqual([true, false]);
            expect(result.SN).toBe(inputNumbers);
            expect(result.IS).toBe(inputBooleans);
        });

        it('should handle mixed array containing valid dates, nulls, and invalid strings in-place', () => {
            const onError = mock();
            const middleware = createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { DA: 'date' },
                logLevel: LOG_LEVEL.info,
                onError,
            });
            const inputMixed = ['2026-01-15', null, 'not-a-date'];
            const payload: RawPipelineRecord = {
                DA: inputMixed,
            };
            const result = middleware(payload);
            expect(result.DA).toEqual(['2026-01-15', null, 'not-a-date']);
            expect(result.DA).toBe(inputMixed);
            expect(onError).toHaveBeenCalled();
        });

        it('should extract fallbackYear from PY or Y1 for DA and Y1 date tags', () => {
            const middleware = createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { DA: 'date', Y1: 'date' },
            });
            const payload: RawPipelineRecord = {
                PY: '2025',
                DA: '15 Jan',
                Y1: '20 Feb',
            };
            const result = middleware(payload);
            expect(result.DA).toBe('2025-01-15');
            expect(result.Y1).toBe('2025-02-20');
        });

        it('should extract fallbackYear from PY for year-less numeric DA dates', () => {
            const middleware = createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { DA: 'date' },
            });
            const result = middleware({ PY: '1999', DA: '/05/25/' });
            expect(result.DA).toBe('1999-05-25');
        });

        it('should handle array PY values when extracting fallbackYear', () => {
            const middleware = createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { DA: 'date' },
            });
            const payload: RawPipelineRecord = {
                PY: ['2024', '2024'],
                DA: '10 Mar',
            };
            const result = middleware(payload);
            expect(result.DA).toBe('2024-03-10');
        });

        it('should enforce logLevel threshold filtering for date fallback warnings', () => {
            const onErrorAll = mock();
            createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { DA: 'date' },
                logLevel: LOG_LEVEL.info,
                onError: onErrorAll,
            })({ DA: 'invalid-date' });
            expect(onErrorAll).toHaveBeenCalledTimes(1);

            const onErrorError = mock();
            createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { DA: 'date' },
                logLevel: LOG_LEVEL.error,
                onError: onErrorError,
            })({ DA: 'invalid-date' });
            expect(onErrorError).not.toHaveBeenCalled();

            const onErrorSilent = mock();
            createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { DA: 'date' },
                logLevel: 'silent',
                onError: onErrorSilent,
            })({ DA: 'invalid-date' });
            expect(onErrorSilent).not.toHaveBeenCalled();
        });

        it('should extract fallback year from semantic keys, numbers, Date objects, and RawDate objects', () => {
            const middleware = createParseTypeCaster({
                ...defaultOptions,
                toSemantic: true,
                smartCastSchema: { DA: 'date' },
                computedSemanticMap: { DA: 'date', PY: 'publicationYear', Y1: 'primaryDate' },
            });

            // 1. From publicationYear (semantic key)
            const payload1: RawPipelineRecord = {
                date: 'JAN',
                publicationYear: '2026',
            };
            expect(middleware(payload1).date).toBe('2026-01');

            // 2. From Date object in PY
            const payload2: RawPipelineRecord = {
                DA: 'FEB',
                PY: new Date(2025, 0, 1),
            };
            expect(middleware(payload2).DA).toBe('2025-02');

            // 3. From RawDate object in PY
            const payload3: RawPipelineRecord = {
                DA: 'MAR',
                PY: { year: 2024, month: 3 },
            };
            expect(middleware(payload3).DA).toBe('2024-03');

            // 4. From numeric year in PY
            const payload4: RawPipelineRecord = {
                DA: 'APR',
                PY: 2023,
            };
            expect(middleware(payload4).DA).toBe('2023-04');

            // 5. From invalid Date object in PY
            const payload5: RawPipelineRecord = {
                DA: 'MAY',
                PY: new Date('invalid-date'),
            };
            expect(middleware(payload5).DA).toBe('MAY');

            // 6. From object without year property in PY
            const payload6: RawPipelineRecord = {
                DA: 'JUN',
                PY: { noYearHere: true },
            };
            expect(middleware(payload6).DA).toBe('JUN');

            // 7. From object with non-matching year property in PY
            const payload7: RawPipelineRecord = {
                DA: 'JUL',
                PY: { year: 'invalid' },
            };
            expect(middleware(payload7).DA).toBe('JUL');

            // 8. From non-matching string in PY
            const payload8: RawPipelineRecord = {
                DA: 'AUG',
                PY: 'no-digits',
            };
            expect(middleware(payload8).DA).toBe('AUG');

            // 9. From Y1 tag when PY is absent
            const payload9: RawPipelineRecord = {
                DA: 'SEP',
                Y1: '2022-09-10',
            };
            expect(middleware(payload9).DA).toBe('2022-09');

            // 10. From primaryDate tag when PY/Y1 are absent
            const payload10: RawPipelineRecord = {
                DA: 'OCT',
                primaryDate: '2021-10-05',
            };
            expect(middleware(payload10).DA).toBe('2021-10');
        });

        it('should pass through null and non-string elements when casting array values', () => {
            const middleware = createParseTypeCaster({
                ...defaultOptions,
                smartCastSchema: { DA: 'date' },
            });
            const payload: RawPipelineRecord = {
                DA: ['2020-05-10', null as any, 123 as any],
            };
            const result = middleware(payload);
            expect(result).toEqual({
                DA: ['2020-05-10', null, 123],
            });
        });
    });
});
