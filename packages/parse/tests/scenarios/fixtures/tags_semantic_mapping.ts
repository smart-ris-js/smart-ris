// Copyright 2026 Martin Winkler

import { t } from '../utils/helper.js';
import type { ParseFixtures } from './index.js';

export const TAGS_SEMANTIC_MAPPING: ParseFixtures[] = [
    // --- Semantic Mapping ---

    {
        desc: 'EEtag input',
        input: [t('TY', 'JOUR'), t('EETAG', 'EE-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR\nEETAG - EE-Value',
            },
            cleanWhitespace_false: {
                TY: 'JOUR\nEETAG  - EE-Value',
            },
            mergeMultiline_true: {
                TY: 'JOUR EETAG - EE-Value',
            },
            repairTags_true: {
                TY: 'JOUR',
                EETAG: 'EE-Value',
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                EETag: 'EE-Value',
            },
        },
    },
    {
        desc: '[EEtag] input',
        input: [t('TY', 'JOUR'), t('EETAG', 'EE-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR\nEETAG - EE-Value',
            },
            cleanWhitespace_false: {
                TY: 'JOUR\nEETAG  - EE-Value',
            },
            mergeMultiline_true: {
                TY: 'JOUR EETAG - EE-Value',
            },
            repairTags_true: {
                TY: 'JOUR',
                EETAG: 'EE-Value',
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                EETag: 'EE-Value',
            },
        },
    },
    {
        desc: 'EEtag AND EE tag input',
        input: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('EETAG', 'EETag-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                EE: 'EE-Value\nEETAG - EETag-Value',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                EE: 'EE-Value\nEETAG  - EETag-Value',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                EE: 'EE-Value EETAG - EETag-Value',
            },
            repairTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value',
                EETAG: 'EETag-Value',
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value',
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                EETag: 'EE-Value EETag-Value',
            },
        },
    },
    {
        desc: '[EEtag] AND [EE] tag input',
        input: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('EETAG', 'EETag-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                EE: 'EE-Value\nEETAG - EETag-Value',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                EE: 'EE-Value\nEETAG  - EETag-Value',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                EE: 'EE-Value EETAG - EETag-Value',
            },
            repairTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value',
                EETAG: 'EETag-Value',
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value',
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                EETag: 'EE-Value EETag-Value',
            },
        },
    },
    {
        desc: '[EEtag, EEtag] AND [EE] tag input',
        input: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('EETAG', 'EETag-Value1 EETag-Value2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                EE: 'EE-Value\nEETAG - EETag-Value1 EETag-Value2',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                EE: 'EE-Value\nEETAG  - EETag-Value1 EETag-Value2',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                EE: 'EE-Value EETAG - EETag-Value1 EETag-Value2',
            },
            repairTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value',
                EETAG: 'EETag-Value1 EETag-Value2',
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value',
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                EETag: 'EE-Value EETag-Value1 EETag-Value2',
            },
        },
    },
    {
        desc: '[EEtag] AND [EE, EE] tag input',
        input: [t('TY', 'JOUR'), t('EE', 'EE-Value1 EE-Value2'), t('EETAG', 'EETag-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2\nEETAG - EETag-Value',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2\nEETAG  - EETag-Value',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2 EETAG - EETag-Value',
            },
            repairTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2',
                EETAG: 'EETag-Value',
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2',
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                EETag: 'EE-Value1 EE-Value2 EETag-Value',
            },
        },
    },
    {
        desc: '[EEtag, EEtag] AND [EE, EE] tag input',
        input: [t('TY', 'JOUR'), t('EE', 'EE-Value1 EE-Value2'), t('EETAG', 'EETag-Value1 EETag-Value2'), t('ER')].join(
            '',
        ),
        expected: {
            default: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2\nEETAG - EETag-Value1 EETag-Value2',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2\nEETAG  - EETag-Value1 EETag-Value2',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2 EETAG - EETag-Value1 EETag-Value2',
            },
            repairTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2',
                EETAG: 'EETag-Value1 EETag-Value2',
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2',
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                EETag: 'EE-Value1 EE-Value2 EETag-Value1 EETag-Value2',
            },
        },
    },
    {
        desc: 'EEtag (scalar) AND [EE, EE] tag input',
        input: [t('TY', 'JOUR'), t('EE', 'EE-Value1 EE-Value2'), t('EETAG', 'EETag-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2\nEETAG - EETag-Value',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2\nEETAG  - EETag-Value',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2 EETAG - EETag-Value',
            },
            repairTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2',
                EETAG: 'EETag-Value',
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value1 EE-Value2',
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                EETag: 'EE-Value1 EE-Value2 EETag-Value',
            },
        },
    },
    {
        desc: '[EEtag, EEtag] AND EE tag (scalar) input',
        input: [t('TY', 'JOUR'), t('EE', 'EE-Value'), t('EETAG', 'EETag-Value1 EETag-Value2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                EE: 'EE-Value\nEETAG - EETag-Value1 EETag-Value2',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                EE: 'EE-Value\nEETAG  - EETag-Value1 EETag-Value2',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                EE: 'EE-Value EETAG - EETag-Value1 EETag-Value2',
            },
            repairTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value',
                EETAG: 'EETag-Value1 EETag-Value2',
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                EE: 'EE-Value',
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                EETag: 'EE-Value EETag-Value1 EETag-Value2',
            },
        },
    },
    {
        desc: 'array-value standard tag AND semantic tag',
        input: [
            t('TY', 'JOUR'),
            t('AU', 'Alpha, A.'),
            t('AU', 'Beta, B.'),
            t('TI', 'Title'),
            t('AUTHOR', 'Gamma, C.'),
            t('ER'),
        ].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Beta, B.'],
                TI: 'Title\nAUTHOR - Gamma, C.',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Beta, B.'],
                TI: 'Title\nAUTHOR  - Gamma, C.',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Beta, B.'],
                TI: 'Title AUTHOR - Gamma, C.',
            },
            repairTags_true: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Beta, B.'],
                TI: 'Title',
                AUTHOR: ['Gamma, C.'],
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Beta, B.'],
                TI: 'Title',
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                author: ['Alpha, A.', 'Beta, B.', 'Gamma, C.'],
                title: 'Title',
            },
        },
    },
    {
        desc: 'scalar-value standard tag AND semantic tag',
        input: [t('TY', 'JOUR'), t('TI', 'Title1'), t('TITLE', 'Title2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                TI: 'Title1\nTITLE - Title2',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                TI: 'Title1\nTITLE  - Title2',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                TI: 'Title1 TITLE - Title2',
            },
            repairTags_true: {
                TY: 'JOUR',
                TI: 'Title1',
                TITLE: 'Title2',
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                TI: 'Title1',
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                title: 'Title1 Title2',
            },
        },
    },
    {
        desc: 'scalar-value standard tag AND array semantic tag',
        input: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('AUTHOR', 'Beta, B.'), t('AUTHOR', 'Gamma, C.'), t('ER')].join(
            '',
        ),
        expected: {
            default: {
                TY: 'JOUR',
                AU: ['Alpha, A.\nAUTHOR - Beta, B.\nAUTHOR - Gamma, C.'],
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                AU: ['Alpha, A.\nAUTHOR  - Beta, B.\nAUTHOR  - Gamma, C.'],
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                AU: ['Alpha, A. AUTHOR - Beta, B. AUTHOR - Gamma, C.'],
            },
            repairTags_true: {
                TY: 'JOUR',
                AU: ['Alpha, A.'],
                AUTHOR: ['Beta, B.', 'Gamma, C.'],
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                AU: ['Alpha, A.'],
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                author: ['Alpha, A.', 'Beta, B.', 'Gamma, C.'],
            },
            repairTags_true_arrayMergeStrategy_first: {
                TY: 'JOUR',
                AU: ['Alpha, A.'],
                AUTHOR: ['Beta, B.', 'Gamma, C.'],
            },
        },
    },
    {
        desc: 'array-value standard tag AND scalar semantic tag',
        input: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('AU', 'Beta, B.'), t('AUTHOR', 'Gamma, C.'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Beta, B.\nAUTHOR - Gamma, C.'],
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Beta, B.\nAUTHOR  - Gamma, C.'],
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Beta, B. AUTHOR - Gamma, C.'],
            },
            repairTags_true: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Beta, B.'],
                AUTHOR: ['Gamma, C.'],
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Beta, B.'],
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                author: ['Alpha, A.', 'Beta, B.', 'Gamma, C.'],
            },
        },
    },
    {
        desc: 'array-value standard tag AND array semantic tag for title',
        input: [t('TY', 'JOUR'), t('TI', 'Title1 Title2'), t('TITLE', 'Title3 Title4'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                TI: 'Title1 Title2\nTITLE - Title3 Title4',
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                TI: 'Title1 Title2\nTITLE  - Title3 Title4',
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                TI: 'Title1 Title2 TITLE - Title3 Title4',
            },
            repairTags_true: {
                TY: 'JOUR',
                TI: 'Title1 Title2',
                TITLE: 'Title3 Title4',
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                TI: 'Title1 Title2',
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                title: 'Title1 Title2 Title3 Title4',
            },
        },
    },

    // --- Semantic Mapping Merge Order (first seen tag array first) ---

    {
        desc: 'semantic tag BEFORE standard array tag input',
        input: [t('TY', 'JOUR'), t('AUTHOR', 'Alpha, A.'), t('AU', 'Beta, B.'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR\nAUTHOR - Alpha, A.',
                AU: ['Beta, B.'],
            },
            cleanWhitespace_false: {
                TY: 'JOUR\nAUTHOR  - Alpha, A.',
                AU: ['Beta, B.'],
            },
            mergeMultiline_true: {
                TY: 'JOUR AUTHOR - Alpha, A.',
                AU: ['Beta, B.'],
            },
            repairTags_true: {
                TY: 'JOUR',
                AUTHOR: ['Alpha, A.'],
                AU: ['Beta, B.'],
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                AU: ['Beta, B.'],
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                author: ['Alpha, A.', 'Beta, B.'],
            },
        },
    },
    {
        desc: 'interleaved [AU, AUTHOR, AU] array tag and semantic tag input',
        input: [t('TY', 'JOUR'), t('AU', 'Alpha, A.'), t('AUTHOR', 'Beta, B.'), t('AU', 'Gamma, C.'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                AU: ['Alpha, A.\nAUTHOR - Beta, B.', 'Gamma, C.'],
            },
            cleanWhitespace_false: {
                TY: 'JOUR',
                AU: ['Alpha, A.\nAUTHOR  - Beta, B.', 'Gamma, C.'],
            },
            mergeMultiline_true: {
                TY: 'JOUR',
                AU: ['Alpha, A. AUTHOR - Beta, B.', 'Gamma, C.'],
            },
            repairTags_true: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Gamma, C.'],
                AUTHOR: ['Beta, B.'],
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                AU: ['Alpha, A.', 'Gamma, C.'],
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                author: ['Alpha, A.', 'Gamma, C.', 'Beta, B.'],
            },
        },
    },
    {
        desc: 'interleaved [AUTHOR, AU, AUTHOR] semantic tag and array tag input',
        input: [t('TY', 'JOUR'), t('AUTHOR', 'Alpha, A.'), t('AU', 'Beta, B.'), t('AUTHOR', 'Gamma, C.'), t('ER')].join(
            '',
        ),
        expected: {
            default: {
                TY: 'JOUR\nAUTHOR - Alpha, A.',
                AU: ['Beta, B.\nAUTHOR - Gamma, C.'],
            },
            cleanWhitespace_false: {
                TY: 'JOUR\nAUTHOR  - Alpha, A.',
                AU: ['Beta, B.\nAUTHOR  - Gamma, C.'],
            },
            mergeMultiline_true: {
                TY: 'JOUR AUTHOR - Alpha, A.',
                AU: ['Beta, B. AUTHOR - Gamma, C.'],
            },
            repairTags_true: {
                TY: 'JOUR',
                AUTHOR: ['Alpha, A.', 'Gamma, C.'],
                AU: ['Beta, B.'],
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                AU: ['Beta, B.'],
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                author: ['Alpha, A.', 'Gamma, C.', 'Beta, B.'],
            },
        },
    },
    {
        desc: 'mixed-case semantic tags [Author, AU, author] input',
        input: [t('TY', 'JOUR'), t('Author', 'Alpha, A.'), t('AU', 'Beta, B.'), t('author', 'Gamma, C.'), t('ER')].join(
            '',
        ),
        expected: {
            default: {
                TY: 'JOUR\nAuthor - Alpha, A.',
                AU: ['Beta, B.\nauthor - Gamma, C.'],
            },
            cleanWhitespace_false: {
                TY: 'JOUR\nAuthor  - Alpha, A.',
                AU: ['Beta, B.\nauthor  - Gamma, C.'],
            },
            mergeMultiline_true: {
                TY: 'JOUR Author - Alpha, A.',
                AU: ['Beta, B. author - Gamma, C.'],
            },
            repairTags_true: {
                TY: 'JOUR',
                AUTHOR: ['Alpha, A.', 'Gamma, C.'],
                AU: ['Beta, B.'],
            },
            repairTags_true_skipInvalidTags_true: {
                TY: 'JOUR',
                AU: ['Beta, B.'],
            },
            repairTags_true_toSemantic_true: {
                typeOfReference: 'JOUR',
                author: ['Alpha, A.', 'Gamma, C.', 'Beta, B.'],
            },
        },
    },

    // --- Tag Mapping ---

    {
        desc: 'input AA and CC (mapping)',
        input: [t('TY', 'JOUR'), t('BB', 'A-Value'), t('DD', 'C-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'A-Value',
                DD: ['C-Value'],
            },
        },
    },
    {
        desc: 'input AA and BB (mapping - scalar)',
        input: [t('TY', 'JOUR'), t('BB', 'B-Value A-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'B-Value A-Value',
            },
        },
    },
    {
        desc: 'input [AA] and [BB] (mapping - scalar)',
        input: [t('TY', 'JOUR'), t('BB', 'B-Value A-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'B-Value A-Value',
            },
        },
    },
    {
        desc: 'input [AA, AA] and [BB] (mapping - scalar)',
        input: [t('TY', 'JOUR'), t('BB', 'B-Value A-Value1 A-Value2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'B-Value A-Value1 A-Value2',
            },
        },
    },
    {
        desc: 'input [AA] and [BB, BB] (mapping - scalar)',
        input: [t('TY', 'JOUR'), t('BB', 'B-Value1 B-Value2 A-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'B-Value1 B-Value2 A-Value',
            },
        },
    },
    {
        desc: 'input [AA, AA] and [BB, BB] (mapping - scalar)',
        input: [t('TY', 'JOUR'), t('BB', 'B-Value B-Value2 A-Value1 A-Value2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'B-Value B-Value2 A-Value1 A-Value2',
            },
        },
    },
    {
        desc: 'input CC and DD (mapping - array)',
        input: [t('TY', 'JOUR'), t('DD', 'D-Value'), t('DD', 'C-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['D-Value', 'C-Value'],
            },
        },
    },
    {
        desc: 'input [CC] and [DD] (mapping - array)',
        input: [t('TY', 'JOUR'), t('DD', 'D-Value'), t('DD', 'C-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['D-Value', 'C-Value'],
            },
        },
    },
    {
        desc: 'input [CC, CC] and [DD] (mapping - array)',
        input: [t('TY', 'JOUR'), t('DD', 'D-Value'), t('DD', 'C-Value1'), t('DD', 'C-Value2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['D-Value', 'C-Value1', 'C-Value2'],
            },
        },
    },
    {
        desc: 'input [CC, CC] and [DD, DD] (mapping - array)',
        input: [
            t('TY', 'JOUR'),
            t('DD', 'D-Value1'),
            t('DD', 'D-Value2'),
            t('DD', 'C-Value1'),
            t('DD', 'C-Value2'),
            t('ER'),
        ].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['D-Value1', 'D-Value2', 'C-Value1', 'C-Value2'],
            },
        },
    },
    {
        desc: 'input AA (scalar) and [BB, BB] (mapping - scalar)',
        input: [t('TY', 'JOUR'), t('BB', 'B-Value1 B-Value2 A-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'B-Value1 B-Value2 A-Value',
            },
        },
    },
    {
        desc: 'input [AA, AA] and BB (scalar) (mapping - scalar)',
        input: [t('TY', 'JOUR'), t('BB', 'B-Value A-Value1 A-Value2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'B-Value A-Value1 A-Value2',
            },
        },
    },
    {
        desc: 'input CC (scalar) and [DD, DD] (mapping - array)',
        input: [t('TY', 'JOUR'), t('DD', 'D-Value1'), t('DD', 'D-Value2'), t('DD', 'C-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['D-Value1', 'D-Value2', 'C-Value'],
            },
        },
    },
    {
        desc: 'input [CC, CC] and DD (scalar) (mapping - array)',
        input: [t('TY', 'JOUR'), t('DD', 'D-Value'), t('DD', 'C-Value1'), t('DD', 'C-Value2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['D-Value', 'C-Value1', 'C-Value2'],
            },
        },
    },
    {
        desc: 'input [CC] and [DD, DD] (mapping - array)',
        input: [t('TY', 'JOUR'), t('DD', 'D-Value1'), t('DD', 'D-Value2'), t('DD', 'C-Value'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['D-Value1', 'D-Value2', 'C-Value'],
            },
        },
    },
];
