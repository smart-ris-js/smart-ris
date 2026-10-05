// Copyright 2026 Martin Winkler

import {
    ERROR_MESSAGES,
    emitError,
    LOG_LEVEL,
    type LogLevelValue,
    RIS_ERROR,
    type RisErrorContext,
} from '@smart-ris/core';
import {
    type ParseOptions,
    parse,
    parseStream,
    type ResolvedParseOptions,
    resolveParseOptions,
} from '@smart-ris/parse';
import { createInitialReport, inspectRecord } from './inspect-parse.engine.js';
import type { AnomalySeverity, ParseInspectionReport } from './inspect-parse.types.js';
import { createEolState, finalizeEolReport, inspectEol, inspectEolChunk } from './inspectors/eol.inspector.js';
import { inspectTagKeyFormat } from './inspectors/tag-format.inspector.js';

export { formatInspectionReport } from './inspect-parse.formatter.js';
export * from './inspect-parse.types.js';

/**
 * **Hardcoded, non-destructive forensic configuration**.
 *
 * Disables array merging (`arrayMergeStrategy: false`) so raw tag arrays are returned unmerged.
 * Uses `logLevel: 'info'` to receive diagnostic RisInfo messages alongside errors and warnings.
 * `repairTags` is not fixed; it follows the caller's option (see `createForensicConfig`).
 */
const FORENSIC_CONFIG = {
    cleanWhitespace: false,
    mergeMultiline: false,
    arrayMergeStrategy: false,
    skipEmptyTags: false,
    skipInvalidTags: false,
    toSemantic: false,
    useSmartTypes: false,
    logLevel: 'info',
} as const;

/** Synchronously inspects RIS content and compiles a forensic anomaly report. */
export function inspectParse(input: string, options?: ParseOptions): ParseInspectionReport {
    const resolvedOptions = resolveParseOptions(options);
    const report = createInitialReport();
    report.eol = inspectEol(input);

    const config = createForensicConfig(report, resolvedOptions, options?.repairTags ?? true);

    const records = parse(input, config);

    // route every object through the shared inspection loop.
    for (let i = 0; i < records.length; i++) {
        inspectRecord(records[i], report, resolvedOptions);
    }

    report.totalRecords = records.length;
    return report;
}

/** Asynchronously streams and inspects RIS content and compiles a forensic anomaly report. */
export async function inspectParseStream(
    stream: AsyncIterable<string | Uint8Array>,
    options?: ParseOptions,
): Promise<ParseInspectionReport> {
    const resolvedOptions = resolveParseOptions(options);
    const report = createInitialReport();

    const config = createForensicConfig(report, resolvedOptions, options?.repairTags ?? true);

    // `parseStream` returns an AsyncGenerator over the tapped stream.
    const generator = parseStream(tapStreamAndInspectEol(stream, report), config);

    // yields memory-efficient records one at a time as chunks are processed.
    try {
        for await (const record of generator) {
            inspectRecord(record, report, resolvedOptions);
            report.totalRecords++;
        }
    } catch (error) {
        // failing source stream: keep the partial report, like a parser abort.
        report.anomalies.push({
            type: 'parse_diagnostic',
            severity: 'error',
            message: `Stream aborted: ${error instanceof Error ? error.message : String(error)}`,
        });
        report.totalAnomalies++;
    }

    return report;
}

// -------------------------------------------------------------------
// 1. Internal Helper Functions
// -------------------------------------------------------------------

/** Maps the numeric severity of a parser incident to its log level name. */
function toAnomalySeverity(severity: LogLevelValue): AnomalySeverity {
    if (severity === LOG_LEVEL.error) {
        return 'error';
    }
    return severity === LOG_LEVEL.warn ? 'warn' : 'info';
}

/**
 * **Creates parser configuration attaching the forensic anomaly collector**.
 *
 * - Incidents are forwarded to the caller's `onError` filtered by its `logLevel`.
 * - `repairTags` defaults to `true` so lax/malformed tag lines are extracted and reported.
 * - An explicit `false` reads tag lines like `parse()` does.
 */
function createForensicConfig(report: ParseInspectionReport, options: ResolvedParseOptions, repairTags: boolean) {
    return {
        ...FORENSIC_CONFIG,
        repairTags,
        onError: (incident: RisErrorContext) => {
            emitError(options, incident);
            // INTENTION: retained invalid tags are reported per occurrence as `invalid_tag_format` with source line.
            // repaired tags carry the original key; reported as repairable `invalid_tag_format`.
            if (
                (incident.error.message === ERROR_MESSAGES[RIS_ERROR.INVALID_TAG_FORMAT_BASE] ||
                    incident.error.message === 'Tag key repaired') &&
                incident.tag
            ) {
                inspectTagKeyFormat(
                    incident.tag,
                    report,
                    toAnomalySeverity(incident.error.severity),
                    incident.rawLine,
                    incident.lineNumber ?? undefined,
                );
                return;
            }
            report.anomalies.push({
                type: 'parse_diagnostic',
                severity: toAnomalySeverity(incident.error.severity),
                message: incident.error.message,
                rawLine: incident.rawLine,
                rawTag: incident.tag ?? undefined,
                lineNumber: incident.lineNumber ?? undefined,
            });
            report.totalAnomalies++;
        },
    };
}

/** Taps into an asynchronous chunk stream to evaluate line ending styles on the fly without consuming payload. */
async function* tapStreamAndInspectEol(
    stream: AsyncIterable<string | Uint8Array>,
    report: ParseInspectionReport,
): AsyncIterable<string | Uint8Array> {
    const decoder = new TextDecoder('utf-8');
    const state = createEolState();

    let completed = false;
    // `finally` also runs when parseStream aborts early and calls `return()` on this generator.
    try {
        for await (const chunk of stream) {
            const str = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
            inspectEolChunk(str, state);
            yield chunk;
        }
        completed = true;
    } finally {
        // INTENTION: terminal TextDecoder flush to process any trailing multi-byte characters and preserve state consistency.
        const remaining = decoder.decode();
        if (remaining.length > 0) {
            inspectEolChunk(remaining, state);
        }

        // trailing `\r` of an aborted stream may belong to an unread `\r\n`.
        if (!completed) {
            state.pendingCr = false;
        }

        report.eol = finalizeEolReport(state);
    }
}
