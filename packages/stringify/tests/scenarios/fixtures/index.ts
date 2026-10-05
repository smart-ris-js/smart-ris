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

export interface StringifyFixtures {
    desc: string;
    input: Record<string, any>;
    expected: {
        default: string;
        cleanWhitespace_false?: string;
        mergeMultiline_true?: string;
        repairTags_false?: string;
        skipInvalidTags_true?: string;
        skipEmptyTags_false?: string;
        fromSemantic_true?: string;
        //customSemanticMap?: string;
        arrayMergeStrategy_first?: string;
        useSmartTypes_true?: string;
        //smartCastSchema?: string;
        //customArrayTags?: string;
        //tagMapping?: string;
        //eol?: string;
        //dateFormat?: string;
    };
}
