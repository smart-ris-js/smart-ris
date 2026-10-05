// Copyright 2026 Martin Winkler

import type { CastType, RisTag } from './core.types.js';

// -------------------------------------------------------------------
// 1. Regular Expressions
// -------------------------------------------------------------------

/**
 * **Matches valid canonical 2-character uppercase alphanumeric RIS tag keys**.
 *
 * Pattern Constraints:
 * - Exactly 2 characters (`{2}`).
 * - Characters must be uppercase ASCII letters or digits (`[A-Z0-9]`).
 */
export const REGEX_TAG_FORMAT = /^[A-Z0-9]{2}$/;

/**
 * **Matches and extracts tag headers in strict mode**.
 *
 * Pattern Constraints:
 * - Exactly 2 uppercase alphanumeric characters (`[A-Z0-9]{2}`).
 * - 1 or 2 spaces preceding the hyphen (` {1,2}`).
 * - Exactly 1 hyphen followed by either 1 space or end-of-line (`-(?: |$)`).
 * - Value capture group omitted to prevent intermediate string allocations.
 */
export const REGEX_TAG_LINE_STRICT = /^([A-Z0-9]{2}) {1,2}-(?: |$)/;

/**
 * **Matches line terminators across operating systems (`\r\n`, `\r`, `\n`)**.
 *
 * Pattern Branches:
 * - `\r\n` - Windows CRLF.
 * - `\r` - Classic Mac CR.
 * - `\n` - POSIX/Unix LF.
 */
export const REGEX_SPLIT_LINES = /\r\n|\r|\n/;

/**
 * **Matches consecutive internal whitespace runs (2+ spaces/tabs) preceded by non-whitespace**.
 *
 * Pattern Constraints:
 * - Positive lookbehind `(?<=\S)` ensures leading indentation is untouched.
 * - `[^\S\r\n]{2,}` matches 2 or more horizontal spaces or tabs.
 */
export const REGEX_INTERNAL_SPACES = /(?<=\S)[^\S\r\n]{2,}/g;

// -------------------------------------------------------------------
// 2. Reference Types (TY)
// -------------------------------------------------------------------

/** Core RIS Reference Types (TY). */
export const recordType = Object.freeze({
    abstract: 'ABST',
    audiovisualMaterial: 'ADVS',
    aggregatedDatabase: 'AGGR',
    ancientText: 'ANCIENT',
    artWork: 'ART',
    bill: 'BILL',
    blog: 'BLOG',
    book: 'BOOK',
    case: 'CASE',
    bookChapter: 'CHAP',
    chart: 'CHART',
    classicalWork: 'CLSWK',
    computerProgram: 'COMP',
    conferenceProceeding: 'CONF',
    conferencePaper: 'CPAPER',
    catalog: 'CTLG',
    dataFile: 'DATA',
    onlineDatabase: 'DBASE',
    dictionary: 'DICT',
    electronicBook: 'EBOOK',
    electronicBookSection: 'ECHAP',
    editedBook: 'EDBOOK',
    electronicArticle: 'EJOUR',
    electronicSource: 'ELEC',
    encyclopedia: 'ENCYC',
    equation: 'EQUA',
    figure: 'FIGURE',
    generic: 'GEN',
    governmentDocument: 'GOVDOC',
    grant: 'GRANT',
    hearing: 'HEAR',
    internetCommunication: 'ICOMM',
    inPress: 'INPR',
    journalFull: 'JFULL',
    journal: 'JOUR',
    legalRule: 'LEGAL',
    manuscript: 'MANSCPT',
    map: 'MAP',
    magazineArticle: 'MGZN',
    motionPicture: 'MPCT',
    onlineMultimedia: 'MULTI',
    musicScore: 'MUSIC',
    newspaper: 'NEWS',
    pamphlet: 'PAMP',
    patent: 'PAT',
    personalCommunication: 'PCOMM',
    report: 'RPRT',
    serialPublication: 'SER',
    slide: 'SLIDE',
    soundRecording: 'SOUND',
    standard: 'STAND',
    statute: 'STAT',
    thesis: 'THES',
    unpublishedWork: 'UNPB',
    videoRecording: 'VIDEO',
    webpage: 'WEB',
} as const);

/** Default RIS Reference Type (TY) used as fallback for untyped records. */
export const DEFAULT_REFERENCE_TYPE = recordType.generic;

// -------------------------------------------------------------------
// 3. Tag Mappings & Dictionaries
// -------------------------------------------------------------------

