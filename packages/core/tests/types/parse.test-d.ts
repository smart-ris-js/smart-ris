// Copyright 2026 Martin Winkler

import type { Equal, Expect, Extends } from '../../../../tests/types/type-utils.js';
import type {
    ArrayRisRecord,
    ParsedRisRecord,
    ParseRisRecord,
    RisRecord,
    SemanticArrayRisRecord,
    SemanticRisRecord,
    SmartArrayRisRecord,
    SmartRisRecord,
    SmartSemanticArrayRisRecord,
    SmartSemanticRisRecord,
} from '../../src/core.types.js';

// -------------------------------------------------------------------
// 1. Positive Cases: 8 Matrix Permutations of ParsedRisRecord
// -------------------------------------------------------------------

// 1.1 Default ParsedRisRecord: Standard 2-character tags, strings
type DefaultRecord = ParsedRisRecord;
export type Test_Default_TY = Expect<Equal<DefaultRecord['TY'], string>>;
export type Test_Default_AU = Expect<Equal<DefaultRecord['AU'], string[] | undefined>>;
export type Test_Default_TI = Expect<Equal<DefaultRecord['TI'], string | undefined>>;
export type Test_Default_Matches_RisRecord = Expect<Equal<DefaultRecord, RisRecord>>;

// 1.2 toSemantic: true -> Semantic keys inferred
type SemanticRecord = ParsedRisRecord<{ toSemantic: true }>;
export type Test_Semantic_TY = Expect<Equal<SemanticRecord['typeOfReference'], string>>;
export type Test_Semantic_AU = Expect<Equal<SemanticRecord['author'], string[] | undefined>>;
export type Test_Semantic_Matches = Expect<Equal<SemanticRecord, SemanticRisRecord>>;

// 1.3 useSmartTypes: true -> Dates, numbers, booleans inferred
type SmartRecord = ParsedRisRecord<{ useSmartTypes: true }>;
export type Test_Smart_VL = Expect<Equal<SmartRecord['VL'], number | string | undefined>>;
export type Test_Smart_PY = Expect<Equal<SmartRecord['PY'], string | undefined>>;
export type Test_Smart_Matches = Expect<Equal<SmartRecord, SmartRisRecord>>;

// 1.4 toSemantic: true + useSmartTypes: true
type SmartSemanticRecord = ParsedRisRecord<{ toSemantic: true; useSmartTypes: true }>;
export type Test_SmartSemantic_Matches = Expect<Equal<SmartSemanticRecord, SmartSemanticRisRecord>>;

// 1.5 arrayMergeStrategy: false -> All fields are strictly arrays
type StrictArrayRecord = ParsedRisRecord<{ arrayMergeStrategy: false }>;
export type Test_ArrayOnly_TY = Expect<Equal<StrictArrayRecord['TY'], string[]>>;
export type Test_ArrayOnly_Matches = Expect<Equal<StrictArrayRecord, ArrayRisRecord>>;

// 1.6 Semantic + Array-only
type SemanticArrayRecord = ParsedRisRecord<{ toSemantic: true; arrayMergeStrategy: false }>;
export type Test_SemanticArray_Matches = Expect<Equal<SemanticArrayRecord, SemanticArrayRisRecord>>;

// 1.7 Smart + Array-only
type SmartArrayRecord = ParsedRisRecord<{ useSmartTypes: true; arrayMergeStrategy: false }>;
export type Test_SmartArray_Matches = Expect<Equal<SmartArrayRecord, SmartArrayRisRecord>>;

// 1.8 Smart + Semantic + Array-only
type SmartSemanticArrayRecord = ParsedRisRecord<{
    toSemantic: true;
    useSmartTypes: true;
    arrayMergeStrategy: false;
}>;
export type Test_SmartSemanticArray_Matches = Expect<Equal<SmartSemanticArrayRecord, SmartSemanticArrayRisRecord>>;

