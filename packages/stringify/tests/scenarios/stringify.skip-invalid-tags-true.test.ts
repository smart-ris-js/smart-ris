// Copyright 2026 Martin Winkler

import { runStringifyFixtures } from './utils/runner.js';

runStringifyFixtures('Option: skipInvalidTags true', { skipInvalidTags: true }, 'skipInvalidTags_true');
