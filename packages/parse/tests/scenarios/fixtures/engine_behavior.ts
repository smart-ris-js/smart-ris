// Copyright 2026 Martin Winkler

import { t } from '../utils/helper.js';
import type { ParseFixtures } from './index.js';

export const ENGINE_BEHAVIOR: ParseFixtures[] = [
    {
        desc: 'multiple TY values array input',
        input: [t('TY', 'UNKNOWN_TYPE'), t('TY', 'JOUR'), t('TY', 'BOOK'), t('TI', 'Sample Article'), t('ER')].join(''),
        expected: {
            default: [{ TY: 'UNKNOWN_TYPE' }, { TY: 'JOUR' }, { TY: 'BOOK', TI: 'Sample Article' }],
        },
    },

    // --- 7. Tag Repair (repairTags) ---

    {
        desc: 'lowercase and whitespace padded tag keys input',
        input: [t('TY', 'JOUR'), t('AB', 'Abstract text'), t('TI', 'Padded Title'), t('ER')].join(''),
        expected: {
            default: [
                {
                    TY: 'JOUR',
                    AB: 'Abstract text',
                    TI: 'Padded Title',
                },
            ],
        },
    },

    // --- 8. Tag Mapping Integration (tagMapping) ---

    {
        desc: 'tagMapping source tags input',
        input: [
            t('TY', 'JOUR'),
            t('AA', 'Mapped Scalar'),
            t('CC', 'Mapped Array 1'),
            t('CC', 'Mapped Array 2'),
            t('ER'),
        ].join(''),
        expected: {
            default: [
                {
                    TY: 'JOUR',
                    BB: 'Mapped Scalar',
                    DD: ['Mapped Array 1', 'Mapped Array 2'],
                },
            ],
        },
    },

    // --- 9. Semantic Unmapping Integration (fromSemantic + customSemanticMap) ---

    {
        desc: 'semantic keys with custom semantic map input',
        input: [
            t('TYPEOFREFERENCE', 'JOUR'),
            t('PRIMARYTITLE', 'Semantic Title'),
            t('EETAG', 'Custom Semantic'),
            t('ER'),
        ].join(''),
        expected: {
            default: [],
            skipInvalidTags_true: [],
        },
    },
];
