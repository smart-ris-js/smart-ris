// Copyright 2026 Martin Winkler

import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Workspace package directory names mapped to their npm package names. */
const PACKAGE_NAMES = {
    core: '@smart-ris/core',
    parse: '@smart-ris/parse',
    stringify: '@smart-ris/stringify',
    'inspect-parse': '@smart-ris/inspect-parse',
} as const;

export type WorkspacePackage = keyof typeof PACKAGE_NAMES;

/** Async function constructor for evaluating scenario bodies in Bun. */
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
    ...args: string[]
) => (module: unknown) => Promise<unknown>;

/** Absolute directory of a workspace package. */
function packageDir(pkg: WorkspacePackage): string {
    return join(import.meta.dir, '..', '..', 'packages', pkg);
}

/**
 * **Runs a scenario against the built `dist/` bundle in Node and against `src/` in Bun**.
 *
 * Node resolves `@smart-ris/*` through the `import`/`default` export conditions, i.e. the built `dist/` bundles of the
 * package and its `@smart-ris/*` dependencies; the `bun` condition pointing at `src/` is never used there.
 *
 * @param pkg - Workspace package directory name.
 * @param srcModule - Source module namespace (`import * as src from '../../src/index.js'`).
 * @param body - Async function body receiving the package namespace as `m`; must `return` a JSON-serializable value.
 * @returns Results of both runs plus the export names of the built bundle.
 */
export async function runDistScenario(
    pkg: WorkspacePackage,
    srcModule: object,
    body: string,
): Promise<{ dist: unknown; src: unknown; distExports: string[] }> {
    if (!existsSync(join(packageDir(pkg), 'dist', 'index.js'))) {
        throw new Error(`Missing packages/${pkg}/dist/index.js - run "bun run build" before testing dist.`);
    }

    const script = `
        import * as m from '${PACKAGE_NAMES[pkg]}';
        const result = await (async (m) => { ${body} })(m);
        console.log(JSON.stringify({ result, exports: Object.keys(m).sort() }));
    `;
    const proc = Bun.spawnSync(['node', '--input-type=module', '-e', script], {
        cwd: packageDir(pkg),
        stdout: 'pipe',
        stderr: 'pipe',
    });
    if (proc.exitCode !== 0) {
        // INTENTION: minified bundle lines are huge; keep only the error tail.
        throw new Error(`node exited with ${proc.exitCode}:\n${proc.stderr.toString().slice(-600)}`);
    }
    const out = JSON.parse(proc.stdout.toString()) as { result: unknown; exports: string[] };

    // INTENTION: JSON round-trip so both results compare on the same serialized shape.
    const srcResult = JSON.parse(JSON.stringify(await new AsyncFunction('m', body)(srcModule)));

    return { dist: out.result, src: srcResult, distExports: out.exports };
}
