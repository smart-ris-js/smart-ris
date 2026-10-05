// Copyright 2026 Martin Winkler

import { t } from '../utils/helper.js';
import type { StringifyFixtures } from './index.js';

export const VALUES_STRING_MULTILINE: StringifyFixtures[] = [
    // --- 1. Baseline Single-Line String Formatting ---

    {
        desc: 'standard string input',
        input: {
            TY: 'JOUR',
            AB: 'Hello World',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('AB', 'Hello World'), t('ER')].join(''),
        },
    },
    {
        desc: 'string with leading and trailing spaces input',
        input: {
            TY: 'JOUR',
            AB: '   Hello World   ',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('AB', 'Hello World'), t('ER')].join(''),
            cleanWhitespace_false: [t('TY', 'JOUR'), t('AB', 'Hello World'), t('ER')].join(''),
        },
    },

    // --- 2. Internal Whitespace Normalization (cleanWhitespace) ---

    {
        desc: 'multiple consecutive internal spaces input',
        input: {
            TY: 'JOUR',
            AB: 'Hello     World',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('AB', 'Hello World'), t('ER')].join(''),
            cleanWhitespace_false: [t('TY', 'JOUR'), t('AB', 'Hello     World'), t('ER')].join(''),
        },
    },
    {
        desc: 'internal tabs input',
        input: {
            TY: 'JOUR',
            AB: 'Hello\t\tWorld',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('AB', 'Hello World'), t('ER')].join(''),
            cleanWhitespace_false: [t('TY', 'JOUR'), t('AB', 'Hello\t\tWorld'), t('ER')].join(''),
        },
    },

    // --- 3. Multiline Preservation vs Merging (mergeMultiline) ---

    {
        desc: 'standard multiline input',
        input: {
            TY: 'JOUR',
            AB: 'Hello\nWorld',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('AB', 'Hello\nWorld'), t('ER')].join(''),
            mergeMultiline_true: [t('TY', 'JOUR'), t('AB', 'Hello World'), t('ER')].join(''),
        },
    },
    {
        desc: '3-line multiline string with empty line input',
        input: {
            TY: 'JOUR',
            AB: 'First Line\n\nThird Line',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('AB', 'First Line\n\nThird Line'), t('ER')].join(''),
            mergeMultiline_true: [t('TY', 'JOUR'), t('AB', 'First Line Third Line'), t('ER')].join(''),
        },
    },

    // --- 4. Multiline Indentation Preservation (cleanWhitespace) ---

    {
        desc: 'multiline string with indented sub-lines input',
        input: {
            TY: 'JOUR',
            AB: 'First Line\n  Indented Second Line\n    Deeply Indented Third Line',
        },
        expected: {
            default: [
                t('TY', 'JOUR'),
                t('AB', 'First Line\n  Indented Second Line\n    Deeply Indented Third Line'),
                t('ER'),
            ].join(''),
            mergeMultiline_true: [
                t('TY', 'JOUR'),
                t('AB', 'First Line Indented Second Line Deeply Indented Third Line'),
                t('ER'),
            ].join(''),
        },
    },

    // --- 5. Consecutive Empty Lines & Boundary Trimming (cleanWhitespace) ---

    {
        desc: 'multiline string with 3+ consecutive empty lines input',
        input: {
            TY: 'JOUR',
            AB: 'Top\n\n\n\nBottom',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('AB', 'Top\n\nBottom'), t('ER')].join(''),
            cleanWhitespace_false: [t('TY', 'JOUR'), t('AB', 'Top\n\n\n\nBottom'), t('ER')].join(''),
            mergeMultiline_true: [t('TY', 'JOUR'), t('AB', 'Top Bottom'), t('ER')].join(''),
        },
    },
    {
        desc: 'multiline string with leading and trailing empty lines input',
        input: {
            TY: 'JOUR',
            AB: '\n\nTop\nBottom\n\n',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('AB', 'Top\nBottom'), t('ER')].join(''),
            cleanWhitespace_false: [t('TY', 'JOUR'), t('AB', 'Top\nBottom'), t('ER')].join(''),
            mergeMultiline_true: [t('TY', 'JOUR'), t('AB', 'Top Bottom'), t('ER')].join(''),
        },
    },

    // --- 6. Combined Array of Multiline Strings (BB and DD) ---

    {
        desc: 'BB scalar-tag array with multiline strings input',
        input: {
            TY: 'JOUR',
            BB: ['Line1\nLine2', 'Line3\nLine4'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'Line1\nLine2 Line3\nLine4'), t('ER')].join(''),
            mergeMultiline_true: [t('TY', 'JOUR'), t('BB', 'Line1 Line2 Line3 Line4'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'Line1\nLine2'), t('ER')].join(''),
        },
    },
    {
        desc: 'DD array-tag array with multiline strings input',
        input: {
            TY: 'JOUR',
            DD: ['Line1\nLine2', 'Line3\nLine4'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'Line1\nLine2'), t('DD', 'Line3\nLine4'), t('ER')].join(''),
            mergeMultiline_true: [t('TY', 'JOUR'), t('DD', 'Line1 Line2'), t('DD', 'Line3 Line4'), t('ER')].join(''),
        },
    },
];
