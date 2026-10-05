// Copyright 2026 Martin Winkler

/** Significant decimal digits every IEEE 754 double round-trips exactly. */
const MAX_EXACT_SIGNIFICANT_DIGITS = 15;

/** Smallest positive normal double; smaller non-zero values underflow or lose precision. */
const MIN_NORMAL_DOUBLE = 2.2250738585072014e-308;

/**
 * **Parses a plain decimal string into a number**, rejecting the extra syntaxes `Number()` accepts.
 *
 * - Accepted: optional surrounding whitespace, optional `+`/`-` sign, digits with at most one `.` (e.g. `12`, `-3.5`, `.5`, `5.`).
 * - Rejected: hex/binary/octal prefixes (`0x10`), exponents (`1e3`), `Infinity`, separators (`1,000`, `1_000`), inner whitespace, empty input.
 * - Rejected: values not exactly representable as a double (more than 15 significant digits, unless a safe integer).
 * - Rejected: non-zero values below the normal double range (would underflow to `0` or lose precision).
 * - Single allocation-free code unit scan; `Number()` only runs on validated input.
 */
export function parseDecimalNumber(str: string): number | null {
    let start = 0;
    let end = str.length;
    while (start < end && isTrimWhitespace(str.charCodeAt(start))) {
        start++;
    }
    while (end > start && isTrimWhitespace(str.charCodeAt(end - 1))) {
        end--;
    }

    let i = start;
    const first = str.charCodeAt(i);
    // `+` or `-`.
    if (first === 43 || first === 45) {
        i++;
    }

    let digitCount = 0;
    // digits from the first non-zero digit on; trailing fraction zeros are removed at the end.
    let significantCount = 0;
    let fractionTrailingZeros = 0;
    let hasDot = false;

    for (; i < end; i++) {
        const c = str.charCodeAt(i);
        if (c >= 48 && c <= 57) {
            digitCount++;
            if (c !== 48) {
                significantCount++;
                fractionTrailingZeros = 0;
            } else if (significantCount > 0) {
                significantCount++;
                if (hasDot) {
                    fractionTrailingZeros++;
                }
            }
        } else if (c === 46 && !hasDot) {
            hasDot = true;
        } else {
            return null;
        }
    }

    if (digitCount === 0) {
        return null;
    }

    // `Number()` strips the same surrounding whitespace itself.
    const num = Number(str);
    if (significantCount - fractionTrailingZeros > MAX_EXACT_SIGNIFICANT_DIGITS && !Number.isSafeInteger(num)) {
        return null;
    }
    if (significantCount > 0 && Math.abs(num) < MIN_NORMAL_DOUBLE) {
        return null;
    }
    return num;
}

/**
 * **Checks whether a UTF-16 code unit is whitespace** as stripped by `String.prototype.trim()` and `Number()`.
 *
 * Covers ECMAScript `WhiteSpace` (incl. Unicode `Zs`) and `LineTerminator`.
 */
function isTrimWhitespace(c: number): boolean {
    if (c <= 32) {
        return c === 32 || (c >= 9 && c <= 13);
    }
    if (c < 160) {
        return false;
    }
    return (
        c === 160 ||
        c === 5760 ||
        (c >= 8192 && c <= 8202) ||
        c === 8232 ||
        c === 8233 ||
        c === 8239 ||
        c === 8287 ||
        c === 12288 ||
        c === 65279
    );
}
