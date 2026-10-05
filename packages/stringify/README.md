# @smart-ris/stringify
 
> Part of the [smart-ris](../../README.md) monorepo.

Versatile, specification-compliant RIS (Research Information Systems) format stringifier and stream serializer.

Converts JavaScript records into formatted RIS text (string or stream). Specification-compliant by default, with opt-in options for tag repair, heuristic date parsing, multiline merging, and semantic key mapping.

## Installation

Workspace package of this monorepo (`private`, not published to npm). See the [root README](../../README.md#requirements-and-installation).

## API

| Function | Signature |
| --- | --- |
| `stringify` | `(input: StringifyInput \| StringifyInput[], options?: StringifyOptions) => string` |
| `stringifyStream` | `(stream: AsyncIterable<StringifyInput>, options?: StringifyOptions) => AsyncGenerator<string>` |

`StringifyInput` is a plain record object or a `RisBuilder` from `@smart-ris/core`. Supported value types: `string`, `number`, `boolean`, `Date`, `RawDate`, `RisDate`, `null` and arrays of these. Other objects are dropped with a `RisError` ("Unsupported object type passed as value").

## Quick Start (Usage)

```ts
import { stringify, stringifyStream } from '@smart-ris/stringify';

const records = [
    {
        TY: 'JOUR',
        AU: ['Alpha, A.', 'Beta, B.'],
        TI: 'Some Title',
        PY: '2026-01'
    }
];

const risData = stringify(records);
console.log(risData);
// Output:
// TY  - JOUR
// AU  - Alpha, A.
// AU  - Beta, B.
// TI  - Some Title
// PY  - 2026-01
// ER  - 
```

### Asynchronous Streaming

For large datasets, use `stringifyStream` to generate RIS output chunks iteratively:

```ts
import { stringifyStream } from '@smart-ris/stringify';

async function* getRecords() {
    yield { TY: 'JOUR', TI: 'Title 1' };
    yield { TY: 'BOOK', TI: 'Title 2' };
}

for await (const chunk of stringifyStream(getRecords())) {
    process.stdout.write(chunk);
}
```

---

## Configuration & Defaults

### Default Configuration

Full option details are listed in the Option Reference below.

```typescript
{
    cleanWhitespace: true,            // Collapse 2+ spaces to 1 & max 1 empty line (\n\n)
    mergeMultiline: false,            // Merge multiline strings to single line
    repairTags: true,                 // Strip non-alphanumeric noise (e.g. 'A-U' -> 'AU')
    skipInvalidTags: false,           // Skip non-[A-Z0-9]{2} tags
    skipEmptyTags: true,              // Omit null/undefined/empty ('', ' ') tags
    fromSemantic: false,              // Map semantic keys (author, title) to RIS tags (AU, TI)
    customSemanticMap: {},            // Extra custom key mappings for fromSemantic (e.g. { N1: 'customNote' })
    customArrayTags: [],              // Extra tags allowed to emit multiple lines (e.g. ['U1'])
    arrayMergeStrategy: 'join-space', // Merge array values on scalar tags: 'join-space'|'join-newline'|'first'|'last'|false
    useSmartTypes: false,             // Enable heuristic parsing for date strings & cross-tag enrichment
    smartCastSchema: {},              // Custom tag type schema (e.g. { U1: 'date' })
    tagMapping: {},                   // Tag alias rewrites (e.g. { A1: 'AU' })
    eol: '\n',                        // Line terminator ('\n', '\r\n', '\r')
    dateFormat: 'YYYY-MM-DD',         // Date format ('YYYY-MM-DD'|'YYYY-MM'|'YYYY/MM/DD'|'YYYY/MM'|'YYYY')
    logLevel: 'error',                // Minimum log level filter ('silent' | 'error' | 'warn' | 'info')
    onError: undefined                // Error/warning callback (e.g. console.log)
}
```

### Custom Options Usage Example

```ts
import { stringify } from '@smart-ris/stringify';

const records = [
    {
        typeOfReference: 'JOUR',
        author: ['Alpha, A.', 'Beta, B.'],
        title: 'Main Title',
        publicationYear: 2026,
        customNote: 'Extra info'
    }
];

const risData = stringify(records, {
    fromSemantic: true,
    customSemanticMap: { N1: 'customNote' },
    eol: '\r\n',
    logLevel: 'info',
    onError: (incident) => console.log('[RIS]:', incident.error.message),
});

console.log(risData);
// Output (CRLF line endings - \r\n):
// TY  - JOUR
// AU  - Alpha, A.
// AU  - Beta, B.
// TI  - Main Title
// PY  - 2026
// N1  - Extra info
// ER  - 
```

---

### Default Behavior

#### Record Boundaries (TY and ER)

- Missing or empty `TY` tag defaults to `'GEN'` (Generic Reference).
- The `ER` tag is always appended at the end of each record.
- Input record `ER` tags and values are always ignored.
- Both cases are reported as `RisWarning` (visible with `logLevel: 'warn'`): "Missing TY tag." and "Data provided for ER tag is ignored".
- The `TY` value is written as given; it is not validated against the reference type list.

```ts
const record = {
    TI: 'Some Title',
    ER: 'This value will entirely be ignored'
};
const risData = stringify(record);
console.log(risData);
// Output:
// TY  - GEN
// TI  - Some Title
// ER  - 

```

#### String Trimming and Empty Values

All string values are trimmed of leading and trailing whitespace by default.

- Ensures that the output is valid and consistent.
- Ensures that intentionally kept empty tags are preserved without noise.

```ts
const record = {
    TY: 'JOUR',
    TI: '   Some Title   ',
    AB: '\n   \n  Abstract text with extra spaces.   \n  \n',
    UR: '  '
};
const risData = stringify(record, { skipEmptyTags: false });
console.log(risData);
// Output:
// TY  - JOUR
// TI  - Some Title
// AB  - Abstract text with extra spaces.
// UR  - 
// ER  - 
```

---

### Option Reference

#### `cleanWhitespace`

If `true`, collapses multiple consecutive spaces (2+ spaces to 1) and for multiline strings limits consecutive empty lines to a maximum of 1 empty line (`\n\n`).

- **Type**: `boolean`
- **Default**: `true`
- normalizes internal space clusters within strings.
- preserves structural newlines while stripping excess blank lines beyond 1 empty line.
- output depends on `mergeMultiline` setting.
- leading/trailing whitespace and blank lines of a value are always trimmed, also with `cleanWhitespace: false`.

```ts
const record = {
    TY: 'JOUR',
    TI: 'This   is  a   title\n\n\n\nwith       extra spaces.'
};

const risData = stringify(record, { cleanWhitespace: true });
console.log(risData);
// Output:
// TY  - JOUR
// TI  - This is a title
// 
// with extra spaces.
// ER  - 
```

#### `mergeMultiline`

If `true`, multi-line string continuations are merged into a single line with spaces.

- **Type**: `boolean`
- **Default**: `false`

```ts
const record = {
    TY: 'JOUR',
    TI: 'This is a title\nthat continues\non multiple lines.'
};
const risData = stringify(record, { mergeMultiline: true });
console.log(risData);
// Output:
// TY  - JOUR
// TI  - This is a title that continues on multiple lines.
// ER  - 

```

#### `repairTags`

If `true`, uppercases tag keys and strips non-alphanumeric noise (`[^A-Z0-9]`) to salvage 2-character RIS tag keys (e.g., `'A-U'` -> `'AU'`, `' T I '` -> `'TI'`).

- **Type**: `boolean`
- **Default**: `true`
- only repairs format noise; unrepairable tags remain invalid.
- output depends on `skipInvalidTags` and `onError` settings.

```ts
const record = {
    TY: 'JOUR',
    'A-U': 'Alpha, A.',
    ' T I ': 'Some Title'
};
const risData = stringify(record, { repairTags: true });
console.log(risData);
// Output:
// TY  - JOUR
// AU  - Alpha, A.
// TI  - Some Title
// ER  - 
```

#### `skipInvalidTags`

If `true`, tags that do not match the 2-character RIS tag format (`[A-Z0-9]{2}`) are skipped.

- **Type**: `boolean`
- **Default**: `false`
- if false, invalid tags are included in the output.
- both cases (kept or skipped) trigger `onError` with a `RisWarning`, visible at log level `'warn'` or `'info'`.
- operates after `repairTags` attempts tag salvaging.

```ts
const record = {
    TY: 'JOUR',
    'A-U': 'Alpha, A.',
    ' T I ': 'Some Title',
    'invalidTag': 'Unrepairable tag'
};
const risData = stringify(record, {
    repairTags: true,
    skipInvalidTags: false
});
// may trigger `onError` for 'invalidTag  - Unrepairable tag'
console.log(risData);
// Output:
// TY  - JOUR
// AU  - Alpha, A.
// TI  - Some Title
// INVALIDTAG  - Unrepairable tag
// ER  - 

```

#### `skipEmptyTags`

If `true`, tags with `undefined`, `null`, empty string (`''` or `' '`), or empty/invalid date values are omitted from the output.

- **Type**: `boolean`
- **Default**: `true`
- if `false`, empty tags are included in the output (e.g. `TI  - `).
- applies to scalar strings, array elements, and date fields (`null`/`undefined` dates, invalid `Date` objects, `RawDate` objects without any part).

```ts
const record = {
    TY: 'JOUR',
    AU: ['Alpha, A.', '', null, undefined, new Date('invalid date')],
    TI: '',
    AB: null,
    LA: undefined,
    PY: new Date('invalid date')
};

const risDataTrue = stringify(record, { skipEmptyTags: true });
console.log(risDataTrue);
// Output:
// TY  - JOUR
// AU  - Alpha, A.
// ER  - 

const risDataFalse = stringify(record, { skipEmptyTags: false });
console.log(risDataFalse);
// Output:
// TY  - JOUR
// AU  - Alpha, A.
// AU  - 
// AU  - 
// AU  - 
// AU  - 
// TI  - 
// PY  - 
// AB  - 
// LA  - 
// ER  - 
```

#### `fromSemantic`

If `true`, translates human-readable semantic keys (`author`, `title`, `journal`, etc.) back to 2-letter RIS tags (`AU`, `TI`, `JF`).

- **Type**: `boolean`
- **Default**: `false`
- uses standard RIS semantic field mappings.
- custom semantic keys can be supplied via `customSemanticMap`.

```ts
const record = {
    typeOfReference: 'JOUR',
    title: 'Some Title'
};
const risData = stringify(record, { fromSemantic: true });
console.log(risData);
// Output:
// TY  - JOUR
// TI  - Some Title
// ER  - 
```

#### `customSemanticMap`

Provides additional custom key-to-tag mappings to extend the `fromSemantic` translation map (e.g. `{ N1: 'customNote' }` or `{ EE: 'extraField' }`).

- **Type**: `Partial<Record<ContentRisTag, string>>`
- **Default**: `{}`
- requires `fromSemantic: true` to be active.
- maps custom property names in JS objects directly to RIS tags.

```ts
const record = {
    typeOfReference: 'JOUR',
    author: ['Alpha, A.', 'Beta, B.'],
    title: 'Some Title',
    publicationYear: 2026,
    customNote: 'Extra info'
};
const risData = stringify(record, {
    fromSemantic: true,
    customSemanticMap: { N1: 'customNote' }
});
console.log(risData);
// Output:
// TY  - JOUR
// AU  - Alpha, A.
// AU  - Beta, B.
// TI  - Some Title
// PY  - 2026
// N1  - Extra info
// ER  - 

```

#### `customArrayTags`

Defines extra RIS tags to treat as multi-value array tags, allowing multiple tag lines (`AU  - ...`) instead of applying `arrayMergeStrategy` (e.g. `['U1']`).

- **Type**: `ContentRisTag[]`
- **Default**: `[]`
- standard array tags like `AU`, `A1`, `A2`, `KW` are supported natively.
- extends multi-line emission capabilities to custom or non-standard tags.

```ts
const record = {
    TY: 'JOUR',
    AU: ['Alpha, A.', 'Beta, B.'],
    U1: ['Custom 1', 'Custom 2']
};
const risData = stringify(record, { customArrayTags: ['U1'] });
console.log(risData);
// Output:
// TY  - JOUR
// AU  - Alpha, A.
// AU  - Beta, B.
// U1  - Custom 1
// U1  - Custom 2
// ER  - 

```

#### `arrayMergeStrategy`

Defines how array values are merged when assigned to a non-array scalar tag (e.g. merging `TI: ['Part 1', 'Part 2']`).

- **Type**: `'join-space' | 'join-newline' | 'first' | 'last' | false`
- **Default**: `'join-space'`
- `'join-space'`: joins elements with a single space.
- `'join-newline'`: joins elements with line terminators.
- `'first'` / `'last'`: selects only the initial or trailing array element.
- `false`: disables array merging entirely.

```ts
const record = {
    TY: 'JOUR',
    TI: ['Title 1', 'Title 2']
};
const risData = stringify(record, { arrayMergeStrategy: 'join-space' });
console.log(risData);
// Output:
// TY  - JOUR
// TI  - Title 1 Title 2
// ER  - 

const risData2 = stringify(record, { arrayMergeStrategy: 'first' });
console.log(risData2);
// Output:
// TY  - JOUR
// TI  - Title 1
// ER  - 

```

#### `useSmartTypes`

Enables heuristic parsing of messy date **strings** (e.g. `'January 15, 2026'` -> `'2026-01-15'`).

- **Type**: `boolean`
- **Default**: `false`
- Automatically parses date strings assigned to standard date tags (`PY`, `Y1`, `DA`, `Y2`). Native `Date` objects are always formatted regardless of this setting.
- Yearless dates in `DA` and `Y1` take the year from `PY`, then `Y1`. Other date tags get no fallback year; uncastable values stay strings with an `INVALID_DATE_FALLBACK` warning.
- Respects output formatting specified by `dateFormat`.

```ts
const record = {
    TY: 'JOUR',
    DA: 'Jan 15', // Partial Date (Missing Year)
    Y2: 'March',  // Access Date (Strictly isolated)
    PY: '2026'    // Publication Year
};
const risData = stringify(record, { useSmartTypes: true });
console.log(risData);
// Output:
// TY  - JOUR
// Y2  - March        <-- Left untouched (no fallback year for Y2), RisWarning
// DA  - 2026-01-15   <-- Enriched with year from PY
// PY  - 2026
// ER  - 
```

#### `smartCastSchema`

Defines which tags are treated as date fields for heuristic parsing when `useSmartTypes: true` is enabled (e.g. `{ U1: 'date' }`). Standard date tags (`PY`, `Y1`, `DA`, `Y2`) and numeric tags (`VL`, `NV`, `SV`, `IS`, `M1`, `SE`) are included by default.

- **Type**: `Partial<Record<ContentRisTag, CastType>>`
- **Default**: `{}`
- requires `useSmartTypes: true` to take effect on custom tags.
- allows custom tags to leverage automatic date string parsing.

```ts
const record = {
    TY: 'JOUR',
    U1: 'January 15, 2026'
};
const risData = stringify(record, {
    useSmartTypes: true,
    smartCastSchema: { U1: 'date' }
});
console.log(risData);
// Output:
// TY  - JOUR
// U1  - 2026-01-15
// ER  - 
```

#### `tagMapping`

Maps tag aliases or legacy tag keys to target RIS tags (e.g. `{ A1: 'AU' }`).

- **Type**: `Partial<Record<ContentRisTag, ContentRisTag>>`
- **Default**: `{}`
- rewrites input tag keys before final tag sorting and line generation.
- supports merging legacy tag variations into standardized RIS tags.
- mapped values behave exactly like the target tag: they use its `smartCastSchema` cast type, date fallback year and year supplier role; casts of source tags are ignored.

```ts
const record = {
    TY: 'JOUR',
    A1: 'Alpha, A.',
    A2: 'Beta, B.'
};
const risData = stringify(record, { tagMapping: { A1: 'AU', A2: 'AU' } });
console.log(risData);
// Output:
// TY  - JOUR
// AU  - Alpha, A.
// AU  - Beta, B.
// ER  - 
```

#### `eol`

End-Of-Line terminator character (`'\n'`, `'\r\n'`, or `'\r'`).

- **Type**: `'\n' | '\r\n' | '\r'`
- **Default**: `'\n'`
- sets line break character sequence across the emitted RIS document.
- allows output formatting tailored for Windows (`\r\n`), Unix (`\n`), or legacy Mac (`\r`).

```ts
const record = {
    TY: 'JOUR',
    AB: 'Some multiline\nabstract text.'
};
const risData = stringify(record, { eol: '\r\n' });
console.log(risData);
// Output (CRLF line endings - \r\n):
// TY  - JOUR
// AB  - Some multiline
// abstract text.
// ER  - 
```

#### `dateFormat`

Target format string for date output. Supported formats: `'YYYY-MM-DD'`, `'YYYY-MM'`, `'YYYY/MM/DD'`, `'YYYY/MM'`, `'YYYY'`.

- **Type**: `DateFormatType`
- **Default**: `'YYYY-MM-DD'`
- controls serialization format for `Date` objects and parsed date strings.
- defaults to ISO standard date representation (`YYYY-MM-DD`).
- `Date` objects are written as their **local** calendar date (`getFullYear()`/`getMonth()`/`getDate()`): `new Date(2026, 0, 1)` is `2026-01-01` in every timezone. Date-only ISO strings like `new Date('2026-01-01')` are UTC midnight in JavaScript and therefore the previous day west of UTC; pass such dates as strings or `RawDate` objects instead.
- `Date` objects that are invalid or have a local year outside `0000-9999` are dropped with an `INVALID_DATE_FALLBACK` warning.
- `RawDate` objects are only dropped when no part is present: invalid ones (year not 4 digits, month not `1-12`, day not in that month, e.g. `{ year: '2024', month: '13', day: '45' }` or `{ year: '2023', month: '02', day: '29' }`) and yearless ones without a fallback year are written unvalidated (`2024-13-45`, `05-12`) with an `INVALID_DATE_FALLBACK` warning; yearless `RawDate` objects are validated against their fallback year.
- A `RawDate` with year and day but no month keeps an empty month slot: `{ year: '2024', day: '15' }` is written as `2024--15` (`2024//15` for slash formats).

```ts
const record = {
    TY: 'JOUR',
    PY: new Date(2026, 0, 15)
};
const risData = stringify(record, { dateFormat: 'YYYY-MM' });
console.log(risData);
// Output:
// TY  - JOUR
// PY  - 2026-01
// ER  - 
```

#### `logLevel`

Filters errors, warnings, and info messages sent to `onError`. Most stringify incidents (invalid tags, missing `TY`, `ER` data, invalid dates) are `RisWarning`s, so the default `'error'` level dispatches almost nothing.

- **Type**: `'silent' | 'error' | 'warn' | 'info'`
- **Default**: `'error'`

- `'error'`: dispatches `RisError` instances only (e.g. unsupported object values).
- `'warn'`: dispatches both `RisError` and `RisWarning` instances (e.g., missing/duplicate `TY` tags, data on `ER` tag).
- `'info'`: dispatches `RisError`, `RisWarning`, and `RisInfo` instances (e.g., diagnostic formatting and repair notices).
- `'silent'`: suppresses all error, warning, and info callbacks.

```ts
const record = {
    TY: 'JOUR',
    invalidTag: 'Value'
};
const risData = stringify(record, {
    logLevel: 'warn',
    onError: (incident) => console.log('Logged:', incident.error.name, incident.error.message)
});
console.log(risData);
// Output:
// Logged: RisWarning Invalid tag format. Tag must be exactly 2 (A-Z, 0-9) characters.
// TY  - JOUR
// INVALIDTAG  - Value
// ER  - 
```

#### `onError`

Callback function for handling non-fatal warnings or validation errors (e.g. `(incident) => console.log(incident.error.message)`). Respects `logLevel`. The callback receives a context object, not the error itself.

- **Type**: `(incident: RisErrorContext) => void`
- **Default**: `undefined`
- `incident.error`: `RisError` | `RisWarning` | `RisInfo` (`name`, `message`, `severity`).
- `incident.rawLine`: simulated RIS line of the affected value; `incident.tag`: affected tag or `null`; `incident.recordContext`: the input record.
- Allows custom error logging, aggregation, or diagnostic monitoring.

```ts
const record = {
    TY: 'JOUR',
    invalidTag: 'Value'
};
const errors: string[] = [];
const risData = stringify(record, {
    logLevel: 'warn',
    onError: (incident) => errors.push(incident.error.message)
});
console.log('Errors:', errors);
console.log(risData);
// Output:
// Errors: [ 'Invalid tag format. Tag must be exactly 2 (A-Z, 0-9) characters.' ]
// TY  - JOUR
// INVALIDTAG  - Value
// ER  - 
```

---

## Output Format and Edge Cases

- **Tag order**: `TY` first, then the remaining tags in a fixed standard order (`TAG_SORT_ORDER_MAP` in `@smart-ris/core`), custom tags alphabetically after them, `ER` last. Input key order is not kept.
- **Record separation**: every record ends with `ER  - ` plus `eol`; multiple records are separated by one blank line.
- **Value conversion**: numbers and booleans are written with `String()` (`VL: 3` → `VL  - 3`, `M3: true` → `M3  - true`).
- **Embedded tag-like lines**: a value line that looks like a tag header is indented by one space so `parse` keeps it inside the field (`AB: 'line\nTI  - fake'` → ` TI - fake`), with a `RisWarning`.
- **Invalid tag keys** are written as given (`INVALIDTAG  - Value`) unless `skipInvalidTags: true`; `parse` will not read them back as tags.
- **No exceptions** for bad data: everything is reported through `onError`.

## Testing

Unit tests in `tests/unit/` mirror `src/` 1:1; option scenarios live in `tests/scenarios/`. Run `bun test` from the repository root.