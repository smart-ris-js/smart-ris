// Copyright 2026 Martin Winkler

import type { EolType } from '@smart-ris/core';
import type { EolReport } from '../inspect-parse.types.js';

/** State tracker for chunked line ending evaluation. */
export type EolState = {
    hasCrlf: boolean;
    hasLf: boolean;
    hasCr: boolean;
    pendingCr: boolean;
};

/** State tracker initialization for chunked line ending evaluation. */
export function createEolState(): EolState {
    return {
        hasCrlf: false,
        hasLf: false,
        hasCr: false,
        pendingCr: false,
    };
}

/** Inspects an individual string chunk to detect and track line ending styles across stream boundaries. */
export function inspectEolChunk(chunk: string, state: EolState): void {
    if (chunk.length === 0) {
        return;
    }

    const hasCrInChunk = chunk.includes('\r');
    const hasLfInChunk = chunk.includes('\n');

    // INTENTION: early skip if no linebreaks and no pending.
    if (!hasCrInChunk && !hasLfInChunk && !state.pendingCr) {
        return;
    }

    let i = 0;

    // INVARIANT: pendingCr disambiguates CRLF split across chunk boundaries from standalone CR.
    if (state.pendingCr) {
        state.pendingCr = false;
        if (chunk.startsWith('\n')) {
            state.hasCrlf = true;
            i = 1;
        } else {
            state.hasCr = true;
        }
    }

    while (i < chunk.length) {
        // INTENTION: early skip if all EOL types have already been detected.
        if (state.hasCrlf && state.hasLf && state.hasCr) {
            break;
        }

        const char = chunk[i];
        if (char === '\r') {
            if (i + 1 < chunk.length) {
                if (chunk[i + 1] === '\n') {
                    state.hasCrlf = true;
                    i += 2;
                    continue;
                }
                state.hasCr = true;
            } else {
                state.pendingCr = true;
            }
        } else if (char === '\n') {
            state.hasLf = true;
        }
        i++;
    }
}

/** Resolves tracked line ending state and pending carriage returns into a final style report. */
export function finalizeEolReport(state: EolState): EolReport {
    if (state.pendingCr) {
        state.hasCr = true;
        state.pendingCr = false;
    }

    const styles: EolType[] = [];
    if (state.hasCrlf) {
        styles.push('\r\n');
    }
    if (state.hasLf) {
        styles.push('\n');
    }
    if (state.hasCr) {
        styles.push('\r');
    }

    return { styles };
}

/** Analyzes raw input string for line break style. */
export function inspectEol(input: string): EolReport {
    const state = createEolState();
    inspectEolChunk(input, state);
    return finalizeEolReport(state);
}
