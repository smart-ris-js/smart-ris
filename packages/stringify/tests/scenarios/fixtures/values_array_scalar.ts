// Copyright 2026 Martin Winkler

import { t } from '../utils/helper.js';
import type { StringifyFixtures } from './index.js';

export const VALUES_ARRAY_SCALAR: StringifyFixtures[] = [
    // --- Default Scalar/Array Scenarios ---

    {
        desc: 'BB scalar-tag as scalar input',
        input: {
            TY: 'JOUR',
            BB: 'BB-Value',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'BB-Value'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB] scalar-tag as 1-element array input',
        input: {
            TY: 'JOUR',
            BB: ['BB-Value'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'BB-Value'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'BB-Value'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] scalar-tag as multi-element array input',
        input: {
            TY: 'JOUR',
            BB: ['BB-Value1', 'BB-Value2'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'BB-Value1 BB-Value2'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'BB-Value1'), t('ER')].join(''),
        },
    },
    {
        desc: 'DD array-tag as scalar input',
        input: {
            TY: 'JOUR',
            DD: 'DD-Value',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'DD-Value'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD] array-tag as 1-element array input',
        input: {
            TY: 'JOUR',
            DD: ['DD-Value'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'DD-Value'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] array-tag as multi-element array input',
        input: {
            TY: 'JOUR',
            DD: ['DD-Value1', 'DD-Value2'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'DD-Value1'), t('DD', 'DD-Value2'), t('ER')].join(''),
            arrayMergeStrategy_first: [
                // explicitly testing
                t('TY', 'JOUR'),
                t('DD', 'DD-Value1'),
                t('DD', 'DD-Value2'),
                t('ER'),
            ].join(''),
        },
    },

    // --- Empty Array & Empty String Combinations ---

    {
        desc: 'BB empty array input',
        input: {
            TY: 'JOUR',
            BB: [],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('ER')].join(''),
            skipEmptyTags_false: [t('TY', 'JOUR'), t('BB', ''), t('ER')].join(''),
        },
    },
    {
        desc: 'BB empty string input',
        input: {
            TY: 'JOUR',
            BB: '',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('ER')].join(''),
            skipEmptyTags_false: [t('TY', 'JOUR'), t('BB', ''), t('ER')].join(''),
        },
    },
    {
        desc: '[BB] array with 1 empty string input',
        input: {
            TY: 'JOUR',
            BB: [''],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('ER')].join(''),
            skipEmptyTags_false: [t('TY', 'JOUR'), t('BB', ''), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] array with 2 empty strings input',
        input: {
            TY: 'JOUR',
            BB: ['', ''],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('ER')].join(''),
            skipEmptyTags_false: [t('TY', 'JOUR'), t('BB', ''), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, empty] array with valid value and empty string input',
        input: {
            TY: 'JOUR',
            BB: ['BB-Value', ''],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'BB-Value'), t('ER')].join(''),
        },
    },
    {
        desc: '[empty, BB] array with empty string and valid value input',
        input: {
            TY: 'JOUR',
            BB: ['', 'BB-Value'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'BB-Value'), t('ER')].join(''),
        },
    },
    {
        desc: 'DD empty array input',
        input: {
            TY: 'JOUR',
            DD: [],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('ER')].join(''),
            skipEmptyTags_false: [t('TY', 'JOUR'), t('DD', ''), t('ER')].join(''),
        },
    },
    {
        desc: 'DD empty string input',
        input: {
            TY: 'JOUR',
            DD: '',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('ER')].join(''),
            skipEmptyTags_false: [t('TY', 'JOUR'), t('DD', ''), t('ER')].join(''),
        },
    },
    {
        desc: '[DD] array with 1 empty string input',
        input: {
            TY: 'JOUR',
            DD: [''],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('ER')].join(''),
            skipEmptyTags_false: [t('TY', 'JOUR'), t('DD', ''), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] array with 2 empty strings input',
        input: {
            TY: 'JOUR',
            DD: ['', ''],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('ER')].join(''),
            skipEmptyTags_false: [t('TY', 'JOUR'), t('DD', ''), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, empty] array with valid value and empty string input',
        input: {
            TY: 'JOUR',
            DD: ['DD-Value', ''],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'DD-Value'), t('ER')].join(''),
            skipEmptyTags_false: [t('TY', 'JOUR'), t('DD', 'DD-Value'), t('DD', ''), t('ER')].join(''),
        },
    },
    {
        desc: '[empty, DD] array with empty string and valid value input',
        input: {
            TY: 'JOUR',
            DD: ['', 'DD-Value'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'DD-Value'), t('ER')].join(''),
            skipEmptyTags_false: [t('TY', 'JOUR'), t('DD', ''), t('DD', 'DD-Value'), t('ER')].join(''),
        },
    },

    // --- Built-in Default Array Tags (AU, KW) ---

    {
        desc: 'AU built-in array-tag as scalar input',
        input: {
            TY: 'JOUR',
            AU: 'Alpha, A.',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('ER')].join(''),
        },
    },
    {
        desc: '[AU] built-in array-tag as 1-element array input',
        input: {
            TY: 'JOUR',
            AU: ['Alpha, A.'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('ER')].join(''),
        },
    },
    {
        desc: '[AU, AU] built-in array-tag as multi-element array input',
        input: {
            TY: 'JOUR',
            AU: ['Alpha, A.', 'Beta, B.'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('AU', 'Beta, B.'), t('ER')].join(''),
            arrayMergeStrategy_first: [
                // explicitly testing
                t('TY', 'JOUR'),
                t('AU', 'Alpha, A.'),
                t('AU', 'Beta, B.'),
                t('ER'),
            ].join(''),
        },
    },
    {
        desc: '[KW, KW] built-in keyword array-tag as multi-element array input',
        input: {
            TY: 'JOUR',
            KW: ['Keyword1', 'Keyword2'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('KW', 'Keyword1'), t('KW', 'Keyword2'), t('ER')].join(''),
            arrayMergeStrategy_first: [
                // explicitly testing
                t('TY', 'JOUR'),
                t('KW', 'Keyword1'),
                t('KW', 'Keyword2'),
                t('ER'),
            ].join(''),
        },
    },
];
