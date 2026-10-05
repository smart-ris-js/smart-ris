# @smart-ris/core
 
> Part of the [smart-ris](../../README.md) monorepo.

RIS (Research Information Systems) core types, specification constants, shared pipeline helpers, and fluent record builder.

## Installation

Workspace package of this monorepo (`private`, not published to npm). See the [root README](../../README.md#requirements-and-installation). `@smart-ris/parse` and `@smart-ris/stringify` re-use its types and constants; import the builder and error classes from here.

## Quick Start (Usage)

Use the fluent `ris` shorthand entry point to construct RIS input records:

```ts
import { ris } from '@smart-ris/core';

const record = ris
    .ty('JOUR')
    .author('Alpha, A.', 'Beta, B.')
    .title('Computing Machinery and Intelligence')
    .publicationYear(1950)
    .build();

console.log(record);
// Output:
// {
//   TY: 'JOUR',
//   AU: ['Alpha, A.', 'Beta, B.'],
//   TI: 'Computing Machinery and Intelligence',
//   PY: 1950
// }
```

---

## Record Builder

### Entry Points & Options Passing

The builder proxy (`ris`) supports **direct property chaining**, **callable factory invocation with options**, and **explicit factory creation** (`createRisBuilder`):

#### 1. Direct Property Chaining (`ris.tag...`)
Direct property access uses default settings without requiring function invocation:

```ts
import { ris } from '@smart-ris/core';

const record = ris
    .ty('JOUR')
    .author('Alpha, A.')
    .title('Title 1')
    .build();
```

#### 2. Callable Factory Invocation (`ris(config)...`)
`ris` can be invoked directly as a function call `ris(config)` to pass custom options on the fly:

```ts
import { ris } from '@smart-ris/core';

const record = ris({
    customSemanticMap: {
        MYKEY: 'U1',
    },
})
    .ty('JOUR')
    .author('Beta, B.')
    .myKey('Custom Value')
    .build();
```

#### 3. Explicit Factory Creation (`createRisBuilder`)
Alternatively, `createRisBuilder(config)` can be called to instantiate a reusable configured builder:

```ts
import { createRisBuilder } from '@smart-ris/core';

const customBuilder = createRisBuilder({
    customSemanticMap: {
        CUSTOMNOTE: 'N1',
        MYKEY: 'U1',
    },
});

const record = customBuilder
    .ty('JOUR')
    .author('Turing, Alan')
    .customNote('Important reference note')
    .myKey('Custom data')
    .build();
```

---

### Builder Capabilities & Features

#### 1. RIS Tag Methods & Semantic Aliases
Methods can be called using 2-character RIS tag names (`au`, `ti`, `py`, `kw`) or human-readable semantic aliases (`author`, `title`, `publicationYear`, `keywords`):

- `builder.au(...)` / `builder.author(...)` $\rightarrow$ maps to `AU`
- `builder.ti(...)` / `builder.title(...)` $\rightarrow$ maps to `TI`
- `builder.py(...)` / `builder.publicationYear(...)` $\rightarrow$ maps to `PY`
- `builder.kw(...)` / `builder.keywords(...)` $\rightarrow$ maps to `KW`

#### 2. Variadic & Array Inputs
Methods accept multiple arguments, arrays, or nested arrays. Arrays are flattened automatically and multiple method calls append values to the tag:

```ts
const record = ris
    .ty('JOUR')
    .author('Alpha, A.', 'Beta, B.')          // Variadic arguments
    .author(['Gamma, G.', 'Delta, D.'])       // Array inputs
    .keywords('AI', ['Machine Learning', 'NLP']) // Mixed variadic arrays
    .build();
```

#### 3. Data Types & Strict Validation
The builder accepts `string`, `number`, `boolean`, `null`, and native `Date` objects:

```ts
const record = ris
    .ty('JOUR')
    .title('Data Analysis')
    .publicationYear(2026)
    .primaryDate(new Date(2026, 4, 15))
    .build();
```

- `Date` objects are written by `stringify` as their local calendar date (`2026-05-15` above, in every timezone).

- `undefined` is automatically normalized to `null`.
- Passing an invalid `Date` object (where `Number.isNaN(date.getTime())`) or an unsupported value type (such as plain objects or functions) throws a strict `TypeError`.

#### 4. Output Extraction (`build()`, `.get`, `raw()`)

The builder provides three ways to extract constructed data:

```ts
const builder = ris
    .ty('JOUR')
    .author('Alpha, A.')
    .keywords('AI', 'ML');

// A. build(): Unboxes single-element arrays to scalar values
console.log(builder.build());
// { TY: 'JOUR', AU: 'Alpha, A.', KW: ['AI', 'ML'] }

// Without .ty(...), build() and raw() add TY: 'GEN' as the last key:
// ris.author('Alpha, A.').build() -> { AU: 'Alpha, A.', TY: 'GEN' }

// B. .get: Property getter shortcut returning unboxed build() output directly
console.log(builder.get);
// { TY: 'JOUR', AU: 'Alpha, A.', KW: ['AI', 'ML'] }

// C. raw(): Returns raw arrays for ALL tags (including single-element tags and TY)
console.log(builder.raw());
// { TY: ['JOUR'], AU: ['Alpha, A.'], KW: ['AI', 'ML'] }
```

#### 5. JSON Serialization (`JSON.stringify`)

The builder implements `toJSON()`, enabling `JSON.stringify(builder)` to serialize unboxed `build()` output directly without calling `.build()`:

```ts
const builder = ris
    .ty('JOUR')
    .author('Alpha, A.')
    .title('Some Title');

console.log(JSON.stringify(builder, null, 2));
// Output:
// {
//   "TY": "JOUR",
//   "AU": "Alpha, A.",
//   "TI": "Some Title"
// }
```

---

## API & Export Reference

`@smart-ris/core` exports primary builder APIs, specification constants, error classes, internal middleware pipeline infrastructure, and helper utilities.

Sections 3 and 4 are exported for `@smart-ris/parse` and `@smart-ris/stringify`. They are internal infrastructure; their signatures can change without notice.

### 1. Primary Public APIs (Builder & Factories)

| API | Signature / Description |
| :--- | :--- |
| **`ris`** | `Proxy` shorthand builder entry point. Supports direct property access (`ris.tag...`) and callable options (`ris(config)...`). |
| **`createRisBuilder`** | `(config?: RisBuilderConfig) => RisBuilder` — Creates a configured `RisBuilder` instance. |

---

### 2. Specification Constants & Dictionaries

| Constant | Description |
| :--- | :--- |
| **`tag`** | Dictionary mapping semantic tag names (`tag.author`, `tag.title`) to 2-character RIS tags (`'AU'`, `'TI'`). |
| **`recordType`** | Dictionary mapping reference types (`recordType.journal`, `recordType.book`) to RIS type codes (`'JOUR'`, `'BOOK'`). |
| **`LOG_LEVEL`** | Numeric log level map (`{ silent: -1, error: 0, warn: 1, info: 2 }`). |
| **`TAG_SORT_ORDER_MAP`** | Canonical RIS tag order dictionary (`TY` first, `ER` last). |
| **`DEFAULT_SMART_CAST_SCHEMA`** | Built-in smart cast type schema mapping for standard RIS tags. |
| **`DEFAULT_ARRAY_TAGS`** | Default list of array-capable tags (`['AU', 'A1', 'A2', 'KW', ...]`). |
| **`ERROR_MESSAGES`** | Preset error message strings used across stringifier & parser. |
| **`VALID_CAST_TYPES`** | Array of valid cast types (`['string', 'number', 'boolean', 'date']`). |
| **`VALID_DATE_FORMATS`** | Array of valid date formats (`['YYYY-MM-DD', 'YYYY-MM', 'YYYY/MM/DD', 'YYYY/MM', 'YYYY']`). |
| **`VALID_LOG_LEVELS`** | Array of valid log levels (`['silent', 'error', 'warn', 'info']`). |
| **`VALID_ARRAY_MERGE_STRATEGIES`** | Array of array merge strategy options (`['join-space', 'join-newline', 'first', 'last']`). |
| **`REGEX_TAG_FORMAT`** | Regular expression validating 2-character RIS tag keys (`/^[A-Z0-9]{2}$/`). |

---

### 3. Middleware Engine & Pipeline Utilities (Internal Infrastructure)

Middlewares form the shared transformation pipeline used across both `@smart-ris/parse` and `@smart-ris/stringify`:

| Utility | Description |
| :--- | :--- |
| **`executePipeline`** | `(payload: PipelinePayload, middlewares: Middleware[]) => PipelinePayload` — Runs payload through middleware stack. |
| **`createStringSanitizer`** | **`Middleware — String Sanitizer`**: Creates middleware for whitespace cleaning & multiline string merging (`(options?: StringSanitizerOptions) => Middleware`). |
| **`createArrayCaster`** | **`Middleware — Array Caster`**: Creates middleware for scalar array merging strategies (`join-space`, `join-newline`, `first`, `last`) (`(options?: ArrayCasterOptions) => Middleware`). |
| **`createTagMapper`** | **`Middleware — Tag Mapper`**: Creates middleware for tag rewrites and tag alias mappings (`(options?: TagMapperOptions) => Middleware`). |
| **`cleanWhitespace`** | Sanitizer helper — collapses 2+ internal space clusters & limits consecutive blank lines. |
| **`mergeMultilineString`** | Sanitizer helper — merges multiline string continuations into a single line. |

---

### 4. Helper Utilities & Diagnostics (Internal Infrastructure)

| Utility | Description |
| :--- | :--- |
| **`formatRisDate`** | `(date: Date \| RawDate, format: DateFormatType) => string` — Formats Date objects by their local calendar date and validated `RawDate` objects; returns `''` for invalid dates, missing years or years outside `0000-9999`; a missing month between year and day keeps its empty slot (`2024--15`). |
| **`formatRawDateUnchecked`** | `(date: RawDate, format: DateFormatType) => string` — Joins present `RawDate` parts without validation, separated like `format`; `''` if no part is present. |
| **`isValidDate`** | `(y: string, m: string, d: string) => boolean` — Checks a 4-digit year, 1-2 digit month and day for a real calendar date (leap years included). |
| **`heuristicallyParseDateString`** | `(str: string) => RawDate \| null` — Heuristically parses messy date strings into structured `RawDate`. |
| **`parseDecimalNumber`** | `(str: string) => number \| null` — Parses plain decimals only (sign, digits, one `.`, surrounding whitespace); rejects hex/binary/octal, exponents, `Infinity` and values not exactly representable as a double. |
| **`repairTag`** | `(tagKey: string) => RisTag \| null` — Uppercases tag keys and strips non-alphanumeric noise (e.g. `'A-U'` $\rightarrow$ `'AU'`). |
| **`emitError`** | `(opts: EmitErrorOptions, incident: RisErrorContext) => void` — Dispatches error/warning callbacks based on `logLevel`. Callback type: `OnErrorCallback = (incident: RisErrorContext) => void`. |
| **`safeStringify`** | `(obj: unknown, space?: string \| number) => string` — Safe JSON stringifier for diagnostic error payloads. |
| **`assertBoolean`**, **`assertStringLiteral`**, **`assertCustom`** | Internal option validation assertion functions. |

---

### 5. Error Classes

| Class | Extends | Description |
| :--- | :--- | :--- |
| **`RisBaseError`** | `Error` | Abstract base with `name` and numeric `severity` (`LOG_LEVEL` value). |
| **`RisError`** | `RisBaseError` | `severity: 0`. Aborts or dropped data (record line limit, unsupported value types). Dispatched at `logLevel: 'error'` and above. |
| **`RisWarning`** | `RisBaseError` | `severity: 1`. Non-fatal specification warnings (missing `ER`/`TY`, invalid tags). Dispatched at `logLevel: 'warn'` and above. |
| **`RisInfo`** | `RisBaseError` | `severity: 2`. Diagnostics and automatic format repairs. Dispatched at `logLevel: 'info'`. |

These classes are passed to `onError`; they are not thrown. The callback receives a context object:

```ts
type RisErrorContext = {
    error: RisBaseError;            // RisError | RisWarning | RisInfo
    rawLine: string;                // source line (parse) or simulated RIS line (stringify)
    lineNumber?: number | null;     // parse only
    tag: string | null;
    recordContext?: Record<string, unknown>;
};
```

Thrown errors are plain `TypeError`s: invalid options, non-string `parse` input, invalid builder values.

---

### 6. TypeScript Types & Interfaces

```ts
import type {
    RisRecord,
    StringifyRisRecord,
    StringifyInput,
    SemanticRisRecord,
    RisTag,
    ContentRisTag,
    CastType,
    DateFormatType,
    LogLevel,
    ArrayMergeStrategy,
    RisBuilder,
    RisBuilderConfig,
    RawDate,
    Middleware
} from '@smart-ris/core';
```

- **`RisRecord`**: Parsed RIS record for default options (`ParsedRisRecord`); use `ParsedRisRecord<typeof options>` to infer the shape for custom options.
- **`StringifyRisRecord`**: Unboxed record dictionary accepted by `stringify()`.
- **`StringifyInput`**: Universal input accepted by `stringify()` (`StringifyRisRecord | RisBuilder`).
- **`SemanticRisRecord`**: Record dictionary using human-readable semantic keys (`author`, `title`, etc.).
- **`RisTag`**: 2-character uppercase RIS tag key (e.g. `'AU'`, `'TY'`, `'ER'`).
- **`ContentRisTag`**: RIS tag keys excluding record boundaries (`Exclude<RisTag, 'TY' | 'ER'>`).
- **`RisBuilder`**: Fluid proxy builder interface.
- **`RisBuilderConfig`**: Builder configuration interface (`{ customSemanticMap?: Record<string, string> }`).
- **`RawDate`**: Structured raw date representation; at least one of `year`, `month`, `day` (strings) is required.
- **`CastType`**: Primitive cast types (`'string' | 'number' | 'boolean' | 'date'`).
- **`DateFormatType`**: Supported date format specifiers (`'YYYY-MM-DD' | 'YYYY-MM' | 'YYYY/MM/DD' | 'YYYY/MM' | 'YYYY'`).
- **`LogLevel`**: Log level setting (`'silent' | 'error' | 'warn' | 'info'`).
- **`ArrayMergeStrategy`**: Array merge strategy (`'join-space' | 'join-newline' | 'first' | 'last' | false`).