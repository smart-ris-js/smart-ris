// Copyright 2026 Martin Winkler

import { t } from '../utils/helper.js';
import type { StringifyFixtures } from './index.js';

export const ENGINE_BEHAVIOR: StringifyFixtures[] = [
    // --- 1. Deterministic Canonical Tag Ordering ---

    {
        desc: 'unsorted tag keys input',
        input: {
            ZZ: 'Unmapped Tag ZZ',
            TI: 'The Title',
            AU: 'Smith, J.',
            TY: 'JOUR',
            BB: 'Unmapped Tag BB',
        },
        expected: {
            default: [
                t('TY', 'JOUR'),
                t('AU', 'Smith, J.'),
                t('TI', 'The Title'),
                t('BB', 'Unmapped Tag BB'),
                t('ZZ', 'Unmapped Tag ZZ'),
                t('ER'),
            ].join(''),
        },
    },

    // --- 2. Missing TY Tag Fallback (DEFAULT_REFERENCE_TYPE) ---

    {
        desc: 'missing TY tag input',
        input: {
            TI: 'Title Without Type',
            AU: 'Doe, J.',
        },
        expected: {
            default: [t('TY', 'GEN'), t('AU', 'Doe, J.'), t('TI', 'Title Without Type'), t('ER')].join(''),
        },
    },

    // --- 3. Multiple TY Values Resolution ---

    {
        desc: 'multiple TY values array input',
        input: {
            TY: ['UNKNOWN_TYPE', 'JOUR', 'BOOK'],
            TI: 'Sample Article',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('TI', 'Sample Article'), t('ER')].join(''),
        },
    },

    // --- 4. Missing ER Tag Auto-Append & Data Ignored ---

    {
        desc: 'missing ER tag in input record',
        input: {
            TY: 'JOUR',
            TI: 'Main Title',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('TI', 'Main Title'), t('ER')].join(''),
        },
    },
    {
        desc: 'data provided for ER tag input',
        input: {
            TY: 'JOUR',
            TI: 'Main Title',
            ER: 'Should Be Ignored',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('TI', 'Main Title'), t('ER')].join(''),
        },
    },

    // --- 5. Empty Input Object & All-Empty Fields Behavior ---

    {
        desc: 'completely empty input object',
        input: {},
        expected: {
            default: '',
            skipEmptyTags_false: '',
        },
    },
    {
        desc: 'all fields empty input record',
        input: {
            TI: null,
            AU: undefined,
            AB: '',
        },
        expected: {
            default: '',
            skipEmptyTags_false: [t('TY', 'GEN'), t('AU', ''), t('TI', ''), t('AB', ''), t('ER')].join(''),
        },
    },

    // --- 6. Builder Objects (RisBuilder) ---

    {
        desc: 'RisBuilder object input',
        input: {
            raw: () => ({
                TY: ['JOUR'],
                TI: ['Built Title'],
            }),
        },
        expected: {
            default: [t('TY', 'JOUR'), t('TI', 'Built Title'), t('ER')].join(''),
        },
    },

    // --- 7. Tag Repair (repairTags) ---

    {
        desc: 'lowercase and whitespace padded tag keys input',
        input: {
            TY: 'JOUR',
            ab: 'Abstract text',
            '  ti  ': 'Padded Title',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('TI', 'Padded Title'), t('AB', 'Abstract text'), t('ER')].join(''),
        },
    },

    // --- 8. Tag Mapping Integration (tagMapping) ---

    {
        desc: 'tagMapping source tags input',
        input: {
            TY: 'JOUR',
            AA: 'Mapped Scalar',
            CC: ['Mapped Array 1', 'Mapped Array 2'],
        },
        expected: {
            default: [
                t('TY', 'JOUR'),
                t('BB', 'Mapped Scalar'),
                t('DD', 'Mapped Array 1'),
                t('DD', 'Mapped Array 2'),
                t('ER'),
            ].join(''),
        },
    },

    // --- 9. Semantic Unmapping Integration (fromSemantic + customSemanticMap) ---

    {
        desc: 'semantic keys with custom semantic map input',
        input: {
            typeOfReference: 'JOUR',
            primaryTitle: 'Semantic Title',
            EETag: 'Custom Semantic',
        },
        expected: {
            default: [
                t('TY', 'GEN'),
                t('EETAG', 'Custom Semantic'),
                t('PRIMARYTITLE', 'Semantic Title'),
                t('TYPEOFREFERENCE', 'JOUR'),
                t('ER'),
            ].join(''),
            fromSemantic_true: [t('TY', 'JOUR'), t('T1', 'Semantic Title'), t('EE', 'Custom Semantic'), t('ER')].join(
                '',
            ),
            skipInvalidTags_true: '',
        },
    },
];
