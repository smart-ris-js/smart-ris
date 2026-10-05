// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import vm from 'node:vm';
import { DATE_YEAR_SUPPLIER_TAGS } from '../../../src/core.constants.js';
import {
    extractYearFromPayload,
    extractYearFromVal,
    formatRisDate,
    heuristicallyParseDateString,
    isDate,
} from '../../../src/utils/date.js';

type ExpectedDate = { year: string; month?: string; day?: string } | null;
type TestCase = [string, ExpectedDate];

const runTest = (input: string, expected: ExpectedDate) => {
    const result = heuristicallyParseDateString(input);
    if (expected === null) {
        expect(result).toBeNull();
    } else {
        expect(result).toEqual(expected);
    }
};

describe('core - unit > utils > date', () => {
    describe('Strict ISO Formats', () => {
        it.each<TestCase>([
            ['2023-05-15', { year: '2023', month: '05', day: '15' }],
            ['2023-05', { year: '2023', month: '05' }],
            ['2023-12', { year: '2023', month: '12' }],
            ['2023/05/15', { year: '2023', month: '05', day: '15' }],
            ['2023/05/06', { year: '2023', month: '05', day: '06' }],
            ['2023/05', { year: '2023', month: '05' }],
            ['2023', { year: '2023' }],
            ['.2023', { year: '2023' }],
            [',2023', { year: '2023' }],
        ])('should parses standard strict ISO dates | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-jan', { year: '2023', month: '01' }],
            ['2023-feb', { year: '2023', month: '02' }],
            ['2023-mar', { year: '2023', month: '03' }],
            ['2023-apr', { year: '2023', month: '04' }],
            ['2023-may', { year: '2023', month: '05' }],
            ['2023-jun', { year: '2023', month: '06' }],
            ['2023-jul', { year: '2023', month: '07' }],
            ['2023-aug', { year: '2023', month: '08' }],
            ['2023-sep', { year: '2023', month: '09' }],
            ['2023-oct', { year: '2023', month: '10' }],
            ['2023-nov', { year: '2023', month: '11' }],
            ['2023-dec', { year: '2023', month: '12' }],
        ])('should parses ISO YM with month names (lowercase) | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-Jan', { year: '2023', month: '01' }],
            ['2023-Feb', { year: '2023', month: '02' }],
            ['2023-Mar', { year: '2023', month: '03' }],
            ['2023-Apr', { year: '2023', month: '04' }],
            ['2023-May', { year: '2023', month: '05' }],
            ['2023-Jun', { year: '2023', month: '06' }],
            ['2023-Jul', { year: '2023', month: '07' }],
            ['2023-Aug', { year: '2023', month: '08' }],
            ['2023-Sep', { year: '2023', month: '09' }],
            ['2023-Oct', { year: '2023', month: '10' }],
            ['2023-Nov', { year: '2023', month: '11' }],
            ['2023-Dec', { year: '2023', month: '12' }],
        ])('should parses ISO YM with month names (capitalized) | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-JaN', { year: '2023', month: '01' }],
            ['2023-FeB', { year: '2023', month: '02' }],
            ['2023-MaR', { year: '2023', month: '03' }],
            ['2023-ApR', { year: '2023', month: '04' }],
            ['2023-MaY', { year: '2023', month: '05' }],
            ['2023-JuN', { year: '2023', month: '06' }],
            ['2023-JuL', { year: '2023', month: '07' }],
            ['2023-AuG', { year: '2023', month: '08' }],
            ['2023-SeP', { year: '2023', month: '09' }],
            ['2023-OcT', { year: '2023', month: '10' }],
            ['2023-NoV', { year: '2023', month: '11' }],
            ['2023-DeC', { year: '2023', month: '12' }],
        ])('should parses ISO YM with month names (mixed case) | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-JAN', { year: '2023', month: '01' }],
            ['2023-FEB', { year: '2023', month: '02' }],
            ['2023-MAR', { year: '2023', month: '03' }],
            ['2023-APR', { year: '2023', month: '04' }],
            ['2023-MAY', { year: '2023', month: '05' }],
            ['2023-JUN', { year: '2023', month: '06' }],
            ['2023-JUL', { year: '2023', month: '07' }],
            ['2023-AUG', { year: '2023', month: '08' }],
            ['2023-SEP', { year: '2023', month: '09' }],
            ['2023-OCT', { year: '2023', month: '10' }],
            ['2023-NOV', { year: '2023', month: '11' }],
            ['2023-DEC', { year: '2023', month: '12' }],
        ])('should parses ISO YM with month names (uppercase) | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-january', { year: '2023', month: '01' }],
            ['2023-february', { year: '2023', month: '02' }],
            ['2023-march', { year: '2023', month: '03' }],
            ['2023-april', { year: '2023', month: '04' }],
            ['2023-may', { year: '2023', month: '05' }],
            ['2023-june', { year: '2023', month: '06' }],
            ['2023-july', { year: '2023', month: '07' }],
            ['2023-august', { year: '2023', month: '08' }],
            ['2023-september', { year: '2023', month: '09' }],
            ['2023-october', { year: '2023', month: '10' }],
            ['2023-november', { year: '2023', month: '11' }],
            ['2023-december', { year: '2023', month: '12' }],
        ])('should parses ISO YM with full month names (lowercase) | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-January', { year: '2023', month: '01' }],
            ['2023-February', { year: '2023', month: '02' }],
            ['2023-March', { year: '2023', month: '03' }],
            ['2023-April', { year: '2023', month: '04' }],
            ['2023-May', { year: '2023', month: '05' }],
            ['2023-June', { year: '2023', month: '06' }],
            ['2023-July', { year: '2023', month: '07' }],
            ['2023-August', { year: '2023', month: '08' }],
            ['2023-September', { year: '2023', month: '09' }],
            ['2023-October', { year: '2023', month: '10' }],
            ['2023-November', { year: '2023', month: '11' }],
            ['2023-December', { year: '2023', month: '12' }],
        ])('should parses ISO YM with full month names (capitalized) | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-JANUARY', { year: '2023', month: '01' }],
            ['2023-FEBRUARY', { year: '2023', month: '02' }],
            ['2023-MARCH', { year: '2023', month: '03' }],
            ['2023-APRIL', { year: '2023', month: '04' }],
            ['2023-MAY', { year: '2023', month: '05' }],
            ['2023-JUNE', { year: '2023', month: '06' }],
            ['2023-JULY', { year: '2023', month: '07' }],
            ['2023-AUGUST', { year: '2023', month: '08' }],
            ['2023-SEPTEMBER', { year: '2023', month: '09' }],
            ['2023-OCTOBER', { year: '2023', month: '10' }],
            ['2023-NOVEMBER', { year: '2023', month: '11' }],
            ['2023-DECEMBER', { year: '2023', month: '12' }],
        ])('should parses ISO YM with full month names (uppercase) | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-Jan-15', { year: '2023', month: '01', day: '15' }],
            ['2023-Feb-15', { year: '2023', month: '02', day: '15' }],
            ['2023-Mar-15', { year: '2023', month: '03', day: '15' }],
            ['2023-Apr-15', { year: '2023', month: '04', day: '15' }],
            ['2023-May-15', { year: '2023', month: '05', day: '15' }],
            ['2023-Jun-15', { year: '2023', month: '06', day: '15' }],
            ['2023-Jul-15', { year: '2023', month: '07', day: '15' }],
            ['2023-Aug-15', { year: '2023', month: '08', day: '15' }],
            ['2023-Sep-15', { year: '2023', month: '09', day: '15' }],
            ['2023-Oct-15', { year: '2023', month: '10', day: '15' }],
            ['2023-Nov-15', { year: '2023', month: '11', day: '15' }],
            ['2023-Dec-15', { year: '2023', month: '12', day: '15' }],
        ])('should parses ISO YMD with month names (capitalized) | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-JaN-15', { year: '2023', month: '01', day: '15' }],
            ['2023-FeB-15', { year: '2023', month: '02', day: '15' }],
            ['2023-MaR-15', { year: '2023', month: '03', day: '15' }],
            ['2023-ApR-15', { year: '2023', month: '04', day: '15' }],
            ['2023-MaY-15', { year: '2023', month: '05', day: '15' }],
            ['2023-JuN-15', { year: '2023', month: '06', day: '15' }],
            ['2023-JuL-15', { year: '2023', month: '07', day: '15' }],
            ['2023-AuG-15', { year: '2023', month: '08', day: '15' }],
            ['2023-SeP-15', { year: '2023', month: '09', day: '15' }],
            ['2023-OcT-15', { year: '2023', month: '10', day: '15' }],
            ['2023-NoV-15', { year: '2023', month: '11', day: '15' }],
            ['2023-DeC-15', { year: '2023', month: '12', day: '15' }],
        ])('should parses ISO YMD with month names (mixed case) | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-JAN-15', { year: '2023', month: '01', day: '15' }],
            ['2023-FEB-15', { year: '2023', month: '02', day: '15' }],
            ['2023-MAR-15', { year: '2023', month: '03', day: '15' }],
            ['2023-APR-15', { year: '2023', month: '04', day: '15' }],
            ['2023-MAY-15', { year: '2023', month: '05', day: '15' }],
            ['2023-JUN-15', { year: '2023', month: '06', day: '15' }],
            ['2023-JUL-15', { year: '2023', month: '07', day: '15' }],
            ['2023-AUG-15', { year: '2023', month: '08', day: '15' }],
            ['2023-SEP-15', { year: '2023', month: '09', day: '15' }],
            ['2023-OCT-15', { year: '2023', month: '10', day: '15' }],
            ['2023-NOV-15', { year: '2023', month: '11', day: '15' }],
            ['2023-DEC-15', { year: '2023', month: '12', day: '15' }],
        ])('should parses ISO YMD with month names (uppercase) | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-15-06', null],
            ['2023-05-32', null],
            ['2023-15-32', null],
            ['2023-15', null],
            ['2023-05-3２', null],
            ['２０２３-１５-３２', null],
            ['２０２３-１５', null],
            ['2023-jan-32', null],
            ['2023-feb-32', null],
            ['2023-mar-32', null],
            ['2023-apr-32', null],
            ['2023-may-32', null],
            ['2023-jun-32', null],
            ['2023-jul-32', null],
            ['2023-aug-32', null],
            ['2023-sep-32', null],
            ['2023-oct-32', null],
            ['2023-nov-32', null],
            ['2023-dec-32', null],
        ])('should rejects invalid strict ISO dates | Input: %p', runTest);
    });

    describe('Textual Month Formats', () => {
        it.each<TestCase>([
            ['15 Jan 2023', { year: '2023', month: '01', day: '15' }],
            ['15/Jan/2023', { year: '2023', month: '01', day: '15' }],
            ['15\\Jan\\2023', { year: '2023', month: '01', day: '15' }],
            ['15_Jan_2023', { year: '2023', month: '01', day: '15' }],
            ['15,Jan,2023', { year: '2023', month: '01', day: '15' }],
            ['15 Jan. 2023', { year: '2023', month: '01', day: '15' }],
            ['Jan 15 2023', { year: '2023', month: '01', day: '15' }],
            ['Jan/15/2023', { year: '2023', month: '01', day: '15' }],
            ['Jan\\15\\2023', { year: '2023', month: '01', day: '15' }],
            ['Jan_15_2023', { year: '2023', month: '01', day: '15' }],
            ['Jan,15,2023', { year: '2023', month: '01', day: '15' }],
            ['Jan. 15, 2023', { year: '2023', month: '01', day: '15' }],
            ['2023 Jan 15', { year: '2023', month: '01', day: '15' }],
            ['2023/Jan/15', { year: '2023', month: '01', day: '15' }],
            ['2023\\Jan\\15', { year: '2023', month: '01', day: '15' }],
            ['2023_Jan_15', { year: '2023', month: '01', day: '15' }],
            ['2023,Jan,15', { year: '2023', month: '01', day: '15' }],
            ['2023. Jan. 15', { year: '2023', month: '01', day: '15' }],
            ['January 2023', { year: '2023', month: '01' }],
            ['January/2023', { year: '2023', month: '01' }],
            ['January\\2023', { year: '2023', month: '01' }],
            ['January_2023', { year: '2023', month: '01' }],
            ['January,2023', { year: '2023', month: '01' }],
            ['January.2023', { year: '2023', month: '01' }],
            ['2023 January', { year: '2023', month: '01' }],
            ['2023/January', { year: '2023', month: '01' }],
            ['2023\\January', { year: '2023', month: '01' }],
            ['2023_January', { year: '2023', month: '01' }],
            ['2023,January', { year: '2023', month: '01' }],
            ['2023.January', { year: '2023', month: '01' }],
            ['15 January, 2023', { year: '2023', month: '01', day: '15' }],
            ['January 15, 2023', { year: '2023', month: '01', day: '15' }],
            ['2023, Jan. 15', { year: '2023', month: '01', day: '15' }],
        ])('should parses textual month dates | Input: %p', runTest);

        it.each<TestCase>([
            ['32 Jan 2023', null],
            ['2023-05-Mai', null],
            ['2023-13-Mai', null],
        ])('should returns null for invalid/impossible textual dates | Input: %p', runTest);
    });

    describe('Textual Month Formats Without Year', () => {
        it.each<TestCase>([
            ['January', { month: '01' }],
            ['Jan', { month: '01' }],
            ['JAN', { month: '01' }],
            ['February', { month: '02' }],
            ['feb', { month: '02' }],
            ['March', { month: '03' }],
            ['April', { month: '04' }],
            ['May', { month: '05' }],
            ['June', { month: '06' }],
            ['July', { month: '07' }],
            ['August', { month: '08' }],
            ['September', { month: '09' }],
            ['October', { month: '10' }],
            ['November', { month: '11' }],
            ['December', { month: '12' }],
        ])('should parse month-only strings without year | Input: %p', runTest);

        it.each<TestCase>([
            ['Jan 15', { month: '01', day: '15' }],
            ['Jan/15', { month: '01', day: '15' }],
            ['Jan\\15', { month: '01', day: '15' }],
            ['Jan_15', { month: '01', day: '15' }],
            ['Jan,15', { month: '01', day: '15' }],
            ['Jan. 15', { month: '01', day: '15' }],
            ['January 15', { month: '01', day: '15' }],
            ['Feb 29', { month: '02', day: '29' }],
            ['Dec 31', { month: '12', day: '31' }],
        ])('should parse month-day strings (month first) without year | Input: %p', runTest);

        it.each<TestCase>([
            ['15 Jan', { month: '01', day: '15' }],
            ['15/Jan', { month: '01', day: '15' }],
            ['15\\Jan', { month: '01', day: '15' }],
            ['15_Jan', { month: '01', day: '15' }],
            ['15,Jan', { month: '01', day: '15' }],
            ['15 January', { month: '01', day: '15' }],
            ['29 Feb', { month: '02', day: '29' }],
            ['31 Dec', { month: '12', day: '31' }],
        ])('should parse day-month strings (day first) without year | Input: %p', runTest);

        it.each<TestCase>([
            ['Jan 32', null],
            ['Feb 30', null],
            ['Apr 31', null],
            ['32 Jan', null],
            ['30 Feb', null],
            ['31 Apr', null],
        ])('should return null for invalid day/month combinations without year | Input: %p', runTest);
    });

    describe('Heuristic Formats', () => {
        it.each<TestCase>([
            ['2023/15/05', { year: '2023', month: '05', day: '15' }],
            ['2023/05/15', { year: '2023', month: '05', day: '15' }],
            ['2023/05/05', { year: '2023', month: '05', day: '05' }],
            ['2023\\15\\05', { year: '2023', month: '05', day: '15' }],
            ['2023\\05\\15', { year: '2023', month: '05', day: '15' }],
            ['2023\\05\\05', { year: '2023', month: '05', day: '05' }],
            ['2023.15.05', { year: '2023', month: '05', day: '15' }],
            ['2023.05.15', { year: '2023', month: '05', day: '15' }],
            ['2023.05.05', { year: '2023', month: '05', day: '05' }],
            ['2023_15_05', { year: '2023', month: '05', day: '15' }],
            ['2023_05_15', { year: '2023', month: '05', day: '15' }],
            ['2023_05_05', { year: '2023', month: '05', day: '05' }],
            ['2023 15 05', { year: '2023', month: '05', day: '15' }],
            ['2023 05 15', { year: '2023', month: '05', day: '15' }],
            ['2023 05 05', { year: '2023', month: '05', day: '05' }],
            ['2023,15,05', { year: '2023', month: '05', day: '15' }],
            ['2023,05,15', { year: '2023', month: '05', day: '15' }],
            ['2023,05,05', { year: '2023', month: '05', day: '05' }],
        ])('should parses year-first formats with unambiguous values | Input: %p', runTest);

        it.each<TestCase>([
            ['15-05-2023', { year: '2023', month: '05', day: '15' }],
            ['05-15-2023', { year: '2023', month: '05', day: '15' }],
            ['05-05-2023', { year: '2023', month: '05', day: '05' }],
            ['15/05/2023', { year: '2023', month: '05', day: '15' }],
            ['05/15/2023', { year: '2023', month: '05', day: '15' }],
            ['05/05/2023', { year: '2023', month: '05', day: '05' }],
            ['15\\05\\2023', { year: '2023', month: '05', day: '15' }],
            ['05\\15\\2023', { year: '2023', month: '05', day: '15' }],
            ['05\\05\\2023', { year: '2023', month: '05', day: '05' }],
            ['15.05.2023', { year: '2023', month: '05', day: '15' }],
            ['05.15.2023', { year: '2023', month: '05', day: '15' }],
            ['05.05.2023', { year: '2023', month: '05', day: '05' }],
            ['15_05_2023', { year: '2023', month: '05', day: '15' }],
            ['05_15_2023', { year: '2023', month: '05', day: '15' }],
            ['05_05_2023', { year: '2023', month: '05', day: '05' }],
            ['15 05 2023', { year: '2023', month: '05', day: '15' }],
            ['05 15 2023', { year: '2023', month: '05', day: '15' }],
            ['05 05 2023', { year: '2023', month: '05', day: '05' }],
            ['15,05,2023', { year: '2023', month: '05', day: '15' }],
            ['05,15,2023', { year: '2023', month: '05', day: '15' }],
            ['05,05,2023', { year: '2023', month: '05', day: '05' }],
        ])('should parses year-last formats with unambiguous values | Input: %p', runTest);

        it.each<TestCase>([
            ['2023.05.06', null],
            ['2023 05 06', null],
            ['2023\\05\\06', null],
            ['2023_05_06', null],
            ['2023,05,06', null],
        ])('should returns null for year-first ambiguous values | Input: %p', runTest);

        it.each<TestCase>([
            ['05-06-2023', null],
            ['05/06/2023', null],
            ['05.06.2023', null],
            ['05 06 2023', null],
            ['05\\06\\2023', null],
            ['05_06_2023', null],
            ['05,06,2023', null],
        ])('should returns null for year-last ambiguous values | Input: %p', runTest);

        it.each<TestCase>([
            ['2023/12/32', null],
            ['2023.12.32', null],
            ['2023 12 32', null],
            ['2023\\12\\32', null],
            ['2023_12_32', null],
            ['2023,12,32', null],
            ['2023/32/12', null],
            ['2023.32.12', null],
            ['2023 32 12', null],
            ['2023\\32\\12', null],
            ['2023_32_12', null],
            ['2023,32,12', null],
            ['2023/14/13', null],
            ['2023.14.13', null],
            ['2023 14 13', null],
            ['2023\\14\\13', null],
            ['2023_14_13', null],
            ['2023,14,13', null],
            ['2023/13/14', null],
            ['2023.13.14', null],
            ['2023 13 14', null],
            ['2023\\13\\14', null],
            ['2023_13_14', null],
            ['2023,13,14', null],
            ['2023/13/32', null],
            ['2023.13.32', null],
            ['2023 13 32', null],
            ['2023\\13\\32', null],
            ['2023_13_32', null],
            ['2023,13,32', null],
            ['2023/32/13', null],
            ['2023.32.13', null],
            ['2023 32 13', null],
            ['2023\\32\\13', null],
            ['2023_32_13', null],
            ['2023,32,13', null],
        ])('should returns null for year-first formats with impossible values | Input: %p', runTest);

        it.each<TestCase>([
            ['12-32-2023', null],
            ['12/32/2023', null],
            ['12.32.2023', null],
            ['12 32 2023', null],
            ['12\\32\\2023', null],
            ['12_32_2023', null],
            ['12,32,2023', null],
            ['32-12-2023', null],
            ['32/12/2023', null],
            ['32.12.2023', null],
            ['32 12 2023', null],
            ['32\\12\\2023', null],
            ['32_12_2023', null],
            ['32,12,2023', null],
            ['14-13-2023', null],
            ['14/13/2023', null],
            ['14.13.2023', null],
            ['14 13 2023', null],
            ['14\\13\\2023', null],
            ['14_13_2023', null],
            ['14,13,2023', null],
            ['13-14-2023', null],
            ['13/14/2023', null],
            ['13.14.2023', null],
            ['13 14 2023', null],
            ['13\\14\\2023', null],
            ['13_14_2023', null],
            ['13,14,2023', null],
            ['13-32-2023', null],
            ['13/32/2023', null],
            ['13.32.2023', null],
            ['13 32 2023', null],
            ['13\\32\\2023', null],
            ['13_32_2023', null],
            ['13,32,2023', null],
            ['32-13-2023', null],
            ['32/13/2023', null],
            ['32.13.2023', null],
            ['32 13 2023', null],
            ['32\\13\\2023', null],
            ['32_13_2023', null],
            ['32,13,2023', null],
        ])('should returns null for year-last formats with impossible values | Input: %p', runTest);

        it.each<TestCase>([
            ['05-2023', { year: '2023', month: '05' }],
            ['05/2023', { year: '2023', month: '05' }],
            ['05.2023', { year: '2023', month: '05' }],
            ['05 2023', { year: '2023', month: '05' }],
            ['05\\2023', { year: '2023', month: '05' }],
            ['05_2023', { year: '2023', month: '05' }],
            ['05,2023', { year: '2023', month: '05' }],
            ['2023/05', { year: '2023', month: '05' }],
            ['2023.05', { year: '2023', month: '05' }],
            ['2023 05', { year: '2023', month: '05' }],
            ['2023\\05', { year: '2023', month: '05' }],
            ['2023_05', { year: '2023', month: '05' }],
            ['2023,05', { year: '2023', month: '05' }],
        ])('should parses Month/Year formats | Input: %p', runTest);

        it.each<TestCase>([
            ['13-2023', null],
            ['13/2023', null],
            ['13.2023', null],
            ['13 2023', null],
            ['13\\2023', null],
            ['13_2023', null],
            ['13,2023', null],
            ['2023/13', null],
            ['2023.13', null],
            ['2023 13', null],
            ['2023\\13', null],
            ['2023_13', null],
            ['2023,13', null],
            ['12-0000', { year: '0000', month: '12' }],
            ['12/0000', { year: '0000', month: '12' }],
            ['12.0000', { year: '0000', month: '12' }],
            ['12 0000', { year: '0000', month: '12' }],
            ['12\\0000', { year: '0000', month: '12' }],
            ['12_0000', { year: '0000', month: '12' }],
            ['12,0000', { year: '0000', month: '12' }],
            ['0000/12', { year: '0000', month: '12' }],
            ['0000.12', { year: '0000', month: '12' }],
            ['0000 12', { year: '0000', month: '12' }],
            ['0000\\12', { year: '0000', month: '12' }],
            ['0000_12', { year: '0000', month: '12' }],
            ['0000,12', { year: '0000', month: '12' }],
        ])('should handles invalid or year zero Month/Year formats | Input: %p', runTest);
    });

    describe('Data Loss Prevention and Safety', () => {
        it.each<TestCase>([
            ['  2023 - 05 - 15  ', { year: '2023', month: '05', day: '15' }],
            ['2023 // 05 // 15', { year: '2023', month: '05', day: '15' }],
            ['2023/ 05 /15', { year: '2023', month: '05', day: '15' }],
            ['2023 \\ 05 \\ 15', { year: '2023', month: '05', day: '15' }],
            ['2023_ 05 _15', { year: '2023', month: '05', day: '15' }],
            ['2023, 05 ,15', { year: '2023', month: '05', day: '15' }],
            ['2023\t06\t15', { year: '2023', month: '06', day: '15' }],
            ['2023 \t 06 \t 15', { year: '2023', month: '06', day: '15' }],
            ['2023\t06', { year: '2023', month: '06' }],
            ['2023..12..14', { year: '2023', month: '12', day: '14' }],
            ['2023.12..', { year: '2023', month: '12' }],
            ['..2023..12..14..', { year: '2023', month: '12', day: '14' }],
            ['____2023,,,,12___', { year: '2023', month: '12' }],
            ['2023\\\\12\\\\14', { year: '2023', month: '12', day: '14' }],
            ['  15 - 05 - 2023  ', { year: '2023', month: '05', day: '15' }],
            ['15 // 05 // 2023', { year: '2023', month: '05', day: '15' }],
            ['15/ 05 /2023', { year: '2023', month: '05', day: '15' }],
            ['15 \\ 05 \\ 2023', { year: '2023', month: '05', day: '15' }],
            ['15_ 05 _2023', { year: '2023', month: '05', day: '15' }],
            ['15, 05 ,2023', { year: '2023', month: '05', day: '15' }],
            ['15\t06\t2023', { year: '2023', month: '06', day: '15' }],
            ['15 \t 06 \t 2023', { year: '2023', month: '06', day: '15' }],
            ['06\t2023', { year: '2023', month: '06' }],
            ['  2023 - 15 - 05  ', { year: '2023', month: '05', day: '15' }],
            ['2023 // 15 // 05', { year: '2023', month: '05', day: '15' }],
            ['2023/ 15 /05', { year: '2023', month: '05', day: '15' }],
            ['2023 \\ 15 \\ 05', { year: '2023', month: '05', day: '15' }],
            ['2023_ 15 _05', { year: '2023', month: '05', day: '15' }],
            ['2023, 15 ,05', { year: '2023', month: '05', day: '15' }],
            ['2023\t15\t06', { year: '2023', month: '06', day: '15' }],
            ['2023 \t 15 \t 06', { year: '2023', month: '06', day: '15' }],
            ['2023\t06', { year: '2023', month: '06' }],
            ['  05 - 15 - 2023  ', { year: '2023', month: '05', day: '15' }],
            ['05 // 15 // 2023', { year: '2023', month: '05', day: '15' }],
            ['05/ 15 /2023', { year: '2023', month: '05', day: '15' }],
            ['05 \\ 15 \\ 2023', { year: '2023', month: '05', day: '15' }],
            ['05_ 15 _2023', { year: '2023', month: '05', day: '15' }],
            ['05, 15 ,2023', { year: '2023', month: '05', day: '15' }],
            ['06\t15\t2023', { year: '2023', month: '06', day: '15' }],
            ['06 \t 15 \t 2023', { year: '2023', month: '06', day: '15' }],
            ['06\t2023', { year: '2023', month: '06' }],
        ])('should handles extreme whitespaces, multi-separators and leading/trailing separators | Input: %p', runTest);

        it.each<TestCase>([
            ['Some random text 2023', null],
            ['2023 Unknown 15', null],
            ['2023-12!', null],
            ['2023!12', null],
            ['2023 Q3', null],
            ['May 2023 Q3', null],
            ['2023!', null],
            ['!2023', null],
        ])('should returns null for unparseable or ambiguous text | Input: %p', runTest);

        it.each<TestCase>([
            ['', null],
            ['   ', null],
            ['\0', null],
            ['\n', null],
            ['\t', null],
            ['\r', null],
        ])('should returns null for completely empty or null-byte strings | Input: %p', runTest);

        it.each<TestCase>([
            ['2023!06', null],
            ['2023-06?', null],
            ['2023$06$15', null],
            ['2023-06-15#', null],
            ['2023-06-15!', null],
            ['!2023-06-15', null],
        ])('should returns null when date has unsupported symbols | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-0a-15', null],
            ['2023-06-b5', null],
            ['2023-c6-15', null],
            ['2023-06-1d', null],
            ['2e23-06-15', null],
        ])('should returns null when known date formats got letters inside | Input: %p', runTest);
    });

    describe('Advanced Hardcore Edge Cases - Single Digits & Ambiguity', () => {
        it.each<TestCase>([
            ['2023-1-2', { year: '2023', month: '01', day: '02' }],
            ['2023-1', { year: '2023', month: '01' }],
            ['2023-01-2', { year: '2023', month: '01', day: '02' }],
            ['2023-1-02', { year: '2023', month: '01', day: '02' }],
        ])('should parses single-digit inputs in strict ISO and heuristic year-first formats | Input: %p', runTest);

        it.each<TestCase>([
            ['13-1-2023', { year: '2023', month: '01', day: '13' }],
            ['1/13/2023', { year: '2023', month: '01', day: '13' }],
            ['2023.1.13', { year: '2023', month: '01', day: '13' }],
            ['2023 13 1', { year: '2023', month: '01', day: '13' }],
            ['1-1-2023', { year: '2023', month: '01', day: '01' }],
            ['2/2/2023', { year: '2023', month: '02', day: '02' }],
            ['2023.9.9', { year: '2023', month: '09', day: '09' }],
            ['2023_5_5', { year: '2023', month: '05', day: '05' }],
        ])('should handles single-digit unambiguous assignments in basic separators | Input: %p', runTest);

        it.each<TestCase>([
            ['1-2-2023', null],
            ['2/1/2023', null],
            ['2023.1.2', null],
            ['2023 2 1', null],
            ['2023_3_4', null],
            ['4,3,2023', null],
            ['12\\11\\2023', null],
        ])('should returns null for strictly ambiguous single-digit formats | Input: %p', runTest);
    });

    describe('Advanced Hardcore Edge Cases - Textual Combinations', () => {
        it.each<TestCase>([
            ['1 Jan 2023', { year: '2023', month: '01', day: '01' }],
            ['9/Feb/2023', { year: '2023', month: '02', day: '09' }],
            ['2.mar.2023', { year: '2023', month: '03', day: '02' }],
            ['2023 Apr 1', { year: '2023', month: '04', day: '01' }],
            ['2023/May/9', { year: '2023', month: '05', day: '09' }],
            ['2023.jun.2', { year: '2023', month: '06', day: '02' }],
            ['Jul 1 2023', { year: '2023', month: '07', day: '01' }],
            ['Aug/9/2023', { year: '2023', month: '08', day: '09' }],
            ['sep.2.2023', { year: '2023', month: '09', day: '02' }],
        ])('should parses single-digit textual months in positional permutations | Input: %p', runTest);

        it.each<TestCase>([
            ['1Jan2023', { year: '2023', month: '01', day: '01' }],
            ['13Feb2023', { year: '2023', month: '02', day: '13' }],
            ['2023Mar1', { year: '2023', month: '03', day: '01' }],
            ['2023Apr15', { year: '2023', month: '04', day: '15' }],
            ['May152023', { year: '2023', month: '05', day: '15' }],
            ['Jun22023', { year: '2023', month: '06', day: '02' }],
            ['Jul2023', { year: '2023', month: '07' }],
            ['2023Aug', { year: '2023', month: '08' }],
        ])('should parses textual date strings lacking whitespace/separators | Input: %p', runTest);

        it.each<TestCase>([
            ['1 2023 Jan', null],
            ['9/2023/Feb', null],
            ['Mar 2023 2', null],
            ['Apr/2023/9', null],
            ['2023 1 May', null],
            ['2023/9/Jun', null],
        ])('should rejects textual month formats in unsupported structural permutations | Input: %p', runTest);
    });

    describe('Advanced Hardcore Edge Cases - Data Integrity & Limits', () => {
        it.each<TestCase>([
            ['2023--1--13', { year: '2023', month: '01', day: '13' }],
            ['13__1__2023', { year: '2023', month: '01', day: '13' }],
            ['1....13....2023', { year: '2023', month: '01', day: '13' }],
            ['2023 / / 13 / / 1', { year: '2023', month: '01', day: '13' }],
        ])('should heuristically resolves over-separated valid numbers | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-0-15', null],
            ['2023-5-0', null],
            ['2023-0-0', null],
            ['0-15-2023', null],
            ['5-0-2023', null],
            ['0 Jan 2023', null],
            ['Jan 0 2023', null],
            ['2023 Jan 0', null],
            ['13-14-2023', null],
            ['2023.13.14', null],
        ])('should rejects impossible zeros and mathematical boundaries | Input: %p', runTest);

        it.each<TestCase>([
            ['999-12-15', null],
            ['12023-12-15', null],
            ['15 Jan 999', null],
            ['15 Jan 12023', null],
            ['15/12/999', null],
            ['15/12/12023', null],
        ])('should rejects structural length violations (e.g., 3-digit or 5-digit years) | Input: %p', runTest);

        it.each<TestCase>([
            ['0000-1-1', { year: '0000', month: '01', day: '01' }],
            ['0001-1-1', { year: '0001', month: '01', day: '01' }],
            ['0999-9-13', { year: '0999', month: '09', day: '13' }],
            ['13 Jan 0500', { year: '0500', month: '01', day: '13' }],
        ])('should processes valid years with leading zeros (0000 - 0999) | Input: %p', runTest);
    });

    describe('Advanced Hardcore Edge Cases - Calendar Validity & Leap Years', () => {
        it.each<TestCase>([
            ['2024-02-29', { year: '2024', month: '02', day: '29' }],
            ['2020-02-29', { year: '2020', month: '02', day: '29' }],
            ['2000-02-29', { year: '2000', month: '02', day: '29' }],
            ['2400-02-29', { year: '2400', month: '02', day: '29' }],
        ])('should confirms correct leap years | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-02-29', null],
            ['2025-02-29', null],
            ['1900-02-29', null],
            ['2100-02-29', null],
        ])('should strictly rejects invalid leap years | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-04-31', null],
            ['2023-06-31', null],
            ['2023-09-31', null],
            ['2023-11-31', null],
            ['2023-02-30', null],
            ['2024-02-30', null],
        ])('should rejects dates at month boundaries (30 vs 31 days) | Input: %p', runTest);
    });

    describe('Advanced Hardcore Edge Cases - Timestamps & Trailing Content', () => {
        it.each<TestCase>([
            ['2023-05-15T12:00:00Z', { year: '2023', month: '05', day: '15' }],
            ['2023-05-15T12:00:00', { year: '2023', month: '05', day: '15' }],
            ['2023-05-15 12:00:00', { year: '2023', month: '05', day: '15' }],
            ['2023-05-15T00:00:00.000Z', { year: '2023', month: '05', day: '15' }],
        ])('should keep the date of ISO 8601 strings with time and timezone components | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-05-15T23:59', { year: '2023', month: '05', day: '15' }],
            ['2023/05/15 08:30:00', { year: '2023', month: '05', day: '15' }],
            ['2023-05-15T12:00:00.123456+02:00', { year: '2023', month: '05', day: '15' }],
            ['2023-05-15T12:00:00-0530', { year: '2023', month: '05', day: '15' }],
            ['2023-05-15T12:00:00+01', { year: '2023', month: '05', day: '15' }],
            // Late UTC time with a positive offset: no timezone conversion, the date is kept as written.
            ['2023-12-31T23:30:00-05:00', { year: '2023', month: '12', day: '31' }],
            ['2023-05-15 12:00 UTC', { year: '2023', month: '05', day: '15' }],
            ['2023-05-15 12:00:00CEST', { year: '2023', month: '05', day: '15' }],
        ])('should accept strictly formatted time suffixes after a full year-first date | Input: %p', runTest);

        it.each<TestCase>([
            ['2023-05-15Tgarbage', null],
            ['2023-05-15T', null],
            ['2023-05-15T12', null],
            ['2023-05-15T24:00', null],
            ['2023-05-15T12:60', null],
            ['2023-05-15T12:00:60', null],
            ['2023-05-15T1:00', null],
            ['2023-05-15T12:00+24:00', null],
            ['2023-05-15T12:00 utc', null],
            ['2023-05-15T12:00 UNIVERSAL', null],
            ['2023-05T12:00', null],
            ['2023T12:00', null],
            ['2023-02-30T12:00', null],
            ['2023/02/30 12:00', null],
            ['15-05-2023T12:00', null],
        ])('should reject malformed time suffixes and times without a valid full date | Input: %p', runTest);

        it.each<TestCase>([
            ['Date: 2023-05-15', null],
            ['2023-05-15 (Estimated)', null],
            ['~2023-05-15', null],
            ['2023-05-15~', null],
        ])('should rejects strings with leading or trailing non-date content | Input: %p', runTest);
    });

    describe('Advanced Hardcore Edge Cases - Partial Text Errors and Lookalikes', () => {
        it.each<TestCase>([
            ['15 Janus 2023', null],
            ['15 Mayor 2023', null],
            ['15 Octopus 2023', null],
        ])('should rejects words that merely contain a month name | Input: %p', runTest);

        it.each<TestCase>([
            ['2023 a0 15', null],
            ['1234 ab 56', null],
            ['2023-FF-15', null],
        ])('should rejects alphanumeric date noise | Input: %p', runTest);
    });

    describe('Year zero cases', () => {
        it.each<TestCase>([
            ['0000 Jan', { year: '0000', month: '01' }],
            ['0000 Jan 15', { year: '0000', month: '01', day: '15' }],
            // Proleptic Gregorian: year 0000 is divisible by 400 and therefore a leap year.
            ['0000 Feb 29', { year: '0000', month: '02', day: '29' }],
            ['0400 Feb 29', { year: '0400', month: '02', day: '29' }],
        ])('should year 0000 is valid | Input: %p', runTest);

        it.each<TestCase>([
            ['0000 Jan 32', null],
            ['0000 Feb 30', null],
            ['0100 Feb 29', null],
        ])('should year 0000 with invalid month/day is rejected | Input: %p', runTest);

        it.each<TestCase>([
            ['0 Jan', null],
            ['0 Jan 15', null],
            ['0-01-01', null],
        ])('should year 0 cannot be matched as year | Input: %p', runTest);
    });
    describe('Fallback Date Parts Edge Cases', () => {
        it.each<TestCase>([
            ['2023-12-12-12', null],
            ['2023 12 12 12', null],
            ['2023-15-15', null],
        ])('should reject dates with >= 4 parts or invalid p1/p2 | Input: %p', runTest);
    });

    describe('RIS Other Info Segment (YYYY/MM/DD/other info)', () => {
        it.each<TestCase>([
            ['2023/12/12/12', { year: '2023', month: '12', day: '12' }],
            ['1998/12/31/Winter', { year: '1998', month: '12', day: '31' }],
            ['2014/01/20/16:10:39', { year: '2014', month: '01', day: '20' }],
            ['1998/05//Spring', { year: '1998', month: '05' }],
            ['1998///Spring', { year: '1998' }],
            ['1998///Spring/', { year: '1998' }],
            ['  2004/2/29/leap day  ', { year: '2004', month: '02', day: '29' }],
        ])('should parse the date part and drop the other info | Input: %p', runTest);

        it.each<TestCase>([
            ['2023/02/30/Winter', null],
            ['2023/13/14/Winter', null],
            ['2023-12-12/Winter', null],
            ['2023/12/Winter', null],
            ['Winter/2023/12/12/x', null],
            ['23/12/12/Winter', null],
        ])('should reject invalid date parts and non-RIS layouts | Input: %p', runTest);

        it('should keep the full parse when the whole value is already a valid date', () => {
            expect(heuristicallyParseDateString('2023///05///15')).toEqual({ year: '2023', month: '05', day: '15' });
        });
    });

    describe('formatRisDate', () => {
        const testDate = new Date(2023, 4, 15); // 2023-05-15 (local)

        it('should format JS Date objects into requested formats', () => {
            expect(formatRisDate(testDate, 'YYYY-MM-DD')).toBe('2023-05-15');
            expect(formatRisDate(testDate, 'YYYY-MM')).toBe('2023-05');
            expect(formatRisDate(testDate, 'YYYY/MM/DD')).toBe('2023/05/15');
            expect(formatRisDate(testDate, 'YYYY/MM')).toBe('2023/05');
            expect(formatRisDate(testDate, 'YYYY')).toBe('2023');
            expect(formatRisDate(testDate, 'UNKNOWN' as any)).toBe('2023');
        });

        it('should return an empty string for invalid JS Date objects', () => {
            const invalidDate = new Date('invalid');
            expect(formatRisDate(invalidDate, 'YYYY-MM-DD')).toBe('');
        });

        it('should format RawDate object with full YMD', () => {
            const raw = { year: '2023', month: '05', day: '15' };
            expect(formatRisDate(raw, 'YYYY-MM-DD')).toBe('2023-05-15');
            expect(formatRisDate(raw, 'YYYY/MM/DD')).toBe('2023/05/15');
            expect(formatRisDate(raw, 'YYYY-MM')).toBe('2023-05');
            expect(formatRisDate(raw, 'YYYY')).toBe('2023');
        });

        it('should fallback gracefully when RawDate is missing day', () => {
            const raw = { year: '2023', month: '05' };
            expect(formatRisDate(raw, 'YYYY-MM-DD')).toBe('2023-05');
            expect(formatRisDate(raw, 'YYYY/MM/DD')).toBe('2023/05');
            expect(formatRisDate(raw, 'YYYY-MM')).toBe('2023-05');
            expect(formatRisDate(raw, 'YYYY/MM')).toBe('2023/05');
            expect(formatRisDate(raw, 'YYYY')).toBe('2023');
        });

        it('should fallback gracefully when RawDate is missing month and day', () => {
            const raw = { year: '2023' };
            expect(formatRisDate(raw, 'YYYY-MM-DD')).toBe('2023');
            expect(formatRisDate(raw, 'YYYY-MM')).toBe('2023');
            expect(formatRisDate(raw, 'YYYY/MM/DD')).toBe('2023');
            expect(formatRisDate(raw, 'YYYY/MM')).toBe('2023');
            expect(formatRisDate(raw, 'YYYY')).toBe('2023');
        });

        it('should pad single-digit month and day values in RawDate', () => {
            const raw = { year: '2023', month: '5', day: '1' } as any;
            expect(formatRisDate(raw, 'YYYY-MM-DD')).toBe('2023-05-01');
        });

        it('should handle RawDate missing year', () => {
            const raw = { month: '05', day: '15' } as any;
            expect(formatRisDate(raw, 'YYYY-MM-DD')).toBe('');
            expect(formatRisDate({}, 'YYYY-MM-DD')).toBe('');
        });
    });

    describe('Audit Vulnerability Edge Cases', () => {
        it('should reject two-digit years (no 4-digit segment found)', () => {
            expect(heuristicallyParseDateString('99/05')).toBeNull();
        });

        it('should reject string with two 4-digit segments when month becomes invalid', () => {
            expect(heuristicallyParseDateString('2023 2024')).toBeNull();
        });

        it('should handle extreme slashes in dates without crashing', () => {
            expect(heuristicallyParseDateString('2023///05///15')).not.toBeUndefined();
        });

        it('should reject foreign language month names', () => {
            expect(heuristicallyParseDateString('15 Mai 2023')).toBeNull();
            expect(heuristicallyParseDateString('15 Février 2023')).toBeNull();
        });
    });

    describe('Function: extractYearFromVal() & extractYearFromPayload()', () => {
        describe('Valid 4-digit Year Extraction (it.each)', () => {
            it.each([
                // Plain numbers & strings
                [2024, '2024'],
                ['2024', '2024'],
                ['1999', '1999'],
                ['0000', '0000'],
                ['9999', '9999'],
                ['1800', '1800'],

                // Delimiters (hyphens, dots, slashes, backslashes, underscores, colons, semicolons, pipes, spaces)
                ['2024-05-15', '2024'],
                ['2024.05.15', '2024'],
                ['2024/05/15', '2024'],
                ['2024\\05\\15', '2024'],
                ['2024_05_15', '2024'],
                ['__2025__03__10__', '2025'],
                ['_2024_', '2024'],
                ['2025:03:10', '2025'],
                ['2025;03;10', '2025'],
                ['2025|03|10', '2025'],
                ['2025~03~10', '2025'],
                ['2025 03 10', '2025'],
                ['2025, 03, 10', '2025'],

                // Year-first and Year-last formats
                ['2025/03/10', '2025'],
                ['10-03-2025', '2025'],
                ['10/03/2025', '2025'],
                ['10.03.2025', '2025'],
                ['10_03_2025', '2025'],
                ['10\\03\\2025', '2025'],

                // Text prefixes/suffixes & brackets
                ['Feb 2025', '2025'],
                ['March, 2024', '2024'],
                ['pub. 2024', '2024'],
                ['c2024', '2024'],
                ['©2024', '2024'],
                ['(2024)', '2024'],
                ['[2024]', '2024'],
                ['{2024}', '2024'],
                ['<2024>', '2024'],
                ['Spring 2024 (Revised)', '2024'],
                ['Volume 12, Issue 3, 2023', '2023'],
                ['Page 10-25, 2022', '2022'],

                // Identical duplicated year in single value
                ['2025/2025', '2025'],
                ['2025-2025-01', '2025'],
                ['2024_2024', '2024'],

                // Arrays with single unique year
                [[['2024-05-15']], '2024'],
                [[[null, '2024-05-15']], '2024'],
                [[['2024-05-15', '2024']], '2024'],
                [[['2024', 'invalid', 5]], '2024'],
                [[['2024', '12345']], '2024'],
                [[['2024', '123']], '2024'],
                [[['2024_01', '2024_02']], '2024'],

                // Object with year property
                [{ year: 2024 }, '2024'],
                [{ year: '2024' }, '2024'],
                [{ year: '2024-05-15' }, '2024'],
                [{ year: 'Feb 2025' }, '2025'],
                [{ year: '_2023_' }, '2023'],
            ])('should extract 4-digit year correctly | Input: %p', (input, expected) => {
                expect(extractYearFromVal(input)).toBe(expected);
            });

            it('should extract 4-digit year from native Date objects', () => {
                expect(extractYearFromVal(new Date(2024, 0, 1))).toBe('2024');
                expect(extractYearFromVal(new Date(1999, 11, 31))).toBe('1999');
                expect(extractYearFromVal(new Date(2025, 4, 15))).toBe('2025');
            });
        });

        describe('Invalid / Non-4-digit / Ambiguous Year Rejection (it.each)', () => {
            it.each([
                // 5+ digit sequences (greedy rejection)
                12345,
                20241,
                123456,
                99999,
                '12345',
                '20241',
                '123456',
                '99999',
                '_12345_',
                '__20241__',
                'foo12345bar',
                '20251/03/10',
                '10-03-20251',
                '20240101',

                // Less than 4 digits
                123,
                99,
                1,
                0,
                '123',
                '999',
                '024',
                '24',
                '99',
                '00',
                '1',
                '0',
                '_123_',
                '--99--',
                'foo123bar',

                // Multiple conflicting 4-digit years
                '2024/2025',
                '2024-2025',
                '2024 and 2026',
                '1999_2020',
                '2023 2024 2025',
                'from 2020 to 2024',
                '2021/01/01 to 2022/02/02',

                // Strings with no digits or symbols only
                '',
                '   ',
                'no year here',
                'invalid',
                '---',
                '___',
                '///',
                '#$@!%^&*()',
                'undefined',
                'null',
                'NaN',

                // Non-string / non-date primitives
                null,
                undefined,
                true,
                false,
                NaN,
                Infinity,
                -Infinity,

                // Objects without valid year property
                {},
                { date: '2024' },
                { year: 'invalid' },
                { year: 12345 },
                { year: '20241' },
                { year: '123' },
                { year: '2024/2025' },
                { year: null },
                { year: '' },
            ])('should return null for invalid, non-4-digit, or conflicting inputs | Input: %p', (input) => {
                expect(extractYearFromVal(input)).toBeNull();
            });

            it.each([
                [[]],
                [[null, undefined, '']],
                [['invalid', false, 123]],
                [['12345', '67890']],
                [['2024-05-15', '2025-06-20']],
                [['2024', '2025']],
                [[12345]],
            ])('should return null for array inputs lacking a single unique valid year | Input: %p', (arrayInput) => {
                expect(extractYearFromVal(arrayInput)).toBeNull();
            });

            it('should return null for invalid Date objects and symbols', () => {
                expect(extractYearFromVal(new Date('invalid'))).toBeNull();
                expect(extractYearFromVal(new Date(NaN))).toBeNull();
                expect(extractYearFromVal(Symbol('2024') as any)).toBeNull();
            });
        });

        describe('Function: extractYearFromPayload() Priority & Fallback Resolution', () => {
            it.each([
                [{ PY: '2024' }, '2024'],
                [{ PY: 2024 }, '2024'],
                [{ PY: '2024-05-15' }, '2024'],
                [{ PY: ['2024-05-15'] }, '2024'],
                [{ PY: '_2024_' }, '2024'],
                [{ Y1: '2023' }, '2023'],
                [{ Y1: '2023/03/10' }, '2023'],
                [{ Y1: 2023 }, '2023'],
            ])(
                'should extract year from individual payload keys with default supplier tags | Input: %p',
                (payload, expected) => {
                    expect(extractYearFromPayload(payload, undefined, DATE_YEAR_SUPPLIER_TAGS)).toBe(expected);
                },
            );

            it('should follow strict priority order for default supplier tags: PY -> Y1', () => {
                expect(extractYearFromPayload({ PY: '2024', Y1: '2022' }, undefined, DATE_YEAR_SUPPLIER_TAGS)).toBe(
                    '2024',
                );
                expect(extractYearFromPayload({ Y1: '2022' }, undefined, DATE_YEAR_SUPPLIER_TAGS)).toBe('2022');
            });

            it('should extract year from custom injected supplier tags in priority order', () => {
                const customSupplierTags = ['PY', 'publicationYear', 'Y1', 'primaryDate'];
                expect(
                    extractYearFromPayload(
                        { PY: '2024', publicationYear: '2023', Y1: '2022', primaryDate: '2021' },
                        undefined,
                        customSupplierTags,
                    ),
                ).toBe('2024');
                expect(
                    extractYearFromPayload(
                        { publicationYear: '2023', Y1: '2022', primaryDate: '2021' },
                        undefined,
                        customSupplierTags,
                    ),
                ).toBe('2023');
                expect(extractYearFromPayload({ Y1: '2022', primaryDate: '2021' }, undefined, customSupplierTags)).toBe(
                    '2022',
                );
                expect(extractYearFromPayload({ primaryDate: '2021' }, undefined, customSupplierTags)).toBe('2021');
            });

            it.each([{}, { PY: '12345' }, { Y1: '123' }, { PY: null, Y1: undefined }])(
                'should return null when payload contains no valid fallback year | Input: %p',
                (payload) => {
                    expect(extractYearFromPayload(payload, undefined, DATE_YEAR_SUPPLIER_TAGS)).toBeNull();
                },
            );

            it('should strictly exclude excludeTag from supplier probing to prevent self-referential resolution', () => {
                expect(extractYearFromPayload({ Y1: '2024' }, 'Y1', DATE_YEAR_SUPPLIER_TAGS)).toBeNull();
                expect(extractYearFromPayload({ PY: '2024' }, 'PY', DATE_YEAR_SUPPLIER_TAGS)).toBeNull();
                expect(extractYearFromPayload({ PY: '2024', Y1: '2022' }, 'PY', DATE_YEAR_SUPPLIER_TAGS)).toBe('2022');
            });
        });

        describe('heuristicallyParseDateString with fallbackYearResolver', () => {
            it('should lazily resolve fallback year for dates missing a year', () => {
                let resolverCalls = 0;
                const resolver = () => {
                    resolverCalls++;
                    return '2026';
                };

                const res = heuristicallyParseDateString('May 15', resolver);
                expect(res).toEqual({ year: '2026', month: '05', day: '15' });
                expect(resolverCalls).toBe(1);
            });

            it('should resolve fallback year for numeric month/day dates missing a year', () => {
                expect(heuristicallyParseDateString('/05/25/', () => '1999')).toEqual({
                    year: '1999',
                    month: '05',
                    day: '25',
                });
                expect(heuristicallyParseDateString('25.05', () => '1999')).toEqual({
                    year: '1999',
                    month: '05',
                    day: '25',
                });
                // ambiguous, lone or impossible values and missing fallback stay unparsed
                expect(heuristicallyParseDateString('05/12', () => '1999')).toBeNull();
                expect(heuristicallyParseDateString('05', () => '1999')).toBeNull();
                expect(heuristicallyParseDateString('02/29', () => '1999')).toBeNull();
                expect(heuristicallyParseDateString('05/25', () => null)).toBeNull();
                expect(heuristicallyParseDateString('05/25')).toBeNull();
            });

            it('should NOT call fallbackYearResolver when date string contains its own year', () => {
                let resolverCalls = 0;
                const resolver = () => {
                    resolverCalls++;
                    return '2020';
                };

                const res = heuristicallyParseDateString('2026-05-15', resolver);
                expect(res).toEqual({ year: '2026', month: '05', day: '15' });
                expect(resolverCalls).toBe(0);
            });

            it('should handle non-ISO dates correctly for valid and invalid calendar dates', () => {
                expect(heuristicallyParseDateString('15.05.2024')).toEqual({ year: '2024', month: '05', day: '15' });
                expect(heuristicallyParseDateString('05.15.2024')).toEqual({ year: '2024', month: '05', day: '15' });
                expect(heuristicallyParseDateString('2024.02.31')).toBeNull();
                expect(heuristicallyParseDateString('31.02.2024')).toBeNull();
            });
        });
    });

    describe('Function: isDate()', () => {
        it('should return true for Date objects, including invalid dates and dates from another realm', () => {
            expect(isDate(new Date('2026-01-01T00:00:00Z'))).toBe(true);
            expect(isDate(new Date('invalid'))).toBe(true);
            expect(isDate(vm.runInNewContext('new Date("2026-01-01T00:00:00Z")'))).toBe(true);
        });

        it.each([
            ['null', null],
            ['undefined', undefined],
            ['string', '2026-01-01'],
            ['number', 1_767_225_600_000],
            ['RawDate', { year: '2026' }],
            ['plain object with getTime', { getTime: () => 0 }],
        ])('should return false for %s', (_label, value) => {
            expect(isDate(value)).toBe(false);
        });
    });
});
