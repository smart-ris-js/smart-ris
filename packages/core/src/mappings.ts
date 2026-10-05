// Copyright 2026 Martin Winkler

import type { ContentRisTag } from './core.types.js';

// -------------------------------------------------------------------
// 1. Comprehensive Canonical Tag Mapping
// -------------------------------------------------------------------

/**
 * **Maps common vendor-specific and alias tags (Zotero, EndNote, Citavi, etc.)**.
 *
 * Normalizes vendor-specific tags to canonical standard RIS tags for maximum compatibility.
 */
export const comprehensiveTagMap: Record<ContentRisTag, ContentRisTag> = Object.freeze(
    Object.assign(Object.create(null), {
        A1: 'AU', // primary author.
        T1: 'TI', // primary title.
        N2: 'AB', // abstract.
        DI: 'DO', // digital object identifier.
        DA: 'Y1', // primary date.
        JO: 'JF', // journal/periodical name full.
        J1: 'JA', // periodical name standard abbreviation.
        K1: 'KW', // keyword.
        CP: 'CY', // city of publication / place published.
        LK: 'UR', // links / URL.
    }),
);

// -------------------------------------------------------------------
// 2. Web of Science (WoS) Tag Mapping
// -------------------------------------------------------------------

/** Web of Science (WoS) specific tag normalization mappings. */
export const wosTagMap: Record<ContentRisTag, ContentRisTag> = Object.freeze(
    Object.assign(Object.create(null), {
        FU: 'U1', // funding agency and grant number.
        FX: 'U2', // funding text.
        J9: 'J2', // 29-character source abbreviation.
        JI: 'JA', // ISO source abbreviation.
        PA: 'N1', // publisher address.
        PI: 'CY', // publisher city.
        PU: 'PB', // publisher.
        WE: 'DB', // Web of Science index.
    }),
);

// -------------------------------------------------------------------
// 3. Common Alias Tag Mapping
// -------------------------------------------------------------------

/** Common alias tag mappings across bibliographic tools. */
export const aliasTagMap: Record<ContentRisTag, ContentRisTag> = Object.freeze(
    Object.assign(Object.create(null), {
        A1: 'AU', // primary author.
        ED: 'A2', // secondary author (editor).
        T1: 'TI', // primary title.
        BT: 'T2', // secondary title / book title.
        JO: 'JF', // journal/periodical name full.
        J1: 'JA', // periodical name standard abbreviation.
        DA: 'Y1', // primary date / date.
        PY: 'Y1', // publication year -> primary date.
        DI: 'DO', // digital object identifier.
        M3: 'DO', // EndNote / Mendeley DOI.
        LK: 'UR', // links / URL.
        N2: 'AB', // abstract.
        K1: 'KW', // keyword.
        RN: 'N1', // notes.
        CP: 'CY', // city of publication.
    }),
);

// -------------------------------------------------------------------
// 4. Citavi Tag Mapping
// -------------------------------------------------------------------

/** Citavi-specific tag normalization mappings. */
export const citaviTagMap: Record<ContentRisTag, ContentRisTag> = Object.freeze(
    Object.assign(Object.create(null), {
        H1: 'DP', // database provider.
        H2: 'CN', // call number.
    }),
);
