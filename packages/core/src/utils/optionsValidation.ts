// Copyright 2026 Martin Winkler

/** Checks whether a value is neither `undefined` nor `null`. */
export function isDefined<T>(value: T): value is NonNullable<T> {
    return value !== undefined && value !== null;
}

/** Asserts boolean option type. */
export function assertBoolean(value: unknown, key: string): asserts value is boolean {
    if (typeof value !== 'boolean') {
        throw new TypeError(`Option '${key}' must be a boolean. Received: ${typeof value}`);
    }
}

/** Asserts string literal option type against allowed values. */
export function assertStringLiteral<T extends string>(
    value: unknown,
    allowedValues: readonly T[],
    key: string,
): asserts value is T {
    if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
        throw new TypeError(`Option '${key}' must be one of [${allowedValues.join(', ')}]. Received: ${value}`);
    }
}

/** Asserts custom validation condition on option value. */
export function assertCustom<T>(
    value: unknown,
    key: string,
    validator: (val: unknown) => boolean,
    errorMessage: string,
): asserts value is T {
    if (!validator(value)) {
        throw new TypeError(`Option '${key}' is invalid. ${errorMessage}`);
    }
}
