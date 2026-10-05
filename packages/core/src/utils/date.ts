// Copyright 2026 Martin Winkler

import type { DateFormatType, Day, Month, RawDate } from '../core.types.js';

// -------------------------------------------------------------------
// 1. Month Dictionaries & Lookup Tables
// -------------------------------------------------------------------

const fullMonths = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
];

const monthNamesMap: Record<string, Month> = Object.create(null);

for (let m = 0; m < fullMonths.length; m++) {
    const month = fullMonths[m];
    const monthValue = (m + 1).toString().padStart(2, '0') as Month;
    for (let i = 3; i <= month.length; i++) {
        monthNamesMap[month.substring(0, i)] = monthValue;
    }
}

const sep = '[\\s\\-.,/\\\\_]';
const months = Object.keys(monthNamesMap)
    .sort((a, b) => b.length - a.length)
    .join('|');

// -------------------------------------------------------------------
// 2. Regular Expressions
// -------------------------------------------------------------------

/** Matches dates starting with day number followed by month name and year. */
const REGEX_DAY_FIRST = new RegExp(`^(\\d{1,2})?${sep}*(${months})${sep}*(\\d{4})$`, 'i');

/** Matches dates starting with year followed by month name and day number. */
const REGEX_YEAR_FIRST = new RegExp(`^(\\d{4})${sep}*(${months})${sep}*(\\d{1,2})?$`, 'i');

/** Matches dates starting with month name followed by day number and year. */
const REGEX_MONTH_FIRST = new RegExp(`^(${months})${sep}*(\\d{1,2})${sep}*(\\d{4})$`, 'i');

/**
 * **Matches ISO-8601 and standard RIS formatted date strings** (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`, `YYYY/MM`, or `YYYY/MM/DD`).
 *
 * A full date may carry a time (`T` or space, `hh:mm[:ss[.fff]]`) and zone (`Z`, `+hh[:mm]`, `-hh[:mm]` or a 3-5 letter abbreviation); the time is dropped, the date is kept as written.
 */
const REGEX_ISO =
    /^(\d{4})(?:[-/](\d{1,2})(?:[-/](\d{1,2})(?:[T ](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3])(?::?[0-5]\d)?| ?[A-Z]{3,5})?)?)?)?$/;

// new patterns for month/day without a year.
/** Matches standalone month names without year or day components. */
const REGEX_MONTH_ONLY = new RegExp(`^(${months})$`, 'i');

/** Matches month followed by day number without a year component. */
const REGEX_MONTH_DAY = new RegExp(`^(${months})${sep}+(\\d{1,2})$`, 'i');

/** Matches day number followed by month name without a year component. */
const REGEX_DAY_MONTH = new RegExp(`^(\\d{1,2})${sep}+(${months})$`, 'i');

/**
 * **Extracts all continuous sequences of digits from candidate date strings**.
 *
 * // INTENTION: `/g` called via `str.match` - safe.
 */
const REGEX_CONSECUTIVE_DIGITS = /\d+/g;

/** Matches the RIS `YYYY/MM/DD/other info` layout; captures the date part before the 4th segment. */
const REGEX_RIS_OTHER_INFO = /^\s*(\d{4}\/\d{0,2}\/\d{0,2})\//;

/** Matches trailing forward slashes on RIS date strings (e.g. `2024///`). */
const REGEX_TRAILING_SLASHES = /\/+$/;

/** Matches all permissible characters allowed in raw RIS date expressions. */
const REGEX_DATE_ALLOWED_CHARS = /[0-9\\/\s\-.,_\t]/g;

/** Matches date segment delimiters (slashes, hyphens, periods, whitespace, underscores). */
const REGEX_DATE_PARTS_SPLIT = /[\\/\s.,_-]+/;

// -------------------------------------------------------------------
// 3. Date Parsing & Formatting
// -------------------------------------------------------------------

/**
 * **Heuristically parses a date string** into structured `RawDate` representation.
 *
 * - Returns partial `RawDate` (missing year) for `inspect-parse` reporting.
 * - Missing years fallback in stringify/parse `typeCaster`.
 * - RIS `YYYY/MM/DD/other info` values that fail as a whole are parsed by their date part; the other info is dropped.
 */
export function heuristicallyParseDateString(
    dateStr: string,
    fallbackYearResolver?: () => string | null | undefined,
): RawDate | null {
    const parsed = parseDateCandidate(dateStr, fallbackYearResolver);
    if (parsed !== null) {
        return parsed;
    }
    // retried only after a failed full parse, so values like `2023///05///15` keep their current result.
    const risMatch = REGEX_RIS_OTHER_INFO.exec(dateStr);
    return risMatch ? parseDateCandidate(risMatch[1], fallbackYearResolver) : null;
}

