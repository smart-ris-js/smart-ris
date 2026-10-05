// Copyright 2026 Martin Winkler

import type { Equal, Expect, Extends } from '../../../../tests/types/type-utils.js';
import { createRisBuilder, ris } from '../../src/builder/builder.js';
import type { BuiltRisRecord, RawBuiltRisRecord, RisBuilder, RisBuilderConfig } from '../../src/core.types.js';

// -------------------------------------------------------------------
// 1. Positive Cases: Method Chaining & Autocomplete
// -------------------------------------------------------------------

declare const baseBuilder: RisBuilder;
declare const customBuilder: RisBuilder<{
    customSemanticMap: { CT: 'customTitle' };
}>;

// 1.1 Standard chaining returns RisBuilder
const chained = baseBuilder.title('Paper Title').author(['Author One', 'Author Two']);
export type Test_Chaining = Expect<Equal<typeof chained, RisBuilder>>;

// 1.2 Custom semantic key autocomplete method is callable
const customChained = customBuilder.customTitle('Custom Title Text');
export type Test_CustomChaining = Expect<Equal<typeof customChained, typeof customBuilder>>;

// 1.3 Custom fallback tag chaining is callable
const fallbackChained = baseBuilder.CUSTOM_UNLISTED_TAG('Custom Value');
export type Test_FallbackChaining = Expect<Equal<typeof fallbackChained, RisBuilder>>;

// -------------------------------------------------------------------
// 2. Positive Cases: Dual-Mode Factory & Builder Creation
// -------------------------------------------------------------------

// 2.1 createRisBuilder() factory returns standard RisBuilder
const createdBase = createRisBuilder();
export type Test_CreateRisBuilder_Default = Expect<Equal<typeof createdBase, RisBuilder>>;

// 2.2 createRisBuilder(config) returns configured RisBuilder
const createdCustom = createRisBuilder({
    customSemanticMap: { CT: 'customTitle' },
} as const);
export type Test_CreateRisBuilder_Custom = Expect<
    Equal<typeof createdCustom, RisBuilder<{ readonly customSemanticMap: { readonly CT: 'customTitle' } }>>
>;

// 2.3 ris() callable factory returns default RisBuilder
const risCalled = ris();
export type Test_RisCallable_Default = Expect<Equal<typeof risCalled, RisBuilder<Record<string, never>>>>;

// 2.4 ris(config) callable factory returns configured RisBuilder
const risConfigured = ris({
    customSemanticMap: { CT: 'customTitle' },
} as const);
export type Test_RisCallable_Configured = Expect<
    Equal<typeof risConfigured, RisBuilder<{ readonly customSemanticMap: { readonly CT: 'customTitle' } }>>
>;

// 2.5 ris property access returns callable builder method
const risPropertyCall = ris.title('Direct Title');
export type Test_RisDirectProperty = Expect<Equal<typeof risPropertyCall, RisBuilder<Record<string, never>>>>;

// 2.6 RisBuilderConfig shape validation
export type Test_RisBuilderConfig_Shape = Expect<
    Extends<{ customSemanticMap?: { C1: 'citationCount' } }, RisBuilderConfig>
>;

// -------------------------------------------------------------------
// 3. Positive Cases: Terminal & Output Accessor Methods
// -------------------------------------------------------------------

// 3.1 build() terminal method returns BuiltRisRecord (required TY)
const record = baseBuilder.build();
export type Test_BuildMethod = Expect<Equal<typeof record, BuiltRisRecord>>;

// 3.2 raw() terminal method returns RawBuiltRisRecord (required TY array)
const rawRecord = baseBuilder.raw();
export type Test_RawMethod = Expect<Equal<typeof rawRecord, RawBuiltRisRecord>>;

// 3.3 get getter property returns BuiltRisRecord
const getRecord = baseBuilder.get;
export type Test_GetMethod = Expect<Equal<typeof getRecord, BuiltRisRecord>>;

// 3.4 toJSON() terminal method returns BuiltRisRecord
const jsonRecord = baseBuilder.toJSON();
export type Test_ToJSONMethod = Expect<Equal<typeof jsonRecord, BuiltRisRecord>>;

// -------------------------------------------------------------------
// 4. Positive Cases: Method Argument Flexibility
// -------------------------------------------------------------------

// 4.1 Scalar types in RisStringifyValue
baseBuilder
    .title('String Title')
    .publicationYear(2026)
    .customField(true)
    .primaryDate(new Date())
    .primaryDate('2026-05-15')
    .notes(null);

// 4.2 RawDate variations (full, single fields, and field pairs)
baseBuilder
    .secondaryDate({ year: '2026', month: '05', day: '15' })
    .secondaryDate({ year: '2026' })
    .secondaryDate({ month: '05' })
    .secondaryDate({ day: '15' })
    .secondaryDate({ year: '2026', month: '05' })
    .secondaryDate({ year: '2026', day: '15' })
    .secondaryDate({ month: '05', day: '15' });

