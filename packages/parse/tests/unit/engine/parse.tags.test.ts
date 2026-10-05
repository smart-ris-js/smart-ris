// Copyright 2026 Martin Winkler

import { describe, expect, it, test } from 'bun:test';
import { extractStrictTagFromLine, extractTagFromLine, REGEX_TAG_LINE_REPAIR } from '../../../src/engine/parse.tags.js';

interface TagTestCase {
    input: string;
    output: {
        repair: { rawTag: string; value: string } | null;
        strict: { rawTag: string; value: string } | null;
    };
}

const BEST_PRACTICE_TAGS_AND_FORMAT: TagTestCase[] = [
    {
        input: 'TY  - JOUR',
        output: {
            repair: { rawTag: 'TY', value: 'JOUR' },
            strict: { rawTag: 'TY', value: 'JOUR' },
        },
    },
    {
        input: 'XX  - xyz',
        output: {
            repair: { rawTag: 'XX', value: 'xyz' },
            strict: { rawTag: 'XX', value: 'xyz' },
        },
    },
    {
        input: 'A1  - Alpha, A.',
        output: {
            repair: { rawTag: 'A1', value: 'Alpha, A.' },
            strict: { rawTag: 'A1', value: 'Alpha, A.' },
        },
    },
    {
        input: '11  - 123',
        output: {
            repair: { rawTag: '11', value: '123' },
            strict: { rawTag: '11', value: '123' },
        },
    },
    {
        input: 'DA  - 2023-01-01',
        output: {
            repair: { rawTag: 'DA', value: '2023-01-01' },
            strict: { rawTag: 'DA', value: '2023-01-01' },
        },
    },
    {
        input: 'AB  - Some abstract text.\nSecond line of abstract that should not be processed at the same time.\nBut should still work.',
        output: {
            repair: {
                rawTag: 'AB',
                value: 'Some abstract text.\nSecond line of abstract that should not be processed at the same time.\nBut should still work.',
            },
            strict: {
                rawTag: 'AB',
                value: 'Some abstract text.\nSecond line of abstract that should not be processed at the same time.\nBut should still work.',
            },
        },
    },
    {
        input: 'ER  - ',
        output: {
            repair: { rawTag: 'ER', value: '' },
            strict: { rawTag: 'ER', value: '' },
        },
    },
];

