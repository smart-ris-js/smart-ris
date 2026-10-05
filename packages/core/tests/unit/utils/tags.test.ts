// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { RisTag } from '../../../src/core.types.js';
import { repairTag } from '../../../src/utils/tags.js';

type RepairTagCase = [string, RisTag | null];

const runRepairTag = (input: string, expected: RisTag | null) => {
    const result = repairTag(input);
    if (expected === null) {
        expect(result).toBeNull();
    } else {
        expect(result).toBe(expected);
    }
};

describe('core - unit > utils > tags', () => {
    describe('repairTag', () => {
        it.each<RepairTagCase>([
            ['TY', 'TY'],
            ['A1', 'A1'],
            ['1A', '1A'],
            ['11', '11'],
        ])('should pass through perfectly valid standard tags | Input: %p', runRepairTag);

        it.each<RepairTagCase>([
            ['ty', 'TY'],
            ['a1', 'A1'],
            ['1a', '1A'],
        ])('should uppercase valid lowercase tags | Input: %p', runRepairTag);

        it.each<RepairTagCase>([
            [' TY', 'TY'],
            ['TY ', 'TY'],
            [' TY ', 'TY'],
            ['\tTI', 'TI'],
            ['TI\t', 'TI'],
            ['\tTI\t', 'TI'],
            ['\nTI', 'TI'],
            ['TI\n', 'TI'],
            ['\nTI\n', 'TI'],
            ['T Y', 'TY'],
            ['T  Y', 'TY'],
            [' T Y', 'TY'],
            ['T Y ', 'TY'],
            [' T Y ', 'TY'],
            ['T \t Y', 'TY'],
            [' T   Y ', 'TY'],
            ['      T\n   \t\r\n\r   Y ', 'TY'],
        ])('should repair tags with internal or surrounding spacing/tabs | Input: %p', runRepairTag);

        it.each<RepairTagCase>([
            ['T#Y', 'TY'],
            ['T_Y', 'TY'],
            ['T-Y', 'TY'],
            ['T.Y', 'TY'],
            ['$T$Y$', 'TY'],
            ['!!T!!Y!!', 'TY'],
            ['T🚀Y', 'TY'],
            ['!.-\t$%&/!T!Y#~+*', 'TY'],
        ])('should repair tags with symbols, punctuation, or emojis by stripping them | Input: %p', runRepairTag);

        it.each<RepairTagCase>([
            ['XXX', null],
            ['xxx', null],
            ['T1A', null],
            ['123', null],
            ['T#YY', null],
            ['$$TYY$$', null],
        ])('should resolve to null if the stripped tag is longer than 2 characters | Input: %p', runRepairTag);

        it.each<RepairTagCase>([
            ['T', null],
            ['1', null],
            ['T#', null],
        ])('should resolve to null if the stripped tag is exactly 1 character | Input: %p', runRepairTag);

        it.each<RepairTagCase>([
            ['', null],
            ['   ', null],
            ['\t', null],
            ['\n', null],
            ['\r', null],
            ['\r\n', null],
            ['$$', null],
            ['#_!', null],
        ])('should resolve to null if the stripped tag is completely empty | Input: %p', runRepairTag);

        it.each<RepairTagCase>([
            [String(null), null],
            [String(undefined), null],
            [String(true), null],
            [String(false), null],
            [String({}), null],
            [String([]), null],
            [String(() => {}), null],
            [String(Infinity), null],
            [String(-Infinity), null],
        ])('should resolve to null for JS coerced primitive strings (e.g. "null", "true") | Input: %p', runRepairTag);

        it.each<RepairTagCase>([
            ['12', '12'],
            [' 1 2 ', '12'],
        ])('should successfully repair valid coerced numeric strings | Input: %p', runRepairTag);

        it.each<RepairTagCase>([
            ['@A[B', 'AB'],
            ['/1:2', '12'],
            ['`A{B', 'AB'], // ` is before a, { is after z
            ['@/[`:{', null], // purely boundaries -> stripped entirely
        ])(
            'should properly strip characters immediately adjacent to A-Z and 0-9 ASCII boundaries | Input: %p',
            runRepairTag,
        );

        it.each<RepairTagCase>([
            ['TÄ', null], // Ä is stripped -> 'T' -> length 1 -> null
            ['AÉ', null],
            ['TÖY', 'TY'], // Ö is stripped -> 'TY' -> valid
            ['1ñ2', '12'], // ñ becomes Ñ, stripped -> '12' -> valid
            ['ДAБB', 'AB'], // Cyrillic characters stripped -> 'AB' -> valid
        ])('should strip diacritics, accents, and non-Latin alphabetical characters | Input: %p', runRepairTag);

        it.each<RepairTagCase>([
            ['T\u200BY', 'TY'], // Zero-width space
            ['\uFEFFA1', 'A1'], // Byte Order Mark (BOM)
            ['A\u200D1', 'A1'], // Zero-width joiner
            ['T\u200E\u200FY', 'TY'], // Left-to-right & Right-to-left marks
        ])('should strip invisible zero-width unicode characters | Input: %p', runRepairTag);
    });
});