/** Parses a single date candidate; see {@link heuristicallyParseDateString}. */
function parseDateCandidate(
    dateStr: string,
    fallbackYearResolver: (() => string | null | undefined) | undefined,
): RawDate | null {
    const str = dateStr.replace(REGEX_TRAILING_SLASHES, '').trim();
    if (!str) {
        return null;
    }

    // 1. ISO YYYY-MM-DD, YYYY-MM, YYYY formats.
    const isoMatch = str.match(REGEX_ISO);
    if (isoMatch) {
        const [, y, m, d] = isoMatch;
        if (m && d) {
            const padM = m.padStart(2, '0');
            const padD = d.padStart(2, '0');
            if (isValidDate(y, padM, padD)) {
                return { year: y, month: padM, day: padD } as RawDate;
            }
            if (str.includes('-')) {
                return null;
            }
        } else if (m) {
            const padM = m.padStart(2, '0');
            if (isValidDate(y, padM, '01')) {
                return { year: y, month: padM } as RawDate;
            }
            if (str.includes('-')) {
                return null;
            }
        } else {
            return { year: y } as RawDate;
        }
    }

    // 2. Textual month formats WITH year.
    let y = '',
        rawD: string | undefined,
        rawM = '';

    const mDF = REGEX_DAY_FIRST.exec(str);
    if (mDF) {
        rawD = mDF[1];
        rawM = mDF[2];
        y = mDF[3];
    } else {
        const mYF = REGEX_YEAR_FIRST.exec(str);
        if (mYF) {
            y = mYF[1];
            rawM = mYF[2];
            rawD = mYF[3];
        } else {
            const mMF = REGEX_MONTH_FIRST.exec(str);
            if (mMF) {
                rawM = mMF[1];
                rawD = mMF[2];
                y = mMF[3];
            }
        }
    }

    if (y && rawM) {
        const m = monthNamesMap[rawM.toLowerCase()];
        if (rawD) {
            const d = rawD.padStart(2, '0');
            return isValidDate(y, m, d) ? ({ year: y, month: m, day: d } as RawDate) : null;
        }
        return isValidDate(y, m, '01') ? ({ year: y, month: m } as RawDate) : null;
    }

    // 2.5 textual month formats without year.
    const mOnly = REGEX_MONTH_ONLY.exec(str);
    if (mOnly) {
        const m = monthNamesMap[mOnly[1].toLowerCase()];
        const res: RawDate = { month: m };
        const year = fallbackYearResolver?.();
        if (year) {
            res.year = year;
        }
        return res;
    }

    const mDay = REGEX_MONTH_DAY.exec(str);
    if (mDay) {
        const m = monthNamesMap[mDay[1].toLowerCase()];
        const d = mDay[2].padStart(2, '0') as Day;
        const year = fallbackYearResolver?.();
        // INTENTION: check with 2004 as leap-year if month/day date is even plausible.
        if (isValidDate(year || '2004', m, d)) {
            const res: RawDate = { month: m, day: d };
            if (year) {
                res.year = year;
            }
            return res;
        }
        return null;
    }

    const dMonth = REGEX_DAY_MONTH.exec(str);
    if (dMonth) {
        const d = dMonth[1].padStart(2, '0') as Day;
        const m = monthNamesMap[dMonth[2].toLowerCase()];
        const year = fallbackYearResolver?.();
        // INTENTION: check with 2004 as leap-year if month/day date is even plausible.
        if (isValidDate(year || '2004', m, d)) {
            const res: RawDate = { month: m, day: d };
            if (year) {
                res.year = year;
            }
            return res;
        }
        return null;
    }

    // 3. Basic separators fallback.
    const remainingCharacters = str.replace(REGEX_DATE_ALLOWED_CHARS, '');
    if (remainingCharacters.length > 0) {
        return null;
    }

    const rawParts = str.split(REGEX_DATE_PARTS_SPLIT);
    let parsedYear: string | null = null;
    let p1Str: string | null = null;
    let p2Str: string | null = null;
    let nonYearCount = 0;
    let totalCount = 0;

    for (let i = 0; i < rawParts.length; i++) {
        const part = rawParts[i];
        if (part.length === 0) {
            continue;
        }
        totalCount++;
        if (part.length === 4 && parsedYear === null) {
            parsedYear = part;
        } else if (nonYearCount === 0) {
            p1Str = part;
            nonYearCount++;
        } else if (nonYearCount === 1) {
            p2Str = part;
            nonYearCount++;
        } else {
            return null;
        }
    }

    if (totalCount === 1 && parsedYear !== null) {
        return { year: parsedYear } as RawDate;
    }

    // year-less month/day pair (e.g. RIS `/05/25/`) inherits the fallback year; a lone number stays no date.
    if (parsedYear === null && nonYearCount === 2) {
        parsedYear = fallbackYearResolver?.() || null;
        totalCount++;
    }

    if (parsedYear !== null && totalCount >= 2 && totalCount <= 3) {
        if (nonYearCount === 1 && p1Str !== null) {
            const m = p1Str.padStart(2, '0');
            if (isValidDate(parsedYear, m, '01')) {
                return { year: parsedYear, month: m } as RawDate;
            }
        }

        if (nonYearCount === 2 && p1Str !== null && p2Str !== null) {
            const p1 = parseInt(p1Str, 10);
            const p2 = parseInt(p2Str, 10);

            let m = '',
                d = '';

            if (p1 > 12 && p2 <= 12) {
                d = p1.toString().padStart(2, '0');
                m = p2.toString().padStart(2, '0');
            } else if (p2 > 12 && p1 <= 12) {
                m = p1.toString().padStart(2, '0');
                d = p2.toString().padStart(2, '0');
            } else if (p1 === p2 && p1 <= 12) {
                m = p1.toString().padStart(2, '0');
                d = p2.toString().padStart(2, '0');
            } else {
                // INVARIANT: ambiguous numeric month/day combinations (both <= 12 and unequal) return `null` to prevent silent date corruption.
                return null;
            }

            if (isValidDate(parsedYear, m, d)) {
                return { year: parsedYear, month: m, day: d } as RawDate;
            }
        }
    }

    return null;
}

