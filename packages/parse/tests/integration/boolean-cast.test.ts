// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { parse } from '../../src/index.js';

describe('parse - integration > boolean-cast', () => {
    describe('Option: useSmartTypes with cleanWhitespace false', () => {
        it('should cast whitespace-padded booleans like numbers and dates', () => {
            const [rec] = parse('TY  - JOUR\nC1  - true  \nC2  - 12  \nC3  - 2020  \nER  - \n', {
                useSmartTypes: true,
                cleanWhitespace: false,
                smartCastSchema: { C1: 'boolean', C2: 'number', C3: 'date' },
            });
            expect(rec).toEqual({ TY: 'JOUR', C1: true, C2: 12, C3: '2020' });
        });
    });
});