/** Core RIS Tags (semanticName: rawTag). */
export const tag = Object.freeze({
    // --- STRUCTURAL & IDENTIFIERS ---
    typeOfReference: 'TY',
    endOfReference: 'ER',
    referenceId: 'ID',
    accessionNumber: 'AN',
    doi: 'DO',
    doiAlternate: 'DI',
    pubmedId: 'PM',
    publishedStandardNumber: 'VO',
    identifyingPhrase: 'IP',

    // --- AUTHORSHIP ---
    author: 'AU',
    primaryAuthor: 'A1',
    secondaryAuthor: 'A2',
    editor: 'ED',
    tertiaryAuthor: 'A3',
    subsidiaryAuthor: 'A4',
    translatedAuthor: 'TA',

    // --- TITLES ---
    title: 'TI',
    primaryTitle: 'T1',
    secondaryTitle: 'T2',
    tertiaryTitle: 'T3',
    shortTitle: 'ST',
    alternateTitle: 'J2',
    translatedTitle: 'TT',
    titleOfUnpublishedReference: 'CT',
    bookTitle: 'BT',

    // --- PERIODICAL & PUBLICATION NAMES ---
    journalFullFormat: 'JF',
    journalFullFormatAlternate: 'JO',
    journalStandardAbbreviation: 'JA',
    journalUserAbbreviation1: 'J1',

    // --- PUBLISHING INFORMATION ---
    publisher: 'PB',
    placePublished: 'CY',
    cityOfPublication: 'CP',
    placeOfPublication: 'PP',
    edition: 'ET',
    reprintEdition: 'RP',
    originalPublication: 'OP',

    // --- DATES ---
    primaryDate: 'Y1',
    accessDate: 'Y2',
    date: 'DA',
    publicationYear: 'PY',

    // --- SERIALIZATION & PAGINATION ---
    volume: 'VL',
    numberOfVolumes: 'NV',
    numberOfVolumesAlternate: 'SV',
    issue: 'IS',
    startPage: 'SP',
    endPage: 'EP',
    section: 'SE',
    number: 'M1',

    // --- CONTENT METADATA ---
    abstract: 'AB',
    abstractAlternate: 'N2',
    keywords: 'KW',
    keywordAlternate: 'K1',
    classification: 'CL',
    language: 'LA',
    caption: 'CA',
    label: 'LB',
    isbnIssn: 'SN',

    // --- LINKS & MEDIA ---
    url: 'UR',
    links: 'LK',
    fileAttachments: 'L1',
    figureLink: 'L2',
    relatedRecords: 'L3',
    figureLinkAlternate: 'L4',

    // --- NOTES, REVIEWS & CUSTOM DATA ---
    notes: 'N1',
    notesAlternate: 'NO',
    researchNotes: 'RN',
    typeOfWork: 'M3',
    reviewedItem: 'RI',
    citedReferences: 'CR',
    freeFormPublicationData: 'FD',
    miscellaneous2: 'M2',

    // --- DATABASE & LIBRARY SPECIFIC ---
    databaseName: 'DB',
    databaseProvider: 'DP',
    dataSource: 'DS',
    authorAddress: 'AD',
    callNumber: 'CN',
    archiveLocation: 'AV',
    libraryCatalog: 'H1',
    callNumberCitavi: 'H2',
    sponsoringLibraryLocation: 'LL',

    // --- USER DEFINABLE & CUSTOM ---
    custom1: 'C1',
    custom2: 'C2',
    custom3: 'C3',
    custom4: 'C4',
    custom5: 'C5',
    custom6: 'C6',
    custom7: 'C7',
    custom8: 'C8',
    userDefinable1: 'U1',
    userDefinable2: 'U2',
    userDefinable3: 'U3',
    userDefinable4: 'U4',
    userDefinable5: 'U5',
} as const satisfies Record<string, RisTag>);

/** Core RIS Tags (rawTag: semanticName). */
const invertedTagMap: Record<string, string> = Object.create(null);
for (const semanticKey in tag) {
    invertedTagMap[tag[semanticKey as keyof typeof tag]] = semanticKey;
}
export const invertedTag: Record<string, string> = Object.freeze(invertedTagMap);

/** Core RIS Tags with uppercase semantic keys (SEMANTICNAME: rawTag). */
const uppercaseTagMap: Record<string, RisTag> = Object.create(null);
for (const semanticKey in tag) {
    uppercaseTagMap[semanticKey.toUpperCase()] = tag[semanticKey as keyof typeof tag];
}
export const DEFAULT_UPPERCASE_TAG_MAP: Record<string, RisTag> = Object.freeze(uppercaseTagMap);