// 4.3 Homogeneous and mixed arrays in RisStringifyValue[]
baseBuilder
    .author(['Author 1', 'Author 2'])
    .publicationYear([2024, 2025, 2026])
    .customField([true, false])
    .primaryDate([new Date(), new Date()])
    .secondaryDate([{ year: '2026' }, { month: '05', day: '15' }])
    .notes([null, null])
    .customField(['str', 123, true, new Date(), { year: '2026' }, null]);

// 4.4 Variadic and spread combinations
baseBuilder
    .author('Author 1', 'Author 2')
    .customField('str', 123, true, new Date(), null)
    .customField(['Author 1'], 'Author 2', [1, true]);

// -------------------------------------------------------------------
// 5. Negative Cases: Disallowed Method Argument Types
// -------------------------------------------------------------------

// 5.1 Disallowed scalar types
// @ts-expect-error Type 'undefined' is not assignable to parameter of type 'MaybeArray<RisStringifyValue>'
baseBuilder.title(undefined);

// @ts-expect-error Type 'symbol' is not assignable to parameter of type 'MaybeArray<RisStringifyValue>'
baseBuilder.title(Symbol('test'));

// @ts-expect-error Type 'bigint' is not assignable to parameter of type 'MaybeArray<RisStringifyValue>'
baseBuilder.title(100n);

// @ts-expect-error Type '() => void' is not assignable to parameter of type 'MaybeArray<RisStringifyValue>'
baseBuilder.title(() => {});

// @ts-expect-error Object literal may only specify known properties not in RawDate
baseBuilder.title({ invalid: true });

// @ts-expect-error Type 'number' is not assignable to type 'string | undefined' in RawDate
baseBuilder.title({ year: 2026 });

// 5.2 Disallowed array types
// @ts-expect-error Type 'undefined[]' is not assignable to parameter of type 'MaybeArray<RisStringifyValue>'
baseBuilder.title([undefined]);

// @ts-expect-error Type 'symbol[]' is not assignable to parameter of type 'MaybeArray<RisStringifyValue>'
baseBuilder.title([Symbol('test')]);

// @ts-expect-error Type 'bigint[]' is not assignable to parameter of type 'MaybeArray<RisStringifyValue>'
baseBuilder.title([100n]);

// @ts-expect-error Type '(() => void)[]' is not assignable to parameter of type 'MaybeArray<RisStringifyValue>'
baseBuilder.title([() => {}]);

// @ts-expect-error Type '{ invalid: boolean }[]' is not assignable to parameter of type 'MaybeArray<RisStringifyValue>'
baseBuilder.title([{ invalid: true }]);

// -------------------------------------------------------------------
// 6. Boundary Tag Constraints (TY / typeOfReference & ER / endOfReference)
// -------------------------------------------------------------------

// 6.1 Positive Cases: TY and typeOfReference accept scalar and array string | null
baseBuilder
    .TY('JOUR')
    .typeOfReference('JOUR')
    .TY('JOUR', 'BOOK')
    .typeOfReference('JOUR', 'BOOK')
    .TY(['JOUR', 'BOOK'])
    .typeOfReference(['JOUR', 'BOOK'])
    .TY('JOUR', 'BOOK')
    .typeOfReference('JOUR', 'BOOK')

    .TY(null)
    .typeOfReference(null)
    .TY([null, null])
    .typeOfReference([null, null])
    .TY(null, null)
    .typeOfReference(null, null)
    .TY([null, null, null])
    .typeOfReference([null, null, null])
    .TY(null, null, null)
    .typeOfReference(null, null, null)

    .TY(['JOUR', null])
    .typeOfReference(['JOUR', null])
    .TY([null, 'JOUR'])
    .typeOfReference([null, 'JOUR'])
    .TY('JOUR', null)
    .typeOfReference('JOUR', null)
    .TY(null, 'JOUR')
    .typeOfReference(null, 'JOUR');

// 6.2 Negative Cases: TY and typeOfReference reject non-string / non-null types
// @ts-expect-error Type 'number' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY(123);
// @ts-expect-error Type 'number' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.typeOfReference(123);
// @ts-expect-error Type 'number[]' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY([123]);
// @ts-expect-error Type 'number[]' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.typeOfReference([123]);

// @ts-expect-error Type 'boolean' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY(true);
// @ts-expect-error Type 'boolean[]' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY([true]);

// @ts-expect-error Type 'Date' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY(new Date());
// @ts-expect-error Type 'Date[]' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY([new Date()]);