const VALID_TAGS_CASE_VARIATIONS: TagTestCase[] = [
    {
        input: 'ty  - JOUR',
        output: {
            repair: { rawTag: 'ty', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'Ty  - JOUR',
        output: {
            repair: { rawTag: 'Ty', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'tY  - JOUR',
        output: {
            repair: { rawTag: 'tY', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'xx  - xyz',
        output: {
            repair: { rawTag: 'xx', value: 'xyz' },
            strict: null,
        },
    },
    {
        input: 'xX  - xYz',
        output: {
            repair: { rawTag: 'xX', value: 'xYz' },
            strict: null,
        },
    },
    {
        input: 'Xx  - XyZ',
        output: {
            repair: { rawTag: 'Xx', value: 'XyZ' },
            strict: null,
        },
    },
    {
        input: 'a1  - Alpha, A.',
        output: {
            repair: { rawTag: 'a1', value: 'Alpha, A.' },
            strict: null,
        },
    },
    {
        input: 'er  - ',
        output: {
            repair: { rawTag: 'er', value: '' },
            strict: null,
        },
    },
];

const VALID_TAGS_SINGLE_SPACING: TagTestCase[] = [
    {
        input: 'TY - JOUR',
        output: {
            repair: { rawTag: 'TY', value: 'JOUR' },
            strict: { rawTag: 'TY', value: 'JOUR' },
        },
    },
    {
        input: 'XX - xyz',
        output: {
            repair: { rawTag: 'XX', value: 'xyz' },
            strict: { rawTag: 'XX', value: 'xyz' },
        },
    },
    {
        input: 'A1 - Alpha, A.',
        output: {
            repair: { rawTag: 'A1', value: 'Alpha, A.' },
            strict: { rawTag: 'A1', value: 'Alpha, A.' },
        },
    },
    {
        input: '11 - 123',
        output: {
            repair: { rawTag: '11', value: '123' },
            strict: { rawTag: '11', value: '123' },
        },
    },
    {
        input: 'DA - 2023-01-01',
        output: {
            repair: { rawTag: 'DA', value: '2023-01-01' },
            strict: { rawTag: 'DA', value: '2023-01-01' },
        },
    },
    {
        input: 'AB - Some abstract text.\nSecond line of abstract that should not be processed at the same time.\nBut should still work.',
        output: {
            repair: {
                rawTag: 'AB',
                value: 'Some abstract text.\nSecond line of abstract that should not be processed at the same time.\nBut should still work.',
            },
            strict: {
                rawTag: 'AB',
                value: 'Some abstract text.\nSecond line of abstract that should not be processed at the same time.\nBut should still work.',
            },
        },
    },
    {
        input: 'ER - ',
        output: {
            repair: { rawTag: 'ER', value: '' },
            strict: { rawTag: 'ER', value: '' },
        },
    },
    {
        input: 'ER -  ',
        output: {
            repair: { rawTag: 'ER', value: '' },
            strict: { rawTag: 'ER', value: ' ' },
        },
    },
];

const VALID_TAGS_INVALID_SPACING: TagTestCase[] = [
    {
        input: 'TY- JOUR',
        output: {
            repair: { rawTag: 'TY', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'XX- xyz',
        output: {
            repair: { rawTag: 'XX', value: 'xyz' },
            strict: null,
        },
    },
    {
        input: 'A1- Alpha, A.',
        output: {
            repair: { rawTag: 'A1', value: 'Alpha, A.' },
            strict: null,
        },
    },
    {
        input: '11- 123',
        output: {
            repair: { rawTag: '11', value: '123' },
            strict: null,
        },
    },
    {
        input: 'DA- 2023-01-01',
        output: {
            repair: { rawTag: 'DA', value: '2023-01-01' },
            strict: null,
        },
    },
    {
        input: 'AB- Some abstract text.\nSecond line of abstract that should not be processed at the same time.\nBut should still work.',
        output: {
            repair: {
                rawTag: 'AB',
                value: 'Some abstract text.\nSecond line of abstract that should not be processed at the same time.\nBut should still work.',
            },
            strict: null,
        },
    },
    {
        input: 'ER- ',
        output: {
            repair: { rawTag: 'ER', value: '' },
            strict: null,
        },
    },
    {
        input: 'TY  -JOUR',
        output: {
            repair: { rawTag: 'TY', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'XX  -xyz',
        output: {
            repair: { rawTag: 'XX', value: 'xyz' },
            strict: null,
        },
    },
    {
        input: 'A1  -Alpha, A.',
        output: {
            repair: { rawTag: 'A1', value: 'Alpha, A.' },
            strict: null,
        },
    },
    {
        input: '11  -123',
        output: {
            repair: { rawTag: '11', value: '123' },
            strict: null,
        },
    },
    {
        input: 'DA  -2023-01-01',
        output: {
            repair: { rawTag: 'DA', value: '2023-01-01' },
            strict: null,
        },
    },
    {
        input: 'AB  -Some abstract text.\nSecond line of abstract that should not be processed at the same time.\nBut should still work.',
        output: {
            repair: {
                rawTag: 'AB',
                value: 'Some abstract text.\nSecond line of abstract that should not be processed at the same time.\nBut should still work.',
            },
            strict: null,
        },
    },
    {
        input: 'ER  -',
        output: {
            repair: { rawTag: 'ER', value: '' },
            strict: { rawTag: 'ER', value: '' },
        },
    },
    {
        input: 'TI  -',
        output: {
            repair: { rawTag: 'TI', value: '' },
            strict: { rawTag: 'TI', value: '' },
        },
    },
    {
        input: 'KW  -',
        output: {
            repair: { rawTag: 'KW', value: '' },
            strict: { rawTag: 'KW', value: '' },
        },
    },
    {
        input: 'N1  -',
        output: {
            repair: { rawTag: 'N1', value: '' },
            strict: { rawTag: 'N1', value: '' },
        },
    },
    {
        input: 'TY -JOUR',
        output: {
            repair: { rawTag: 'TY', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'XX -xyz',
        output: {
            repair: { rawTag: 'XX', value: 'xyz' },
            strict: null,
        },
    },
    {
        input: 'A1 -Alpha, A.',
        output: {
            repair: { rawTag: 'A1', value: 'Alpha, A.' },
            strict: null,
        },
    },
    {
        input: '11 -123',
        output: {
            repair: { rawTag: '11', value: '123' },
            strict: null,
        },
    },
    {
        input: 'DA -2023-01-01',
        output: {
            repair: { rawTag: 'DA', value: '2023-01-01' },
            strict: null,
        },
    },
    {
        input: 'AB -Some abstract text.\nSecond line of abstract that should not be processed at the same time.\nBut should still work.',
        output: {
            repair: {
                rawTag: 'AB',
                value: 'Some abstract text.\nSecond line of abstract that should not be processed at the same time.\nBut should still work.',
            },
            strict: null,
        },
    },
    {
        input: 'ER -',
        output: {
            repair: { rawTag: 'ER', value: '' },
            strict: { rawTag: 'ER', value: '' },
        },
    },
    {
        input: 'TY-JOUR',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'XX-xyz',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'A1-Alpha, A.',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: '11-123',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'DA-2023-01-01',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'AB-Some abstract text.\nSecond line of abstract that should not be processed at the same time.\nBut should still work.',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'ER-',
        output: {
            repair: null,
            strict: null,
        },
    },
];

const CASE_AND_SPACING_VARIATIONS: TagTestCase[] = [
    {
        input: 'ty - JOUR',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'Ty - JOUR',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'tY - JOUR',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'xx - xyz',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'xX - xYz',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'Xx - XyZ',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'a1 - Alpha, A.',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'er - ',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'ty  -JOUR',
        output: {
            repair: { rawTag: 'ty', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'Ty  -JOUR',
        output: {
            repair: { rawTag: 'Ty', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'tY  -JOUR',
        output: {
            repair: { rawTag: 'tY', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'xx  -xyz',
        output: {
            repair: { rawTag: 'xx', value: 'xyz' },
            strict: null,
        },
    },
    {
        input: 'xX  -xYz',
        output: {
            repair: { rawTag: 'xX', value: 'xYz' },
            strict: null,
        },
    },
    {
        input: 'Xx  -XyZ',
        output: {
            repair: { rawTag: 'Xx', value: 'XyZ' },
            strict: null,
        },
    },
    {
        input: 'a1  -Alpha, A.',
        output: {
            repair: { rawTag: 'a1', value: 'Alpha, A.' },
            strict: null,
        },
    },
    {
        input: 'er  -',
        output: {
            repair: { rawTag: 'er', value: '' },
            strict: null,
        },
    },
    {
        input: 'ty- JOUR',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'Ty- JOUR',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'tY- JOUR',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'xx- xyz',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'xX- xYz',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'Xx- XyZ',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'a1- Alpha, A.',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'er- ',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'ty   -   JOUR',
        output: {
            repair: { rawTag: 'ty', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'Ty   -   JOUR',
        output: {
            repair: { rawTag: 'Ty', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'tY   -   JOUR',
        output: {
            repair: { rawTag: 'tY', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'ty   - JOUR',
        output: {
            repair: { rawTag: 'ty', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'Ty   - JOUR',
        output: {
            repair: { rawTag: 'Ty', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'tY   - JOUR',
        output: {
            repair: { rawTag: 'tY', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'ty  -  JOUR',
        output: {
            repair: { rawTag: 'ty', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: ' Ty  -  JOUR',
        output: {
            repair: { rawTag: 'Ty', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: ' tY  -  JOUR',
        output: {
            repair: { rawTag: 'tY', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: ' xx  - xyz',
        output: {
            repair: { rawTag: 'xx', value: 'xyz' },
            strict: null,
        },
    },
    {
        input: ' XX  - xyz',
        output: {
            repair: { rawTag: 'XX', value: 'xyz' },
            strict: null, // should we allow this?
        },
    },
    {
        input: 'XX  - xyz ',
        output: {
            repair: { rawTag: 'XX', value: 'xyz ' },
            strict: { rawTag: 'XX', value: 'xyz ' },
        },
    },
    {
        input: ' XX  - xyz ',
        output: {
            repair: { rawTag: 'XX', value: 'xyz ' },
            strict: null, // should we allow this?
        },
    },
    {
        input: '\tXX  - xyz',
        output: {
            repair: { rawTag: 'XX', value: 'xyz' },
            strict: null, // should we allow this?
        },
    },
    {
        input: '\tXX\t- xyz',
        output: {
            repair: { rawTag: 'XX', value: 'xyz' },
            strict: null,
        },
    },
];

const VALID_TAGS_WITH_DASHES: TagTestCase[] = [
    {
        input: 'XX  - yz-ab',
        output: {
            repair: { rawTag: 'XX', value: 'yz-ab' },
            strict: { rawTag: 'XX', value: 'yz-ab' },
        },
    },
    {
        input: 'XX  - yz - ab',
        output: {
            repair: { rawTag: 'XX', value: 'yz - ab' },
            strict: { rawTag: 'XX', value: 'yz - ab' },
        },
    },
    {
        input: 'XX  - yz  - ab',
        output: {
            repair: { rawTag: 'XX', value: 'yz  - ab' },
            strict: { rawTag: 'XX', value: 'yz  - ab' },
        },
    },
];

const INVALID_TAGS: TagTestCase[] = [
    // INTENTION: with '{space}{space}-' repair must be able to extract broken tags!
    {
        input: 'AUTH  - Alpha, A.',
        output: {
            repair: { rawTag: 'AUTH', value: 'Alpha, A.' },
            strict: null,
        },
    },
    {
        input: 'DOI  - 10.1000/xyz123',
        output: {
            repair: { rawTag: 'DOI', value: '10.1000/xyz123' },
            strict: null,
        },
    },
    {
        input: 'A_1  - Alpha, A.',
        output: {
            repair: { rawTag: 'A_1', value: 'Alpha, A.' },
            strict: null,
        },
    },
    {
        input: 'T Y  - JOUR',
        output: {
            repair: { rawTag: 'T Y', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'T_Y  - JOUR',
        output: {
            repair: { rawTag: 'T_Y', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'T#Y  - JOUR',
        output: {
            repair: { rawTag: 'T#Y', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: '111  - 123',
        output: {
            repair: { rawTag: '111', value: '123' },
            strict: null,
        },
    },
    {
        input: '1.1  - 123',
        output: {
            repair: { rawTag: '1.1', value: '123' },
            strict: null,
        },
    },
    {
        input: '1,1  - 123',
        output: {
            repair: { rawTag: '1,1', value: '123' },
            strict: null,
        },
    },
    {
        input: 'typeOfRecord  - 123',
        output: {
            repair: { rawTag: 'typeOfRecord', value: '123' },
            strict: null,
        },
    },
];

const INVALID_TAGS_WITH_DASHES: TagTestCase[] = [
    {
        input: 'XXX  - xyz  - abc',
        output: {
            repair: { rawTag: 'XXX', value: 'xyz  - abc' },
            strict: null,
        },
    },
];

const INVALID_TAGS_SPACING_VARIATIONS: TagTestCase[] = [
    {
        input: 'T Y - JOUR',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 't y - JOUR',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'XXX - xyz',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'xxx - xyz',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'T Y- JOUR',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 't y- JOUR',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'XXX- xyz',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'xxx- xyz',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'T Y   - JOUR',
        output: {
            repair: { rawTag: 'T Y', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 't y   - JOUR',
        output: {
            repair: { rawTag: 't y', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'XXX   - xyz',
        output: {
            repair: { rawTag: 'XXX', value: 'xyz' },
            strict: null,
        },
    },
    {
        input: 'xxx   - xyz',
        output: {
            repair: { rawTag: 'xxx', value: 'xyz' },
            strict: null,
        },
    },
    {
        input: 'T Y  -JOUR',
        output: {
            repair: { rawTag: 'T Y', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 't y  -JOUR',
        output: {
            repair: { rawTag: 't y', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'XXX  -xyz',
        output: {
            repair: { rawTag: 'XXX', value: 'xyz' },
            strict: null,
        },
    },
    {
        input: 'xxx  -xyz',
        output: {
            repair: { rawTag: 'xxx', value: 'xyz' },
            strict: null,
        },
    },
    {
        input: 'T Y  -  JOUR',
        output: {
            repair: { rawTag: 'T Y', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 't y  -  JOUR',
        output: {
            repair: { rawTag: 't y', value: 'JOUR' },
            strict: null,
        },
    },
    {
        input: 'XXX  -  xyz',
        output: {
            repair: { rawTag: 'XXX', value: 'xyz' },
            strict: null,
        },
    },
    {
        input: 'xxx  -  xyz',
        output: {
            repair: { rawTag: 'xxx', value: 'xyz' },
            strict: null,
        },
    },
    {
        input: 'T Y-JOUR',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 't y-JOUR',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'XXX-xyz',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'xxx-xyz',
        output: {
            repair: null,
            strict: null,
        },
    },
];

const MULTILINE_TEXT: TagTestCase[] = [
    {
        input: 'Just some multiline text.',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'Well - More - Text.',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'it should be text.',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'xyz - else dont.',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'do it - else dont.',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'it - should be text.',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: 'it-department does something.',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: '',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: ' ',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: '\n',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: '\t',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: '- Text',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: ' - Text',
        output: {
            repair: null,
            strict: null,
        },
    },
    {
        input: '\t- Text',
        output: {
            repair: null,
            strict: null,
        },
    },
];

const FALSE_POSITIVES_AND_EDGE_CASES: TagTestCase[] = [
    // Tags that are just spaces or would have been parsed as whitespace tags by previous regexes
    {
        input: '  - value',
        output: { repair: null, strict: null },
    },
    {
        input: '   - value',
        output: { repair: null, strict: null },
    },
    {
        input: '    - value',
        output: { repair: null, strict: null },
    },
    {
        input: '\t  - value',
        output: { repair: null, strict: null },
    },
    // Tags starting with space but containing chars (should be consumed by ^\s* and result in the trimmed tag)
    {
        input: ' A  - value',
        output: {
            repair: { rawTag: 'A', value: 'value' },
            strict: null,
        },
    },
    {
        input: '  AB  - value',
        output: {
            repair: { rawTag: 'AB', value: 'value' },
            strict: null,
        },
    },
    {
        input: '\tA_1  - value',
        output: {
            repair: { rawTag: 'A_1', value: 'value' },
            strict: null,
        },
    },
    // Backtracking / spacing permutations
    {
        input: 'A  - ',
        output: {
            repair: { rawTag: 'A', value: '' },
            strict: null,
        },
    },
    {
        input: 'A   - ',
        output: {
            repair: { rawTag: 'A', value: '' },
            strict: null,
        },
    },
    {
        input: ' A B C  - value',
        output: {
            repair: { rawTag: 'A B C', value: 'value' },
            strict: null,
        },
    },
];

const ALL_TEST_CASES: TagTestCase[] = [
    ...BEST_PRACTICE_TAGS_AND_FORMAT,
    ...VALID_TAGS_CASE_VARIATIONS,
    ...VALID_TAGS_SINGLE_SPACING,
    ...VALID_TAGS_INVALID_SPACING,
    ...CASE_AND_SPACING_VARIATIONS,
    ...VALID_TAGS_WITH_DASHES,
    ...INVALID_TAGS,
    ...INVALID_TAGS_WITH_DASHES,
    ...INVALID_TAGS_SPACING_VARIATIONS,
    ...MULTILINE_TEXT,
    ...FALSE_POSITIVES_AND_EDGE_CASES,
];

describe('parse - unit > engine > parse.tags', () => {
    describe('extractTagFromLine()', () => {
        it.each(ALL_TEST_CASES)("'$input'", ({ input, output }) => {
            expect(extractTagFromLine(input)).toEqual(output.repair);
        });
    });

    describe('extractTagFromLine() - lines without hyphen', () => {
        it.each([
            ['plain text', 'just some text without delimiter'],
            ['tag-like key without hyphen', 'AU  Smith'],
            ['empty line', ''],
            ['whitespace only', '     '],
        ])('should return null for %s', (_label, line) => {
            expect(extractTagFromLine(line)).toBeNull();
        });

        // 64k spaces without hyphen used to backtrack quadratically (~1.3 s)
        it('should reject a 64k whitespace line without hyphen in under 50 ms', () => {
            const line = `X${' '.repeat(64_000)}`;
            const start = performance.now();
            const result = extractTagFromLine(line);
            expect(performance.now() - start).toBeLessThan(50);
            expect(result).toBeNull();
        });

        it('should still extract lax and malformed headers containing a hyphen', () => {
            expect(extractTagFromLine('Author Name  - Alpha, A.')).toEqual({
                rawTag: 'Author Name',
                value: 'Alpha, A.',
            });
            expect(extractTagFromLine('UR  -https://example.org')).toEqual({
                rawTag: 'UR',
                value: 'https://example.org',
            });
            expect(extractTagFromLine('ER  -')).toEqual({ rawTag: 'ER', value: '' });
        });
    });

    describe('REGEX_TAG_LINE_REPAIR - ReDoS execution safety', () => {
        const ATTACK_INPUTS: [string, string][] = [
            ['64k whitespace with trailing hyphen', `X${' '.repeat(64_000)}a-`],
            ['64k leading whitespace with malformed tag', `${' '.repeat(64_000)}X a-`],
            ['64k repetitive word-space with hyphen', `${'a '.repeat(64_000)}-`],
            ['64k tab-space with hyphen', `${'\t '.repeat(64_000)}-`],
            ['2-char tag followed by 64k spaces and text with hyphen', `AB${' '.repeat(64_000)}x-`],
            ['64k word-double-space with hyphen', `${'a  '.repeat(64_000)}b-`],
            ['64k tabs with trailing hyphen', `X${'\t'.repeat(64_000)}a-`],
        ];

        // pathological lines used to backtrack quadratically (~1.3 s)
        test.each(ATTACK_INPUTS)('should evaluate %s directly in under 500 ms', (_label, line) => {
            const start = performance.now();
            const result = REGEX_TAG_LINE_REPAIR.exec(line);
            expect(performance.now() - start).toBeLessThan(500);
            expect(result).toBeNull();
        });
    });

    describe('extractTagFromLine() - whitespace and tag length boundaries', () => {
        it('should parse lines with more than 120 leading spaces', () => {
            expect(extractTagFromLine(`${' '.repeat(130)}AU  - x`)).toEqual({
                rawTag: 'AU',
                value: 'x',
            });
        });

        it('should parse lines with more than 120 leading tabs', () => {
            expect(extractTagFromLine(`${'\t'.repeat(130)}AU - x`)).toEqual({
                rawTag: 'AU',
                value: 'x',
            });
        });

        it('should parse lines with more than 120 spaces before hyphen', () => {
            expect(extractTagFromLine(`AU${' '.repeat(130)}- x`)).toEqual({
                rawTag: 'AU',
                value: 'x',
            });
        });

        it('should parse tags containing internal tabs', () => {
            expect(extractTagFromLine('A\tU  - x')).toEqual({
                rawTag: 'A\tU',
                value: 'x',
            });
            expect(extractTagFromLine('Foo\tBar  - x')).toEqual({
                rawTag: 'Foo\tBar',
                value: 'x',
            });
        });

        it('should parse tags containing internal double spaces', () => {
            expect(extractTagFromLine('Author  Name  - x')).toEqual({
                rawTag: 'Author  Name',
                value: 'x',
            });
        });

        it('should parse tags with trailing tab or non-breaking space before the space run', () => {
            expect(extractTagFromLine('Foo\t  - x')).toEqual({ rawTag: 'Foo\t', value: 'x' });
            expect(extractTagFromLine('Foo Bar  - x')).toEqual({ rawTag: 'Foo Bar', value: 'x' });
        });

        it('should reject when fewer than 2 plain spaces directly precede the first hyphen', () => {
            expect(extractTagFromLine('Foo \t - x')).toBeNull();
            expect(extractTagFromLine('Foo\t- x')).toBeNull();
        });

        it('should split on the first hyphen only', () => {
            expect(extractTagFromLine('Foo  -  Bar  - x')).toEqual({ rawTag: 'Foo', value: 'Bar  - x' });
            expect(extractTagFromLine('X-  - y')).toBeNull();
        });

        it('should parse tags of arbitrary length', () => {
            const longTag = 'T'.repeat(500);
            expect(extractTagFromLine(`${longTag}  - x`)).toEqual({
                rawTag: longTag,
                value: 'x',
            });
        });
    });

    describe('extractStrictTagFromLine()', () => {
        it.each(ALL_TEST_CASES)("'$input'", ({ input, output }) => {
            expect(extractStrictTagFromLine(input)).toEqual(output.strict);
        });
    });
});
