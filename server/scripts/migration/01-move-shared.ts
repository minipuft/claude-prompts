/**
 * Phase 1: Move shared layer (types/, utils/, core/ → shared/)
 *
 * Usage:
 *   npx tsx scripts/migration/01-move-shared.ts [--dry-run]
 */

import { loadProject, saveProject, moveFiles, previewMoves } from './shared/project-loader.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`\n=== Phase 1: Shared Layer Migration ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  const project = loadProject();

  const moves = [
    { glob: 'src/types/**/*.ts', from: '/src/types/', to: '/src/shared/types/' },
    { glob: 'src/utils/**/*.ts', from: '/src/utils/', to: '/src/shared/utils/' },
    { glob: 'src/core/**/*.ts', from: '/src/core/', to: '/src/shared/errors/' },
  ];

  for (const { glob, from, to } of moves) {
    if (DRY_RUN) {
      const preview = previewMoves(project, glob, from, to);
      console.log(`\n[DRY RUN] ${glob}:`);
      for (const { from: f, to: t } of preview) {
        console.log(`  ${f} → ${t}`);
      }
    } else {
      moveFiles(project, glob, from, to);
    }
  }

  if (!DRY_RUN) {
    await saveProject(project);
  }

  console.log('\nPhase 1 complete.');
}

main().catch((err) => {
  console.error('Phase 1 failed:', err);
  process.exit(1);
});
