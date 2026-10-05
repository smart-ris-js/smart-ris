// Copyright 2026 Martin Winkler

import type { ContentRisTag } from '../core.types.js';

/** Remaps record dictionary keys according to a mapping table, preserving target precedence and handling multi-alias merges. */
export function remapRecordKeys<V>(
    payload: Record<string, V[]>,
    mapping: Record<string, string> | Partial<Record<ContentRisTag, ContentRisTag>>,
): Record<string, V[]> {
    // INTENTION: clean dictionary accumulator decoupling reads from writes; prevents cross-swap and chain collisions.
    // INTENTION: `Object.create(null)` faster than delete operation.
    const out: Record<string, V[]> = Object.create(null);

    for (const sourceKey in payload) {
        // INTENTION: alias for resolved target tag else self.
        const targetTag = mapping[sourceKey as ContentRisTag] ?? sourceKey;
        // INTENTION: cached dictionary lookup.
        const sourceVal = payload[sourceKey];
        // INTENTION: cached dictionary lookup.
        let existingVal = out[targetTag];

        if (targetTag === sourceKey) {
            // INTENTION: primary/unmapped key; assign if not already initialized by a mapped alias.
            if (existingVal === undefined) {
                out[targetTag] = sourceVal.slice();
            }
            continue;
        }

        // INTENTION: remapping alias to target key.
        if (existingVal === undefined) {
            // INTENTION: preserve target precedence if target tag was present in source payload and not itself remapped.
            // INTENTION: cached dictionary lookup.
            const targetMapping = mapping[targetTag as ContentRisTag];
            // self-mapping (`AU -> AU`) keeps the target in place, not a remap away.
            const primaryTargetVal =
                targetMapping !== undefined && targetMapping !== targetTag ? undefined : payload[targetTag];

            if (primaryTargetVal !== undefined) {
                existingVal = primaryTargetVal.slice();
                out[targetTag] = existingVal;
            } else {
                out[targetTag] = sourceVal.slice();
                continue;
            }
        }

        // INTENTION: for loop strictly faster and safer than `push(...sourceVal)`.
        for (let i = 0; i < sourceVal.length; i++) {
            existingVal.push(sourceVal[i]);
        }
    }

    return out;
}
