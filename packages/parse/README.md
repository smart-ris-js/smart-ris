# @smart-ris/parse
 
> Part of the [smart-ris](../../README.md) monorepo.

Versatile, fault-tolerant RIS (Research Information Systems) format parser and stream processor.

Converts RIS text (string or stream) to JavaScript records. Strict and non-destructive by default, with opt-in pipeline options for tag repair, smart date/number casting, multiline merging, and semantic key mapping.

## Installation

Workspace package (currently `private`, not published). ESM only, Node.js `>=22.12` or Bun `>=1.3`. Depends on `@smart-ris/core`.

## API

| Export | Signature | Notes |
| --- | --- | --- |
| `parse` | `(input: string, options?: ParseOptions) => RisRecord[]` | Throws `TypeError` for non-string input and for invalid options |
| `parseStream` | `(source: AsyncIterable<string \| Uint8Array>, options?: ParseOptions) => AsyncGenerator<RisRecord>` | Decodes `Uint8Array` chunks as UTF-8; errors thrown by `source` propagate |

The return type follows the options (`toSemantic`, `customArrayTags`, `smartCastSchema`, ...) when they are passed as literals.

## Quick Start (Usage)

```ts
import { parse } from '@smart-ris/parse';

const risData = [
    'TY  - JOUR',
    'AU  - Turing, Alan',
    'TI  - Computing Machinery and Intelligence',
    'PY  - 1950',
    'ER  - '
].join('\n');

const records = parse(risData);
console.log(records);
// Output:
// [
//   {
//     TY: 'JOUR',
//     AU: [ 'Turing, Alan' ],
//     TI: 'Computing Machinery and Intelligence',
//     PY: '1950'
//   }
// ]
```

### Asynchronous Streaming

For large datasets or streaming network sources, use `parseStream` to yield parsed RIS record objects asynchronously line-by-line or chunk-by-chunk:

```ts
import { parseStream } from '@smart-ris/parse';

async function* getChunks() {
    yield [
        'TY  - JOUR',
        'TI  - Title 1',
        'ER  - '
    ].join('\n') + '\n';
    yield [
        'TY  - BOOK',
        'TI  - Title 2',
        'ER  - '
    ].join('\n') + '\n';
}

for await (const record of parseStream(getChunks())) {
    console.log(record);
}
// Output:
// { TY: 'JOUR', TI: 'Title 1' }
// { TY: 'BOOK', TI: 'Title 2' }
```

---

## Configuration & Defaults

### Default Configuration

Full option details are listed in the Option Reference below.

```typescript
{
    cleanWhitespace: true,            // Collapse 2+ spaces to 1 & max 1 empty line (\n\n)
    mergeMultiline: false,            // Merge multiline string continuations into single line
    repairTags: false,                // Lax tag extraction & repair (e.g. 'a u' -> 'AU'); strict 'XX  - ' tags only if false
    skipInvalidTags: false,           // Skip non-[A-Z0-9]{2} tags (if false, keeps as INVALIDTAG)
    skipEmptyTags: true,              // Omit empty tag values (if false, keeps as null)
    toSemantic: false,                // Map RIS tags (AU, TI) to semantic keys (author, title)
    customSemanticMap: {},            // Extra custom tag-to-key mappings for toSemantic (e.g. { XX: 'customNote' })
    customArrayTags: [],              // Extra tags to treat as multi-value arrays (e.g. ['U1'])
    arrayMergeStrategy: 'join-space', // Merge array values on scalar tags: 'join-space'|'join-newline'|'first'|'last'|false
    useSmartTypes: false,             // Enable heuristic date string parsing & type casting
    smartCastSchema: {},              // Custom tag type schema for useSmartTypes (e.g. { U1: 'date' })
    tagMapping: {},                   // Tag alias rewrites before pipeline processing (e.g. { A1: 'AU' })
    eol: '\n',                        // Line terminator sequence for multiline content ('\n', '\r\n', '\r')
    dateFormat: 'YYYY-MM-DD',         // Target date format ('YYYY-MM-DD'|'YYYY-MM'|'YYYY/MM/DD'|'YYYY/MM'|'YYYY')
    logLevel: 'error',                // Minimum log level filter ('silent' | 'error' | 'warn' | 'info')
    onError: undefined                // Error/warning callback (e.g. console.log)
}
```

