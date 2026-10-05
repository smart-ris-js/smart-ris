// Copyright 2026 Martin Winkler

import { expect } from 'bun:test';
import type { Equal } from './type-utils.js';

// -------------------------------------------------------------------
// 1. Type-Derived Shape Spec
// -------------------------------------------------------------------

type KindMap = { number: number; boolean: boolean; string: string; null: null };
type Kind = keyof KindMap;

type Has<E, K extends Kind> = [Extract<E, KindMap[K]>] extends [never] ? [] : [K];

// canonical member order: number | boolean | string | null
type KindList<E> = [...Has<E, 'number'>, ...Has<E, 'boolean'>, ...Has<E, 'string'>, ...Has<E, 'null'>];

type Join<T extends readonly string[]> = T extends readonly [infer H extends string]
    ? H
    : T extends readonly [infer H extends string, ...infer R extends string[]]
      ? `${H}|${Join<R>}`
      : never;

// `never` unless E is exactly a union of primitive kinds (no literals, no objects)
type Members<E> = Equal<KindMap[KindList<E>[number]], E> extends true ? Join<KindList<E>> : never;

type ArraySpec<E> = KindList<E>['length'] extends 1 ? `${Members<E>}[]` : `(${Members<E>})[]`;

type Suffix<V> = undefined extends V ? '?' : '';

/**
 * Canonical string form of a value type, e.g. `'number|string?'`, `'(string|null)[]'`.
 * - `?` suffix: `undefined` is part of the type.
 * - `never` for literals, objects, or mixed scalar/array unions.
 */
export type Spec<V> = [Exclude<V, undefined>] extends [never]
    ? never
    : [Exclude<V, undefined>] extends [readonly (infer E)[]]
      ? `${ArraySpec<E>}${Suffix<V>}`
      : [Extract<Exclude<V, undefined>, readonly unknown[]>] extends [never]
        ? `${Members<Exclude<V, undefined>>}${Suffix<V>}`
        : never;

// -------------------------------------------------------------------
// 2. Runtime Conformance Assertions
// -------------------------------------------------------------------

const REGEX_SPEC = /^(?:\((.+)\)\[\]|(.+?)(\[\])?)(\?)?$/;

const kindOf = (value: unknown): string => (value === null ? 'null' : typeof value);

/**
 * **Asserts runtime samples match the static type exactly**.
 *
 * - Compile time: `spec` must equal `Spec<V>`, i.e. the literal written in the test is the static type.
 * - Runtime: every sample conforms to `spec`, and every union member (incl. `undefined`) is witnessed by at least one sample.
 */
export function expectShape<V>(samples: readonly V[], spec: NoInfer<Spec<V>>): void {
    const match = REGEX_SPEC.exec(spec);
    if (match === null) {
        throw new Error(`Invalid shape spec: ${spec}`);
    }
    const isArray = match[1] !== undefined || match[3] !== undefined;
    const isOptional = match[4] !== undefined;
    const kinds = (match[1] ?? match[2]).split('|');

    const seen = new Set<string>();
    for (const sample of samples) {
        if (sample === undefined) {
            expect(isOptional, `undefined sample for non-optional spec '${spec}'`).toBe(true);
            seen.add('undefined');
            continue;
        }
        expect(Array.isArray(sample), `array-ness of ${JSON.stringify(sample)} for spec '${spec}'`).toBe(isArray);
        const elements: readonly unknown[] = Array.isArray(sample) ? sample : [sample];
        for (const element of elements) {
            expect(kinds, `element ${JSON.stringify(element)} for spec '${spec}'`).toContain(kindOf(element));
            seen.add(kindOf(element));
        }
    }

    const expected = isOptional ? [...kinds, 'undefined'] : kinds;
    expect([...seen].sort(), `witnessed members for spec '${spec}'`).toEqual([...expected].sort());
}

/** **Asserts the runtime key set equals `keys`**; each key must exist on the static type. */
export function expectKeys<R extends object>(record: R, keys: readonly (keyof R & string)[]): void {
    expect(Object.keys(record).sort()).toEqual([...keys].sort());
}
