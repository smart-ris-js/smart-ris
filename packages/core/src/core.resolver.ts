// Copyright 2026 Martin Winkler

import {
    DEFAULT_UPPERCASE_TAG_MAP,
    invertedTag,
    REGEX_TAG_FORMAT,
    RESERVED_SEMANTIC_KEYS_SET,
} from './core.constants.js';
import { LOG_LEVEL, VALID_CAST_TYPES, VALID_CAST_TYPES_SET, VALID_LOG_LEVELS } from './core.options.js';
import type { CastType, ContentRisTag, LogLevel, LogLevelValue, RisTag } from './core.types.js';
import { assertCustom, assertStringLiteral } from './utils/optionsValidation.js';

// INTENTION: hoisted configuration reference.
const VALID_CAST_TYPES_MSG = `Must be one of ${VALID_CAST_TYPES.join(', ')}`;

// -------------------------------------------------------------------
// 1. Log Level Resolution
// -------------------------------------------------------------------

/** Resolves input logLevel string option into a numeric severity value. */
export function resolveLogLevel(inputLogLevel: unknown, defaultLogLevel: LogLevel = 'error'): LogLevelValue {
    const rawLogLevel = inputLogLevel ?? defaultLogLevel;
    assertStringLiteral(rawLogLevel, VALID_LOG_LEVELS, 'logLevel');
    return LOG_LEVEL[rawLogLevel];
}

// -------------------------------------------------------------------
// 2. Tag Mapping Resolution
// -------------------------------------------------------------------

/** Resolves tagMapping by validating input and normalizing keys/values to uppercase. */
export function resolveTagMapping(tagMapping: unknown): Partial<Record<ContentRisTag, ContentRisTag>> {
    // INTENTION: early return with default empty.
    if (tagMapping === undefined) {
        return Object.create(null);
    }

    assertCustom(
        tagMapping,
        'tagMapping',
        (val) => typeof val === 'object' && val !== null && !Array.isArray(val),
        'Must be a valid object.',
    );

    const normalizedTagMapping: Partial<Record<ContentRisTag, ContentRisTag>> = Object.create(null);
    // INTENTION: type guard alias.
    const mappingRecord = tagMapping as Record<string, unknown>;

    for (const fromTag in mappingRecord) {
        if (!Object.hasOwn(mappingRecord, fromTag)) {
            continue;
        }
        const toTag = mappingRecord[fromTag];
        // INTENTION: 1. validate if strings.
        assertCustom(fromTag, 'tagMapping.key', (k) => typeof k === 'string', 'Keys must be strings.');
        assertCustom<string>(toTag, 'tagMapping.value', (v) => typeof v === 'string', 'Values must be strings.');

        // INTENTION: 2. trim and uppercase keys and values.
        const upperFromTag = fromTag.trim().toUpperCase();
        const upperToTag = toTag.trim().toUpperCase();

        // INTENTION: 3. validate if valid 2-character RIS tags.
        assertCustom(
            upperFromTag,
            'tagMapping.key',
            (k) => REGEX_TAG_FORMAT.test(k as string),
            'Keys must be valid 2-character RIS tags.',
        );
        assertCustom(
            upperToTag,
            'tagMapping.value',
            (v) => REGEX_TAG_FORMAT.test(v as string),
            'Values must be valid 2-character RIS tags.',
        );

        // INTENTION: disallow remapping structural tags TY and ER.
        assertCustom(
            upperFromTag,
            'tagMapping.key',
            (k) => k !== 'TY' && k !== 'ER',
            `Cannot remap 'TY' or 'ER' tags.`,
        );
        assertCustom(
            upperToTag,
            'tagMapping.value',
            (v) => v !== 'TY' && v !== 'ER',
            `Cannot map to 'TY' or 'ER' tags.`,
        );

        if (upperFromTag !== upperToTag) {
            normalizedTagMapping[upperFromTag as ContentRisTag] = upperToTag as ContentRisTag;
        }
    }
    return normalizedTagMapping;
}

// -------------------------------------------------------------------
// 3. Array Tag Resolution
// -------------------------------------------------------------------

