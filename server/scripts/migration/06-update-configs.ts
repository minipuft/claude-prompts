// Phase 6: Update non-TS configurations after all file moves
// Updates: package.json, .dependency-cruiser.cjs, jest.config.cjs, docs, CLAUDE.md
//
// Usage: npx tsx scripts/migration/06-update-configs.ts [--dry-run]

const DRY_RUN = process.argv.includes('--dry-run');

// Config path mappings: old path pattern → new path pattern
const PATH_MAPPINGS: Array<{ old: string; new: string; description: string }> = [
  { old: 'src/types/', new: 'src/shared/types/', description: 'types → shared/types' },
  { old: 'src/utils/', new: 'src/shared/utils/', description: 'utils → shared/utils' },
  { old: 'src/core/', new: 'src/shared/errors/', description: 'core → shared/errors' },
  { old: 'src/logging/', new: 'src/infra/logging/', description: 'logging → infra/logging' },
  { old: 'src/config/', new: 'src/infra/config/', description: 'config → infra/config' },
  { old: 'src/cache/', new: 'src/infra/cache/', description: 'cache → infra/cache' },
  { old: 'src/server/', new: 'src/infra/http/', description: 'server → infra/http' },
  { old: 'src/api/', new: 'src/infra/http/api/', description: 'api → infra/http/api' },
  {
    old: 'src/metrics/',
    new: 'src/infra/observability/metrics/',
    description: 'metrics → infra/observability/metrics',
  },
  {
    old: 'src/tracking/',
    new: 'src/infra/observability/tracking/',
    description: 'tracking → infra/observability/tracking',
  },
  {
    old: 'src/notifications/',
    new: 'src/infra/observability/notifications/',
    description: 'notifications → infra/observability/notifications',
  },
  {
    old: 'src/performance/',
    new: 'src/infra/observability/performance/',
    description: 'performance → infra/observability/performance',
  },
  { old: 'src/hooks/', new: 'src/infra/hooks/', description: 'hooks → infra/hooks' },
  {
    old: 'src/execution/',
    new: 'src/engine/execution/',
    description: 'execution → engine/execution',
  },
  {
    old: 'src/frameworks/',
    new: 'src/engine/frameworks/',
    description: 'frameworks → engine/frameworks',
  },
  { old: 'src/gates/', new: 'src/engine/gates/', description: 'gates → engine/gates' },
  { old: 'src/prompts/', new: 'src/modules/prompts/', description: 'prompts → modules/prompts' },
  {
    old: 'src/chain-session/',
    new: 'src/modules/chains/',
    description: 'chain-session → modules/chains',
  },
  {
    old: 'src/text-references/',
    new: 'src/modules/text-refs/',
    description: 'text-references → modules/text-refs',
  },
  {
    old: 'src/semantic/',
    new: 'src/modules/semantic/',
    description: 'semantic → modules/semantic',
  },
  {
    old: 'src/styles/',
    new: 'src/modules/formatting/',
    description: 'styles → modules/formatting',
  },
  {
    old: 'src/resources/',
    new: 'src/modules/resources/',
    description: 'resources → modules/resources',
  },
  {
    old: 'src/versioning/',
    new: 'src/modules/versioning/',
    description: 'versioning → modules/versioning',
  },
  {
    old: 'src/scripts/',
    new: 'src/modules/automation/',
    description: 'scripts → modules/automation',
  },
  {
    old: 'src/mcp-contracts/',
    new: 'src/mcp/contracts/',
    description: 'mcp-contracts → mcp/contracts',
  },
  {
    old: 'src/action-metadata/',
    new: 'src/mcp/metadata/',
    description: 'action-metadata → mcp/metadata',
  },
  { old: 'src/mcp-tools/', new: 'src/mcp/tools/', description: 'mcp-tools → mcp/tools' },
];

async function main() {
  console.log(`\n=== Phase 6: Config Updates ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  console.log('Path mappings to apply:');
  for (const mapping of PATH_MAPPINGS) {
    console.log(`  ${mapping.description}`);
  }

  // TODO: Implement config file updates using fs read/write
  // Files to update:
  // - package.json (lint patterns, script paths)
  // - .dependency-cruiser.cjs (path patterns)
  // - .husky/pre-commit (staging paths)
  // - CLAUDE.md (architecture references)
  // - docs/architecture/overview.md (path references)
  // - .claude/rules/orchestration-layers.md (domain ownership paths)

  console.log('\nPhase 6 stub complete — implement config updates per-phase.');
}

main().catch((err) => {
  console.error('Phase 6 failed:', err);
  process.exit(1);
});
