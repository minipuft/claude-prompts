// @lifecycle canonical - Manages SQLite database lifecycle via node:sqlite (native)
/**
 * SQLite Engine
 *
 * Singleton that manages the native Node.js SQLite database lifecycle.
 * Uses node:sqlite (DatabaseSync) for file-backed storage with no WASM dependency.
 *
 * Key Features:
 * - File-backed natively (no manual persist() needed)
 * - WAL mode for concurrent reader access (Python hooks)
 * - Embedded schema with version-based drop-and-recreate
 * - Synchronous operations via DatabaseSync
 *
 * Schema Strategy:
 * The complete schema is embedded in this file (SSOT). On startup:
 * - Fresh DB: create all tables from embedded schema
 * - Matching version: skip (fast path)
 * - Version mismatch: drop all tables, recreate from embedded schema
 *
 * This is safe because state.db is ephemeral — resource_index (including tools)
 * and skills_sync_manifests are regenerated from YAML on startup. Chain sessions
 * and framework state are interrupted by the restart that triggers schema changes.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type { Logger } from '../logging/index.js';

/** Bump this when changing the embedded schema. Triggers drop-and-recreate. */
const SCHEMA_VERSION = 13;

/**
 * Database configuration options
 */
export interface DatabaseConfig {
  /** Path to the database file (default: runtime-state/state.db) */
  dbPath?: string;
  /** Enable verbose SQL logging */
  verbose?: boolean;
}

/**
 * SQLite Engine - Singleton for native SQLite lifecycle management
 *
 * Replaces the former sql.js WASM-based DatabaseManager with node:sqlite.
 * All state writes go directly to the file — no persist() step needed.
 */
export class SqliteEngine {
  private static instance: SqliteEngine | null = null;

  private db: DatabaseSync | null = null;
  private readonly dbPath: string;
  private readonly logger: Logger;
  private readonly verbose: boolean;
  private initialized: boolean = false;

  private constructor(serverRoot: string, logger: Logger, config: DatabaseConfig = {}) {
    this.logger = logger;
    this.verbose = config.verbose ?? false;

    // Set paths
    this.dbPath = config.dbPath ?? path.join(serverRoot, 'runtime-state', 'state.db');
  }