### Custom Options Usage Example

```ts
import { parse } from '@smart-ris/parse';

const risData = [
    'TY  - JOUR',
    'AU  - Alpha, A.',
    'AU  - Beta, B.',
    'TI  - Main Title',
    'PY  - 2026',
    'XX  - Extra info',
    'ER  - '
].join('\n');

const records = parse(risData, {
    toSemantic: true,
    customSemanticMap: { XX: 'customNote' },
    logLevel: 'info',
    onError: (incident) => console.log('[RIS]:', incident.error.message),
});

console.log(records);
// Output:
// [
//   {
//     typeOfReference: 'JOUR',
//     author: [ 'Alpha, A.', 'Beta, B.' ],
//     title: 'Main Title',
//     publicationYear: '2026',
//     customNote: 'Extra info'
//   }
// ]
```

---

### Default Behavior

#### Record Boundaries (TY and ER)

- Missing or empty `TY` tag defaults to `'GEN'` (Generic Reference) once a record is initialized.
- The `ER` tag marks the boundary of a record. Any text on the `ER` tag line is ignored.
- A record starts only at a valid `TY  - ` line. Input without one returns `[]`; tags before the first `TY` are dropped with a `RisWarning`.
- A `TY` tag without a preceding `ER` tag starts a new record implicitly and emits a `RisWarning` (`'Missing ER tag, starting new record implicitly.'`).
- A missing `ER` at the end of the input flushes the pending record (`RisWarning`).

```ts
const risData = [
    'TY  - ',
    'TI  - Some Title',
    'ER  - This value will entirely be ignored'
].join('\n');

const records = parse(risData);
console.log(records);
// Output:
// [
//   {
//     TI: 'Some Title',
//     TY: 'GEN'
//   }
// ]
```

#### String Trimming and Empty Values

All string values are trimmed of leading and trailing whitespace by default.

- Ensures that parsed output is clean and consistent across different line-ending styles.
- When `skipEmptyTags: false` is configured, empty scalar tags are represented as `null`.

```ts
const risData = [
    'TY  - JOUR',
    'TI  -    Some Title   ',
    'AB  - \n   Abstract text with extra spaces.   \n',
    'UR  -   ',
    'ER  - '
].join('\n');

const records = parse(risData, { skipEmptyTags: false });
console.log(records);
// Output:
// [
//   {
//     TY: 'JOUR',
//     TI: 'Some Title',
//     AB: 'Abstract text with extra spaces.',
//     UR: [ null ]
//   }
// ]
```

---

### Option Reference

#### `cleanWhitespace`

If `true`, collapses multiple consecutive spaces (2+ spaces to 1) and for multiline strings limits consecutive empty lines to a maximum of 1 empty line (`\n\n`).

- **Type**: `boolean`
- **Default**: `true`
- Normalizes internal space clusters within strings.
- Preserves structural newlines while stripping excess blank lines beyond 1 empty line.
- Output formatting depends on `mergeMultiline` setting.
- Leading/trailing whitespace and blank lines of a value are always trimmed, also with `cleanWhitespace: false`.

```ts
const risData = [
    'TY  - JOUR',
    'TI  - This   is  a   title\n\n\n\nwith       extra spaces.',
    'ER  - '
].join('\n');

const records = parse(risData, { cleanWhitespace: true });
console.log(records);
// Output:
// [
//   {
//     TY: 'JOUR',
//     TI: 'This is a title\n\nwith extra spaces.'
//   }
// ]
```

#### `mergeMultiline`

