// Copyright 2026 Martin Winkler

import type { Equal, Expect, ExpectFalse, Extends, IsNever } from '../../../../tests/types/type-utils.js';
import type { DEFAULT_ARRAY_TAGS, tag } from '../../src/core.constants.js';
import type {
    ContentRisTag,
    Day,
    DefaultArrayRisTag,
    DefaultArraySemanticKey,
    ExtractCustomArrayTags,
    ExtractCustomSemanticValues,
    ExtractSchemaKeys,
    KnownRisTag,
    MaybeArray,
    Month,
    RawDate,
    RisDate,
    RisTag,
    SemanticKey,
    StructuralRisTag,
} from '../../src/core.types.js';
import type { repairTag } from '../../src/utils/tags.js';

// -------------------------------------------------------------------
// 1. Positive Cases: Primitives & Type Utilities
// -------------------------------------------------------------------

// 1.0 repairTag returns RisTag | null
export type Test_RepairTag_ReturnType = Expect<Equal<ReturnType<typeof repairTag>, RisTag | null>>;

// 1.1 MaybeArray<T> direct union equality
type StringMaybeArray = MaybeArray<string>;
export type Test_MaybeArray = Expect<Equal<StringMaybeArray, string | string[] | readonly string[]>>;

// 1.2 Month and Day bounded union definitions
export type Test_Month_Bound = Expect<Extends<'01' | '12', Month>>;
export type Test_Day_Bound = Expect<Extends<'01' | '31', Day>>;

// 1.3 RawDate structure validation
export type Test_RawDate_Shape = Expect<
    Equal<
        RawDate,
        | { year: string; month?: Month; day?: Day }
        | { year?: string; month: Month; day?: Day }
        | { year?: string; month?: Month; day: Day }
    >
>;

// 1.4 RisDate valid format acceptance
export type Test_RisDate_YearOnly = Expect<Extends<'2026', RisDate>>;
export type Test_RisDate_YearMonth = Expect<Extends<'2026-05', RisDate>>;
export type Test_RisDate_FullDate = Expect<Extends<'2026-05-15', RisDate>>;
export type Test_RisDate_SlashYearMonth = Expect<Extends<'2026/05', RisDate>>;
export type Test_RisDate_SlashFullDate = Expect<Extends<'2026/05/15', RisDate>>;

// -------------------------------------------------------------------
// 2. Positive Cases: RIS Tags & Key Mappings
// -------------------------------------------------------------------

// 2.1 RisTag uppercase 2-character template literal
export type Test_RisTag_ValidTwoChar = Expect<Extends<'AU' | 'TY' | 'ER' | 'T1' | '99', RisTag>>;

// 2.2 SemanticKey tracks constant keys exactly
export type Test_SemanticKey_TracksConstant = Expect<Equal<SemanticKey, keyof typeof tag>>;

// 2.3 KnownRisTag tracks constant values exactly
export type Test_KnownRisTag_TracksConstant = Expect<Equal<KnownRisTag, (typeof tag)[SemanticKey]>>;

// 2.4 StructuralRisTag is exactly 'TY' | 'ER'
export type Test_StructuralRisTag = Expect<Equal<StructuralRisTag, 'TY' | 'ER'>>;

// 2.5 ContentRisTag excludes structural tags
export type Test_ContentRisTag_IncludesAU = Expect<Extends<'AU', ContentRisTag>>;
export type Test_ContentRisTag_ExcludesTY = ExpectFalse<Extends<'TY', ContentRisTag>>;
export type Test_ContentRisTag_ExcludesER = ExpectFalse<Extends<'ER', ContentRisTag>>;

// 2.6 DefaultArrayRisTag tracks DEFAULT_ARRAY_TAGS constant
export type Test_DefaultArrayRisTag = Expect<Equal<DefaultArrayRisTag, (typeof DEFAULT_ARRAY_TAGS)[number]>>;

// 2.7 DefaultArraySemanticKey includes standard author/keyword semantic keys
export type Test_DefaultArraySemanticKey = Expect<Extends<'author' | 'keywords' | 'notes', DefaultArraySemanticKey>>;

// -------------------------------------------------------------------
// 3. Positive Cases: Literal Tuple & Map Extractions
// -------------------------------------------------------------------

