/**
 * esbuild configuration for the cpm CLI tool.
 *
 * Produces a single self-contained dist/cpm.js that bundles cli-shared
 * schemas and utilities from the server source (no runtime deps needed).
 *
 * Usage:
 *   npm -w cli run build
 *   node cli/dist/cpm.js --help
 */

import * as esbuild from 'esbuild';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));

const isProduction = process.env.NODE_ENV === 'production';

const BUNDLE_BUDGET_BYTES = 512_000; // 500KB

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/cpm.js',
  sourcemap: true,
  minify: isProduction,
  keepNames: true,

  // Node.js built-ins are always available at runtime
  external: [
    'node:assert', 'node:buffer', 'node:child_process', 'node:cluster',
    'node:crypto', 'node:dgram', 'node:dns', 'node:events', 'node:fs',
    'node:fs/promises', 'node:http', 'node:https', 'node:net', 'node:os',
    'node:path', 'node:readline', 'node:stream', 'node:string_decoder',
    'node:tls', 'node:url', 'node:util', 'node:vm', 'node:worker_threads',
    'node:zlib', 'node:perf_hooks',
    // Unprefixed equivalents
    'assert', 'buffer', 'child_process', 'cluster', 'crypto', 'dgram',
    'dns', 'events', 'fs', 'http', 'https', 'net', 'os', 'path',
    'readline', 'stream', 'string_decoder', 'tls', 'url', 'util', 'vm',
    'worker_threads', 'zlib', 'perf_hooks',
  ],

  // CJS require shim for ESM bundle (shebang comes from src/index.ts)
  banner: {
    js: `import { createRequire as __createRequire } from 'module';
const require = __createRequire(import.meta.url);`,
  },

  define: {
    'process.env.CPM_VERSION': JSON.stringify(pkg.version),
  },

  // Resolve @cli-shared to server source; esbuild bundles transitive deps
  alias: {
    '@cli-shared': '../server/src/cli-shared',
    // Server path aliases needed for transitive imports within cli-shared re-exports
    '@shared': '../server/src/shared',
    '@engine': '../server/src/engine',
    '@modules': '../server/src/modules',
  },

  treeShaking: true,
  logLevel: 'info',
  metafile: true,
};

async function build() {
  try {
    console.log('Building CLI...');
    console.log(`  Entry: src/index.ts`);
    console.log(`  Output: dist/cpm.js`);

    const result = await esbuild.build(buildOptions);

    if (result.metafile) {
      const output = result.metafile.outputs['dist/cpm.js'];
      if (output) {
        const sizeKB = (output.bytes / 1024).toFixed(1);
        console.log(`\nBundle size: ${sizeKB} KB`);

        if (output.bytes > BUNDLE_BUDGET_BYTES) {
          console.error(
            `\nBundle exceeds ${BUNDLE_BUDGET_BYTES / 1024}KB budget (${sizeKB} KB)`,
          );
          process.exit(1);
        }
      }
    }

    console.log('\nBuild complete: dist/cpm.js');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
