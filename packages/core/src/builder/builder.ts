// Copyright 2026 Martin Winkler

import { DEFAULT_REFERENCE_TYPE, OBJECT_PROTOTYPE_SET, PROMISE_THENABLE_SET } from '../core.constants.js';
import { resolveStringifySemanticMap } from '../core.resolver.js';
import type {
    MaybeArray,
    RawDate,
    RisBuilder,
    RisBuilderConfig,
    RisCallableBuilder,
    RisStringifyValue,
    StringifyRisRecord,
} from '../core.types.js';
import { isDate } from '../utils/date.js';

// -------------------------------------------------------------------
// 1. Exported Builder Entrypoint (`ris`)
// -------------------------------------------------------------------

/**
 * **RIS builder factory**
 * - can be called as a function `ris(config)` or
 * - accessed directly as a builder instance `ris.tag(...)`.
 */
export const ris: RisCallableBuilder = new Proxy(createRisBuilder, {
    // INTENTION: apply trap for calling `ris()` or `ris(config)`.
    apply(target, _thisArg, argArray: [RisBuilderConfig?]) {
        return target(argArray[0]);
    },
    // INTENTION: get trap for calling `ris.tag(...)` directly.
    get(target, prop) {
        return Reflect.get(target(), prop);
    },
    // INTENTION: has trap for `'tag' in ris` reflection parity.
    has(target, prop) {
        return Reflect.has(target(), prop);
    },
}) as unknown as RisCallableBuilder;

// -------------------------------------------------------------------
// 2. Builder Factory (`createRisBuilder`)
// -------------------------------------------------------------------

/** Creates a fluent RIS builder instance wrapped in a Proxy. */
export function createRisBuilder<const TConfig extends RisBuilderConfig = Record<string, never>>(
    config?: TConfig,
): RisBuilder<TConfig> {
    // INTENTION: to prevent `ris()` (no args) from corrupting autocomplete: `= Record<string, never>` if `ris()`.
    // INTENTION: else `TConfig` defaults to `RisBuilderConfig`; `TConfig['customSemanticMap']` resolves to `Record<string, string> | undefined` instead of `never` or `undefined`, corrupting autocomplete.
    const internalRecord: Record<string, RisStringifyValue[]> = Object.create(null);
    const semanticMap = resolveStringifySemanticMap(config?.customSemanticMap);

    const proxy: RisBuilder<TConfig> = new Proxy({} as RisBuilder<TConfig>, {
        has(_target, prop) {
            if (typeof prop !== 'string') {
                return false;
            }
            // INTENTION: disallow promise/thenable properties; disallow `ER` and `endOfReference`.
            if (PROMISE_THENABLE_SET.has(prop)) {
                return false;
            }
            // INTENTION: disallow `Object.prototype` properties (`toString`, `valueOf`, `constructor`, ...); never RIS tags.
            if (OBJECT_PROTOTYPE_SET.has(prop)) {
                return false;
            }
            const normalizedProp = prop.toUpperCase();
            const risTag = semanticMap[normalizedProp] || normalizedProp;
            return risTag !== 'ER';
        },
        // INTENTION: `ris.tag()` triggers `get` trap for `tag`, returns a function and `()` calls it.
        get(_target, prop: string | symbol) {
            // INTENTION: block all symbols and suppress promise/thenable properties.
            if (typeof prop === 'symbol' || PROMISE_THENABLE_SET.has(prop)) {
                return undefined;
            }
            // INTENTION: block `Object.prototype` properties like promise/thenable properties; never RIS tags.
            // INTENTION: `String(builder)`/`${builder}` throw a native TypeError instead of creating `TOSTRING`/`VALUEOF` tags.
            if (OBJECT_PROTOTYPE_SET.has(prop)) {
                return undefined;
            }

            // INTENTION: terminal methods & getters.
            if (prop === 'toJSON' || prop === 'build') {
                return () => generateBuilderOutput(internalRecord, false);
            }
            if (prop === 'get') {
                return generateBuilderOutput(internalRecord, false);
            }
            if (prop === 'raw') {
                return () => generateBuilderOutput(internalRecord, true);
            }

            // INTENTION: dynamic RIS tag resolution.
            const normalizedProp = prop.toUpperCase();
            const risTag = semanticMap[normalizedProp] || normalizedProp;

            // INTENTION: return `undefined` for `ER` (and `endOfReference`) case-insensitively.
            if (risTag === 'ER') {
                return undefined;
            }

            return (...values: MaybeArray<RisStringifyValue>[]) => {
                // INTENTION: cache record array to prevent redundant hash lookups.
                let targetArr = internalRecord[risTag];
                if (targetArr === undefined) {
                    targetArr = [];
                    internalRecord[risTag] = targetArr;
                }

                // INTENTION: zero arguments: `ris.tag()` -> `[null]`.
                if (values.length === 0) {
                    targetArr.push(null);
                    return proxy;
                }

                // INTENTION: single scalar value: hot path, 0 intermediate allocations.
                if (values.length === 1 && !isArray(values[0])) {
                    const val = values[0] === undefined ? null : values[0];
                    validateAndPushValue(val, targetArr, risTag);
                    return proxy;
                }

                // INTENTION: nested array or multiple arguments: single-pass flattening, validation, and push.
                const initialLen = targetArr.length;
                flattenValidateAndPush(values, targetArr, risTag);

                // INTENTION: if empty nested arrays were passed (e.g. `ris.tag([])`), normalize to `[null]`.
                if (targetArr.length === initialLen) {
                    targetArr.push(null);
                }

                return proxy;
            };
        },
    });

    return proxy;
}

