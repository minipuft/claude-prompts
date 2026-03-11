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
import { DatabaseSync } from 'node:sqlite';
import type { DatabasePort } from '../../shared/types/persistence.js';
import type { Logger } from '../logging/index.js';
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
export declare class SqliteEngine implements DatabasePort {
    private static instance;
    private db;
    private readonly dbPath;
    private readonly logger;
    private readonly verbose;
    private initialized;
    private constructor();
    /**
     * Get or create the SqliteEngine singleton
     */
    static getInstance(serverRoot: string, logger: Logger, config?: DatabaseConfig): Promise<SqliteEngine>;
    /**
     * Check if database is initialized
     */
    isInitialized(): boolean;
    /**
     * Initialize the database (lazy - call when needed)
     */
    initialize(): Promise<void>;
    /**
     * Get the database instance (throws if not initialized)
     */
    getDb(): DatabaseSync;
    /**
     * Execute a SQL statement (no return value).
     * Uses exec() for DDL/unparam statements, prepare().run() for parameterized DML.
     */
    run(sql: string, params?: any[]): void;
    /**
     * Execute a SQL query and return all results
     */
    query<T = Record<string, any>>(sql: string, params?: any[]): T[];
    /**
     * Execute a SQL query and return first result (or null)
     */
    queryOne<T = Record<string, any>>(sql: string, params?: any[]): T | null;
    /**
     * Begin a transaction
     */
    beginTransaction(): void;
    /**
     * Commit a transaction
     */
    commit(): void;
    /**
     * Rollback a transaction
     */
    rollback(): void;
    /**
     * Execute multiple statements in a transaction
     */
    transaction<T>(fn: () => T | Promise<T>): Promise<T>;
    /**
     * Ensure database schema is current.
     *
     * Strategy: embedded schema is the SSOT. On version mismatch,
     * drop all tables and recreate. Safe because state.db is ephemeral —
     * all indexed data is regenerated from YAML resources on startup.
     */
    private ensureSchema;
    private getCurrentSchemaVersion;
    private dropAllTables;
    /**
     * Apply the complete schema. This is the single source of truth for all tables.
     * Bump SCHEMA_VERSION at the top of this file when making changes here.
     *
     * Uses exec() to run the entire schema as a single multi-statement string.
     */
    private applySchema;
    private getTableColumns;
    private applyIdentityScopeMigration;
    /**
     * Shutdown and cleanup
     */
    shutdown(): Promise<void>;
    /**
     * Get database file path (for testing/debugging)
     */
    getDbPath(): string;
    /**
     * Get current schema version
     */
    getSchemaVersion(): number;
}
