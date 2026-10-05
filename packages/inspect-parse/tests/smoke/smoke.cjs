const assert = require('node:assert/strict');
const pkg = require('@smart-ris/inspect-parse');

assert.equal(typeof pkg.formatInspectionReport, 'function');
assert.equal(typeof pkg.inspectParse, 'function');
assert.equal(typeof pkg.inspectParseStream, 'function');

assert.equal(pkg.inspectParse('TY  - JOUR\nTI  - A title\nER  - \n').totalRecords, 1);