/**
 * **Checks whether a value is a `Date` object**, including dates created in another realm (iframe, `node:vm`).
 *
 * `instanceof Date` fails across realms; the internal `[object Date]` tag does not. Invalid dates still return `true`.
 */
export function isDate(val: unknown): val is Date {
    return Object.prototype.toString.call(val) === '[object Date]';
}

/**
 * **Checks whether year, month and day form a real calendar date** (proleptic Gregorian, leap years included).
 *
 * - `y`: exactly 4 ASCII digits (`0000-9999`).
 * - `m`: 1-2 ASCII digits, `1-12`.
 * - `d`: 1-2 ASCII digits, `1` up to the days of that month (`29` for February in leap years).
 * - Signs, whitespace, decimals and other characters are rejected.
 */
export function isValidDate(y: string, m: string, d: string): boolean {
    const year = parseDigits(y, 4, 4);
    const month = parseDigits(m, 1, 2);
    const day = parseDigits(d, 1, 2);
    if (year < 0 || month < 1 || month > 12 || day < 1) {
        return false;
    }
    if (month === 2 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
        return day <= 29;
    }
    return day <= DAYS_IN_MONTH[month - 1];
}

/**
 * **Formats a date object or Date** according to the specified RIS date format.
 *
 * - `Date`: formatted by its **local** calendar date (`getFullYear`/`getMonth`/`getDate`), so `new Date(2024, 0, 1)` is `2024-01-01` in every timezone.
 * - `RawDate`: `year` must be 4 digits, `month`/`day` 1-2 digits forming a real calendar date (leap years included); `null`/`undefined`/`''` parts count as missing.
 */
export function formatRisDate(date: RawDate | Date, format: DateFormatType): string {
    let y = '',
        m = '',
        d = '';

    if (isDate(date)) {
        y = formatDateYear(date);
        if (!y) {
            return '';
        }
        // `getMonth()` is zero-based (January = 0).
        m = (date.getMonth() + 1).toString().padStart(2, '0');
        d = date.getDate().toString().padStart(2, '0');
    } else {
        y = rawDatePart(date.year);
        m = rawDatePart(date.month);
        d = rawDatePart(date.day);
        if (m.length === 1) {
            m = `0${m}`;
        }
        if (d.length === 1) {
            d = `0${d}`;
        }
        // missing month/day are checked as `01` so present parts are still validated.
        if (!y || !isValidDate(y, m || '01', d || '01')) {
            return '';
        }
    }

    switch (format) {
        case 'YYYY-MM-DD':
            // missing month keeps its empty slot (`2024--15`) so the day is not lost.
            return y && m && d ? `${y}-${m}-${d}` : y && m ? `${y}-${m}` : y && d ? `${y}--${d}` : y;
        case 'YYYY-MM':
            return y && m ? `${y}-${m}` : y;
        case 'YYYY/MM/DD':
            return y && m && d ? `${y}/${m}/${d}` : y && m ? `${y}/${m}` : y && d ? `${y}//${d}` : y;
        case 'YYYY/MM':
            return y && m ? `${y}/${m}` : y;
        case 'YYYY':
            return y;
        default:
            return y;
    }
}

