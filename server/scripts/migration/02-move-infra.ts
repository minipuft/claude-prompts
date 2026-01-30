// Phase 2: Move infrastructure layer
// logging/, config/, cache/, server/, api/, metrics/, tracking/, notifications/, performance/, hooks/ → infra/
//
// Usage: npx tsx scripts/migration/02-move-infra.ts [--dry-run]

import { loadProject, saveProject, moveFiles, previewMoves } from './shared/project-loader.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`\n=== Phase 2: Infrastructure Layer Migration ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  const project = loadProject();

  const moves = [
    { glob: 'src/logging/**/*.ts', from: '/src/logging/', to: '/src/infra/logging/' },
    { glob: 'src/config/**/*.ts', from: '/src/config/', to: '/src/infra/config/' },
    { glob: 'src/cache/**/*.ts', from: '/src/cache/', to: '/src/infra/cache/' },
    { glob: 'src/server/**/*.ts', from: '/src/server/', to: '/src/infra/http/' },
    { glob: 'src/api/**/*.ts', from: '/src/api/', to: '/src/infra/http/api/' },
    { glob: 'src/metrics/**/*.ts', from: '/src/metrics/', to: '/src/infra/observability/metrics/' },
    {
      glob: 'src/tracking/**/*.ts',
      from: '/src/tracking/',
      to: '/src/infra/observability/tracking/',
    },
    {
      glob: 'src/notifications/**/*.ts',
      from: '/src/notifications/',
      to: '/src/infra/observability/notifications/',
    },
    {
      glob: 'src/performance/**/*.ts',
      from: '/src/performance/',
      to: '/src/infra/observability/performance/',
    },
    { glob: 'src/hooks/**/*.ts', from: '/src/hooks/', to: '/src/infra/hooks/' },
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

  console.log('\nPhase 2 complete.');
}

main().catch((err) => {
  console.error('Phase 2 failed:', err);
  process.exit(1);
});