const tagSortOrderMap = new Map<string, number>();
let sortIndex = 0;
for (const semanticKey in tag) {
    const risTag = tag[semanticKey as keyof typeof tag];
    if (risTag !== 'TY' && risTag !== 'ER') {
        tagSortOrderMap.set(risTag, sortIndex++);
    }
}
export const TAG_SORT_ORDER_MAP: ReadonlyMap<string, number> = tagSortOrderMap;

// -------------------------------------------------------------------
// 4. Array Tags & Lookups
// -------------------------------------------------------------------

/** RIS Tags considered as "array tags" by default (multiple entries with same tag allowed). */
export const DEFAULT_ARRAY_TAGS = Object.freeze([
    // --- AUTHORS & EDITORS ---
    'AU',
    'A1',
    'A2',
    'A3',
    'A4',
    'ED',
    'TA',

    // --- KEYWORDS ---
    'KW',
    'K1',

    // --- LINKS & ATTACHMENTS ---
    'UR',
    'L1',
    'L2',
    'L3',
    'L4',

    // --- REFERENCES & NOTES ---
    'CR',
    'N1',
    'NO',
] as const);

/** RIS Tags considered as "array tags" by default - O(1) lookup. */
export const DEFAULT_ARRAY_TAGS_SET: ReadonlySet<string> = new Set<string>(DEFAULT_ARRAY_TAGS);

// -------------------------------------------------------------------
// 5. Smart Type Casting & Dates
// -------------------------------------------------------------------

// INTENTION: type-definition literal for `null`-prototype schema inference.
const defaultSmartCastMap = {
    DA: 'date',
    PY: 'date',
    Y1: 'date',
    Y2: 'date',

    VL: 'number',
    NV: 'number',
    SV: 'number',
    IS: 'number',
    M1: 'number',
    SE: 'number',
} as const satisfies Record<string, CastType>;

/** Default schema for smart type casting of RIS tag values. */
export const DEFAULT_SMART_CAST_SCHEMA: typeof defaultSmartCastMap = Object.freeze(
    Object.assign(Object.create(null), defaultSmartCastMap),
);

/** RIS tags that inherit fallback year from publication year when casting dates - O(1) lookup. */
export const DATE_YEAR_FALLBACK_TAGS: ReadonlySet<string> = new Set<string>(['DA', 'Y1']);

/** RIS tags that supply the fallback year IN PRIORITY ORDER: first PY, then Y1. */
export const DATE_YEAR_SUPPLIER_TAGS = Object.freeze(['PY', 'Y1'] as const);

// -------------------------------------------------------------------
// 6. Runtime Inspection & Promise Checks
// -------------------------------------------------------------------

/** Properties checked by JS runtime to detect promise/thenable instances. */
export const PROMISE_THENABLE_PROPERTIES = Object.freeze(['then', 'catch', 'finally'] as const);
/** Properties checked by JS runtime to detect promise/thenable instances - O(1) lookup. */
export const PROMISE_THENABLE_SET: ReadonlySet<string> = new Set<string>(PROMISE_THENABLE_PROPERTIES);

/** `Object.prototype` properties probed by JS runtime on conversion and reflection (e.g. `String(obj)`). */
export const OBJECT_PROTOTYPE_PROPERTIES = Object.freeze([
    'constructor',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    'toString',
    'valueOf',
    '__proto__',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__',
] as const);
/** `Object.prototype` properties probed by JS runtime on conversion and reflection - O(1) lookup. */
export const OBJECT_PROTOTYPE_SET: ReadonlySet<string> = new Set<string>(OBJECT_PROTOTYPE_PROPERTIES);

/** Builder methods intercepted before the semantic key lookup. */
export const SPECIAL_BUILDER_PROPERTIES = Object.freeze(['build', 'raw', 'get', 'toJSON'] as const);

/** Uppercase names rejected as custom semantic values (builder methods, thenable and prototype probes) - O(1) lookup. */
export const RESERVED_SEMANTIC_KEYS_SET: ReadonlySet<string> = new Set<string>(
    [...SPECIAL_BUILDER_PROPERTIES, ...PROMISE_THENABLE_PROPERTIES, ...OBJECT_PROTOTYPE_PROPERTIES].map((name) =>
        name.toUpperCase(),
    ),
);
