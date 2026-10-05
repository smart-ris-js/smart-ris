// Copyright 2026 Martin Winkler

import { t } from '../utils/helper.js';
import type { StringifyFixtures } from './index.js';

export const TAGS_SEMANTIC_MAPPING: StringifyFixtures[] = [
    // --- Semantic Mapping ---

    {
        desc: 'EEtag input',
        input: {
            TY: 'JOUR',
            EETag: 'EE-Value',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('EETAG', 'EE-Value'), t('ER')].join(''),
            skipInvalidTags_true: [t('TY', 'JOUR'), t('ER')].join(''),
            fromSemantic_true: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('ER')].join(''),
        },
    },
    {
        desc: '[EEtag] input',
        input: {
            TY: 'JOUR',
            EETag: ['EE-Value'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('EETAG', 'EE-Value'), t('ER')].join(''),
            skipInvalidTags_true: [t('TY', 'JOUR'), t('ER')].join(''),
            fromSemantic_true: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('ER')].join(''),
        },
    },
    {
        desc: 'EEtag AND EE tag input',
        input: {
            TY: 'JOUR',
            EETag: 'EETag-Value',
            EE: 'EE-Value',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('EETAG', 'EETag-Value'), t('ER')].join(''),
            skipInvalidTags_true: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('ER')].join(''),
            fromSemantic_true: [t('TY', 'JOUR'), t('EE', 'EE-Value EETag-Value'), t('ER')].join(''),
        },
    },
    {
        desc: '[EEtag] AND [EE] tag input',
        input: {
            TY: 'JOUR',
            EETag: ['EETag-Value'],
            EE: ['EE-Value'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('EETAG', 'EETag-Value'), t('ER')].join(''),
            skipInvalidTags_true: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('ER')].join(''),
            fromSemantic_true: [t('TY', 'JOUR'), t('EE', 'EE-Value EETag-Value'), t('ER')].join(''),
        },
    },
    {
        desc: '[EEtag, EEtag] AND [EE] tag input',
        input: {
            TY: 'JOUR',
            EETag: ['EETag-Value1', 'EETag-Value2'],
            EE: ['EE-Value'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('EETAG', 'EETag-Value1 EETag-Value2'), t('ER')].join(''),
            skipInvalidTags_true: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('ER')].join(''),
            fromSemantic_true: [t('TY', 'JOUR'), t('EE', 'EE-Value EETag-Value1 EETag-Value2'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('EETAG', 'EETag-Value1'), t('ER')].join(
                '',
            ),
        },
    },
    {
        desc: '[EEtag] AND [EE, EE] tag input',
        input: {
            TY: 'JOUR',
            EETag: ['EETag-Value'],
            EE: ['EE-Value1', 'EE-Value2'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('EE', 'EE-Value1 EE-Value2'), t('EETAG', 'EETag-Value'), t('ER')].join(''),
            skipInvalidTags_true: [t('TY', 'JOUR'), t('EE', 'EE-Value1 EE-Value2'), t('ER')].join(''),
            fromSemantic_true: [t('TY', 'JOUR'), t('EE', 'EE-Value1 EE-Value2 EETag-Value'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('EE', 'EE-Value1'), t('EETAG', 'EETag-Value'), t('ER')].join(
                '',
            ),
        },
    },
    {
        desc: '[EEtag, EEtag] AND [EE, EE] tag input',
        input: {
            TY: 'JOUR',
            EETag: ['EETag-Value1', 'EETag-Value2'],
            EE: ['EE-Value1', 'EE-Value2'],
        },
        expected: {
            default: [
                t('TY', 'JOUR'),
                t('EE', 'EE-Value1 EE-Value2'),
                t('EETAG', 'EETag-Value1 EETag-Value2'),
                t('ER'),
            ].join(''),
            skipInvalidTags_true: [t('TY', 'JOUR'), t('EE', 'EE-Value1 EE-Value2'), t('ER')].join(''),
            fromSemantic_true: [
                t('TY', 'JOUR'),
                t('EE', 'EE-Value1 EE-Value2 EETag-Value1 EETag-Value2'),
                t('ER'),
            ].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('EE', 'EE-Value1'), t('EETAG', 'EETag-Value1'), t('ER')].join(
                '',
            ),
        },
    },
    {
        desc: 'EEtag (scalar) AND [EE, EE] tag input',
        input: {
            TY: 'JOUR',
            EETag: 'EETag-Value',
            EE: ['EE-Value1', 'EE-Value2'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('EE', 'EE-Value1 EE-Value2'), t('EETAG', 'EETag-Value'), t('ER')].join(''),
            skipInvalidTags_true: [t('TY', 'JOUR'), t('EE', 'EE-Value1 EE-Value2'), t('ER')].join(''),
            fromSemantic_true: [t('TY', 'JOUR'), t('EE', 'EE-Value1 EE-Value2 EETag-Value'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('EE', 'EE-Value1'), t('EETAG', 'EETag-Value'), t('ER')].join(
                '',
            ),
        },
    },
    {
        desc: '[EEtag, EEtag] AND EE tag (scalar) input',
        input: {
            TY: 'JOUR',
            EETag: ['EETag-Value1', 'EETag-Value2'],
            EE: 'EE-Value',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('EETAG', 'EETag-Value1 EETag-Value2'), t('ER')].join(''),
            skipInvalidTags_true: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('ER')].join(''),
            fromSemantic_true: [t('TY', 'JOUR'), t('EE', 'EE-Value EETag-Value1 EETag-Value2'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('EETAG', 'EETag-Value1'), t('ER')].join(
                '',
            ),
        },
    },
    {
        desc: 'array-value standard tag AND semantic tag',
        input: {
            TY: 'JOUR',
            TI: 'Title',
            AU: ['Alpha, A.', 'Beta, B.'],
            author: ['Gamma, C.'],
        },
        expected: {
            default: [
                t('TY', 'JOUR'),
                t('AU', 'Alpha, A.'),
                t('AU', 'Beta, B.'),
                t('TI', 'Title'),
                t('AUTHOR', 'Gamma, C.'),
                t('ER'),
            ].join(''),
            skipInvalidTags_true: [
                t('TY', 'JOUR'),
                t('AU', 'Alpha, A.'),
                t('AU', 'Beta, B.'),
                t('TI', 'Title'),
                t('ER'),
            ].join(''),
            fromSemantic_true: [
                t('TY', 'JOUR'),
                t('AU', 'Alpha, A.'),
                t('AU', 'Beta, B.'),
                t('AU', 'Gamma, C.'),
                t('TI', 'Title'),
                t('ER'),
            ].join(''),
        },
    },
    {
        desc: 'scalar-value standard tag AND semantic tag',
        input: {
            TY: 'JOUR',
            TI: 'Title1',
            title: 'Title2',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('TI', 'Title1'), t('TITLE', 'Title2'), t('ER')].join(''),
            skipInvalidTags_true: [t('TY', 'JOUR'), t('TI', 'Title1'), t('ER')].join(''),
            fromSemantic_true: [t('TY', 'JOUR'), t('TI', 'Title1 Title2'), t('ER')].join(''),
        },
    },
    {
        desc: 'scalar-value standard tag AND array semantic tag (stays unresolved cause we assume proper rawTag input)',
        input: {
            TY: 'JOUR',
            AU: 'Alpha, A.',
            author: ['Beta, B.', 'Gamma, C.'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('AUTHOR', 'Beta, B. Gamma, C.'), t('ER')].join(''),
            skipInvalidTags_true: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('ER')].join(''),
            fromSemantic_true: [
                t('TY', 'JOUR'),
                t('AU', 'Alpha, A.'),
                t('AU', 'Beta, B.'),
                t('AU', 'Gamma, C.'),
                t('ER'),
            ].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('AUTHOR', 'Beta, B.'), t('ER')].join(
                '',
            ),
        },
    },
    {
        desc: 'array-value standard tag AND scalar semantic tag',
        input: {
            TY: 'JOUR',
            AU: ['Alpha, A.', 'Beta, B.'],
            author: 'Gamma, C.',
        },
        expected: {
            default: [
                t('TY', 'JOUR'),
                t('AU', 'Alpha, A.'),
                t('AU', 'Beta, B.'),
                t('AUTHOR', 'Gamma, C.'),
                t('ER'),
            ].join(''),
            skipInvalidTags_true: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('AU', 'Beta, B.'), t('ER')].join(''),
            fromSemantic_true: [
                t('TY', 'JOUR'),
                t('AU', 'Alpha, A.'),
                t('AU', 'Beta, B.'),
                t('AU', 'Gamma, C.'),
                t('ER'),
            ].join(''),
        },
    },
    {
        desc: 'array-value standard tag AND array semantic tag for title',
        input: {
            TY: 'JOUR',
            TI: ['Title1', 'Title2'],
            title: ['Title3', 'Title4'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('TI', 'Title1 Title2'), t('TITLE', 'Title3 Title4'), t('ER')].join(''),
            skipInvalidTags_true: [t('TY', 'JOUR'), t('TI', 'Title1 Title2'), t('ER')].join(''),
            fromSemantic_true: [t('TY', 'JOUR'), t('TI', 'Title1 Title2 Title3 Title4'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('TI', 'Title1'), t('TITLE', 'Title3'), t('ER')].join(''),
        },
    },

    // --- Tag Mapping ---

    {
        desc: 'input AA and CC (mapping)',
        input: {
            TY: 'JOUR',
            AA: 'A-Value',
            CC: 'C-Value',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'A-Value'), t('DD', 'C-Value'), t('ER')].join(''),
        },
    },
    {
        desc: 'input AA and BB (mapping - scalar)',
        input: {
            TY: 'JOUR',
            AA: 'A-Value',
            BB: 'B-Value',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'B-Value A-Value'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'B-Value'), t('ER')].join(''),
        },
    },
    {
        desc: 'input [AA] and [BB] (mapping - scalar)',
        input: {
            TY: 'JOUR',
            AA: ['A-Value'],
            BB: ['B-Value'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'B-Value A-Value'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'B-Value'), t('ER')].join(''),
        },
    },
    {
        desc: 'input [AA, AA] and [BB] (mapping - scalar)',
        input: {
            TY: 'JOUR',
            AA: ['A-Value1', 'A-Value2'],
            BB: ['B-Value'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'B-Value A-Value1 A-Value2'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'B-Value'), t('ER')].join(''),
        },
    },
    {
        desc: 'input [AA] and [BB, BB] (mapping - scalar)',
        input: {
            TY: 'JOUR',
            AA: ['A-Value'],
            BB: ['B-Value1', 'B-Value2'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'B-Value1 B-Value2 A-Value'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'B-Value1'), t('ER')].join(''),
        },
    },
    {
        desc: 'input [AA, AA] and [BB, BB] (mapping - scalar)',
        input: {
            TY: 'JOUR',
            AA: ['A-Value1', 'A-Value2'],
            BB: ['B-Value', 'B-Value2'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'B-Value B-Value2 A-Value1 A-Value2'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'B-Value'), t('ER')].join(''),
        },
    },
    {
        desc: 'input CC and DD (mapping - array)',
        input: {
            TY: 'JOUR',
            CC: 'C-Value',
            DD: 'D-Value',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'D-Value'), t('DD', 'C-Value'), t('ER')].join(''),
        },
    },
    {
        desc: 'input [CC] and [DD] (mapping - array)',
        input: {
            TY: 'JOUR',
            CC: ['C-Value'],
            DD: ['D-Value'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'D-Value'), t('DD', 'C-Value'), t('ER')].join(''),
        },
    },
    {
        desc: 'input [CC, CC] and [DD] (mapping - array)',
        input: {
            TY: 'JOUR',
            CC: ['C-Value1', 'C-Value2'],
            DD: ['D-Value'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'D-Value'), t('DD', 'C-Value1'), t('DD', 'C-Value2'), t('ER')].join(''),
        },
    },
    {
        desc: 'input [CC, CC] and [DD, DD] (mapping - array)',
        input: {
            TY: 'JOUR',
            CC: ['C-Value1', 'C-Value2'],
            DD: ['D-Value1', 'D-Value2'],
        },
        expected: {
            default: [
                t('TY', 'JOUR'),
                t('DD', 'D-Value1'),
                t('DD', 'D-Value2'),
                t('DD', 'C-Value1'),
                t('DD', 'C-Value2'),
                t('ER'),
            ].join(''),
        },
    },
    {
        desc: 'input AA (scalar) and [BB, BB] (mapping - scalar)',
        input: {
            TY: 'JOUR',
            AA: 'A-Value',
            BB: ['B-Value1', 'B-Value2'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'B-Value1 B-Value2 A-Value'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'B-Value1'), t('ER')].join(''),
        },
    },
    {
        desc: 'input [AA, AA] and BB (scalar) (mapping - scalar)',
        input: {
            TY: 'JOUR',
            AA: ['A-Value1', 'A-Value2'],
            BB: 'B-Value',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'B-Value A-Value1 A-Value2'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'B-Value'), t('ER')].join(''),
        },
    },
    {
        desc: 'input CC (scalar) and [DD, DD] (mapping - array)',
        input: {
            TY: 'JOUR',
            CC: 'C-Value',
            DD: ['D-Value1', 'D-Value2'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'D-Value1'), t('DD', 'D-Value2'), t('DD', 'C-Value'), t('ER')].join(''),
        },
    },
    {
        desc: 'input [CC, CC] and DD (scalar) (mapping - array)',
        input: {
            TY: 'JOUR',
            CC: ['C-Value1', 'C-Value2'],
            DD: 'D-Value',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'D-Value'), t('DD', 'C-Value1'), t('DD', 'C-Value2'), t('ER')].join(''),
        },
    },
    {
        desc: 'input [CC] and [DD, DD] (mapping - array)',
        input: {
            TY: 'JOUR',
            CC: ['C-Value'],
            DD: ['D-Value1', 'D-Value2'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'D-Value1'), t('DD', 'D-Value2'), t('DD', 'C-Value'), t('ER')].join(''),
        },
    },
];