If `true`, multi-line string continuations are merged into a single line with spaces.

- **Type**: `boolean`
- **Default**: `false`

```ts
const risData = [
    'TY  - JOUR',
    'TI  - This is a title',
    '  that continues',
    '  on multiple lines.',
    'ER  - '
].join('\n');

const records = parse(risData, { mergeMultiline: true });
console.log(records);
// Output:
// [
//   {
//     TY: 'JOUR',
//     TI: 'This is a title that continues on multiple lines.'
//   }
// ]
```

#### `repairTags`

If `true`, uppercases tag keys and strips non-alphanumeric noise to salvage 2-character RIS tag keys (e.g. `'au'` -> `'AU'`, `'t i'` -> `'TI'`).

- **Type**: `boolean`
- **Default**: `false`
- If `false` (strict), only lines matching `XX  - ` (2 uppercase alphanumerics) start a tag; all other lines inside a record are kept as continuation text.
- Lax extraction can misread prose continuation lines as tags (e.g. `The results  - significant` -> tag `THE RESULTS`); enable only for malformed input.
- Repairs formatting noise while leaving unrepairable tags for `skipInvalidTags` handling.
- Output depends on `skipInvalidTags` and `onError` settings.

```ts
const risData = [
    'TY  - JOUR',
    'au  - Alpha, A.',
    't i  - Some Title',
    'ER  - '
].join('\n');

const records = parse(risData, { repairTags: true });
console.log(records);
// Output:
// [
//   {
//     TY: 'JOUR',
//     AU: [ 'Alpha, A.' ],
//     TI: 'Some Title'
//   }
// ]
```

#### `skipInvalidTags`

If `true`, tags that do not match the 2-character RIS tag format (`[A-Z0-9]{2}`) are omitted.

- **Type**: `boolean`
- **Default**: `false`
- If `false`, invalid tags are kept as uppercase keys (e.g. `'INVALIDTAG'`) in the record.
- Both cases (kept or skipped) trigger `onError` with a `RisWarning`, visible at log level `'warn'` or `'info'`.
- Operates after `repairTags` attempts tag salvaging.
- Only effective with `repairTags: true`; strict extraction yields format-valid tags only.

```ts
const risData = [
    'TY  - JOUR',
    'au  - Alpha, A.',
    'invalidTag  - Unrepairable tag',
    'ER  - '
].join('\n');

const records = parse(risData, { repairTags: true, skipInvalidTags: false });
console.log(records);
// Output:
// [
//   {
//     TY: 'JOUR',
//     AU: [ 'Alpha, A.' ],
//     INVALIDTAG: 'Unrepairable tag'
//   }
// ]
```

#### `skipEmptyTags`

If `true`, tags with empty or whitespace-only values are omitted from the output.

- **Type**: `boolean`
- **Default**: `true`
- If `false`, empty tags are included in the output object with `null` values.
- Applies to scalar tags and array elements.

```ts
const risData = [
    'TY  - JOUR',
    'AU  - Alpha, A.',
    'TI  - ',
    'AB  -    ',
    'ER  - '
].join('\n');

const recordsTrue = parse(risData, { skipEmptyTags: true });
console.log(recordsTrue);
// Output:
// [ { TY: 'JOUR', AU: [ 'Alpha, A.' ] } ]

const recordsFalse = parse(risData, { skipEmptyTags: false });
console.log(recordsFalse);
// Output:
// [
//   {
//     TY: 'JOUR',
//     AU: [ 'Alpha, A.' ],
//     TI: null,
//     AB: null
//   }
// ]
```

#### `toSemantic`

If `true`, translates standard 2-letter RIS tags (`AU`, `TI`, `JF`, `TY`) to human-readable semantic keys (`author`, `title`, `journalFullFormat`, `typeOfReference`).

- **Type**: `boolean`
- **Default**: `false`
- Uses standard RIS semantic field mappings.
- Custom semantic mappings can be added via `customSemanticMap`.

