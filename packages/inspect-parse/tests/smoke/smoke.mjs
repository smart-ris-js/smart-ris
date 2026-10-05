import assert from 'node:assert/strict';
import * as pkg from '@smart-ris/inspect-parse';

assert.equal(typeof pkg.formatInspectionReport, 'function');
assert.equal(typeof pkg.inspectParse, 'function');
assert.equal(typeof pkg.inspectParseStream, 'function');

assert.equal(pkg.inspectParse('TY  - JOUR\nTI  - A title\nER  - \n').totalRecords, 1);
