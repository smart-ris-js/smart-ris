# smart-ris

[![Test](https://github.com/smart-ris-js/smart-ris/actions/workflows/test.yml/badge.svg)](https://github.com/smart-ris-js/smart-ris/actions/workflows/test.yml)
[![Package](https://github.com/smart-ris-js/smart-ris/actions/workflows/package.yml/badge.svg)](https://github.com/smart-ris-js/smart-ris/actions/workflows/package.yml)
[![Bun](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsmart-ris-js%2Fsmart-ris%2Fmain%2Fpackage.json&query=%24.engines.bun&label=Bun&logo=bun&color=blue)](https://bun.sh)
[![Node.js](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsmart-ris-js%2Fsmart-ris%2Fmain%2Fpackage.json&query=%24.engines.node&label=Node.js&logo=nodedotjs&color=blue)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

Versatile, fault-tolerant RIS (Research Information Systems) parser, stringifier, record builder, and inspection suite for JavaScript and TypeScript. Strict and conservative by default, with opt-in options for tag repair, smart date/number casting, and semantic key translation.

## Packages

| Package | Purpose | Depends on |
| --- | --- | --- |
| [`@smart-ris/core`](packages/core) | Shared types, constants, error classes, `RisBuilder` | none |
| [`@smart-ris/parse`](packages/parse) | RIS text → JS records (`parse`, `parseStream`) | core |
| [`@smart-ris/stringify`](packages/stringify) | JS records → RIS text (`stringify`, `stringifyStream`) | core |
| [`@smart-ris/inspect-parse`](packages/inspect-parse) | Data quality report for RIS input (`inspectParse`, `inspectParseStream`) | core, parse |

Each package README is the full option reference. This file covers what applies to all of them.

## Requirements and Installation

- ESM only (`"type": "module"`), no CommonJS build.
- Node.js `>=22.12` or Bun `>=1.3`.
- Under Bun, the `bun` export condition resolves to the TypeScript sources; other runtimes use the compiled `dist`.
- All packages are currently `private` and licensed under Apache-2.0; they are not published to npm. Use them as workspace packages inside this repository.

```bash
bun install
```

## Round Trip

```ts
import { parse } from '@smart-ris/parse';
import { stringify } from '@smart-ris/stringify';

const records = parse('TY  - JOUR\nAU  - Doe, J.\nAU  - Roe, R.\nTI  - Title\nER  - \n');
// [{ TY: 'JOUR', AU: ['Doe, J.', 'Roe, R.'], TI: 'Title' }]

const text = stringify(records);
// 'TY  - JOUR\nAU  - Doe, J.\nAU  - Roe, R.\nTI  - Title\nER  - \n'
```

## Features

- **Lenient parsing**: missing `ER` lines, content outside records, empty tags and unknown tags are reported via `onError` instead of throwing.
- **Opt-in tag repair**: `repairTags: true` reconstructs malformed tag lines such as `TY - JOUR`, `AU -Doe` or `au  - Doe`.
- **Configurable shape**: array tags, merge strategies for repeated tags, tag renaming (`tagMapping`), custom tags.
- **Smart types**: `useSmartTypes` turns date tags into normalized date strings (`YYYY-MM-DD` by default) and numeric tags into numbers. `parse` never returns `Date` objects; `stringify` accepts them.
- **Fluent builder**: `ris` and `createRisBuilder()` build typed records by method chaining.
- **Sync and streaming APIs**: every package has a string API and an `AsyncIterable` API.
- **Inspection**: `inspectParse` reports anomalies, tag statistics, cast failures and line ending styles without changing the data.

## Limitations and Gotchas

Read this before relying on the defaults.

1. **Strict tag syntax by default in `parse`.** A tag line must match `XX  - value` (two uppercase/digit characters, two spaces, dash, space). With the default `repairTags: false`, a line like `au  - Doe` or `TY - JOUR` is not a tag. Inside a record it becomes continuation text of the previous tag, without any diagnostic.
2. **Records start only at a `TY` line.** Input without a valid `TY  - ` line returns `[]`. Tags before the first `TY` are dropped with a warning.
3. **`repairTags` defaults differ.** `parse`: `false`. `stringify` and `inspectParse`: `true`. Pass the option explicitly if both sides must behave the same.
4. **Most incidents are warnings, not errors.** `onError` is called only for incidents at or above `logLevel`, and the default `logLevel` is `'error'`. Missing `ER`, invalid tags and content outside records are `RisWarning`s; set `logLevel: 'warn'` to receive them.
5. **`onError` receives a context object, not the error.** Signature: `(incident: RisErrorContext) => void` with `incident.error` (`RisError` | `RisWarning` | `RisInfo`), `incident.rawLine`, `incident.lineNumber` and `incident.tag`. Read the message via `incident.error.message`.
6. **Hard limits abort instead of throwing.** `parse` stops at a record with more than 1,000 lines (`RECORD_EXCEEDS_MAX_LINES`). `parseStream` also stops at a single line longer than 10 MiB (`LINE_EXCEEDS_MAX_BUFFER_SIZE`). Both report a `RisError` through `onError` and return the records collected so far; nothing is thrown. Check `onError` if completeness matters.
7. **No exceptions for malformed data.** Only invalid arguments (`parse` with a non-string, invalid options) and errors from a stream source throw. Everything else is reported through `onError`.
8. **Dates are local time.** `stringify` formats `Date` objects with local getters (`getFullYear`, `getMonth`, `getDate`). A `Date` created as UTC midnight can shift by one day in negative UTC offsets.
9. **Output format of `stringify`.** One blank line between records, a trailing line ending at the end, values written with `String()`.

## Development

```bash
bun run check
```

| Script | Action |
| --- | --- |
| `bun test` | Run all tests against the sources |
| `bun run test:types` | Type-check sources and tests (`tsconfig.test.json`) |
| `bun run lint` / `lint:fix` | Biome check / apply safe fixes |
| `bun run build` | Emit `dist` (JS and `.d.ts`) for all packages |
| `bun run check` | Lint, build, type-check, tests, dist and package tests |

Layout per package: `src/` (sources), `tests/unit/` (mirrors `src/` 1:1), `tests/scenarios/` (integration scenarios per option).

## License

[Apache-2.0](LICENSE) © 2026 Martin Winkler
