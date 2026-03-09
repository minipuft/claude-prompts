#!/usr/bin/env tsx
import { DatabaseManager } from '../src/infra/database/index.js';

import type { Logger } from '../src/infra/logging/index.js';

type ScopeTableName =
  | 'framework_state'
  | 'gate_system_state'
  | 'checkpoint_state'
  | 'chain_sessions';
type ScopeBackfillStats = {
  table: ScopeTableName;
  totalRows: number;
  workspaceRows: number;
  organizationRows: number;
  legacyTenantOnlyRows: number;
  missingIdentityRows: number;
};

const TABLES: ScopeTableName[] = [
  'framework_state',
  'gate_system_state',
  'checkpoint_state',
  'chain_sessions',
];

function createLogger(): Logger {
  return {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  } as Logger;
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

async function collectTableStats(
  dbManager: DatabaseManager,
  table: ScopeTableName
): Promise<ScopeBackfillStats> {
  const row = dbManager.queryOne<Record<string, unknown>>(
    `SELECT
       COUNT(*) AS total_rows,
       SUM(CASE WHEN workspace_id IS NOT NULL AND TRIM(workspace_id) != '' THEN 1 ELSE 0 END) AS workspace_rows,
       SUM(CASE WHEN organization_id IS NOT NULL AND TRIM(organization_id) != '' THEN 1 ELSE 0 END) AS organization_rows,
       SUM(
         CASE
           WHEN (workspace_id IS NULL OR TRIM(workspace_id) = '')
            AND (organization_id IS NULL OR TRIM(organization_id) = '')
            AND (tenant_id IS NOT NULL AND TRIM(tenant_id) != '')
           THEN 1 ELSE 0
         END
       ) AS legacy_tenant_only_rows,
       SUM(
         CASE
           WHEN (workspace_id IS NULL OR TRIM(workspace_id) = '')
            AND (organization_id IS NULL OR TRIM(organization_id) = '')
            AND (tenant_id IS NULL OR TRIM(tenant_id) = '')
           THEN 1 ELSE 0
         END
       ) AS missing_identity_rows
     FROM ${table}`
  );

  return {
    table,
    totalRows: toNumber(row?.['total_rows']),
    workspaceRows: toNumber(row?.['workspace_rows']),
    organizationRows: toNumber(row?.['organization_rows']),
    legacyTenantOnlyRows: toNumber(row?.['legacy_tenant_only_rows']),
    missingIdentityRows: toNumber(row?.['missing_identity_rows']),
  };
}

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const dbManager = await DatabaseManager.getInstance(process.cwd(), createLogger());
  await dbManager.initialize();

  try {
    const stats = await Promise.all(TABLES.map((table) => collectTableStats(dbManager, table)));

    console.log('Identity Backfill Report');
    console.log('=======================');

    let missingIdentityTotal = 0;
    let legacyOnlyTotal = 0;
    for (const tableStats of stats) {
      missingIdentityTotal += tableStats.missingIdentityRows;
      legacyOnlyTotal += tableStats.legacyTenantOnlyRows;
      const fallbackRate =
        tableStats.totalRows > 0
          ? ((tableStats.legacyTenantOnlyRows / tableStats.totalRows) * 100).toFixed(2)
          : '0.00';
      console.log(
        `- ${tableStats.table}: total=${tableStats.totalRows}, workspace=${tableStats.workspaceRows}, organization=${tableStats.organizationRows}, legacy-only=${tableStats.legacyTenantOnlyRows} (${fallbackRate}%), missing=${tableStats.missingIdentityRows}`
      );
    }

    if (missingIdentityTotal > 0) {
      console.error(
        `Identity verification failed: ${missingIdentityTotal} row(s) missing all identity fields.`
      );
      process.exit(1);
    }

    if (strict && legacyOnlyTotal > 0) {
      console.error(
        `Identity strict mode failed: ${legacyOnlyTotal} row(s) still rely on tenant-only identity.`
      );
      process.exit(1);
    }

    console.log('Identity verification passed.');
  } finally {
    await dbManager.shutdown();
  }
}

main().catch((error) => {
  console.error(
    `Identity backfill verification failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
