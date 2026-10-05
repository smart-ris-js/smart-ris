// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { parse } from '../../../parse/src/index.js';
import { stringify } from '../../src/index.js';

describe('stringify - integration > semantic-repair', () => {
    describe('Option: fromSemantic with repairTags', () => {
        const customSemanticMap = { XX: 'm-f' };

        it('should resolve known semantic keys before tag repair', () => {
            const out = stringify({ typeOfReference: 'JOUR', 'm-f': 'v' }, { fromSemantic: true, customSemanticMap });
            expect(out).toContain('XX  - v');
            expect(out).not.toContain('MF  -');
        });

        it('should keep custom semantic names across a parse and stringify round trip', () => {
            const text = 'TY  - JOUR\nXX  - v\nER  - \n';
            const [rec] = parse(text, { toSemantic: true, customSemanticMap });
            const [again] = parse(stringify(rec, { fromSemantic: true, customSemanticMap }), {
                toSemantic: true,
                customSemanticMap,
            });
            expect(again).toEqual(rec);
            expect(again['m-f']).toBe('v');
        });

        it('should still repair unknown keys', () => {
            expect(stringify({ typeOfReference: 'JOUR', T_1: 'v' }, { fromSemantic: true })).toContain('T1  - v');
        });

        it('should repair semantic-looking keys without fromSemantic', () => {
            expect(stringify({ TY: 'JOUR', 'm-f': 'v' }, { customSemanticMap })).toContain('MF  - v');
        });
    });
});
