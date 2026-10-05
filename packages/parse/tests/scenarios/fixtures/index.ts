// Copyright 2026 Martin Winkler

import { ENGINE_BEHAVIOR } from './engine_behavior.js';
import { TAGS_SEMANTIC_MAPPING } from './tags_semantic_mapping.js';
import { VALUES_ARRAY_SCALAR } from './values_array_scalar.js';
import { VALUES_STRING_MULTILINE } from './values_string_multiline.js';
import { VALUES_TYPES } from './values_types.js';

export const allFixtures = [
    ...ENGINE_BEHAVIOR,
    ...TAGS_SEMANTIC_MAPPING,
    ...VALUES_ARRAY_SCALAR,
    ...VALUES_STRING_MULTILINE,
    ...VALUES_TYPES,
];

export interface ParseFixtures {
    desc: string;
    input: string;
    expected: {
        default: Record<string, unknown> | Record<string, unknown>[];
        repairTags_true?: Record<string, unknown> | Record<string, unknown>[];
        repairTags_true_skipInvalidTags_true?: Record<string, unknown> | Record<string, unknown>[];
        repairTags_true_toSemantic_true?: Record<string, unknown> | Record<string, unknown>[];
        repairTags_true_arrayMergeStrategy_first?: Record<string, unknown> | Record<string, unknown>[];
        skipInvalidTags_true?: Record<string, unknown> | Record<string, unknown>[];
        skipEmptyTags_false?: Record<string, unknown> | Record<string, unknown>[];
        cleanWhitespace_false?: Record<string, unknown> | Record<string, unknown>[];
        mergeMultiline_true?: Record<string, unknown> | Record<string, unknown>[];
        toSemantic_true?: Record<string, unknown> | Record<string, unknown>[];
        arrayMergeStrategy_first?: Record<string, unknown> | Record<string, unknown>[];
        useSmartTypes_true?: Record<string, unknown> | Record<string, unknown>[];
        //customSemanticMap?: any;
        //smartCastSchema?: any;
        //customArrayTags?: any;
        //tagMapping?: any;
        //eol?: any;
        //dateFormat?: any;
        //logLevel?: any;
    };
}
