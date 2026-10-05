// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import type { Middleware } from '../../../src/core.types.js';
import { executePipeline } from '../../../src/middlewares/core.pipeline.js';

describe('core - unit > middlewares > core.pipeline', () => {
    describe('Function: executePipeline()', () => {
        it('should return the initial payload unchanged when no middlewares are provided', () => {
            const payload = { A1: 'Author' };
            const result = executePipeline(payload, []);
            expect(result).toBe(payload);
        });

        it('should execute a single middleware and return its transformed output', () => {
            const payload = { A1: 'author' };
            const middleware: Middleware = (p) => ({ ...p, A1: (p.A1 as string).toUpperCase() });

            const result = executePipeline(payload, [middleware]);
            expect(result).toEqual({ A1: 'AUTHOR' });
        });

        it('should execute multiple middlewares sequentially in the exact provided order', () => {
            const payload = { steps: ['start'] };

            const middleware1: Middleware = (p) => ({
                ...p,
                steps: [...(p.steps as string[]), 'step1'],
            });

            const middleware2: Middleware = (p) => ({
                ...p,
                steps: [...(p.steps as string[]), 'step2'],
            });

            const middleware3: Middleware = (p) => ({
                ...p,
                steps: [...(p.steps as string[]), 'step3'],
            });

            const result = executePipeline(payload, [middleware1, middleware2, middleware3]);
            expect(result).toEqual({ steps: ['start', 'step1', 'step2', 'step3'] });
        });

        it('should pass the output of previous middleware as input to the next', () => {
            const payload = { count: 1 };

            const addTwo: Middleware = (p) => ({ ...p, count: (p.count as number) + 2 });
            const multiplyByThree: Middleware = (p) => ({ ...p, count: (p.count as number) * 3 });

            const result = executePipeline(payload, [addTwo, multiplyByThree]);
            expect(result).toEqual({ count: 9 });
        });
    });
});
