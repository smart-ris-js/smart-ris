// Copyright 2026 Martin Winkler

import { t } from '../utils/helper.js';
import type { ParseFixtures } from './index.js';

export const VALUES_ARRAY_SCALAR: ParseFixtures[] = [
    // --- Default Scalar/Array Scenarios ---

    {
        desc: 'BB scalar-tag as scalar input',
        input: [t('TY', 'JOUR'), t('BB', 'BB-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'BB-Value',
            },
        },
    },
    {
        desc: '[BB] scalar-tag as 1-element array input',
        input: [t('TY', 'JOUR'), t('BB', 'BB-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'BB-Value',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: 'BB-Value',
            },
        },
    },
    {
        desc: '[BB, BB] scalar-tag as multi-element array input',
        input: [t('TY', 'JOUR'), t('BB', 'BB-Value1'), t('BB', 'BB-Value2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'BB-Value1 BB-Value2',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: 'BB-Value1',
            },
        },
    },
    {
        desc: 'DD array-tag as scalar input',
        input: [t('TY', 'JOUR'), t('DD', 'DD-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['DD-Value'],
            },
        },
    },
    {
        desc: '[DD] array-tag as 1-element array input',
        input: [t('TY', 'JOUR'), t('DD', 'DD-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['DD-Value'],
            },
        },
    },
    {
        desc: '[DD, DD] array-tag as multi-element array input',
        input: [t('TY', 'JOUR'), t('DD', 'DD-Value1'), t('DD', 'DD-Value2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['DD-Value1', 'DD-Value2'],
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                DD: ['DD-Value1', 'DD-Value2'],
            },
        },
    },

    // --- Empty Array & Empty String Combinations ---

    {
        desc: 'BB empty array input',
        input: [t('TY', 'JOUR'), t('BB', ''), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
            },
            skipEmptyTags_false: {
                TY: 'JOUR',
                BB: null,
            },
        },
    },
    {
        desc: 'BB empty string input',
        input: [t('TY', 'JOUR'), t('BB', ''), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
            },
            skipEmptyTags_false: {
                TY: 'JOUR',
                BB: null,
            },
        },
    },
    {
        desc: '[BB] array with 1 empty string input',
        input: [t('TY', 'JOUR'), t('BB', ''), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
            },
            skipEmptyTags_false: {
                TY: 'JOUR',
                BB: null,
            },
        },
    },
    {
        desc: '[BB, BB] array with 2 empty strings input',
        input: [t('TY', 'JOUR'), t('BB', ''), t('BB', ''), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
            },
            skipEmptyTags_false: {
                TY: 'JOUR',
                BB: null,
            },
        },
    },
    {
        desc: '[BB, empty] array with valid value and empty string input',
        input: [t('TY', 'JOUR'), t('BB', 'BB-Value'), t('BB', ''), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'BB-Value',
            },
            skipEmptyTags_false: {
                TY: 'JOUR',
                BB: 'BB-Value',
            },
        },
    },
    {
        desc: '[empty, BB] array with empty string and valid value input',
        input: [t('TY', 'JOUR'), t('BB', ''), t('BB', 'BB-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'BB-Value',
            },
            skipEmptyTags_false: {
                TY: 'JOUR',
                BB: 'BB-Value',
            },
        },
    },
    {
        desc: 'DD empty array input',
        input: [t('TY', 'JOUR'), t('DD', ''), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
            },
            skipEmptyTags_false: {
                TY: 'JOUR',
                DD: [null],
            },
        },
    },
    {
        desc: 'DD empty string input',
        input: [t('TY', 'JOUR'), t('DD', ''), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
            },
            skipEmptyTags_false: {
                TY: 'JOUR',
                DD: [null],
            },
        },
    },
    {
        desc: '[DD] array with 1 empty string input',
        input: [t('TY', 'JOUR'), t('DD', ''), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
            },
            skipEmptyTags_false: {
                TY: 'JOUR',
                DD: [null],
            },
        },
    },
    {
        desc: '[DD, DD] array with 2 empty strings input',
        input: [t('TY', 'JOUR'), t('DD', ''), t('DD', ''), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
            },
            skipEmptyTags_false: {
                TY: 'JOUR',
                DD: [null, null],
            },
        },
    },
    {
        desc: '[DD, empty] array with valid value and empty string input',
        input: [t('TY', 'JOUR'), t('DD', 'DD-Value'), t('DD', ''), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['DD-Value'],
            },
            skipEmptyTags_false: {
                TY: 'JOUR',
                DD: ['DD-Value', null],
            },
        },
    },
    {
        desc: '[empty, DD] array with empty string and valid value input',
        input: [t('TY', 'JOUR'), t('DD', ''), t('DD', 'DD-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['DD-Value'],
            },
            skipEmptyTags_false: {
                TY: 'JOUR',
                DD: [null, 'DD-Value'],
            },
        },
    },

    // --- Built-in Default Array Tags (AU, KW) ---

    {
        desc: 'AU built-in array-tag as scalar input',
        input: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AU: ['Alpha, A.'],
            },
        },
    },
    {
        desc: '[AU] built-in array-tag as 1-element array input',
        input: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AU: ['Alpha, A.'],
            },
        },
    },
    {
        desc: '[AU, AU] built-in array-tag as multi-element array input',
        input: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('AU', 'Beta, B.'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Beta, B.'],
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Beta, B.'],
            },
        },
    },
    {
        desc: '[KW, KW] built-in keyword array-tag as multi-element array input',
        input: [t('TY', 'JOUR'), t('KW', 'Keyword1'), t('KW', 'Keyword2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                KW: ['Keyword1', 'Keyword2'],
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                KW: ['Keyword1', 'Keyword2'],
            },
        },
    },

    // --- Custom Semantic Map (CRIT-P3) ---

    {
        desc: '[EE, EE] custom semantic tag multi-element array input',
        input: [t('TY', 'JOUR'), t('EE', 'EE-Value1'), t('EE', 'EE-Value2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                EE: 'EE-Value1',
            },
            toSemantic_true: {
                typeOfReference: 'JOUR',
                EETag: 'EE-Value1 EE-Value2',
            },
        },
    },
];
