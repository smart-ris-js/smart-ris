import assert from 'node:assert/strict';
import * as pkg from '@smart-ris/parse';

assert.equal(typeof pkg.buildParsePipeline, 'function');
assert.equal(typeof pkg.createParseEngine, 'function');
assert.equal(typeof pkg.parse, 'function');
assert.equal(typeof pkg.parseStream, 'function');
assert.equal(typeof pkg.resolveParseOptions, 'function');
assert.equal(typeof pkg.DEFAULT_PARSE_OPTIONS, 'object');

assert.deepEqual({ ...pkg.parse('TY  - JOUR\nTI  - A title\nER  - \n')[0] }, { TY: 'JOUR', TI: 'A title' });