// -------------------------------------------------------------------
// 2. Positive Cases: Custom Schemas, Smart Casting & Array Resolution
// -------------------------------------------------------------------

// 2.1 Custom Smart Cast Schema override
type CustomCastRecord = ParsedRisRecord<{
    useSmartTypes: true;
    smartCastSchema: { readonly U1: 'number'; readonly U2: 'boolean'; readonly CD: 'date' };
}>;
export type Test_CustomNumber = Expect<Equal<CustomCastRecord['U1'], number | string | undefined>>;
export type Test_CustomBoolean = Expect<Equal<CustomCastRecord['U2'], boolean | string | undefined>>;
export type Test_CustomDate = Expect<Equal<CustomCastRecord['CD'], string | undefined>>;

// 2.2 Overriding Default Smart Cast back to string
type OverrideCastRecord = ParsedRisRecord<{
    useSmartTypes: true;
    smartCastSchema: { readonly VL: 'string' };
}>;
export type Test_OverriddenVolume = Expect<Equal<OverrideCastRecord['VL'], string | undefined>>;
export type Test_PreservedDate = Expect<Equal<OverrideCastRecord['PY'], string | undefined>>;

// 2.3 Cross-Feature: Custom Array Tag + Custom Smart Cast
type ArraySmartRecord = ParsedRisRecord<{
    useSmartTypes: true;
    customArrayTags: readonly ['C1'];
    smartCastSchema: { readonly C1: 'number' };
}>;
export type Test_ArraySmartCast = Expect<Equal<ArraySmartRecord['C1'], (number | string)[] | undefined>>;

// 2.4 Custom Semantic Map and Custom Array Tags
type CustomMappedRecord = ParsedRisRecord<{
    toSemantic: true;
    customSemanticMap: { readonly C1: 'citationCount' };
    customArrayTags: readonly ['C3'];
}>;
export type Test_CustomSemanticField = Expect<Equal<CustomMappedRecord['citationCount'], string | undefined>>;
export type Test_CustomArrayField = Expect<Equal<CustomMappedRecord['C3'], string[] | undefined>>;

// 2.4.1 Failed casts keep the raw string (e.g. `VL  - 12-14`, `DA  - Spring 2020`, `YYYY/MM/DD` output)
export type Test_FallbackNumber = Expect<Extends<'12-14', NonNullable<SmartRecord['VL']>>>;
export type Test_FallbackDate = Expect<Extends<'Spring 2020', NonNullable<SmartRecord['DA']>>>;
export type Test_FallbackBoolean = Expect<Extends<'yes', NonNullable<CustomCastRecord['U2']>>>;

// 2.5 Semantic Tag Remapping inherits array nature (AU -> authorsList)
type RemappedArrayRecord = ParsedRisRecord<{
    toSemantic: true;
    customSemanticMap: { readonly AU: 'authorsList'; readonly TI: 'primaryTitle' };
}>;
export type Test_RemappedArrayField = Expect<Equal<RemappedArrayRecord['authorsList'], string[] | undefined>>;
export type Test_RemappedScalarField = Expect<Equal<RemappedArrayRecord['primaryTitle'], string | undefined>>;

// 2.6 Unmapped 2-character raw tags accessible under toSemantic: true
type UnmappedRawTagRecord = ParsedRisRecord<{
    toSemantic: true;
    useSmartTypes: true;
    smartCastSchema: { readonly XX: 'number' };
    customArrayTags: readonly ['YY'];
}>;
export type Test_UnmappedSmartTag = Expect<Equal<UnmappedRawTagRecord['XX'], number | string | undefined>>;
export type Test_UnmappedArrayTag = Expect<Equal<UnmappedRawTagRecord['YY'], string[] | undefined>>;