```ts
const risData = [
    'TY  - JOUR',
    'TI  - Some Title',
    'ER  - '
].join('\n');

const records = parse(risData, { toSemantic: true });
console.log(records);
// Output:
// [
//   {
//     typeOfReference: 'JOUR',
//     title: 'Some Title'
//   }
// ]
```

#### `customSemanticMap`

Provides additional custom tag-to-key mappings to extend the `toSemantic` translation map (e.g. `{ XX: 'customNote' }`).

- **Type**: `Partial<Record<ContentRisTag, string>>`
- **Default**: `{}`
- Requires `toSemantic: true` to be active.
- Maps RIS tags directly to custom property names on the output object.

```ts
const risData = [
    'TY  - JOUR',
    'AU  - Alpha, A.',
    'AU  - Beta, B.',
    'TI  - Some Title',
    'PY  - 2026',
    'XX  - Extra info',
    'ER  - '
].join('\n');

const records = parse(risData, {
    toSemantic: true,
    customSemanticMap: { XX: 'customNote' }
});
console.log(records);
// Output:
// [
//   {
//     typeOfReference: 'JOUR',
//     author: [ 'Alpha, A.', 'Beta, B.' ],
//     title: 'Some Title',
//     publicationYear: '2026',
//     customNote: 'Extra info'
//   }
// ]
```

#### `customArrayTags`

Defines extra RIS tags to treat as multi-value array tags, returning values as string arrays (`['Value 1', 'Value 2']`).

- **Type**: `ContentRisTag[]`
- **Default**: `[]`
- Standard array tags like `AU`, `A1`, `A2`, `KW`, `UR` are supported natively.
- Extends array output capabilities to custom or non-standard tags.

```ts
const risData = [
    'TY  - JOUR',
    'AU  - Alpha, A.',
    'AU  - Beta, B.',
    'U1  - Custom 1',
    'U1  - Custom 2',
    'ER  - '
].join('\n');

const records = parse(risData, { customArrayTags: ['U1'] });
console.log(records);
// Output:
// [
//   {
//     TY: 'JOUR',
//     AU: [ 'Alpha, A.', 'Beta, B.' ],
//     U1: [ 'Custom 1', 'Custom 2' ]
//   }
// ]
```

#### `arrayMergeStrategy`

Defines how multiple entries for non-array scalar tags are merged (e.g. merging multiple `TI` tag lines).

- **Type**: `'join-space' | 'join-newline' | 'first' | 'last' | false`
- **Default**: `'join-space'`
- `'join-space'`: joins elements with a single space.
- `'join-newline'`: joins elements with line terminators.
- `'first'` / `'last'`: selects only the initial or trailing array element.
- `false`: disables array merging entirely.

```ts
const risData = [
    'TY  - JOUR',
    'TI  - Title 1',
    'TI  - Title 2',
    'ER  - '
].join('\n');

const recordsSpace = parse(risData, { arrayMergeStrategy: 'join-space' });
console.log(recordsSpace);
// Output:
// [ { TY: 'JOUR', TI: 'Title 1 Title 2' } ]

const recordsFirst = parse(risData, { arrayMergeStrategy: 'first' });
console.log(recordsFirst);
// Output:
// [ { TY: 'JOUR', TI: 'Title 1' } ]
```

#### `useSmartTypes`

Enables heuristic parsing of date strings into standardized ISO representations (e.g. `'Jan 15 2026'` -> `'2026-01-15'`, `'2026.10'` -> `'2026-10'`).

- **Type**: `boolean`
- **Default**: `false`
- Automatically parses date strings assigned to standard date tags (`PY`, `Y1`, `DA`, `Y2`).
- Year-less dates (e.g. `'15 Jan'`) in `DA` and `Y1` take the year from `PY`, then `Y1` (also under `toSemantic` keys). Other date tags keep the raw string when the year is missing.
- Values that cannot be cast keep the original string.
- Output is always a string, never a `Date` object.
- Respects output formatting specified by `dateFormat`.

