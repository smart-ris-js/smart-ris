// Copyright 2026 Martin Winkler

import type { Equal, Expect, Extends } from '../../../../tests/types/type-utils.js';
import type { EmitErrorOptions, LogLevelValue, OnErrorCallback, RisErrorContext } from '../../src/core.types.js';
import type { RisBaseError, RisError, RisInfo, RisWarning } from '../../src/errors.js';

// -------------------------------------------------------------------
// 1. Positive Cases: Error Class Hierarchy
// -------------------------------------------------------------------

// 1.1 RisError, RisWarning, RisInfo extend RisBaseError
export type Test_RisError_Extends_Base = Expect<Extends<RisError, RisBaseError>>;
export type Test_RisWarning_Extends_Base = Expect<Extends<RisWarning, RisBaseError>>;
export type Test_RisInfo_Extends_Base = Expect<Extends<RisInfo, RisBaseError>>;

// 1.2 RisBaseError extends standard Error
export type Test_RisBaseError_Extends_Error = Expect<Extends<RisBaseError, Error>>;

// 1.3 RisBaseError severity narrows to LogLevelValue
export type Test_RisBaseError_Severity_Type = Expect<Equal<RisBaseError['severity'], LogLevelValue>>;

// -------------------------------------------------------------------
// 2. Positive Cases: Error Callbacks and Diagnostic Contexts
// -------------------------------------------------------------------

// 2.1 RisErrorContext shape matches incident diagnostic model
export type Test_RisErrorContext_Shape = Expect<
    Equal<
        RisErrorContext,
        {
            error: RisBaseError;
            rawLine: string;
            lineNumber?: number | null;
            tag: string | null;
            recordContext?: Record<string, unknown>;
        }
    >
>;

// 2.2 OnErrorCallback function signature
export type Test_OnErrorCallback_Signature = Expect<Equal<OnErrorCallback, (incident: RisErrorContext) => void>>;

// 2.3 EmitErrorOptions interface validation
export type Test_EmitErrorOptions_Shape = Expect<
    Equal<
        EmitErrorOptions,
        {
            onError?: OnErrorCallback | undefined;
            logLevel: LogLevelValue;
        }
    >
>;
