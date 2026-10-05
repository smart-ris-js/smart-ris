// Copyright 2026 Martin Winkler

import type { Middleware } from '../core.types.js';

/** Executes synchronous middleware pipeline sequentially over a payload record. */
export function executePipeline<TInput = unknown, TOutput = unknown>(
    payload: TInput,
    middlewares: readonly Middleware[],
): TOutput {
    // INTENTION: mutable accumulator holding intermediate payload across pipeline stages.
    let currentPayload: unknown = payload;

    for (let i = 0; i < middlewares.length; i++) {
        currentPayload = (middlewares[i] as (p: unknown) => unknown)(currentPayload);
    }

    return currentPayload as TOutput;
}