/** Resolves arrayTags by validating customArrayTags and merging defaultArrayTags with normalized custom tags. */
export function resolveArrayTags(
    customArrayTags: unknown,
    defaultArrayTags: readonly ContentRisTag[],
): ContentRisTag[] {
    if (customArrayTags === undefined) {
        return defaultArrayTags.slice();
    }

    assertCustom(customArrayTags, 'customArrayTags', (val) => Array.isArray(val), 'Must be an array.');

    const mergedSet = new Set<ContentRisTag>(defaultArrayTags);
    for (const tagItem of customArrayTags as unknown[]) {
        // INTENTION: 1. validate if string.
        assertCustom<string>(tagItem, 'customArrayTags.item', (t) => typeof t === 'string', 'Items must be strings.');

        // INTENTION: 2. trim and uppercase tags for validation.
        const trimmedTag = tagItem.trim().toUpperCase() as ContentRisTag;

        // INTENTION: 3. validate if valid RIS tag - empty string checked indirectly.
        assertCustom(
            trimmedTag,
            'customArrayTags.item',
            (t) => REGEX_TAG_FORMAT.test(t as string),
            'Items must be valid 2-character RIS tags.',
        );

        // INTENTION: disallow structural tags TY and ER in customArrayTags.
        assertCustom(
            trimmedTag,
            'customArrayTags.item',
            (t) => t !== 'TY' && t !== 'ER',
            `Cannot include structural tags 'TY' or 'ER' in customArrayTags.`,
        );

        mergedSet.add(trimmedTag);
    }

    return Array.from(mergedSet);
}

// -------------------------------------------------------------------
// 4. Semantic Mapping Resolution
// -------------------------------------------------------------------

/** Resolves customSemanticMap for parse by validating input and merging with invertedTag (rawTag -> semanticKey). */
export function resolveParseSemanticMap(customSemanticMap?: unknown): Partial<Record<RisTag, string>> {
    if (customSemanticMap === undefined) {
        return invertedTag as Partial<Record<RisTag, string>>;
    }

    const mergedSemanticMap: Partial<Record<RisTag, string>> = Object.assign(Object.create(null), invertedTag);

    iterateValidSemanticMap(customSemanticMap, (upperTagKey, trimmedValue) => {
        // INTENTION: preserve exact casing of target semantic property name; upperValue used exclusively for validation.
        mergedSemanticMap[upperTagKey] = trimmedValue;
    });

    return mergedSemanticMap;
}

/** Resolves customSemanticMap for stringify/builder by validating input and mapping uppercase semanticKey -> rawTag. */
export function resolveStringifySemanticMap(customSemanticMap?: unknown): Record<string, RisTag> {
    if (customSemanticMap === undefined) {
        return DEFAULT_UPPERCASE_TAG_MAP;
    }

    const mergedSemanticMap: Record<string, RisTag> = Object.assign(Object.create(null), DEFAULT_UPPERCASE_TAG_MAP);

    iterateValidSemanticMap(customSemanticMap, (upperTagKey, _trimmedValue, upperValue) => {
        // INTENTION: invert mapping (UPPERCASE_SEMANTIC_KEY -> RisTag) to resolve semantic record keys back to raw RIS tags.
        mergedSemanticMap[upperValue] = upperTagKey as RisTag;
    });

    return mergedSemanticMap;
}

// -------------------------------------------------------------------
// 5. Smart Cast Schema Resolution
// -------------------------------------------------------------------

/** Resolves smartCastSchema by validating input object, keys (2-character RIS tags excluding TY/ER), and values. */
export function resolveCastSchema(
    smartCastSchema: unknown,
    defaultSchema: Record<string, CastType>,
): Record<string, CastType> {
    if (smartCastSchema === undefined) {
        return defaultSchema;
    }

    assertCustom(
        smartCastSchema,
        'smartCastSchema',
        (val) => typeof val === 'object' && val !== null && !Array.isArray(val),
        'Must be a valid object.',
    );

    const computedSmartCastSchema: Record<string, CastType> = Object.assign(Object.create(null), defaultSchema);
    // INTENTION: type guard alias.
    const schemaRecord = smartCastSchema as Record<string, unknown>;

    for (const key in schemaRecord) {
        if (!Object.hasOwn(schemaRecord, key)) {
            continue;
        }
        const value = schemaRecord[key];
        // INTENTION: 1. validate if string.
        assertCustom(key, 'smartCastSchema.key', (k) => typeof k === 'string', 'Keys must be strings.');

        // INTENTION: 2. trim and uppercase key for validation.
        const upperKey = key.trim().toUpperCase() as ContentRisTag;

        // INTENTION: 3. validate if valid 2-character RIS tag.
        assertCustom(
            upperKey,
            'smartCastSchema.key',
            (k) => REGEX_TAG_FORMAT.test(k as string),
            'Keys must be valid 2-character RIS tags.',
        );

        // INTENTION: disallow casting structural tags TY and ER.
        assertCustom(
            upperKey,
            'smartCastSchema.key',
            (k) => k !== 'TY' && k !== 'ER',
            `Cannot cast structural tags 'TY' or 'ER'.`,
        );

        // INTENTION: 4. validate value is a valid cast type string literal via O(1) set lookup.
        assertCustom(
            value,
            'smartCastSchema.value',
            (v) => VALID_CAST_TYPES_SET.has(v as string),
            VALID_CAST_TYPES_MSG,
        );

        computedSmartCastSchema[upperKey] = value as CastType;
    }

    return computedSmartCastSchema;
}

