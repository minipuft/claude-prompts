/**
 * Package Root Resolution
 *
 * Resolves the server's package root from the bundled entry point.
 * The bundle is always at dist/index.js — package root is one dirname above.
 *
 * Priority:
 *   1. --server-root CLI flag (explicit override for containers/edge cases)
 *   2. Derive from import.meta.url (dist/index.js → package root)
 *
 * No CWD guessing, no multi-strategy fallbacks.
 */
interface PackageRootOptions {
    cliOverride?: string;
    verbose?: boolean;
}
/**
 * Resolve the package root directory.
 *
 * The esbuild bundle lives at dist/index.js — one dirname up is the package root.
 * Validates that config.json and a prompts directory exist before returning.
 */
export declare function resolvePackageRoot(options?: PackageRootOptions): Promise<string>;
export {};
