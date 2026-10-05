// Copyright 2026 Martin Winkler

import type { MaybeArray, StringifyInput } from '@smart-ris/core';
import { createStringifyEngine } from './engine/stringify.engine.js';
import { buildStringifyPipeline } from './middlewares/stringify.pipeline.js';
import { DEFAULT_STRINGIFY_OPTIONS, type ResolvedStringifyOptions } from './stringify.options.js';
import { resolveStringifyOptions } from './stringify.resolver.js';
import type { StringifyOptions } from './stringify.types.js';

export type { ResolvedStringifyOptions, StringifyOptions };
export { buildStringifyPipeline, createStringifyEngine, DEFAULT_STRINGIFY_OPTIONS, resolveStringifyOptions };

// -------------------------------------------------------------------
// 1. Synchronous Stringifier (`stringify`)
// -------------------------------------------------------------------

/** Stringifies single or multiple RIS record objects into standard RIS text format. */
export function stringify(input: MaybeArray<StringifyInput>, options: StringifyOptions = {}): string {
    const opts = resolveStringifyOptions(options);
    const middlewares = buildStringifyPipeline(opts);
    const engine = createStringifyEngine({
        ...opts,
        middlewares,
        semanticMap: opts.fromSemantic ? opts.customSemanticMap : undefined,
    });
    if (!Array.isArray(input)) {
        return engine.serializeRecord(input as StringifyInput);
    }

    // INTENTION: type guard alias.
    const records: readonly StringifyInput[] = input as readonly StringifyInput[];

    let result = '';

    let isFirst = true;
    for (let i = 0; i < records.length; i++) {
        const serialized = engine.serializeRecord(records[i]);
        if (serialized !== '') {
            if (!isFirst) {
                result += opts.eol;
            }
            result += serialized;
            isFirst = false;
        }
    }

    return result;
}

// -------------------------------------------------------------------
// 2. Asynchronous Stream Stringifier (`stringifyStream`)
// -------------------------------------------------------------------

/** Streams serialized RIS records asynchronously chunk-by-chunk. */
export async function* stringifyStream(
    stream: AsyncIterable<StringifyInput>,
    options: StringifyOptions = {},
): AsyncGenerator<string> {
    const opts = resolveStringifyOptions(options);
    const middlewares = buildStringifyPipeline(opts);
    const engine = createStringifyEngine({
        ...opts,
        middlewares,
        semanticMap: opts.fromSemantic ? opts.customSemanticMap : undefined,
    });

    let isFirstRecord = true;

    // INTENTION: stream I/O errors and iterator failures propagate directly to the caller's for-await loop without domain interception.
    for await (const record of stream) {
        const serialized = engine.serializeRecord(record);
        if (serialized !== '') {
            if (!isFirstRecord) {
                yield opts.eol;
            }
            yield serialized;
            isFirstRecord = false;
        }
    }
}
