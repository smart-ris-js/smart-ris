# @smart-ris/inspect-parse
 
> Part of the [smart-ris](../../README.md) monorepo.

Non-destructive forensic inspection and diagnostic anomaly reporting engine for RIS (Research Information Systems) format files.

Analyzes data quality metrics, tag occurrences, line ending conventions, formatting defects, and type cast rates without mutating input data.

## Installation

Workspace package of this monorepo (`private`, not published to npm). See the [root README](../../README.md#requirements-and-installation).

## API

| Function | Signature |
| --- | --- |
| `inspectParse` | `(input: string, options?: ParseOptions) => ParseInspectionReport` |
| `inspectParseStream` | `(stream: AsyncIterable<string \| Uint8Array>, options?: ParseOptions) => Promise<ParseInspectionReport>` |
| `formatInspectionReport` | `(report: ParseInspectionReport) => string` |

The stream variant collects the full report before resolving; it does not yield partial results. The report always records every incident as an anomaly. A passed `onError` additionally receives the parser incidents, filtered by the passed `logLevel`.

## Quick Start

### Synchronous Inspection

Analyze a complete RIS text string in memory using `inspectParse`:

```ts
import { inspectParse, formatInspectionReport } from '@smart-ris/inspect-parse';

const risData = `
TY  - JOUR
AU  - Shannon, Claude E.
TI  - A Mathematical Theory of Communication
PY  - 1948
DA  - 1948/07/01
KW  - Information Theory
ER  - 
`;

const report = inspectParse(risData);

console.log(`Total Records: ${report.totalRecords}`);
console.log(`Total Anomalies: ${report.totalAnomalies}`);
console.log(`EOL Styles: ${report.eol.styles.join(', ')}`);

// Print formatted diagnostic report
console.log(formatInspectionReport(report));
```

---

### Asynchronous Streaming

Inspect large files or network streams chunk-by-chunk with minimal memory overhead using `inspectParseStream`:

```ts
import { inspectParseStream, formatInspectionReport } from '@smart-ris/inspect-parse';
import { createReadStream } from 'node:fs';

const fileStream = createReadStream('large-dataset.ris', { encoding: 'utf-8' });
const report = await inspectParseStream(fileStream);

console.log(formatInspectionReport(report));
```

---

## Formatted Reports

### Human-Readable Text Report

`formatInspectionReport(report)` renders a compact overview instead of one line per finding:

1. **Status**: 🟢 clean, 🔵 notices only, 🟡 warnings, 🟠 findings to verify, 🔴 parsing aborted (the report is partial).
2. **Anomalies**: grouped by severity and message with counts, `info` first and `error` last. Invalid tag keys are grouped by repairability and list each key (with its repair target) and count.
3. **Tags**: one line per tag, sorted by entry count, with class (`standard`, `custom`, `unknown`), entry count, non-zero quality counters, cast verdicts and date precision.
4. **Overview**: aggregates across all tags, such as entries per record, EOL styles (mixed styles are flagged), anomalies per severity, tag classes, quality counters, cast success rates and date precision.
5. **Verify**: the exact cases worth checking in the source: parser aborts and unrepairable tag keys (with line numbers and a raw line sample), tags with cast failures, and inputs without records.

```ts
import { inspectParse, formatInspectionReport } from '@smart-ris/inspect-parse';

const report = inspectParse(risContent);
const textOutput = formatInspectionReport(report);

console.log(textOutput);
```

Example output:
```text
RIS Parse Inspection Report
===========================
Status          🟠 4 findings to verify

Anomalies
---------------------------
🟡 warn   2  Invalid tag keys, not repairable: CUSTOMTAG ×1, BROKENTAGNAME ×1
🟡 warn   1  Content found outside of record.

Tags
---------------------------
AU             standard  5  1 repeated
PY             standard  4  date cast 3/4 · 3 year only
TI             standard  4
TY             standard  4
KW             standard  3  1 empty · 1 repeated
DA             standard  2  date cast 1/2 · 1 full
AB             standard  1  1 empty
BROKENTAGNAME  unknown   1
CUSTOMTAG      unknown   1
EP             standard  1
IS             standard  1  type cast 1/1
JO             standard  1
N1             standard  1  1 multiline
PB             standard  1
SP             standard  1
UR             standard  1
VL             standard  1  type cast 1/1

Overview
---------------------------
Records         4 · 8.3 entries per record
EOL             \n
Anomalies       3 · 🟡 3 warn
Tags            17 distinct · 15 standard · 2 unknown (BROKENTAGNAME, CUSTOMTAG)
Entries         33 · 2 empty · 1 multiline · 2 repeated
Date casts      🔴 █████████████░░░░░░░  66%  4/6
Type casts      🟢 ████████████████████ 100%  2/2
Date precision  1 full · 3 year only

Verify
---------------------------
🟠 Tag key 'CUSTOMTAG' is invalid and not repairable (1×), line 22
     "CUSTOMTAG  - Non standard tag content"
🟠 Tag key 'BROKENTAGNAME' is invalid and not repairable (1×), line 33
     "BROKENTAGNAME  - Malformed key entry"
🟠 PY: 1 of 4 date values failed to cast
🟠 DA: 1 of 2 date values failed to cast
```

Cast rate colors: 🟢 100 %, 🟡 at least 80 %, 🔴 below 80 %. Lists are capped at 5 items with a `(+N more)` suffix.

---

## Report Structure

The `ParseInspectionReport` object contains four key diagnostic dimensions:

```ts
type ParseInspectionReport = {
    totalRecords: number;
    totalAnomalies: number;
    eol: EolReport;
    anomalies: Anomaly[];
    tags: Record<string, TagStats>;
}
```

### 1. Tag Statistics (`TagStats`)

Tracks data quality metrics for every encountered tag:

- **`count`**: Total occurrences of the tag across all records.
- **`emptyCount`**: Number of times the tag was present with an empty value.
- **`multilineCount`**: Occurrences where tag values spanned multiple lines.
- **`whitespacePaddedCount`**: Occurrences with leading/trailing whitespace padding.
- **`multipleInternalSpacesCount`**: Values with consecutive redundant internal spaces.
- **`excessiveLinebreaksCount`**: Values containing consecutive linebreaks.
- **`multipleOccurrencesCount`**: Records containing multiple entries for this tag.
- **`isStandard` / `isCustom` / `isUnknown`**: Tag specification categorization.
- **`canBeRepaired`**: Whether an invalid tag key could be repaired to a valid 2-character tag.
- **`castSuccessCount` / `castFailureCount`**: Cast verdicts for tags in `smartCastSchema` (number, boolean, date, string).
- **`dateCastSuccessCount` / `dateCastFailureCount`**: Cast verdicts for date tags; a date without resolvable year is a failure.
- **`datePrecision`**: Distribution breakdown (`fullDateCount`, `yearMonthCount`, `yearOnlyCount`, `monthOnlyCount`); year-less dates resolved via the `PY`/`Y1` fallback year count by their resolved precision.

Cast verdicts mirror `parse()` with `useSmartTypes: true` for the passed options: values are evaluated after `tagMapping`, `arrayMergeStrategy` merging and whitespace sanitizing, and attributed to the raw tag the value came from.

### 2. Line Ending Summary (`EolReport`)

Identifies the line break styles detected in the input:
- `\n` (LF)
- `\r\n` (CRLF)
- `\r` (CR)

Detects mixed line endings across legacy or cross-platform datasets.

### 3. Anomalies (`Anomaly`)

Diagnostic incidents identified during ingestion:
- **`parse_diagnostic`**: Parser diagnostics (e.g. content outside records, normalized lowercase tags or lax spacing, record line limit exceeded) with line number and raw line. A source stream that throws during `inspectParseStream` ends with a `parse_diagnostic` of severity `error`.
- **`invalid_tag_format`**: Tag keys violating specification structure (not `[A-Z0-9]{2}`), one per occurrence with line number and raw line; `isRepairable` tells whether `repairTags` can fix the key.

Every anomaly carries a `severity` (`'info' | 'warn' | 'error'`) taken from the parser incident class (`RisInfo`, `RisWarning`, `RisError`):

| Severity | Examples |
| --- | --- |
| `info` | lowercase tag normalized, lax spacing normalized, tag key repaired |
| `warn` | content outside of record, invalid tag format |
| `error` | record exceeds maximum lines, unsupported format, stream aborted |

---

## Options Passthrough

Both `inspectParse` and `inspectParseStream` accept standard `ParseOptions` from `@smart-ris/parse` as an optional second parameter. The input itself is always read with a fixed forensic configuration (invalid and empty tags kept, no merging); the passed options drive classification and cast verdicts, so you can test how a parser configuration (such as `tagMapping`, `smartCastSchema` or `arrayMergeStrategy`) interacts with your data:

```ts
import { inspectParse } from '@smart-ris/inspect-parse';

const report = inspectParse(risContent, {
    arrayMergeStrategy: 'first',
    smartCastSchema: { C1: 'number' },
    tagMapping: {
        Z1: 'PY',
    },
});
```

### `repairTags`

`repairTags` is the only option that changes how lines are read, so it is passed through to the parser. It defaults to `true` here (unlike `parse()`), so lax and malformed tag lines are extracted and reported as `invalid_tag_format`. With `repairTags: false`, those lines become continuation text of the previous tag, exactly as `parse()` reads them by default. Run both to compare:

```ts
const repaired = inspectParse(risContent);
const strict = inspectParse(risContent, { repairTags: false });
```

---

## License

[Apache-2.0](LICENSE) © 2026 Martin Winkler
