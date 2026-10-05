const assert = require('node:assert/strict');
const pkg = require('@smart-ris/stringify');

assert.equal(typeof pkg.buildStringifyPipeline, 'function');
assert.equal(typeof pkg.createStringifyEngine, 'function');
assert.equal(typeof pkg.resolveStringifyOptions, 'function');
assert.equal(typeof pkg.stringify, 'function');
assert.equal(typeof pkg.stringifyStream, 'function');
assert.equal(typeof pkg.DEFAULT_STRINGIFY_OPTIONS, 'object');

assert.equal(pkg.stringify({ TY: 'JOUR', TI: 'A title' }), 'TY  - JOUR\nTI  - A title\nER  - \n');
