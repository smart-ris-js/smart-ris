// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { parse, parseStream } from '../../src/index.js';

const t = (tag: string, value: string) => `${tag}  - ${value}\n`;
const record = (...lines: string[]) => `${t('TY', 'JOUR')}${lines.join('')}${t('ER', '')}`;

describe('parse - integration > number-cast', () => {
    describe('Option: useSmartTypes with default number tags (VL, IS, SE, ...)', () => {
        it('should keep radix, exponent and Infinity syntax as raw strings', () => {
            const [rec] = parse(
                record(t('VL', '0x10'), t('SE', '1e3'), t('IS', 'Infinity'), t('NV', '0b1'), t('SV', '-Infinity')),
                { useSmartTypes: true },
            );
            expect(rec).toEqual({ TY: 'JOUR', VL: '0x10', SE: '1e3', IS: 'Infinity', NV: '0b1', SV: '-Infinity' });
        });

        it('should keep non-decimal values intact through JSON serialization', () => {
            const [rec] = parse(record(t('IS', 'Infinity'), t('VL', '12')), { useSmartTypes: true });
            expect(JSON.parse(JSON.stringify(rec))).toEqual({ TY: 'JOUR', IS: 'Infinity', VL: 12 });
        });

        it('should cast plain decimals', () => {
            const [rec] = parse(record(t('VL', '12'), t('IS', '-3.5'), t('SE', '007')), { useSmartTypes: true });
            expect(rec).toEqual({ TY: 'JOUR', VL: 12, IS: -3.5, SE: 7 });
        });

        it('should keep values beyond exact double precision as raw strings', () => {
            const [rec] = parse(record(t('VL', '12345678901234567890')), { useSmartTypes: true });
            expect(rec?.VL).toBe('12345678901234567890');
        });

        it('should cast merged repeated scalar values only if the merged value is a plain decimal', () => {
            const [rec] = parse(record(t('VL', '12'), t('VL', '13')), { useSmartTypes: true });
            expect(rec?.VL).toBe('12 13');
        });

        it('should cast each array entry independently', () => {
            const [rec] = parse(record(t('C1', '1'), t('C1', '1e3'), t('C1', '0x1'), t('C1', '2.5')), {
                useSmartTypes: true,
                smartCastSchema: { C1: 'number' },
                customArrayTags: ['C1'],
            });
            expect(rec?.C1).toEqual([1, '1e3', '0x1', 2.5]);
        });

        it('should behave identically in parseStream', async () => {
            async function* chunks() {
                yield record(t('VL', '0x10'), t('IS', 'Infinity'));
                yield record(t('VL', '42'));
            }
            const results: unknown[] = [];
            for await (const rec of parseStream(chunks(), { useSmartTypes: true })) {
                results.push(rec);
            }
            expect(results).toEqual([
                { TY: 'JOUR', VL: '0x10', IS: 'Infinity' },
                { TY: 'JOUR', VL: 42 },
            ]);
        });
    });
});
