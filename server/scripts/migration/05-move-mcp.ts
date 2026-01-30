// Phase 5: Move MCP layer
// mcp-contracts/, action-metadata/, mcp-tools/ → mcp/
//
// Usage: npx tsx scripts/migration/05-move-mcp.ts [--dry-run]

import { loadProject, saveProject, moveFiles, previewMoves } from './shared/project-loader.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`\n=== Phase 5: MCP Layer Migration ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  const project = loadProject();

  const moves = [
    { glob: 'src/mcp-contracts/**/*.ts', from: '/src/mcp-contracts/', to: '/src/mcp/contracts/' },
    {
      glob: 'src/action-metadata/**/*.ts',
      from: '/src/action-metadata/',
      to: '/src/mcp/metadata/',
    },
    { glob: 'src/mcp-tools/**/*.ts', from: '/src/mcp-tools/', to: '/src/mcp/tools/' },
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

  console.log('\nPhase 5 complete.');
}

main().catch((err) => {
  console.error('Phase 5 failed:', err);
  process.exit(1);
});
