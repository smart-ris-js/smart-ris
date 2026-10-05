// Copyright 2026 Martin Winkler

import { t } from '../utils/helper.js';
import type { ParseFixtures } from './index.js';

export const VALUES_STRING_MULTILINE: ParseFixtures[] = [
    // --- 1. Baseline Single-Line String Formatting ---

    {
        desc: 'standard string input',
        input: [t('TY', 'JOUR'), t('AB', 'Hello World'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AB: 'Hello World',
            },
        },
    },
    {
        desc: 'string with leading and trailing spaces input',
        input: [t('TY', 'JOUR'), t('AB', '   Hello World   '), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AB: 'Hello World',
            },
        },
    },

    // --- 2. Internal Whitespace Normalization (cleanWhitespace) ---

    {
        desc: 'multiple consecutive internal spaces input',
        input: [t('TY', 'JOUR'), t('AB', 'Hello    World'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AB: 'Hello World',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                AB: 'Hello    World',
            },
        },
    },
    {
        desc: 'internal tabs input',
        input: [t('TY', 'JOUR'), t('AB', 'Hello\t\tWorld'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AB: 'Hello World',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                AB: 'Hello\t\tWorld',
            },
        },
    },

    // --- 3. Multiline Preservation vs Merging (mergeMultiline) ---

    {
        desc: 'standard multiline input',
        input: [t('TY', 'JOUR'), t('AB', 'Hello\nWorld'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AB: 'Hello\nWorld',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                AB: 'Hello World',
            },
        },
    },
    {
        desc: '3-line multiline string with empty line input',
        input: [t('TY', 'JOUR'), t('AB', 'First Line\n\nThird Line'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AB: 'First Line\n\nThird Line',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                AB: 'First Line Third Line',
            },
        },
    },

    // --- 4. Multiline Indentation Preservation (cleanWhitespace) ---

    {
        desc: 'multiline string with indented sub-lines input',
        input: [
            t('TY', 'JOUR'),
            t('AB', 'First Line\n  Indented Second Line\n    Deeply Indented Third Line'),
            t('ER'),
        ].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AB: 'First Line\n  Indented Second Line\n    Deeply Indented Third Line',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                AB: 'First Line Indented Second Line Deeply Indented Third Line',
            },
        },
    },

    // --- 5. Consecutive Empty Lines & Boundary Trimming (cleanWhitespace) ---

    {
        desc: 'multiline string with 3+ consecutive empty lines input',
        input: [t('TY', 'JOUR'), t('AB', 'Top\n\n\n\nBottom'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AB: 'Top\n\nBottom',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                AB: 'Top\n\n\n\nBottom',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                AB: 'Top Bottom',
            },
        },
    },
    {
        desc: 'multiline string with leading and trailing empty lines input',
        input: [t('TY', 'JOUR'), t('AB', '\n\nTop\nBottom\n\n'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AB: 'Top\nBottom',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                AB: 'Top\nBottom\n\n',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                AB: 'Top Bottom',
            },
        },
    },

    // --- 6. Combined Array of Multiline Strings (BB and DD) ---

    {
        desc: 'BB scalar-tag array with multiline strings input',
        input: [t('TY', 'JOUR'), t('BB', 'Line1\nLine2'), t('BB', 'Line3\nLine4'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'Line1\nLine2 Line3\nLine4',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                BB: 'Line1 Line2 Line3 Line4',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: 'Line1\nLine2',
            },
        },
    },
    {
        desc: 'DD array-tag array with multiline strings input',
        input: [t('TY', 'JOUR'), t('DD', 'Line1\nLine2'), t('DD', 'Line3\nLine4'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['Line1\nLine2', 'Line3\nLine4'],
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                DD: ['Line1 Line2', 'Line3 Line4'],
            },
        },
    },

    // --- 7. Empty Entry Followed by Continuation Lines (skipEmptyTags) ---

    {
        desc: 'DD array-tag with empty 2nd entry followed by continuation line input',
        input: [t('TY', 'JOUR'), t('DD', 'DD-Value1'), t('DD', '\nDD-Value2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['DD-Value1', 'DD-Value2'],
            },
        },
    },
    {
        desc: 'AU built-in array-tag with empty 2nd entry followed by continuation line input',
        input: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('AU', '\nBeta, B.'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Beta, B.'],
            },
        },
    },
    {
        desc: 'BB scalar-tag with empty 2nd entry followed by continuation line input',
        input: [t('TY', 'JOUR'), t('BB', 'BB-Value1'), t('BB', '\nBB-Value2'), t('ER')].join(''),
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
        desc: 'DD array-tag with empty 2nd entry followed by empty line and multiline continuation input',
        input: [t('TY', 'JOUR'), t('DD', 'DD-Value1'), t('DD', '\n\nLine A\nLine B'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['DD-Value1', 'Line A\nLine B'],
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                DD: ['DD-Value1', 'Line A Line B'],
            },
        },
    },
    {
        desc: 'DD array-tag with other tag in between and empty 2nd entry followed by continuation line input',
        input: [t('TY', 'JOUR'), t('DD', 'DD-Value1'), t('BB', 'BB-Value'), t('DD', '\nDD-Value2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['DD-Value1', 'DD-Value2'],
                BB: 'BB-Value',
            },
        },
    },
    {
        desc: 'DD array-tag with empty 2nd entry followed by empty line only input',
        input: [t('TY', 'JOUR'), t('DD', 'DD-Value1'), t('DD', '\n'), t('BB', 'BB-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['DD-Value1'],
                BB: 'BB-Value',
            },
            skipEmptyTags_false: {
                TY: 'JOUR',
                DD: ['DD-Value1', null],
                BB: 'BB-Value',
            },
        },
    },
];