// 2.7 Cross-Mapping Smart Cast through raw tag
type CrossMappedSmartRecord = ParsedRisRecord<{
    toSemantic: true;
    useSmartTypes: true;
    customSemanticMap: { readonly C1: 'citationCount' };
    smartCastSchema: { readonly C1: 'number' };
}>;
export type Test_CrossMappedSmart = Expect<Equal<CrossMappedSmartRecord['citationCount'], number | string | undefined>>;

// 2.8 Explicit Scalar Merge Strategy preserves scalar vs array duality
type JoinSpaceRecord = ParsedRisRecord<{ arrayMergeStrategy: 'join-space' }>;
export type Test_JoinSpace_AU = Expect<Equal<JoinSpaceRecord['AU'], string[] | undefined>>;
export type Test_JoinSpace_TI = Expect<Equal<JoinSpaceRecord['TI'], string | undefined>>;

// 2.9 Preserving Null on Empty Tags (skipEmptyTags: false)
type NullableRecord = ParsedRisRecord<{ skipEmptyTags: false }>;
export type Test_Nullable_TI = Expect<Equal<NullableRecord['TI'], string | null | undefined>>;
export type Test_Nullable_AU = Expect<Equal<NullableRecord['AU'], (string | null)[] | undefined>>;

// 2.10 Explicit skipEmptyTags: true strips null
type ExplicitNonNullableRecord = ParsedRisRecord<{ skipEmptyTags: true }>;
export type Test_ExplicitNonNull_TI = Expect<Equal<ExplicitNonNullableRecord['TI'], string | undefined>>;

// -------------------------------------------------------------------
// 3. Positive Cases: Universal ParseRisRecord Union
// -------------------------------------------------------------------

// 3.1 All 8 record types are assignable to ParseRisRecord
export type Test_Union_Default = Expect<Extends<RisRecord, ParseRisRecord>>;
export type Test_Union_Smart = Expect<Extends<SmartRisRecord, ParseRisRecord>>;
export type Test_Union_Semantic = Expect<Extends<SemanticRisRecord, ParseRisRecord>>;
export type Test_Union_SmartSemantic = Expect<Extends<SmartSemanticRisRecord, ParseRisRecord>>;
export type Test_Union_Array = Expect<Extends<ArrayRisRecord, ParseRisRecord>>;
export type Test_Union_SmartArray = Expect<Extends<SmartArrayRisRecord, ParseRisRecord>>;
export type Test_Union_SemanticArray = Expect<Extends<SemanticArrayRisRecord, ParseRisRecord>>;
export type Test_Union_SmartSemanticArray = Expect<Extends<SmartSemanticArrayRisRecord, ParseRisRecord>>;

// -------------------------------------------------------------------
// 4. Negative Cases: Boundary Tag Constraints & Tag Shape Rejections
// -------------------------------------------------------------------

{
    const parsedDoc = {} as ParsedRisRecord<{ toSemantic: true }>;
    const rawDoc = {} as ParsedRisRecord;

    // 4.1 Boundary tags (ER / endOfReference) are typed as never/undefined, cannot be assigned to string
    // @ts-expect-error Property 'ER' cannot be assigned to string
    const _invalidER: string = parsedDoc.ER;

    // @ts-expect-error Property 'endOfReference' cannot be assigned to string
    const _invalidEndOfRef: string = parsedDoc.endOfReference;

    // @ts-expect-error Property 'ER' cannot be assigned to string on raw record
    const _invalidRawER: string = rawDoc.ER;

    // 4.2 Semantic output rejects standard 2-character keys if mapped
    // @ts-expect-error Property 'AU' does not exist when toSemantic: true is active
    const _invalidAU = parsedDoc.AU;

    // 4.3 In arrayMergeStrategy: false mode, TY is string[], cannot assign to scalar string
    const arrayDoc = {} as ParsedRisRecord<{ arrayMergeStrategy: false }>;
    // @ts-expect-error TY is string[] when arrayMergeStrategy: false
    const _invalidScalarTY: string = arrayDoc.TY;
}
