// Copyright 2026 Martin Winkler

import { isDate } from './date.js';

/** Safely stringifies an object to JSON, handling circular references, BigInt, and invalid Dates. */
export function safeStringify(obj: unknown, space?: string | number): string {
    const cache = new Set<unknown>();

    /** Recursively inspects and transforms complex types, circular structures, BigInts, and Dates into JSON-safe representations. */
    function sanitize(value: unknown): unknown {
        if (typeof value === 'bigint') {
            return `${value.toString()}n`;
        }

        if (isDate(value)) {
            if (Number.isNaN(value.getTime())) {
                return '[Invalid Date]';
            }
            return value.toISOString();
        }

        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) {
                return '[Circular]';
            }
            cache.add(value);

            // honor `toJSON` like `JSON.stringify` (e.g. builder proxies have no own properties).
            if ('toJSON' in value && typeof value.toJSON === 'function') {
                const serialized = sanitize(value.toJSON());
                cache.delete(value);
                return serialized;
            }

            if (Array.isArray(value)) {
                const arr = new Array<unknown>(value.length);
                for (let i = 0; i < value.length; i++) {
                    arr[i] = sanitize(value[i]);
                }
                cache.delete(value);
                return arr;
            }

            // INTENTION: type guard alias.
            const record = value as Record<string, unknown>;
            const result: Record<string, unknown> = Object.create(null);

            for (const key in record) {
                if (Object.hasOwn(record, key)) {
                    result[key] = sanitize(record[key]);
                }
            }
            cache.delete(value);
            return result;
        }

        return value;
    }

    const json = JSON.stringify(sanitize(obj), null, space);
    if (json !== undefined) {
        return json;
    }

    // top-level `undefined`, functions, symbols (or `toJSON` returning `undefined`) have no JSON form.
    try {
        return String(obj);
    } catch {
        return '[Unserializable]';
    }
}