// -------------------------------------------------------------------
// 3. Pure Helper Functions (Module-Level Single Allocation)
// -------------------------------------------------------------------

/** Type guard for readonly and mutable arrays. */
function isArray(val: unknown): val is readonly unknown[] {
    return Array.isArray(val);
}

/** Recursive array flattening; `undefined` to `null` conversion. */
function flattenValidateAndPush(
    input: MaybeArray<RisStringifyValue>[],
    target: RisStringifyValue[],
    risTag: string,
): void {
    for (let i = 0; i < input.length; i++) {
        // INTENTION: cache element to prevent multiple bounds checks.
        const item = input[i];
        if (isArray(item)) {
            flattenValidateAndPush(item as MaybeArray<RisStringifyValue>[], target, risTag);
        } else {
            const val = item === undefined ? null : (item as RisStringifyValue);
            validateAndPushValue(val, target, risTag);
        }
    }
}

/** Validates scalar data types allowed in RIS entries; throws TypeError on invalid types. */
function validateAndPushValue(val: RisStringifyValue, target: RisStringifyValue[], risTag: string): void {
    if (val === null || typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        target.push(val);
        return;
    }

    // INTENTION: safe `instanceof Date` check.
    if (isDate(val)) {
        if (!Number.isNaN(val.getTime())) {
            target.push(val);
            return;
        }
        throw new TypeError(`Invalid Date object passed for RIS tag ${risTag}`);
    }

    // INTENTION: accept `RawDate` containing at least one of year/month/day not `undefined`.
    if (
        typeof val === 'object' &&
        ((val as RawDate).year !== undefined ||
            (val as RawDate).month !== undefined ||
            (val as RawDate).day !== undefined)
    ) {
        target.push(val as RawDate);
        return;
    }

    // INTENTION: invalid types (`undefined`, functions, symbols, plain empty objects).
    throw new TypeError(`Invalid value type for RIS tag ${risTag}`);
}

/** If `isRaw:false` unwraps scalar values; checks `TY` else fallback. */
function generateBuilderOutput(
    internalRecord: Record<string, RisStringifyValue[]>,
    isRaw: boolean,
): StringifyRisRecord {
    const out: StringifyRisRecord = Object.create(null);
    for (const key in internalRecord) {
        // INTENTION: cached dictionary lookup.
        const values = internalRecord[key];
        // INTENTION: unbox single-element-arrays; `isRaw:true` always returns arrays.
        // INTENTION: shallow-copy array to prevent reference leakage; `RawDate` and `Date` objects passed by reference.
        out[key] = !isRaw && values.length === 1 ? values[0] : values.slice();
    }

    // INTENTION: if missing TY tag add default.
    if (!('TY' in out)) {
        out.TY = isRaw ? [DEFAULT_REFERENCE_TYPE] : DEFAULT_REFERENCE_TYPE;
    }

    return out;
}
