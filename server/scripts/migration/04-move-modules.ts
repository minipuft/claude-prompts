// Phase 4: Move modules layer
// prompts/, chain-session/, text-references/, semantic/, styles/, resources/, versioning/, scripts/ → modules/
//
// Usage: npx tsx scripts/migration/04-move-modules.ts [--dry-run]

import { loadProject, saveProject, moveFiles, previewMoves } from './shared/project-loader.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`\n=== Phase 4: Modules Layer Migration ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  const project = loadProject();

  const moves = [
    { glob: 'src/prompts/**/*.ts', from: '/src/prompts/', to: '/src/modules/prompts/' },
    { glob: 'src/chain-session/**/*.ts', from: '/src/chain-session/', to: '/src/modules/chains/' },
    {
      glob: 'src/text-references/**/*.ts',
      from: '/src/text-references/',
      to: '/src/modules/text-refs/',
    },
    { glob: 'src/semantic/**/*.ts', from: '/src/semantic/', to: '/src/modules/semantic/' },
    { glob: 'src/styles/**/*.ts', from: '/src/styles/', to: '/src/modules/formatting/' },
    { glob: 'src/resources/**/*.ts', from: '/src/resources/', to: '/src/modules/resources/' },
    { glob: 'src/versioning/**/*.ts', from: '/src/versioning/', to: '/src/modules/versioning/' },
    { glob: 'src/scripts/**/*.ts', from: '/src/scripts/', to: '/src/modules/automation/' },
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

  console.log('\nPhase 4 complete.');
}

main().catch((err) => {
  console.error('Phase 4 failed:', err);
  process.exit(1);
});
