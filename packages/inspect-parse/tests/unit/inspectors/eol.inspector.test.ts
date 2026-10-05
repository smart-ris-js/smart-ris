// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import {
    createEolState,
    finalizeEolReport,
    inspectEol,
    inspectEolChunk,
} from '../../../src/inspectors/eol.inspector.js';

describe('inspect-parse - unit > inspectors > eol.inspector.ts', () => {
    describe('Function: inspectEol()', () => {
        it('should detect CRLF (\\r\\n), LF (\\n), and CR (\\r) line endings in input string', () => {
            const report = inspectEol('Line1\r\nLine2\nLine3\rLine4');
            expect(report.styles).toEqual(['\r\n', '\n', '\r']);
        });

        it('should return empty styles array when input has no linebreaks', () => {
            const report = inspectEol('No linebreaks here');
            expect(report.styles).toEqual([]);
        });
    });

    describe('Function: inspectEolChunk() & finalizeEolReport()', () => {
        it('should resolve split \\r\\n across chunk boundaries (\\r at chunk1 end, \\n at chunk2 start)', () => {
            const state = createEolState();
            inspectEolChunk('Line1\r', state);
            expect(state.pendingCr).toBe(true);

            inspectEolChunk('\nLine2', state);
            expect(state.hasCrlf).toBe(true);
            expect(state.pendingCr).toBe(false);

            const report = finalizeEolReport(state);
            expect(report.styles).toEqual(['\r\n']);
        });

        it('should preserve pendingCr when empty chunks arrive between split \\r and \\n', () => {
            const state = createEolState();
            inspectEolChunk('Line1\r', state);
            expect(state.pendingCr).toBe(true);

            // Empty chunks should not clear pendingCr or mark hasCr
            inspectEolChunk('', state);
            expect(state.pendingCr).toBe(true);
            expect(state.hasCr).toBe(false);

            inspectEolChunk('', state);
            expect(state.pendingCr).toBe(true);
            expect(state.hasCr).toBe(false);

            inspectEolChunk('\nLine2', state);
            expect(state.hasCrlf).toBe(true);
            expect(state.hasCr).toBe(false);
            expect(state.pendingCr).toBe(false);

            const report = finalizeEolReport(state);
            expect(report.styles).toEqual(['\r\n']);
        });

        it('should resolve standalone \\r when chunk2 starts with non-newline character', () => {
            const state = createEolState();
            inspectEolChunk('Line1\r', state);
            expect(state.pendingCr).toBe(true);

            inspectEolChunk('Line2', state);
            expect(state.hasCr).toBe(true);
            expect(state.pendingCr).toBe(false);

            const report = finalizeEolReport(state);
            expect(report.styles).toEqual(['\r']);
        });

        it('should finalize pending \\r as CR if stream ends with trailing \\r', () => {
            const state = createEolState();
            inspectEolChunk('Line1\r', state);
            const report = finalizeEolReport(state);
            expect(report.styles).toEqual(['\r']);
        });

        it('should short-circuit loop when all 3 line break styles are already found', () => {
            const state = createEolState();
            inspectEolChunk('Line1\r\nLine2\nLine3\rLine4\r\nLine5\nLine6', state);
            expect(state.hasCrlf).toBe(true);
            expect(state.hasLf).toBe(true);
            expect(state.hasCr).toBe(true);

            // Calling inspectEolChunk again short-circuits immediately via fast-path / all 3 found
            inspectEolChunk('Extra chunk data\n', state);
            const report = finalizeEolReport(state);
            expect(report.styles).toEqual(['\r\n', '\n', '\r']);
        });
    });
});
