// Copyright 2026 Martin Winkler

import type {
    ActiveArrayMergeStrategy,
    EolType,
    Middleware,
    RawArrayPipelineRecord,
    RawPipelineRecord,
    RisRawValue,
    RisTag,
} from '../../core.types.js';

/** Configuration options for the array caster middleware. */
export type ArrayCasterOptions = {
    /** Array of {@link RisTag} - internal type; user-exposed `opts.customArrayTags` is `ContentRisTag`. */
    arrayTags: RisTag[];

    /** {@link ActiveArrayMergeStrategy} to apply when merging multiple entries for scalar tags. */
    arrayMergeStrategy: ActiveArrayMergeStrategy;

    /** Bidirectional union of parse (`<RisTag, string>`) and stringify (`<string, RisTag>`). */
    semanticMap: Partial<Record<RisTag, string>> | Record<string, RisTag>;

    /** Internal pipeline flag: `false` for parse (unwraps scalars), `true` for stringify (keeps arrays). */
    forStringify: boolean;

    /** Line ending delimiter to apply when merging with 'join-newline'. Defaults to '\n'. */
    eol?: EolType;
};

/** Creates array caster middleware resolving scalar tag values according to merge strategy. */
export function createArrayCaster(options: ArrayCasterOptions): Middleware<RawArrayPipelineRecord, RawPipelineRecord> {
    const isArrayLookup = new Set<string>(options.arrayTags);

    // INTENTION: hoisted configuration references.
    const arrayMergeStrategy = options.arrayMergeStrategy;
    const forStringify = options.forStringify;
    const eol = options.eol ?? '\n';

    // INTENTION: create bidirectional lookup for RawTag, SemanticTag, and UppercaseSemanticTag.
    //  - PARSE: `semanticMapper` runs before `arrayCaster` -> RisTag or SemanticTag (uppercased SemanticTag if resolveable converted to default-cased SemanticTag by `semanticMapper`).
    //  - PARSE (`toSemantic: false`): semantic aliases (e.g. AUTHOR for AU) must still be registered so non-standard input tags preserve array structure instead of merging into scalars.
    //  - STRINGIFY: `semanticUnmapper` runs before `arrayCaster` (broken semantic names might be left at `skipInvalidTags:false`) -> RisTag or UppercaseSemanticTag (also works with unconverted SemanticTag - unintended and would lead to broken output).
    if (!forStringify) {
        for (const rawTag in options.semanticMap) {
            if (isArrayLookup.has(rawTag)) {
                // INTENTION: cached dictionary lookup.
                const semanticKey = (options.semanticMap as Record<string, string>)[rawTag];
                isArrayLookup.add(semanticKey);
                // INTENTION: `semanticKey` never `undefined`; assured by `resolveStringifySemanticMap` and `parseSemanticMapper`.
                isArrayLookup.add(semanticKey.toUpperCase());
            }
        }
    }

    return (payload: RawArrayPipelineRecord): RawPipelineRecord => {
        // INTENTION: type guard alias.
        const out: RawPipelineRecord = payload as RawPipelineRecord;
        // INVARIANT: `payload` has no prototype.
        for (const tag in payload) {
            if (!isArrayLookup.has(tag)) {
                // INTENTION: never `null` @see RawArrayPipelineRecord.
                const resolvedVal: RisRawValue = applyMergeStrategy(payload[tag], arrayMergeStrategy, eol);

                // INTENTION: wrap `resolvedVal` in array if `forStringify` is `true` (stringify), else output primitive scalar value (parse).
                out[tag] = resolvedVal !== null && forStringify ? [resolvedVal] : resolvedVal;
            }
        }

        return out;
    };
}

/**
 * **Applies array merge strategy to resolve scalar tag values**.
 *
 * - `'first'` - First non-null value in array.
 * - `'last'` - Last non-null value in array.
 * - `'join-space'` - Joins all non-null values with a single space.
 * - `'join-newline'` - Joins all non-null values with a newline character.
 */
function applyMergeStrategy(values: RisRawValue[], strategy: ActiveArrayMergeStrategy, eol: EolType): RisRawValue {
    // INTENTION: `values.length` can never be 0.

    if (values.length === 1) {
        return values[0];
    }

    // INTENTION: 'first' fast-path try to find first non-`null` value.
    if (strategy === 'first') {
        for (let i = 0; i < values.length; i++) {
            if (values[i] !== null) {
                return values[i];
            }
        }
        return null;
    }

    // INTENTION: 'last' fast-path try to find last non-`null` value.
    if (strategy === 'last') {
        for (let i = values.length - 1; i >= 0; i--) {
            if (values[i] !== null) {
                return values[i];
            }
        }
        return null;
    }

    const validValues: string[] = [];
    for (let i = 0; i < values.length; i++) {
        // INTENTION: type guard alias.
        const v = values[i];
        if (v !== null) {
            validValues.push(v);
        }
    }
    if (validValues.length === 0) {
        return null;
    }
    if (validValues.length === 1) {
        return validValues[0];
    }

    // INVARIANT: fallback else 'join-space' for test coverage.
    return strategy === 'join-newline' ? validValues.join(eol) : validValues.join(' ');
}
