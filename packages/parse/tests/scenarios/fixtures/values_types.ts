// Copyright 2026 Martin Winkler

import { t } from '../utils/helper.js';
import type { ParseFixtures } from './index.js';

const _d1 = new Date(2026, 0, 1);
const _d2 = new Date(2026, 5, 15);

export const VALUES_TYPES: ParseFixtures[] = [
    // --- 1. Single Scalar Inputs for BB (Scalar Tag) and DD (Array Tag) ---

    {
        desc: 'BB scalar String input',
        input: [t('TY', 'JOUR'), t('BB', 'str'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'str',
            },
        },
    },
    {
        desc: 'BB scalar Number input',
        input: [t('TY', 'JOUR'), t('BB', '100'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '100',
            },
        },
    },
    {
        desc: 'BB scalar Boolean input',
        input: [t('TY', 'JOUR'), t('BB', 'true'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'true',
            },
        },
    },
    {
        desc: 'BB scalar Date input',
        input: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '2026-01-01',
            },
        },
    },
    {
        desc: 'DD scalar String input',
        input: [t('TY', 'JOUR'), t('DD', 'str'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['str'],
            },
        },
    },
    {
        desc: 'DD scalar Number input',
        input: [t('TY', 'JOUR'), t('DD', '100'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['100'],
            },
        },
    },
    {
        desc: 'DD scalar Boolean input',
        input: [t('TY', 'JOUR'), t('DD', 'true'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['true'],
            },
        },
    },
    {
        desc: 'DD scalar Date input',
        input: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['2026-01-01'],
            },
        },
    },

    // --- 2. 1-Element Array Inputs for BB (Scalar Tag) ---

    {
        desc: '[BB] 1-element String array input',
        input: [t('TY', 'JOUR'), t('BB', 'str'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'str',
            },
        },
    },
    {
        desc: '[BB] 1-element Number array input',
        input: [t('TY', 'JOUR'), t('BB', '100'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '100',
            },
        },
    },
    {
        desc: '[BB] 1-element Boolean array input',
        input: [t('TY', 'JOUR'), t('BB', 'true'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'true',
            },
        },
    },
    {
        desc: '[BB] 1-element Date array input',
        input: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '2026-01-01',
            },
        },
    },

    // --- 3. 1-Element Array Inputs for DD (Array Tag) ---

    {
        desc: '[DD] 1-element String array input',
        input: [t('TY', 'JOUR'), t('DD', 'str'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['str'],
            },
        },
    },
    {
        desc: '[DD] 1-element Number array input',
        input: [t('TY', 'JOUR'), t('DD', '100'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['100'],
            },
        },
    },
    {
        desc: '[DD] 1-element Boolean array input',
        input: [t('TY', 'JOUR'), t('DD', 'true'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['true'],
            },
        },
    },
    {
        desc: '[DD] 1-element Date array input',
        input: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['2026-01-01'],
            },
        },
    },

    // --- 4. 2-Element Same-Type Array Inputs for BB (Scalar Tag) ---

    {
        desc: '[BB, BB] 2-element String array input',
        input: [t('TY', 'JOUR'), t('BB', 'str1'), t('BB', 'str2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'str1 str2',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: 'str1',
            },
        },
    },
    {
        desc: '[BB, BB] 2-element Number array input',
        input: [t('TY', 'JOUR'), t('BB', '100'), t('BB', '200'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '100 200',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: '100',
            },
        },
    },
    {
        desc: '[BB, BB] 2-element Boolean array input',
        input: [t('TY', 'JOUR'), t('BB', 'true'), t('BB', 'false'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'true false',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: 'true',
            },
        },
    },
    {
        desc: '[BB, BB] 2-element Date array input',
        input: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('BB', '2026-06-15'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '2026-01-01 2026-06-15',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: '2026-01-01',
            },
        },
    },

    // --- 5. 2-Element Same-Type Array Inputs for DD (Array Tag) ---

    {
        desc: '[DD, DD] 2-element String array input',
        input: [t('TY', 'JOUR'), t('DD', 'str1'), t('DD', 'str2'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['str1', 'str2'],
            },
        },
    },
    {
        desc: '[DD, DD] 2-element Number array input',
        input: [t('TY', 'JOUR'), t('DD', '100'), t('DD', '200'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['100', '200'],
            },
        },
    },
    {
        desc: '[DD, DD] 2-element Boolean array input',
        input: [t('TY', 'JOUR'), t('DD', 'true'), t('DD', 'false'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['true', 'false'],
            },
        },
    },
    {
        desc: '[DD, DD] 2-element Date array input',
        input: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('DD', '2026-06-15'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['2026-01-01', '2026-06-15'],
            },
        },
    },

    // --- 6. Full 16 Cross-Type Pair Combinations for BB (Scalar Tag) ---

    {
        desc: '[BB, BB] cross-type pair (String, String)',
        input: [t('TY', 'JOUR'), t('BB', 'str'), t('BB', 'text'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'str text',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: 'str',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (String, Number)',
        input: [t('TY', 'JOUR'), t('BB', 'str'), t('BB', '100'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'str 100',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: 'str',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (String, Boolean)',
        input: [t('TY', 'JOUR'), t('BB', 'str'), t('BB', 'true'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'str true',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: 'str',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (String, Date)',
        input: [t('TY', 'JOUR'), t('BB', 'str'), t('BB', '2026-01-01'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'str 2026-01-01',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: 'str',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Number, String)',
        input: [t('TY', 'JOUR'), t('BB', '100'), t('BB', 'str'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '100 str',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: '100',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Number, Number)',
        input: [t('TY', 'JOUR'), t('BB', '100'), t('BB', '200'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '100 200',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: '100',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Number, Boolean)',
        input: [t('TY', 'JOUR'), t('BB', '100'), t('BB', 'true'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '100 true',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: '100',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Number, Date)',
        input: [t('TY', 'JOUR'), t('BB', '100'), t('BB', '2026-01-01'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '100 2026-01-01',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: '100',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Boolean, String)',
        input: [t('TY', 'JOUR'), t('BB', 'true'), t('BB', 'str'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'true str',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: 'true',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Boolean, Number)',
        input: [t('TY', 'JOUR'), t('BB', 'true'), t('BB', '100'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'true 100',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: 'true',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Boolean, Boolean)',
        input: [t('TY', 'JOUR'), t('BB', 'true'), t('BB', 'false'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'true false',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: 'true',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Boolean, Date)',
        input: [t('TY', 'JOUR'), t('BB', 'true'), t('BB', '2026-01-01'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: 'true 2026-01-01',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: 'true',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Date, String)',
        input: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('BB', 'str'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '2026-01-01 str',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: '2026-01-01',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Date, Number)',
        input: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('BB', '100'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '2026-01-01 100',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: '2026-01-01',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Date, Boolean)',
        input: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('BB', 'true'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '2026-01-01 true',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: '2026-01-01',
            },
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Date, Date)',
        input: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('BB', '2026-06-15'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                BB: '2026-01-01 2026-06-15',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                BB: '2026-01-01',
            },
        },
    },

    // --- 7. Full 16 Cross-Type Pair Combinations for DD (Array Tag) ---

    {
        desc: '[DD, DD] cross-type pair (String, String)',
        input: [t('TY', 'JOUR'), t('DD', 'str'), t('DD', 'text'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['str', 'text'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (String, Number)',
        input: [t('TY', 'JOUR'), t('DD', 'str'), t('DD', '100'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['str', '100'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (String, Boolean)',
        input: [t('TY', 'JOUR'), t('DD', 'str'), t('DD', 'true'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['str', 'true'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (String, Date)',
        input: [t('TY', 'JOUR'), t('DD', 'str'), t('DD', '2026-01-01'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['str', '2026-01-01'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Number, String)',
        input: [t('TY', 'JOUR'), t('DD', '100'), t('DD', 'str'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['100', 'str'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Number, Number)',
        input: [t('TY', 'JOUR'), t('DD', '100'), t('DD', '200'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['100', '200'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Number, Boolean)',
        input: [t('TY', 'JOUR'), t('DD', '100'), t('DD', 'true'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['100', 'true'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Number, Date)',
        input: [t('TY', 'JOUR'), t('DD', '100'), t('DD', '2026-01-01'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['100', '2026-01-01'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Boolean, String)',
        input: [t('TY', 'JOUR'), t('DD', 'true'), t('DD', 'str'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['true', 'str'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Boolean, Number)',
        input: [t('TY', 'JOUR'), t('DD', 'true'), t('DD', '100'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['true', '100'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Boolean, Boolean)',
        input: [t('TY', 'JOUR'), t('DD', 'true'), t('DD', 'false'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['true', 'false'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Boolean, Date)',
        input: [t('TY', 'JOUR'), t('DD', 'true'), t('DD', '2026-01-01'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['true', '2026-01-01'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Date, String)',
        input: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('DD', 'str'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['2026-01-01', 'str'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Date, Number)',
        input: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('DD', '100'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['2026-01-01', '100'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Date, Boolean)',
        input: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('DD', 'true'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['2026-01-01', 'true'],
            },
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Date, Date)',
        input: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('DD', '2026-06-15'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DD: ['2026-01-01', '2026-06-15'],
            },
        },
    },

    // --- 8. Date Trickery & Advanced Type Cases (DA Date Tag) ---

    // 1. Textual & Slash Heuristic Date Parsing
    {
        desc: 'DA date-tag explicit verification input',
        input: [t('TY', 'JOUR'), t('DA', '2026-01-01'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '2026-01-01',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                DA: '2026-01-01',
            },
        },
    },
    {
        desc: 'DA date-tag textual month day year input',
        input: [t('TY', 'JOUR'), t('DA', '15 Jan 2023'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '15 Jan 2023',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                DA: '2023-01-15',
            },
        },
    },
    {
        desc: 'DA date-tag full month name year input',
        input: [t('TY', 'JOUR'), t('DA', 'January 2023'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: 'January 2023',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                DA: '2023-01',
            },
        },
    },
    {
        desc: 'DA date-tag ISO textual month input',
        input: [t('TY', 'JOUR'), t('DA', '2023-Jan-15'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '2023-Jan-15',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                DA: '2023-01-15',
            },
        },
    },
    {
        desc: 'DA date-tag slash separated day/month/year input',
        input: [t('TY', 'JOUR'), t('DA', '15/05/2023'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '15/05/2023',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                DA: '2023-05-15',
            },
        },
    },

    // 2. Invalid Date Boundaries & Fallback Behavior
    {
        desc: 'DA date-tag impossible date 31.02.2026 fallback input',
        input: [t('TY', 'JOUR'), t('DA', '31.02.2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '31.02.2026',
            },
        },
    },
    {
        desc: 'DA date-tag impossible date 2023-04-31 fallback input',
        input: [t('TY', 'JOUR'), t('DA', '2023-04-31'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '2023-04-31',
            },
        },
    },
    {
        desc: 'DA date-tag non-leap year Feb 29 fallback input',
        input: [t('TY', 'JOUR'), t('DA', '2023-02-29'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '2023-02-29',
            },
        },
    },
    {
        desc: 'DA date-tag valid leap year Feb 29 input',
        input: [t('TY', 'JOUR'), t('DA', '2024-02-29'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '2024-02-29',
            },
        },
    },

    // 3. Timestamps & Unparseable Text
    {
        desc: 'DA date-tag ISO timestamp input',
        input: [t('TY', 'JOUR'), t('DA', '2023-05-15T12:00:00Z'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '2023-05-15T12:00:00Z',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                DA: '2023-05-15',
            },
        },
    },
    {
        desc: 'DA date-tag RIS other info segment input',
        input: [t('TY', 'JOUR'), t('DA', '1998/12/31/Winter'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '1998/12/31/Winter',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                DA: '1998-12-31',
            },
        },
    },
    {
        desc: 'DA date-tag unparseable text fallback input',
        input: [t('TY', 'JOUR'), t('DA', 'Estimated Date 2023'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: 'Estimated Date 2023',
            },
        },
    },

    // 4. RawDate Object Inputs
    {
        desc: 'DA date-tag RawDate object with single-digit padding input',
        input: [t('TY', 'JOUR'), t('DA', '2026-05-01'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '2026-05-01',
            },
        },
    },
    {
        desc: 'DA date-tag RawDate object with year and month input',
        input: [t('TY', 'JOUR'), t('DA', '2026-06'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '2026-06',
            },
        },
    },
    {
        desc: 'DA date-tag RawDate object with year only input',
        input: [t('TY', 'JOUR'), t('DA', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '2026',
            },
        },
    },

    // 5. Month/Day and Partial Date Scenarios
    {
        desc: 'DA month-only date and PY publication year input',
        input: [t('TY', 'JOUR'), t('DA', 'JAN'), t('PY', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: 'JAN',
                PY: '2026',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                DA: '2026-01',
                PY: '2026',
            },
        },
    },
    {
        desc: 'Y1 month-only primary date and PY publication year input',
        input: [t('TY', 'JOUR'), t('Y1', 'JAN'), t('PY', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                Y1: 'JAN',
                PY: '2026',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                Y1: '2026-01',
                PY: '2026',
            },
        },
    },
    {
        desc: 'PY publication year input',
        input: [t('TY', 'JOUR'), t('PY', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                PY: '2026',
            },
        },
    },
    {
        desc: 'Y1 primary date input',
        input: [t('TY', 'JOUR'), t('Y1', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                Y1: '2026',
            },
        },
    },
    {
        desc: 'DA date tag input',
        input: [t('TY', 'JOUR'), t('DA', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '2026',
            },
        },
    },
    {
        desc: 'DA month-day date and PY publication year input',
        input: [t('TY', 'JOUR'), t('DA', 'Jan 01'), t('PY', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: 'Jan 01',
                PY: '2026',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                DA: '2026-01-01',
                PY: '2026',
            },
        },
    },
    {
        desc: 'Y1 month-day primary date and PY publication year input',
        input: [t('TY', 'JOUR'), t('Y1', 'Jan 01'), t('PY', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                Y1: 'Jan 01',
                PY: '2026',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                Y1: '2026-01-01',
                PY: '2026',
            },
        },
    },

    // 6. Date Edge Cases (Y2 isolation, ranges/seasons, leap year, year conflict, simultaneous Y1/DA, array payloads)
    {
        desc: 'Y2 access date isolation without PY inheritance input',
        input: [t('TY', 'JOUR'), t('Y2', 'JAN'), t('PY', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                Y2: 'JAN',
                PY: '2026',
            },
        },
    },
    {
        desc: 'DA date range fallback input',
        input: [t('TY', 'JOUR'), t('DA', 'JAN-MAR'), t('PY', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: 'JAN-MAR',
                PY: '2026',
            },
        },
    },
    {
        desc: 'DA seasonal text fallback input',
        input: [t('TY', 'JOUR'), t('DA', 'SPRING'), t('PY', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: 'SPRING',
                PY: '2026',
            },
        },
    },
    {
        desc: 'DA invalid leap year Feb 29 with non-leap PY 2026 fallback input',
        input: [t('TY', 'JOUR'), t('DA', 'Feb 29'), t('PY', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: 'Feb 29',
                PY: '2026',
            },
        },
    },
    {
        desc: 'DA valid leap year Feb 29 with leap PY 2024 input',
        input: [t('TY', 'JOUR'), t('DA', 'Feb 29'), t('PY', '2024'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: 'Feb 29',
                PY: '2024',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                DA: '2024-02-29',
                PY: '2024',
            },
        },
    },
    {
        desc: 'DA explicit year precedence over PY input',
        input: [t('TY', 'JOUR'), t('DA', '2024 JAN'), t('PY', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: '2024 JAN',
                PY: '2026',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                DA: '2024-01',
                PY: '2026',
            },
        },
    },
    {
        desc: 'Simultaneous Y1 and DA independent PY inheritance input',
        input: [t('TY', 'JOUR'), t('Y1', 'FEB'), t('DA', 'JAN'), t('PY', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                Y1: 'FEB',
                DA: 'JAN',
                PY: '2026',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                Y1: '2026-02',
                DA: '2026-01',
                PY: '2026',
            },
        },
    },
    {
        desc: 'DA and PY input enrichment of DA with PY year',
        input: [t('TY', 'JOUR'), t('DA', 'JAN'), t('PY', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: 'JAN',
                PY: '2026',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                DA: '2026-01',
                PY: '2026',
            },
        },
    },
    {
        desc: 'Y2 does not enrich DA with year',
        input: [t('TY', 'JOUR'), t('DA', 'JAN'), t('Y2', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: 'JAN',
                Y2: '2026',
            },
        },
    },
    {
        desc: 'Y2 does not interfere with PY enrichment of DA with year',
        input: [t('TY', 'JOUR'), t('DA', 'JAN'), t('PY', '2024'), t('Y2', '2026'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                DA: 'JAN',
                PY: '2024',
                Y2: '2026',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                DA: '2024-01',
                PY: '2024',
                Y2: '2026',
            },
        },
    },

    // --- 9. Custom Tag Smart Type Schema (smartCastSchema XX, YY, ZZ) ---

    {
        desc: 'XX custom tag date smartCastSchema input',
        input: [t('TY', 'JOUR'), t('XX', '2026/01/15'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                XX: '2026/01/15',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                XX: '2026-01-15',
            },
        },
    },
    {
        desc: 'YY custom tag number smartCastSchema input',
        input: [t('TY', 'JOUR'), t('YY', '123'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                YY: '123',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                YY: 123,
            },
        },
    },
    {
        desc: 'ZZ custom tag boolean smartCastSchema input',
        input: [t('TY', 'JOUR'), t('ZZ', 'true'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                ZZ: 'true',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                ZZ: true,
            },
        },
    },
    {
        desc: '[XX, XX] custom tag date smartCastSchema array input',
        input: [t('TY', 'JOUR'), t('XX', '2026/01/15'), t('XX', '2026/06/15'), t('ER')].join(''),
        expected: {
            default: {
                TY: 'JOUR',
                XX: '2026/01/15 2026/06/15',
            },
            useSmartTypes_true: {
                TY: 'JOUR',
                XX: '2026/01/15 2026/06/15',
            },
            arrayMergeStrategy_first: {
                TY: 'JOUR',
                XX: '2026/01/15',
            },
        },
    },
];
