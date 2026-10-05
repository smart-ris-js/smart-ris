// Copyright 2026 Martin Winkler

// --- Builder ---
export * from './builder/builder.js';

// --- Core Schema, Types & Constants ---
export * from './core.constants.js';

// --- Default Options & Resolver ---
export * from './core.options.js';
export * from './core.resolver.js';
export * from './core.types.js';

// --- Errors & Warnings ---
export * from './errors.js';

// --- Custom Mappings ---
export * from './mappings.js';

// --- Middlewares ---
// INTENTION: `export *` only - Bun's bundler drops named re-exports of otherwise unused modules under `sideEffects: false`.
export * from './middlewares/arrayCaster/arrayCaster.middleware.js';
export * from './middlewares/core.pipeline.js';
export * from './middlewares/stringSanitizer/stringSanitizer.middleware.js';
export * from './middlewares/tagMapper/tagMapper.middleware.js';

// --- Utilities ---
export * from './utils/date.js';
export * from './utils/json.js';
export * from './utils/number.js';
export * from './utils/optionsValidation.js';
export * from './utils/record.js';
export * from './utils/tags.js';