/** Joins present `RawDate` parts without validation, separated like `format`; `''` if no part is present. */
export function formatRawDateUnchecked(date: RawDate, format: DateFormatType): string {
    let m = rawDatePart(date.month);
    let d = rawDatePart(date.day);
    if (m.length === 1) {
        m = `0${m}`;
    }
    if (d.length === 1) {
        d = `0${d}`;
    }
    const y = rawDatePart(date.year);
    const sep = format.includes('/') ? '/' : '-';
    // missing month between year and day keeps its empty slot, like `formatRisDate`.
    if (y && !m && d) {
        return `${y}${sep}${sep}${d}`;
    }
    return [y, m, d].filter(Boolean).join(sep);
}

// -------------------------------------------------------------------
// 4. Fallback Year Extraction & Resolvers
// -------------------------------------------------------------------

/** Extracts a 4-digit year string from a value (string, number, Date, array, or object with year property). */
export function extractYearFromVal(val: unknown): string | null {
    if (val == null) {
        return null;
    }

    if (Array.isArray(val)) {
        // INTENTION: deduplication; if [2024, 2024] we treat as a single year.
        // INTENTION: check for multiple entries; only return if there is a single unique year.
        let uniqueYear: string | null = null;
        for (let i = 0; i < val.length; i++) {
            const year = extractYearFromVal(val[i]);
            if (year !== null) {
                if (uniqueYear === null) {
                    uniqueYear = year;
                } else if (uniqueYear !== year) {
                    return null;
                }
            }
        }
        return uniqueYear;
    }

    if (isDate(val)) {
        // INTENTION: only extract year and ignore month/day.
        return formatDateYear(val) || null;
    }

    // INTENTION: check for number/string or object with property year (objects allowed for stringify/builder as type RisDate).
    const target =
        typeof val === 'number' || typeof val === 'string'
            ? val
            : typeof val === 'object' && val !== null && 'year' in val && val.year
              ? val.year
              : null;

    if (target != null) {
        const str = String(target).trim();
        const digitSequences = str.match(REGEX_CONSECUTIVE_DIGITS);
        if (!digitSequences) {
            return null;
        }

        let uniqueYear: string | null = null;
        for (let i = 0; i < digitSequences.length; i++) {
            if (digitSequences[i].length === 4) {
                if (uniqueYear === null) {
                    uniqueYear = digitSequences[i];
                } else if (uniqueYear !== digitSequences[i]) {
                    return null;
                }
            }
        }
        return uniqueYear;
    }

    return null;
}

/** Extracts fallback year from a pipeline payload, probing priority supplier tags. */
export function extractYearFromPayload(
    payload: Record<string, unknown>,
    excludeTag: string | undefined,
    supplierTags: readonly string[],
): string | null {
    for (let i = 0; i < supplierTags.length; i++) {
        const tag = supplierTags[i];
        if (tag === excludeTag) {
            continue;
        }
        // INTENTION: cached dictionary lookup.
        const val = payload[tag];
        if (val !== undefined) {
            const year = extractYearFromVal(val);
            if (year) {
                return year;
            }
        }
    }
    return null;
}

/** Creates a cached fallback year resolver function for a pipeline payload. */
export function createFallbackYearResolver(
    payload: Record<string, unknown>,
    supplierTags: readonly string[],
): (currentTag: string) => string | null {
    let cachedFallbackYear: string | null | undefined;
    let cachedFallbackYearTag: string | undefined;

    return (currentTag: string): string | null => {
        // INTENTION: prevent own (current) value from providing cached fallback.
        if (cachedFallbackYear === undefined || cachedFallbackYearTag !== currentTag) {
            cachedFallbackYearTag = currentTag;
            cachedFallbackYear = extractYearFromPayload(payload, currentTag, supplierTags);
        }
        return cachedFallbackYear;
    };
}

// -------------------------------------------------------------------
// 5. Internal Helper Functions
// -------------------------------------------------------------------

/** Days per month of a non-leap year (index `0` = January). */
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Parses a string of `minLength`-`maxLength` ASCII digits; returns `-1` for any other input. */
function parseDigits(str: string, minLength: number, maxLength: number): number {
    if (str.length < minLength || str.length > maxLength) {
        return -1;
    }
    let num = 0;
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i) - 48;
        if (c < 0 || c > 9) {
            return -1;
        }
        num = num * 10 + c;
    }
    return num;
}

/** Normalizes a `RawDate` part to a string; `null`, `undefined` and `''` become `''`. */
function rawDatePart(val: unknown): string {
    return val == null ? '' : String(val);
}

/** Formats the local 4-digit year of a `Date`; `''` for invalid dates or years outside `0000-9999`. */
function formatDateYear(date: Date): string {
    const year = date.getFullYear();
    // `NaN` (invalid date) fails both comparisons.
    if (!(year >= 0 && year <= 9999)) {
        return '';
    }
    return year.toString().padStart(4, '0');
}
