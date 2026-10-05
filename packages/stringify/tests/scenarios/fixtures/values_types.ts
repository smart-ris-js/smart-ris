// Copyright 2026 Martin Winkler

import { t } from '../utils/helper.js';
import type { StringifyFixtures } from './index.js';

const d1 = new Date(2026, 0, 1);
const d2 = new Date(2026, 5, 15);

export const VALUES_TYPES: StringifyFixtures[] = [
    // --- 1. Single Scalar Inputs for BB (Scalar Tag) and DD (Array Tag) ---

    {
        desc: 'BB scalar String input',
        input: {
            TY: 'JOUR',
            BB: 'str',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'str'), t('ER')].join(''),
        },
    },
    {
        desc: 'BB scalar Number input',
        input: {
            TY: 'JOUR',
            BB: 100,
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '100'), t('ER')].join(''),
        },
    },
    {
        desc: 'BB scalar Boolean input',
        input: {
            TY: 'JOUR',
            BB: true,
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'true'), t('ER')].join(''),
        },
    },
    {
        desc: 'BB scalar Date input',
        input: {
            TY: 'JOUR',
            BB: d1,
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('ER')].join(''),
        },
    },
    {
        desc: 'DD scalar String input',
        input: {
            TY: 'JOUR',
            DD: 'str',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'str'), t('ER')].join(''),
        },
    },
    {
        desc: 'DD scalar Number input',
        input: {
            TY: 'JOUR',
            DD: 100,
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '100'), t('ER')].join(''),
        },
    },
    {
        desc: 'DD scalar Boolean input',
        input: {
            TY: 'JOUR',
            DD: true,
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'true'), t('ER')].join(''),
        },
    },
    {
        desc: 'DD scalar Date input',
        input: {
            TY: 'JOUR',
            DD: d1,
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('ER')].join(''),
        },
    },

    // --- 2. 1-Element Array Inputs for BB (Scalar Tag) ---

    {
        desc: '[BB] 1-element String array input',
        input: {
            TY: 'JOUR',
            BB: ['str'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'str'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB] 1-element Number array input',
        input: {
            TY: 'JOUR',
            BB: [100],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '100'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB] 1-element Boolean array input',
        input: {
            TY: 'JOUR',
            BB: [true],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'true'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB] 1-element Date array input',
        input: {
            TY: 'JOUR',
            BB: [d1],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('ER')].join(''),
        },
    },

    // --- 3. 1-Element Array Inputs for DD (Array Tag) ---

    {
        desc: '[DD] 1-element String array input',
        input: {
            TY: 'JOUR',
            DD: ['str'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'str'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD] 1-element Number array input',
        input: {
            TY: 'JOUR',
            DD: [100],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '100'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD] 1-element Boolean array input',
        input: {
            TY: 'JOUR',
            DD: [true],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'true'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD] 1-element Date array input',
        input: {
            TY: 'JOUR',
            DD: [d1],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('ER')].join(''),
        },
    },

    // --- 4. 2-Element Same-Type Array Inputs for BB (Scalar Tag) ---

    {
        desc: '[BB, BB] 2-element String array input',
        input: {
            TY: 'JOUR',
            BB: ['str1', 'str2'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'str1 str2'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'str1'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] 2-element Number array input',
        input: {
            TY: 'JOUR',
            BB: [100, 200],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '100 200'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', '100'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] 2-element Boolean array input',
        input: {
            TY: 'JOUR',
            BB: [true, false],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'true false'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'true'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] 2-element Date array input',
        input: {
            TY: 'JOUR',
            BB: [d1, d2],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '2026-01-01 2026-06-15'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('ER')].join(''),
        },
    },

    // --- 5. 2-Element Same-Type Array Inputs for DD (Array Tag) ---

    {
        desc: '[DD, DD] 2-element String array input',
        input: {
            TY: 'JOUR',
            DD: ['str1', 'str2'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'str1'), t('DD', 'str2'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] 2-element Number array input',
        input: {
            TY: 'JOUR',
            DD: [100, 200],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '100'), t('DD', '200'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] 2-element Boolean array input',
        input: {
            TY: 'JOUR',
            DD: [true, false],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'true'), t('DD', 'false'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] 2-element Date array input',
        input: {
            TY: 'JOUR',
            DD: [d1, d2],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('DD', '2026-06-15'), t('ER')].join(''),
        },
    },

    // --- 6. Full 16 Cross-Type Pair Combinations for BB (Scalar Tag) ---

    {
        desc: '[BB, BB] cross-type pair (String, String)',
        input: {
            TY: 'JOUR',
            BB: ['str', 'text'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'str text'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'str'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (String, Number)',
        input: {
            TY: 'JOUR',
            BB: ['str', 100],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'str 100'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'str'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (String, Boolean)',
        input: {
            TY: 'JOUR',
            BB: ['str', true],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'str true'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'str'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (String, Date)',
        input: {
            TY: 'JOUR',
            BB: ['str', d1],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'str 2026-01-01'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'str'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Number, String)',
        input: {
            TY: 'JOUR',
            BB: [100, 'str'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '100 str'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', '100'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Number, Number)',
        input: {
            TY: 'JOUR',
            BB: [100, 200],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '100 200'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', '100'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Number, Boolean)',
        input: {
            TY: 'JOUR',
            BB: [100, true],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '100 true'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', '100'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Number, Date)',
        input: {
            TY: 'JOUR',
            BB: [100, d1],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '100 2026-01-01'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', '100'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Boolean, String)',
        input: {
            TY: 'JOUR',
            BB: [true, 'str'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'true str'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'true'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Boolean, Number)',
        input: {
            TY: 'JOUR',
            BB: [true, 100],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'true 100'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'true'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Boolean, Boolean)',
        input: {
            TY: 'JOUR',
            BB: [true, false],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'true false'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'true'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Boolean, Date)',
        input: {
            TY: 'JOUR',
            BB: [true, d1],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'true 2026-01-01'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', 'true'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Date, String)',
        input: {
            TY: 'JOUR',
            BB: [d1, 'str'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '2026-01-01 str'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Date, Number)',
        input: {
            TY: 'JOUR',
            BB: [d1, 100],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '2026-01-01 100'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Date, Boolean)',
        input: {
            TY: 'JOUR',
            BB: [d1, true],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '2026-01-01 true'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('ER')].join(''),
        },
    },
    {
        desc: '[BB, BB] cross-type pair (Date, Date)',
        input: {
            TY: 'JOUR',
            BB: [d1, d2],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', '2026-01-01 2026-06-15'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('BB', '2026-01-01'), t('ER')].join(''),
        },
    },

    // --- 7. Full 16 Cross-Type Pair Combinations for DD (Array Tag) ---

    {
        desc: '[DD, DD] cross-type pair (String, String)',
        input: {
            TY: 'JOUR',
            DD: ['str', 'text'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'str'), t('DD', 'text'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (String, Number)',
        input: {
            TY: 'JOUR',
            DD: ['str', 100],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'str'), t('DD', '100'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (String, Boolean)',
        input: {
            TY: 'JOUR',
            DD: ['str', true],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'str'), t('DD', 'true'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (String, Date)',
        input: {
            TY: 'JOUR',
            DD: ['str', d1],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'str'), t('DD', '2026-01-01'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Number, String)',
        input: {
            TY: 'JOUR',
            DD: [100, 'str'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '100'), t('DD', 'str'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Number, Number)',
        input: {
            TY: 'JOUR',
            DD: [100, 200],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '100'), t('DD', '200'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Number, Boolean)',
        input: {
            TY: 'JOUR',
            DD: [100, true],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '100'), t('DD', 'true'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Number, Date)',
        input: {
            TY: 'JOUR',
            DD: [100, d1],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '100'), t('DD', '2026-01-01'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Boolean, String)',
        input: {
            TY: 'JOUR',
            DD: [true, 'str'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'true'), t('DD', 'str'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Boolean, Number)',
        input: {
            TY: 'JOUR',
            DD: [true, 100],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'true'), t('DD', '100'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Boolean, Boolean)',
        input: {
            TY: 'JOUR',
            DD: [true, false],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'true'), t('DD', 'false'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Boolean, Date)',
        input: {
            TY: 'JOUR',
            DD: [true, d1],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'true'), t('DD', '2026-01-01'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Date, String)',
        input: {
            TY: 'JOUR',
            DD: [d1, 'str'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('DD', 'str'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Date, Number)',
        input: {
            TY: 'JOUR',
            DD: [d1, 100],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('DD', '100'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Date, Boolean)',
        input: {
            TY: 'JOUR',
            DD: [d1, true],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('DD', 'true'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD, DD] cross-type pair (Date, Date)',
        input: {
            TY: 'JOUR',
            DD: [d1, d2],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', '2026-01-01'), t('DD', '2026-06-15'), t('ER')].join(''),
        },
    },

    // --- 8. Date Trickery & Advanced Type Cases (DA Date Tag) ---

    // 1. Textual & Slash Heuristic Date Parsing
    {
        desc: 'DA date-tag textual month day year input',
        input: {
            TY: 'JOUR',
            DA: '15 Jan 2023',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '15 Jan 2023'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', '2023-01-15'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA date-tag full month name year input',
        input: {
            TY: 'JOUR',
            DA: 'January 2023',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', 'January 2023'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', '2023-01'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA date-tag ISO textual month input',
        input: {
            TY: 'JOUR',
            DA: '2023-Jan-15',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '2023-Jan-15'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', '2023-01-15'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA date-tag slash separated day/month/year input',
        input: {
            TY: 'JOUR',
            DA: '15/05/2023',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '15/05/2023'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', '2023-05-15'), t('ER')].join(''),
        },
    },

    // 2. Invalid Date Boundaries & Fallback Behavior
    {
        desc: 'DA date-tag impossible date 31.02.2026 fallback input',
        input: {
            TY: 'JOUR',
            DA: '31.02.2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '31.02.2026'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA date-tag impossible date 2023-04-31 fallback input',
        input: {
            TY: 'JOUR',
            DA: '2023-04-31',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '2023-04-31'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA date-tag non-leap year Feb 29 fallback input',
        input: {
            TY: 'JOUR',
            DA: '2023-02-29',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '2023-02-29'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA date-tag valid leap year Feb 29 input',
        input: {
            TY: 'JOUR',
            DA: '2024-02-29',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '2024-02-29'), t('ER')].join(''),
        },
    },

    // 3. Timestamps & Unparseable Text
    {
        desc: 'DA date-tag ISO timestamp input',
        input: {
            TY: 'JOUR',
            DA: '2023-05-15T12:00:00Z',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '2023-05-15T12:00:00Z'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', '2023-05-15'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA date-tag RIS other info segment input',
        input: {
            TY: 'JOUR',
            DA: '1998/12/31/Winter',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '1998/12/31/Winter'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', '1998-12-31'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA date-tag unparseable text fallback input',
        input: {
            TY: 'JOUR',
            DA: 'Estimated Date 2023',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', 'Estimated Date 2023'), t('ER')].join(''),
        },
    },

    // 4. RawDate Object Inputs
    {
        desc: 'DA date-tag RawDate object with single-digit padding input',
        input: {
            TY: 'JOUR',
            DA: { year: '2026', month: '5', day: '1' } as any,
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '2026-05-01'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA date-tag RawDate object with year and month input',
        input: {
            TY: 'JOUR',
            DA: { year: '2026', month: '6' } as any,
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '2026-06'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA date-tag RawDate object with year only input',
        input: {
            TY: 'JOUR',
            DA: { year: '2026' } as any,
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '2026'), t('ER')].join(''),
        },
    },

    // 5. Month/Day and Partial Date Scenarios
    {
        desc: 'DA month-only date and PY publication year input',
        input: {
            TY: 'JOUR',
            DA: 'JAN',
            PY: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', 'JAN'), t('PY', '2026'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', '2026-01'), t('PY', '2026'), t('ER')].join(''),
        },
    },
    {
        desc: 'Y1 month-only primary date and PY publication year input',
        input: {
            TY: 'JOUR',
            Y1: 'JAN',
            PY: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('Y1', 'JAN'), t('PY', '2026'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('Y1', '2026-01'), t('PY', '2026'), t('ER')].join(''),
        },
    },
    {
        desc: 'PY publication year input',
        input: {
            TY: 'JOUR',
            PY: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('PY', '2026'), t('ER')].join(''),
        },
    },
    {
        desc: 'Y1 primary date input',
        input: {
            TY: 'JOUR',
            Y1: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('Y1', '2026'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA date tag input',
        input: {
            TY: 'JOUR',
            DA: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '2026'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA month-day date and PY publication year input',
        input: {
            TY: 'JOUR',
            DA: 'Jan 01',
            PY: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', 'Jan 01'), t('PY', '2026'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', '2026-01-01'), t('PY', '2026'), t('ER')].join(''),
        },
    },
    {
        desc: 'Y1 month-day primary date and PY publication year input',
        input: {
            TY: 'JOUR',
            Y1: 'Jan 01',
            PY: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('Y1', 'Jan 01'), t('PY', '2026'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('Y1', '2026-01-01'), t('PY', '2026'), t('ER')].join(''),
        },
    },

    // 6. Date Edge Cases (Y2 isolation, ranges/seasons, leap year, year conflict, simultaneous Y1/DA, array payloads)
    {
        desc: 'Y2 access date isolation without PY inheritance input',
        input: {
            TY: 'JOUR',
            Y2: 'JAN',
            PY: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('Y2', 'JAN'), t('PY', '2026'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('Y2', 'JAN'), t('PY', '2026'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA date range fallback input',
        input: {
            TY: 'JOUR',
            DA: 'JAN-MAR',
            PY: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', 'JAN-MAR'), t('PY', '2026'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', 'JAN-MAR'), t('PY', '2026'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA seasonal text fallback input',
        input: {
            TY: 'JOUR',
            DA: 'SPRING',
            PY: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', 'SPRING'), t('PY', '2026'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', 'SPRING'), t('PY', '2026'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA invalid leap year Feb 29 with non-leap PY 2026 fallback input',
        input: {
            TY: 'JOUR',
            DA: 'Feb 29',
            PY: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', 'Feb 29'), t('PY', '2026'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', 'Feb 29'), t('PY', '2026'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA valid leap year Feb 29 with leap PY 2024 input',
        input: {
            TY: 'JOUR',
            DA: 'Feb 29',
            PY: '2024',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', 'Feb 29'), t('PY', '2024'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', '2024-02-29'), t('PY', '2024'), t('ER')].join(''),
        },
    },
    {
        desc: 'DA explicit year precedence over PY input',
        input: {
            TY: 'JOUR',
            DA: '2024 JAN',
            PY: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', '2024 JAN'), t('PY', '2026'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', '2024-01'), t('PY', '2026'), t('ER')].join(''),
        },
    },
    {
        desc: 'Simultaneous Y1 and DA independent PY inheritance input',
        input: {
            TY: 'JOUR',
            Y1: 'FEB',
            DA: 'JAN',
            PY: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('Y1', 'FEB'), t('DA', 'JAN'), t('PY', '2026'), t('ER')].join(''),
            useSmartTypes_true: [
                t('TY', 'JOUR'),
                t('Y1', '2026-02'),
                t('DA', '2026-01'),
                t('PY', '2026'),
                t('ER'),
            ].join(''),
        },
    },
    {
        desc: 'DA and PY array payload input',
        input: {
            TY: 'JOUR',
            DA: ['JAN'],
            PY: ['2026'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DA', 'JAN'), t('PY', '2026'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('DA', '2026-01'), t('PY', '2026'), t('ER')].join(''),
        },
    },
    {
        desc: 'Y2 does not enrich DA with year',
        input: {
            TY: 'JOUR',
            DA: 'JAN',
            Y2: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('Y2', '2026'), t('DA', 'JAN'), t('ER')].join(''),
        },
    },
    {
        desc: 'Y2 does not interfere with PY enrichment of DA with year',
        input: {
            TY: 'JOUR',
            DA: 'JAN',
            PY: '2024',
            Y2: '2026',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('Y2', '2026'), t('DA', 'JAN'), t('PY', '2024'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('Y2', '2026'), t('DA', '2024-01'), t('PY', '2024'), t('ER')].join(
                '',
            ),
        },
    },

    // 7. Array Inputs with Mixed Unsupported Objects
    {
        desc: '[BB] scalar-tag array with mixed unsupported object input',
        input: {
            TY: 'JOUR',
            BB: ['valid-string', { invalid: true } as any],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('BB', 'valid-string'), t('ER')].join(''),
        },
    },
    {
        desc: '[DD] array-tag array with mixed unsupported object input',
        input: {
            TY: 'JOUR',
            DD: ['valid-string', { invalid: true } as any],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'valid-string'), t('ER')].join(''),
            skipEmptyTags_false: [t('TY', 'JOUR'), t('DD', 'valid-string'), t('DD', ''), t('ER')].join(''),
        },
    },

    // 8. Non-Finite Numbers (functions/symbols are not structured-cloneable; covered in unit/integration tests)
    {
        desc: '[DD] array-tag array with non-finite numbers kept as text',
        input: {
            TY: 'JOUR',
            DD: [NaN, Infinity, -Infinity],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('DD', 'NaN'), t('DD', 'Infinity'), t('DD', '-Infinity'), t('ER')].join(''),
        },
    },

    // --- 9. Custom Tag Smart Type Schema (smartCastSchema XX, YY, ZZ) ---

    {
        desc: 'XX custom tag date smartCastSchema input',
        input: {
            TY: 'JOUR',
            XX: '2026/01/15',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('XX', '2026/01/15'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('XX', '2026-01-15'), t('ER')].join(''),
        },
    },
    {
        desc: 'YY custom tag number smartCastSchema input',
        input: {
            TY: 'JOUR',
            YY: '123',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('YY', '123'), t('ER')].join(''),
        },
    },
    {
        desc: 'ZZ custom tag boolean smartCastSchema input',
        input: {
            TY: 'JOUR',
            ZZ: 'true',
        },
        expected: {
            default: [t('TY', 'JOUR'), t('ZZ', 'true'), t('ER')].join(''),
        },
    },
    {
        desc: '[XX, XX] custom tag date smartCastSchema array input',
        input: {
            TY: 'JOUR',
            XX: ['2026/01/15', '2026/06/15'],
        },
        expected: {
            default: [t('TY', 'JOUR'), t('XX', '2026/01/15 2026/06/15'), t('ER')].join(''),
            useSmartTypes_true: [t('TY', 'JOUR'), t('XX', '2026-01-15 2026-06-15'), t('ER')].join(''),
            arrayMergeStrategy_first: [t('TY', 'JOUR'), t('XX', '2026/01/15'), t('ER')].join(''),
        },
    },
];