// @ts-expect-error Type '{ year: string; }' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY({ year: '2026' });
// @ts-expect-error Type '{ year: string; }[]' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY([{ year: '2026' }]);

// @ts-expect-error Type 'undefined' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY(undefined);
// @ts-expect-error Type 'undefined[]' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY([undefined]);

// @ts-expect-error Type 'symbol' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY(Symbol('x'));
// @ts-expect-error Type 'symbol[]' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY([Symbol('x')]);

// @ts-expect-error Type 'bigint' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY(100n);
// @ts-expect-error Type 'bigint[]' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY([100n]);

// @ts-expect-error Type '() => void' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY(() => {});
// @ts-expect-error Type '(() => void)[]' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY([() => {}]);

// @ts-expect-error Type '{ foo: string; }' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY({ foo: 'bar' });
// @ts-expect-error Type '{ foo: string; }[]' is not assignable to parameter of type 'MaybeArray<string | null>'
baseBuilder.TY([{ foo: 'bar' }]);

// 6.3 Negative Cases: Boundary markers and promise thenables mapped to 'never' must reject function invocation
// @ts-expect-error Property 'ER' is not callable (mapped to never)
baseBuilder.ER();

// @ts-expect-error Property 'endOfReference' is not callable (mapped to never)
baseBuilder.endOfReference();

// @ts-expect-error Property 'then' is not callable (mapped to never)
baseBuilder.then();

// @ts-expect-error Property 'catch' is not callable (mapped to never)
baseBuilder.catch();

// @ts-expect-error Property 'finally' is not callable (mapped to never)
baseBuilder.finally();

// -------------------------------------------------------------------
// 7. Positive Cases: Readonly Arrays & Immutability
// -------------------------------------------------------------------

const readonlyAuthors = ['Author 1', 'Author 2'] as const;
baseBuilder.author(readonlyAuthors);
baseBuilder.TY(['JOUR', 'BOOK'] as const);

// -------------------------------------------------------------------
// 8. Positive Cases: Zero-Argument Method Calls
// -------------------------------------------------------------------

// Method invocation with 0 args is valid (represents empty tag)
baseBuilder.title().notes().TY();

// -------------------------------------------------------------------
// 9. Positive Cases: Direct `ris` Proxy Terminal & Boundary Calls
// -------------------------------------------------------------------

const risDirectTY = ris.TY('JOUR');
export type Test_RisDirectTY = Expect<Equal<typeof risDirectTY, RisBuilder<Record<string, never>>>>;

const risDirectBuild = ris.build();
export type Test_RisDirectBuild = Expect<Equal<typeof risDirectBuild, BuiltRisRecord>>;

const risDirectRaw = ris.raw();
export type Test_RisDirectRaw = Expect<Equal<typeof risDirectRaw, RawBuiltRisRecord>>;

const risDirectGet = ris.get;
export type Test_RisDirectGet = Expect<Equal<typeof risDirectGet, BuiltRisRecord>>;

// -------------------------------------------------------------------
// 10. Negative Cases: Direct `ris` ER & Promise Thenable Invocations
// -------------------------------------------------------------------

// @ts-expect-error Property 'ER' is not callable on direct ris proxy
ris.ER();

// @ts-expect-error Property 'endOfReference' is not callable on direct ris proxy
ris.endOfReference();

// @ts-expect-error Property 'then' is not callable on direct ris proxy
ris.then();

// @ts-expect-error Property 'catch' is not callable on direct ris proxy
ris.catch();

// @ts-expect-error Property 'finally' is not callable on direct ris proxy
ris.finally();

// -------------------------------------------------------------------
// 11. Positive Cases: Config Widening & Overwrite Exclusions
// -------------------------------------------------------------------

// 11.1 Non-literal RisBuilderConfig preserves standard semantic methods
declare const wideConfig: RisBuilderConfig;
const wideBuilder = createRisBuilder(wideConfig);
wideBuilder.title('Preserved Title').author('Preserved Author');

// 11.2 Overwritten semantic key is excluded from autocomplete keys
declare const overwrittenBuilder: RisBuilder<{
    customSemanticMap: { AU: 'firstAuthor' };
}>;
overwrittenBuilder.firstAuthor('New Author');

// 11.3 Multi-step chain preserves TConfig throughout
const multiChainedCustom = customBuilder.customTitle('T1').title('T2').customTitle('T3');
export type Test_MultiChainedCustom = Expect<Equal<typeof multiChainedCustom, typeof customBuilder>>;

// -------------------------------------------------------------------
// 12. Negative Cases: Empty RawDate & Invalid Types
// -------------------------------------------------------------------

// @ts-expect-error Empty object rejected because RawDate requires >= 1 property
baseBuilder.secondaryDate({});