  /**
   * Get or create the SqliteEngine singleton
   */
  static async getInstance(
    serverRoot: string,
    logger: Logger,
    config?: DatabaseConfig
  ): Promise<SqliteEngine> {
    if (!SqliteEngine.instance) {
      SqliteEngine.instance = new SqliteEngine(serverRoot, logger, config);
    }
    return SqliteEngine.instance;
  }

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.db !== null;
  }

  /**
   * Initialize the database (lazy - call when needed)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.debug('SqliteEngine already initialized');
      return;
    }

    this.logger.info('Initializing SQLite database (node:sqlite)...');

    try {
      // Ensure runtime-state directory exists
      fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });

      // Open file-backed database (creates file if not exists)
      this.db = new DatabaseSync(this.dbPath);

      // Enable WAL mode for concurrent reader access (Python hooks, skills-sync CLI)
      this.db.exec('PRAGMA journal_mode=WAL');

      // Ensure schema is current (creates or recreates if version mismatch)
      this.ensureSchema();
      this.applyIdentityScopeMigration();

      this.initialized = true;
      this.logger.info('SQLite database initialized successfully');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to initialize SQLite database: ${msg}`);
      if (stack) this.logger.error(`Stack: ${stack}`);
      throw error;
    }
  }

  /**
   * Get the database instance (throws if not initialized)
   */
  getDb(): DatabaseSync {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Execute a SQL statement (no return value).
   * Uses exec() for DDL/unparam statements, prepare().run() for parameterized DML.
   */
  run(sql: string, params?: any[]): void {
    if (this.verbose) {
      this.logger.debug(`SQL: ${sql.slice(0, 100)}...`);
    }
    if (params && params.length > 0) {
      this.getDb()
        .prepare(sql)
        .run(...params);
    } else {
      this.getDb().exec(sql);
    }
  }

  /**
   * Execute a SQL query and return all results
   */
  query<T = Record<string, any>>(sql: string, params?: any[]): T[] {
    if (this.verbose) {
      this.logger.debug(`SQL Query: ${sql.slice(0, 100)}...`);
    }

    const stmt = this.getDb().prepare(sql);

    if (params && params.length > 0) {
      return stmt.all(...params) as T[];
    }
    return stmt.all() as T[];
  }

  /**
   * Execute a SQL query and return first result (or null)
   */
  queryOne<T = Record<string, any>>(sql: string, params?: any[]): T | null {
    const stmt = this.getDb().prepare(sql);
    const result = params && params.length > 0 ? stmt.get(...params) : stmt.get();
    return (result as T) ?? null;
  }

  /**
   * Begin a transaction
   */
  beginTransaction(): void {
    this.run('BEGIN TRANSACTION');
  }

  /**
   * Commit a transaction
   */
  commit(): void {
    this.run('COMMIT');
  }

  /**
   * Rollback a transaction
   */
  rollback(): void {
    this.run('ROLLBACK');
  }

  /**
   * Execute multiple statements in a transaction
   */
  async transaction<T>(fn: () => T | Promise<T>): Promise<T> {
    this.beginTransaction();
    try {
      const result = await fn();
      this.commit();
      return result;
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  /**
   * Ensure database schema is current.
   *
   * Strategy: embedded schema is the SSOT. On version mismatch,
   * drop all tables and recreate. Safe because state.db is ephemeral —
   * all indexed data is regenerated from YAML resources on startup.
   */
  private ensureSchema(): void {
    const currentVersion = this.getCurrentSchemaVersion();

    if (currentVersion === SCHEMA_VERSION) {
      this.logger.info(`Database schema is up to date (version ${currentVersion})`);
      return;
    }

    if (currentVersion > 0) {
      this.logger.info(
        `Schema version mismatch (have ${currentVersion}, need ${SCHEMA_VERSION}), recreating...`
      );
      this.dropAllTables();
    }

    this.applySchema();
    this.logger.info(`Schema version ${SCHEMA_VERSION} applied`);
  }

  private getCurrentSchemaVersion(): number {
    try {
      const result = this.queryOne<{ version: number }>(
        'SELECT MAX(version) as version FROM schema_version'
      );
      return result?.version ?? 0;
    } catch {
      return 0;
    }
  }

  private dropAllTables(): void {
    const tables = this.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'"
    );
    for (const { name } of tables) {
      this.run(`DROP TABLE IF EXISTS "${name}"`);
    }
  }

  /**
   * Apply the complete schema. This is the single source of truth for all tables.
   * Bump SCHEMA_VERSION at the top of this file when making changes here.
   *
   * Uses exec() to run the entire schema as a single multi-statement string.
   */
  private applySchema(): void {
    this.getDb().exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      INSERT OR IGNORE INTO tenants (id, name) VALUES ('default', 'Default Tenant');

      CREATE TABLE IF NOT EXISTS chain_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        organization_id TEXT,
        workspace_id TEXT,
        chain_id TEXT NOT NULL,
        run_number INTEGER NOT NULL,
        state TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE (tenant_id, chain_id, run_number)
      );

      CREATE TABLE IF NOT EXISTS framework_state (
        tenant_id TEXT PRIMARY KEY DEFAULT 'default',
        organization_id TEXT,
        workspace_id TEXT,
        state TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS gate_system_state (
        tenant_id TEXT PRIMARY KEY DEFAULT 'default',
        organization_id TEXT,
        workspace_id TEXT,
        state TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS resource_index (
        id TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT,
        category TEXT,
        description TEXT,
        content_hash TEXT,
        file_path TEXT,
        metadata_json TEXT,
        keywords TEXT,
        indexed_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (id, type)
      );

      CREATE TABLE IF NOT EXISTS skills_sync_manifests (
        client TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('user', 'project')),
        resource_key TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        source_hash TEXT NOT NULL,
        output_hash TEXT NOT NULL,
        output_files TEXT NOT NULL,
        exported_at TEXT NOT NULL,
        version INTEGER,
        version_date TEXT,
        config_hash TEXT NOT NULL,
        source_snapshot TEXT,
        PRIMARY KEY (client, scope, resource_key)
      );

      CREATE TABLE IF NOT EXISTS version_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        organization_id TEXT,
        workspace_id TEXT,
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        snapshot TEXT NOT NULL,
        diff_summary TEXT DEFAULT '',
        description TEXT DEFAULT '',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS resource_hash_cache (
        tenant_id TEXT NOT NULL DEFAULT 'default',
        organization_id TEXT,
        workspace_id TEXT,
        state TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (tenant_id)
      );

      CREATE TABLE IF NOT EXISTS resource_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        organization_id TEXT,
        workspace_id TEXT,
        timestamp TEXT NOT NULL,
        source TEXT NOT NULL,
        operation TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        file_path TEXT,
        content_hash TEXT,
        previous_hash TEXT
      );

      CREATE TABLE IF NOT EXISTS chain_run_registry (
        tenant_id TEXT PRIMARY KEY DEFAULT 'default',
        organization_id TEXT,
        workspace_id TEXT,
        state TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS argument_history (
        tenant_id TEXT PRIMARY KEY DEFAULT 'default',
        organization_id TEXT,
        workspace_id TEXT,
        state TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_chain_sessions_tenant ON chain_sessions(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_chain_sessions_workspace ON chain_sessions(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_chain_sessions_organization ON chain_sessions(organization_id);
      CREATE INDEX IF NOT EXISTS idx_chain_sessions_chain ON chain_sessions(chain_id);
      CREATE INDEX IF NOT EXISTS idx_resource_index_type ON resource_index(type);
      CREATE INDEX IF NOT EXISTS idx_framework_state_workspace ON framework_state(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_framework_state_organization ON framework_state(organization_id);
      CREATE INDEX IF NOT EXISTS idx_gate_system_state_workspace ON gate_system_state(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_gate_system_state_organization ON gate_system_state(organization_id);
      CREATE INDEX IF NOT EXISTS idx_resource_changes_tenant ON resource_changes(tenant_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_ssm_client_scope ON skills_sync_manifests(client, scope);
      CREATE INDEX IF NOT EXISTS idx_version_history_resource ON version_history(tenant_id, resource_type, resource_id);
      CREATE INDEX IF NOT EXISTS idx_version_history_workspace ON version_history(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_version_history_organization ON version_history(organization_id);
      CREATE INDEX IF NOT EXISTS idx_resource_hash_cache_workspace ON resource_hash_cache(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_resource_hash_cache_organization ON resource_hash_cache(organization_id);
      CREATE INDEX IF NOT EXISTS idx_resource_changes_workspace ON resource_changes(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_resource_changes_organization ON resource_changes(organization_id);
      CREATE INDEX IF NOT EXISTS idx_chain_run_registry_workspace ON chain_run_registry(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_argument_history_workspace ON argument_history(workspace_id);

      INSERT OR IGNORE INTO schema_version (version) VALUES (${SCHEMA_VERSION});
    `);
  }

  private getTableColumns(tableName: string): Set<string> {
    const rows = this.query<{ name?: string }>(`PRAGMA table_info(${tableName})`);
    return new Set(
      rows
        .map((row) => row.name)
        .filter((name): name is string => typeof name === 'string' && name.length > 0)
    );
  }

  private applyIdentityScopeMigration(): void {
    const scopeTables = [
      'chain_sessions',
      'framework_state',
      'gate_system_state',
      'chain_run_registry',
      'argument_history',
      'version_history',
      'resource_hash_cache',
      'resource_changes',
    ];
    let didMutateSchema = false;

    for (const tableName of scopeTables) {
      const columns = this.getTableColumns(tableName);
      if (columns.size === 0) {
        continue;
      }

      if (!columns.has('organization_id')) {
        this.run(`ALTER TABLE ${tableName} ADD COLUMN organization_id TEXT`);
        didMutateSchema = true;
      }
      if (!columns.has('workspace_id')) {
        this.run(`ALTER TABLE ${tableName} ADD COLUMN workspace_id TEXT`);
        didMutateSchema = true;
      }

      const refreshed = this.getTableColumns(tableName);
      if (!refreshed.has('tenant_id')) {
        continue;
      }
      if (refreshed.has('organization_id')) {
        this.run(
          `UPDATE ${tableName}
           SET organization_id = tenant_id
           WHERE organization_id IS NULL OR TRIM(organization_id) = ''`
        );
      }
      if (refreshed.has('workspace_id')) {
        this.run(
          `UPDATE ${tableName}
           SET workspace_id = COALESCE(NULLIF(TRIM(workspace_id), ''), organization_id, tenant_id)
           WHERE workspace_id IS NULL OR TRIM(workspace_id) = ''`
        );
      }
    }

    // Ensure indexes are present for migrated columns.
    this.run(
      `CREATE INDEX IF NOT EXISTS idx_chain_sessions_workspace ON chain_sessions(workspace_id)`
    );
    this.run(
      `CREATE INDEX IF NOT EXISTS idx_chain_sessions_organization ON chain_sessions(organization_id)`
    );
    this.run(
      `CREATE INDEX IF NOT EXISTS idx_framework_state_workspace ON framework_state(workspace_id)`
    );
    this.run(
      `CREATE INDEX IF NOT EXISTS idx_framework_state_organization ON framework_state(organization_id)`
    );
    this.run(
      `CREATE INDEX IF NOT EXISTS idx_gate_system_state_workspace ON gate_system_state(workspace_id)`
    );
    this.run(
      `CREATE INDEX IF NOT EXISTS idx_gate_system_state_organization ON gate_system_state(organization_id)`
    );
    this.run(
      `CREATE INDEX IF NOT EXISTS idx_version_history_workspace ON version_history(workspace_id)`
    );
    this.run(
      `CREATE INDEX IF NOT EXISTS idx_version_history_organization ON version_history(organization_id)`
    );
    this.run(
      `CREATE INDEX IF NOT EXISTS idx_resource_hash_cache_workspace ON resource_hash_cache(workspace_id)`
    );
    this.run(
      `CREATE INDEX IF NOT EXISTS idx_resource_hash_cache_organization ON resource_hash_cache(organization_id)`
    );
    this.run(
      `CREATE INDEX IF NOT EXISTS idx_resource_changes_workspace ON resource_changes(workspace_id)`
    );
    this.run(
      `CREATE INDEX IF NOT EXISTS idx_resource_changes_organization ON resource_changes(organization_id)`
    );
    if (didMutateSchema) {
      this.logger.info('Applied identity scope column migration (organization_id/workspace_id)');
    }
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down SqliteEngine...');

    if (this.db) {
      this.db.close();
      this.db = null;
    }

    this.initialized = false;
    SqliteEngine.instance = null;

    this.logger.info('SqliteEngine shutdown complete');
  }

  /**
   * Get database file path (for testing/debugging)
   */
  getDbPath(): string {
    return this.dbPath;
  }

  /**
   * Get current schema version
   */
  getSchemaVersion(): number {
    try {
      const result = this.queryOne<{ version: number }>(
        'SELECT MAX(version) as version FROM schema_version'
      );
      return result?.version ?? 0;
    } catch {
      return 0;
    }
  }
}