// 3.1 ExtractCustomArrayTags with readonly const tuple
type ValidArrayTags = ExtractCustomArrayTags<readonly ['CUSTOM_A', 'CUSTOM_B']>;
export type Test_ValidArrayTags = Expect<Equal<ValidArrayTags, 'CUSTOM_A' | 'CUSTOM_B'>>;

// 3.2 ExtractCustomArrayTags with single-element tuple
type SingleArrayTag = ExtractCustomArrayTags<readonly ['SINGLE_TAG']>;
export type Test_SingleArrayTag = Expect<Equal<SingleArrayTag, 'SINGLE_TAG'>>;

// 3.3 ExtractCustomArrayTags with literal string
type LiteralStringArrayTag = ExtractCustomArrayTags<'LITERAL_TAG'>;
export type Test_LiteralStringArrayTag = Expect<Equal<LiteralStringArrayTag, 'LITERAL_TAG'>>;

// 3.4 ExtractCustomSemanticValues extracts exact literal values
type CustomMap = { readonly CT: 'customTitle'; readonly CA: 'customAuthor' };
type ValidSemanticVals = ExtractCustomSemanticValues<CustomMap>;
export type Test_ValidSemanticVals = Expect<Equal<ValidSemanticVals, 'customTitle' | 'customAuthor'>>;

// 3.5 ExtractSchemaKeys extraction
type CustomSchema = { readonly MY_DATE: 'date'; readonly MY_NUM: 'number' };
type ValidSchemaKeys = ExtractSchemaKeys<CustomSchema>;
export type Test_ValidSchemaKeys = Expect<Equal<ValidSchemaKeys, 'MY_DATE' | 'MY_NUM'>>;

// -------------------------------------------------------------------
// 4. Negative Cases: Missing 'as const' & Wide Type Guards
// -------------------------------------------------------------------

// 4.1 Mutable string[] without 'as const' evaluates to never
type InvalidArrayTags = ExtractCustomArrayTags<string[]>;
export type Test_RejectMutableStringArray = Expect<IsNever<InvalidArrayTags>>;

// 4.2 Non-const Record with wide string values evaluates to never
type InvalidCustomMap = Record<string, string>;
type InvalidSemanticVals = ExtractCustomSemanticValues<InvalidCustomMap>;
export type Test_RejectMutableRecord = Expect<IsNever<InvalidSemanticVals>>;

// 4.3 Non-const Record for schema keys evaluates to never
type InvalidSchemaMap = Record<string, string>;
type InvalidSchemaKeys = ExtractSchemaKeys<InvalidSchemaMap>;
export type Test_RejectWideSchemaKeys = Expect<IsNever<InvalidSchemaKeys>>;

// 4.4 Non-conforming tag shapes rejected from RisTag
export type Test_RejectLowercaseTag = ExpectFalse<Extends<'au', RisTag>>;
export type Test_RejectOneCharTag = ExpectFalse<Extends<'A', RisTag>>;
export type Test_RejectThreeCharTag = ExpectFalse<Extends<'ABC', RisTag>>;
export type Test_RejectEmptyTag = ExpectFalse<Extends<'', RisTag>>;

// -------------------------------------------------------------------
// 5. Negative Cases: RisDate Format Bounds Checking
// -------------------------------------------------------------------

{
    // 5.1 Invalid month format (must be '01'-'12')
    // @ts-expect-error Invalid month format '13'
    const _invalidMonth13: RisDate = '2026-13';

    // @ts-expect-error Invalid month format '00'
    const _invalidMonth00: RisDate = '2026-00';

    // 5.2 Invalid day format (must be '01'-'31')
    // @ts-expect-error Invalid day format '32'
    const _invalidDay32: RisDate = '2026-05-32';

    // @ts-expect-error Invalid day format '00'
    const _invalidDay00: RisDate = '2026-05-00';

    // 5.3 Slash formats share the month/day bounds
    // @ts-expect-error Invalid month format '13'
    const _invalidSlashMonth13: RisDate = '2026/13';

    // @ts-expect-error Invalid day format '32'
    const _invalidSlashDay32: RisDate = '2026/05/32';
}
