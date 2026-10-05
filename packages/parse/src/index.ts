// Copyright 2026 Martin Winkler

import {
    ERROR_MESSAGES,
    emitError,
    type ParsedRisRecord,
    type ParseRisRecord,
    REGEX_SPLIT_LINES,
    RIS_ERROR,
    RisError,
} from '@smart-ris/core';
import { createParseEngine } from './engine/parse.engine.js';
import { buildParsePipeline } from './middlewares/parse.pipeline.js';
import { DEFAULT_PARSE_OPTIONS, MAX_BUFFER_SIZE, type ResolvedParseOptions } from './parse.options.js';
import { resolveParseOptions } from './parse.resolver.js';
import type { ParseOptions } from './parse.types.js';

export type { ParseOptions, ResolvedParseOptions };
export { buildParsePipeline, createParseEngine, DEFAULT_PARSE_OPTIONS, resolveParseOptions };

/** Matches Windows CRLF (\r\n) and legacy Mac CR (\r) line endings. */
const REGEX_NORMALIZE_CRLF = /\r\n|\r/g;

// -------------------------------------------------------------------
// 1. Synchronous Parser (`parse`)
// -------------------------------------------------------------------

/** Parses a RIS string into structured record objects with schema-inferred options. */
export function parse<const TOpts extends ParseOptions = ParseOptions>(
    input: string,
    options?: TOpts,
): ParsedRisRecord<TOpts>[];
/** Parses a RIS string into caller-specified record objects. */
export function parse<TRecord extends Record<string, unknown>>(input: string, options?: ParseOptions): TRecord[];
export function parse(input: string, options?: ParseOptions): Record<string, unknown>[] {
    if (typeof input !== 'string') {
        throw new TypeError(`Input must be a string. Received: ${input === null ? 'null' : typeof input}`);
    }
    const opts = resolveParseOptions(options);
    const middlewares = buildParsePipeline(opts);
    const engine = createParseEngine({ ...opts, middlewares });
    const lines = input.split(REGEX_SPLIT_LINES);
    const results: ParseRisRecord[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === lines.length - 1 && line === '') {
            continue;
        }
        const rec = engine.processLine(line);
        if (rec) {
            results.push(rec);
        }
        if (engine.isAborted) {
            break;
        }
    }

    if (!engine.isAborted) {
        const finalRec = engine.flush();
        if (finalRec) {
            results.push(finalRec);
        }
    }

    return results;
}

// -------------------------------------------------------------------
// 2. Asynchronous Stream Parser (`parseStream`)
// -------------------------------------------------------------------

/** Streams parsed RIS record objects asynchronously line-by-line with schema-inferred options. */
export function parseStream<const TOpts extends ParseOptions = ParseOptions>(
    stream: AsyncIterable<string | Uint8Array>,
    options?: TOpts,
): AsyncGenerator<ParsedRisRecord<TOpts>>;
/** Streams parsed RIS record objects asynchronously line-by-line into caller-specified record objects. */
export function parseStream<TRecord extends Record<string, unknown>>(
    stream: AsyncIterable<string | Uint8Array>,
    options?: ParseOptions,
): AsyncGenerator<TRecord>;
export async function* parseStream(
    stream: AsyncIterable<string | Uint8Array>,
    options?: ParseOptions,
): AsyncGenerator<Record<string, unknown>> {
    const opts = resolveParseOptions(options);
    const middlewares = buildParsePipeline(opts);
    const engine = createParseEngine({ ...opts, middlewares });
    let buffer = '';
    const decoder = new TextDecoder('utf-8');
    let lastCharWasCr = false;

    // INTENTION: stream I/O errors and iterator failures propagate directly to the caller's for-await loop without domain interception.
    for await (const chunk of stream) {
        let strChunk = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
        // empty chunk must not reset CR state between `\r` and `\n`.
        if (strChunk.length === 0) {
            continue;
        }

        if (lastCharWasCr && strChunk.startsWith('\n')) {
            strChunk = strChunk.slice(1);
        }
        lastCharWasCr = strChunk.endsWith('\r');
        strChunk = strChunk.replace(REGEX_NORMALIZE_CRLF, '\n');

        buffer += strChunk;
        let start = 0;
        let newlineIdx = buffer.indexOf('\n', start);
        while (newlineIdx >= 0) {
            const line = buffer.slice(start, newlineIdx);
            start = newlineIdx + 1;
            const rec = engine.processLine(line);
            if (rec) {
                yield rec;
            }
            if (engine.isAborted) {
                break;
            }
            newlineIdx = buffer.indexOf('\n', start);
        }
        buffer = buffer.slice(start);
        if (engine.isAborted) {
            break;
        }
        // limit applies to the unterminated remainder after line splitting; abort like `MAX_RECORD_LINES`, never throw.
        if (buffer.length > MAX_BUFFER_SIZE) {
            emitError(
                { onError: opts.onError, logLevel: opts.logLevel },
                {
                    error: new RisError(ERROR_MESSAGES[RIS_ERROR.LINE_EXCEEDS_MAX_BUFFER_SIZE]),
                    rawLine: buffer.slice(0, 100),
                    tag: null,
                    recordContext: {},
                },
            );
            return;
        }
    }

    if (!engine.isAborted) {
        const finalChunk = decoder.decode();
        if (finalChunk.length > 0) {
            buffer += finalChunk;
        }

        if (buffer.length > 0) {
            const rec = engine.processLine(buffer);
            if (rec) {
                yield rec;
            }
        }

        if (!engine.isAborted) {
            const finalRec = engine.flush();
            if (finalRec) {
                yield finalRec;
            }
        }
    }
}
