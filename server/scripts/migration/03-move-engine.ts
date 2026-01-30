// Phase 3: Move engine layer
// execution/, frameworks/, gates/ → engine/
// Also creates engine/interfaces/ for DI contracts
//
// Usage: npx tsx scripts/migration/03-move-engine.ts [--dry-run]

import { loadProject, saveProject, moveFiles, previewMoves } from './shared/project-loader.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`\n=== Phase 3: Engine Layer Migration ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  const project = loadProject();

  const moves = [
    { glob: 'src/execution/**/*.ts', from: '/src/execution/', to: '/src/engine/execution/' },
    { glob: 'src/frameworks/**/*.ts', from: '/src/frameworks/', to: '/src/engine/frameworks/' },
    { glob: 'src/gates/**/*.ts', from: '/src/gates/', to: '/src/engine/gates/' },
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

  // TODO: Phase 3 also requires creating engine/interfaces/ with DI contracts
  // This will be implemented alongside the moves.

  if (!DRY_RUN) {
    await saveProject(project);
  }

  console.log('\nPhase 3 complete.');
}

main().catch((err) => {
  console.error('Phase 3 failed:', err);
  process.exit(1);
});