// -------------------------------------------------------------------
// 6. Internal Helper Functions
// -------------------------------------------------------------------

/** Validates customSemanticMap input object and iterates valid normalized tag-value pairs. */
function iterateValidSemanticMap(
    customSemanticMap: unknown,
    onEntry: (upperTagKey: ContentRisTag, trimmedValue: string, upperValue: string) => void,
): void {
    assertCustom(
        customSemanticMap,
        'customSemanticMap',
        (val) => typeof val === 'object' && val !== null && !Array.isArray(val),
        'Must be a valid object.',
    );

    // INTENTION: type guard alias.
    const mapRecord = customSemanticMap as Record<string, unknown>;
    const seenUpperValues = new Set<string>();

    for (const key in mapRecord) {
        if (!Object.hasOwn(mapRecord, key)) {
            continue;
        }
        const value = mapRecord[key];
        // INTENTION: 1. validate if string.
        assertCustom(key, 'customSemanticMap.key', (k) => typeof k === 'string', 'Keys must be strings.');
        assertCustom<string>(value, 'customSemanticMap.value', (v) => typeof v === 'string', 'Values must be strings.');

        const trimmedKey = key.trim();
        const trimmedValue = value.trim();

        // INTENTION: 2. trim and uppercase keys for validation.
        const upperTagKey = trimmedKey.toUpperCase() as ContentRisTag;

        // INTENTION: 3. validate if valid RIS tag - empty string checked indirectly.
        assertCustom(
            upperTagKey,
            'customSemanticMap.key',
            (k) => REGEX_TAG_FORMAT.test(k as string),
            'Keys must be valid 2-character RIS tags.',
        );

        // INTENTION: disallow remapping structural tags TY and ER.
        assertCustom(
            upperTagKey,
            'customSemanticMap.key',
            (k) => k !== 'TY' && k !== 'ER',
            `Cannot remap 'TY' or 'ER' tags.`,
        );

        assertCustom(trimmedValue, 'customSemanticMap.value', (v) => v !== '', 'Values must be non-empty strings.');

        const upperValue = trimmedValue.toUpperCase();

        // INTENTION: disallow 2-character RIS tag values - use tagMapper.
        assertCustom(
            upperValue,
            'customSemanticMap.value',
            (v) => !REGEX_TAG_FORMAT.test(v as string),
            'Values cannot be 2-character RIS tags.',
        );

        // INTENTION: disallow mapping to existing core semantic keys - for tag aliasing use tagMapper.
        assertCustom(
            upperValue,
            'customSemanticMap.value',
            (v) => DEFAULT_UPPERCASE_TAG_MAP[v as string] === undefined,
            'Cannot override core semantic keys.',
        );

        // case-insensitive: builder intercepts these props before the semantic lookup; parsed records expose them as own keys.
        assertCustom(
            upperValue,
            'customSemanticMap.value',
            () => !RESERVED_SEMANTIC_KEYS_SET.has(upperValue),
            'Cannot override builder reserved methods.',
        );

        // case-insensitive: stringify/builder resolve semantic keys via uppercase lookup.
        assertCustom(
            upperValue,
            'customSemanticMap.value',
            (v) => !seenUpperValues.has(v as string),
            'Duplicate semantic value.',
        );
        seenUpperValues.add(upperValue);

        onEntry(upperTagKey, trimmedValue, upperValue);
    }
}
