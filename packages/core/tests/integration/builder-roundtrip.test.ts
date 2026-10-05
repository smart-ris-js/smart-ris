// Copyright 2026 Martin Winkler

import { describe, expect, it } from 'bun:test';
import { parse } from '../../../parse/src/index.js';
import { stringify } from '../../../stringify/src/index.js';
import { createRisBuilder, recordType } from '../../src/index.js';

describe('core - integration > builder-roundtrip', () => {
    describe('Absolute Data Integrity (Hardcore Integration)', () => {
        it('should perform a flawless roundtrip across all modules with edge cases, massive payloads, and type mutations', () => {
            // --- RECORD 1: THE MONSTER (Everything at once) ---
            const record1 = createRisBuilder()
                // 1. Constants & Semantic Aliases
                .typeOfReference(recordType.journal)
                .title('🚀 The Ultimate "Hardcore" Edge-Case: Über-Guide (100%)')
                // 2. Deep flattening with sparse arrays & nulls (Dein neues Feature!)
                .author([
                    ['Müller, M.', undefined],
                    [null, 'Schmidt, H.'],
                ])
                // 3. Type Mutation (Number)
                .publicationYear(2026)
                // 4. Multiline Hell (Mixed CRLF, empty lines, indentation)
                .abstract('First line.\n\nThird line after empty.\n    Indented line.\r\nCRLF line.')
                // 5. Multiple array inputs directly
                .keywords('Hardcore', 'Integration', ' Spaces ')
                // 6. Custom/Unknown Tags via Bracket Notation
                .customTag('Custom Data')
                .build(); // .build() liefert das unboxte Object (Record 1)

            // --- RECORD 2: THE GHOST (Sparse / Empty / Falsy values) ---
            const record2 = createRisBuilder()
                .ty('BOOK') // Standard Tag
                .ti('') // Leerer String
                .au([]) // Leeres Array -> Builder macht [null] draus
                .da(new Date(2000, 0, 1)) // Date Object
                .build();

            // --- RECORD 3: THE CHAIN (Huge chained arrays) ---
            const record3 = createRisBuilder()
                .ty('CONF')
                .ti('Conference Paper')
                .au('Alpha')
                .au('Beta')
                .au('Gamma') // Chaining Accumulation
                .sp(100)
                .ep(150) // Numbers as Pages
                .build();

            // ==========================================
            // 2. STRINGIFY (Die Brücke)
            // ==========================================
            const payload = [record1, record2, record3];

            const stringified = stringify(payload, {
                eol: '\n',
                mergeMultiline: false, // Wichtig für echte RIS-Kompatibilität bei AB
                dateFormat: 'YYYY-MM-DD',
            });

            // Sicherstellen, dass Stringify überhaupt einen sauberen RIS-String mit Trennern gebaut hat
            expect(typeof stringified).toBe('string');
            expect(stringified).toContain('ER  - '); // Record separator must exist

            // ==========================================
            // 3. PARSE (Die Wiederherstellung)
            // ==========================================
            const parsedResults = parse(stringified, {
                useSmartTypes: true, // Sollte idealerweise "2026" wieder zu 2026 machen (oder als String belassen, je nach Parser-Logik)
                asSemantic: false, // Wir prüfen die echten RIS Tags (AU, TY)
                cleanEol: true,
                mergeMultiline: false,
                repairTags: true, // Nötig, damit der Nicht-RIS-Tag CUSTOMTAG wieder als Tag gelesen wird
            } as any);

            // ==========================================
            // 4. ASSERTIONS (Die schonungslose Wahrheit)
            // ==========================================
            expect(parsedResults.length).toBe(3); // Hat der Parser alle 3 Records sauber getrennt?

            // --- Assert Record 1 (The Monster) ---
            const p1 = parsedResults[0];
            expect(p1.TY).toBe(recordType.journal); // Konstante muss überlebt haben
            expect(p1.TI).toBe('🚀 The Ultimate "Hardcore" Edge-Case: Über-Guide (100%)'); // Emojis/Sonderzeichen
            expect(p1.AU).toEqual(['Müller, M.', 'Schmidt, H.']); // Undefined/Null wurde eliminiert, Deep Array wurde flattened!

            // HINWEIS: Je nachdem, wie dein Parser `useSmartTypes` implementiert,
            // ist PY hier evtl. der String '2026' oder die Number 2026.
            // Wenn der Parser schlau genug ist, passe `toBe('2026')` zu `toBe(2026)` an!
            expect(String(p1.PY)).toBe('2026');

            expect(p1.AB).toBe('First line.\n\nThird line after empty.\n    Indented line.\nCRLF line.'); // \r\n wurde zu \n normalisiert
            expect(p1.KW).toEqual(['Hardcore', 'Integration', 'Spaces']);
            expect(p1.CUSTOMTAG).toBe('Custom Data'); // Unbekannter Tag hat überlebt

            // --- Assert Record 2 (The Ghost) ---
            const p2 = parsedResults[1];
            expect(p2.TY).toBe('BOOK');
            // Hier entscheidet deine Stringify/Parse-Logik:
            // Entweder wird `TI: ''` weggelassen, oder es kommt als Leerstring zurück.
            // Ebenso für `AU: [null]`. Wir gehen hier davon aus, dass leere Tags vom Parser ignoriert/ausgefiltert werden:
            expect(p2.TI).toBeUndefined(); // oder `.toBe('')` je nach Logik
            expect(p2.AU).toBeUndefined(); // oder `.toEqual([])`
            expect(p2.DA).toBe('2000-01-01'); // Datums-Formatierung aus Stringify muss greifen

            // --- Assert Record 3 (The Chain) ---
            const p3 = parsedResults[2];
            expect(p3.TY).toBe('CONF');
            expect(p3.TI).toBe('Conference Paper');
            expect(p3.AU).toEqual(['Alpha', 'Beta', 'Gamma']); // Chaining wurde wieder korrekt zum Array
            expect(String(p3.SP)).toBe('100'); // Zahlen überleben
            expect(String(p3.EP)).toBe('150');
        });
    });
});