```ts
const risData = [
    'TY  - JOUR',
    'DA  - Jan 15 2026',
    'PY  - 2026.10',
    'ER  - '
].join('\n');

const records = parse(risData, { useSmartTypes: true });
console.log(records);
// Output:
// [
//   {
//     TY: 'JOUR',
//     DA: '2026-01-15',
//     PY: '2026-10'
//   }
// ]
```

#### `smartCastSchema`

Defines which tags are treated as target types for heuristic casting when `useSmartTypes: true` is enabled (e.g. `{ U1: 'date' }`). Standard date tags (`PY`, `Y1`, `DA`, `Y2`) and numeric tags (`VL`, `NV`, `SV`, `IS`, `M1`, `SE`) are included by default.

- **Type**: `Partial<Record<ContentRisTag, CastType>>`
- **Default**: `{}`
- Requires `useSmartTypes: true` to take effect on custom tags.
- Allows custom tags to leverage automatic type casting.
- `number` casts only plain decimals (e.g. `12`, `-3.5`); hex/binary/octal (`0x10`), exponents (`1e3`), `Infinity` and values beyond exact double precision stay strings.

```ts
const risData = [
    'TY  - JOUR',
    'U1  - January 15, 2026',
    'ER  - '
].join('\n');

const records = parse(risData, {
    useSmartTypes: true,
    smartCastSchema: { U1: 'date' }
});
console.log(records);
// Output:
// [
//   {
//     TY: 'JOUR',
//     U1: '2026-01-15'
//   }
// ]
```

#### `tagMapping`

Maps tag aliases or legacy tag keys to target RIS tags before pipeline execution (e.g. `{ A1: 'AU' }`).

- **Type**: `Partial<Record<ContentRisTag, ContentRisTag>>`
- **Default**: `{}`
- Rewrites input tag keys before final structuring and sorting.
- Supports merging legacy tag variations into standardized RIS tags.
- Mapped values behave exactly like the target tag: they use its `smartCastSchema` cast type, date fallback year and year supplier role; casts of source tags are ignored.

```ts
const risData = [
    'TY  - JOUR',
    'A1  - Alpha, A.',
    'A2  - Beta, B.',
    'ER  - '
].join('\n');

const records = parse(risData, { tagMapping: { A1: 'AU', A2: 'AU' } });
console.log(records);
// Output:
// [
//   {
//     TY: 'JOUR',
//     AU: [ 'Alpha, A.', 'Beta, B.' ]
//   }
// ]
```

#### `eol`

Line-ending sequence (`'\n'`, `'\r\n'`, or `'\r'`) to use when preserving multiline continuations.

- **Type**: `'\n' | '\r\n' | '\r'`
- **Default**: `'\n'`
- Sets line break sequence when `mergeMultiline: false` and `cleanWhitespace: false`.

```ts
const risData = [
    'TY  - JOUR',
    'AB  - Line 1',
    '  Line 2',
    'ER  - '
].join('\n');

const records = parse(risData, { eol: '\r\n', cleanWhitespace: false });
console.log(records);
// Output:
// [
//   {
//     TY: 'JOUR',
//     AB: 'Line 1\r\n  Line 2'
//   }
// ]
```

#### `dateFormat`

Target format string for date output when `useSmartTypes: true`. Supported formats: `'YYYY-MM-DD'`, `'YYYY-MM'`, `'YYYY/MM/DD'`, `'YYYY/MM'`, `'YYYY'`.

- **Type**: `DateFormatType`
- **Default**: `'YYYY-MM-DD'`
- Controls serialization format for parsed date strings.
- Defaults to ISO standard date representation (`YYYY-MM-DD`).

```ts
const risData = [
    'TY  - JOUR',
    'PY  - 2026-01-15',
    'ER  - '
].join('\n');

const records = parse(risData, { useSmartTypes: true, dateFormat: 'YYYY-MM' });
console.log(records);
// Output:
// [
//   {
//     TY: 'JOUR',
//     PY: '2026-01'
//   }
// ]
```

