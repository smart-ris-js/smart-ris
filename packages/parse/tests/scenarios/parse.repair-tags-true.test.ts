// Copyright 2026 Martin Winkler

import { runParseFixtures } from './utils/runner.js';

runParseFixtures('Option: repairTags true', { repairTags: true }, 'repairTags_true');

// repairTags combined with every other option variation; `repairTags_true` precedes the single-option key
// since that key assumes the default `repairTags: false`.
runParseFixtures('Option: repairTags true + skipInvalidTags true', { repairTags: true, skipInvalidTags: true }, [
    'repairTags_true_skipInvalidTags_true',
    'repairTags_true',
    'skipInvalidTags_true',
]);
runParseFixtures('Option: repairTags true + skipEmptyTags false', { repairTags: true, skipEmptyTags: false }, [
    'repairTags_true',
    'skipEmptyTags_false',
]);
runParseFixtures('Option: repairTags true + cleanWhitespace false', { repairTags: true, cleanWhitespace: false }, [
    'repairTags_true',
    'cleanWhitespace_false',
]);
runParseFixtures('Option: repairTags true + mergeMultiline true', { repairTags: true, mergeMultiline: true }, [
    'repairTags_true',
    'mergeMultiline_true',
]);
runParseFixtures('Option: repairTags true + toSemantic true', { repairTags: true, toSemantic: true }, [
    'repairTags_true_toSemantic_true',
    'repairTags_true',
    'toSemantic_true',
]);
runParseFixtures('Option: repairTags true + arrayMergeStrategy first', { repairTags: true, arrayMergeStrategy: 'first' }, [
    'repairTags_true_arrayMergeStrategy_first',
    'repairTags_true',
    'arrayMergeStrategy_first',
]);
runParseFixtures('Option: repairTags true + useSmartTypes true', { repairTags: true, useSmartTypes: true }, [
    'repairTags_true',
    'useSmartTypes_true',
]);