#### `logLevel`

Filters the incidents sent to `onError` by severity.

- **Type**: `'silent' | 'error' | 'warn' | 'info'`
- **Default**: `'error'`

- `'error'`: dispatches `RisError` instances only (record line limit, stream buffer limit, unsupported format). Most data problems are warnings and are not dispatched at this level.
- `'warn'`: dispatches both `RisError` and `RisWarning` instances (e.g., content outside record, skipped invalid tags).
- `'info'`: dispatches `RisError`, `RisWarning`, and `RisInfo` instances (e.g., diagnostic formatting and repair notices).
- `'silent'`: suppresses all error, warning, and info callbacks.

```ts
const risData = [
    'TY  - JOUR',
    'TI  - Title 1',
    'TY  - BOOK',
    'TI  - Title 2',
    'ER  - '
].join('\n');

const records = parse(risData, {
    logLevel: 'warn',
    onError: (incident) => console.log(incident.error.name, incident.error.message)
});
console.log(records);
// Output:
// RisWarning Missing ER tag, starting new record implicitly.
// [
//   { TY: 'JOUR', TI: 'Title 1' },
//   { TY: 'BOOK', TI: 'Title 2' }
// ]
```

#### `onError`

Callback for incidents at or above `logLevel` (e.g. `(incident) => console.log(incident.error.message)`).

- **Type**: `(incident: RisErrorContext) => void`
- **Default**: `undefined`
- Receives a `RisErrorContext`, not the error itself: `{ error, rawLine, lineNumber, tag, recordContext }`. `error` is a `RisError`, `RisWarning` or `RisInfo` with `code`, `message` and numeric `severity`.
- Allows custom error logging, aggregation, or diagnostic monitoring.

```ts
const risData = [
    'TY  - JOUR',
    'TI  - Title 1',
    'TY  - BOOK',
    'TI  - Title 2',
    'ER  - '
].join('\n');

const errors: string[] = [];
const records = parse(risData, {
    logLevel: 'warn',
    onError: (incident) => errors.push(incident.error.message)
});

console.log('Errors:', errors);
console.log(records);
// Output:
// Errors: [ 'Missing ER tag, starting new record implicitly.' ]
// [
//   { TY: 'JOUR', TI: 'Title 1' },
//   { TY: 'BOOK', TI: 'Title 2' }
// ]
```

---

## Limits and Edge Cases

- **Record line limit**: a record with more than 1,000 lines emits `RECORD_EXCEEDS_MAX_LINES` (`RisError`) and aborts parsing. Records already returned or yielded stay valid; everything after is lost. Nothing is thrown.
- **Stream line limit**: in `parseStream`, an unterminated line longer than 10 MiB emits `LINE_EXCEEDS_MAX_BUFFER_SIZE` (`RisError`) and aborts.
- **Strict tags**: with `repairTags: false`, malformed tag lines (`au  - x`, `TY - JOUR`) inside a record become continuation text of the previous tag without a diagnostic. Use `inspectParse` from `@smart-ris/inspect-parse` to find them.
- **Line endings**: LF, CRLF and CR are accepted, also mixed. Multiline values use `eol`.
- **UTF-8 Byte Order Mark (BOM)**: Automatically detects and strips invisible `\uFEFF` markers at the start of input data streams without corrupting the initial `TY` tag.
- **Stream Boundary Safety**: When parsing asynchronous streams via `parseStream`, stateful chunk buffers properly handle line breaks split across chunk boundaries (such as a `\r\n` sequence cut between `\r` at the end of chunk 1 and `\n` at the start of chunk 2).

## Testing

Unit tests mirror `src/` in `tests/unit/`. Scenario tests in `tests/scenarios/` run edge-case snippets (null bytes, backtracking vectors, missing `ER`, trailing spaces) against combinations of options.
