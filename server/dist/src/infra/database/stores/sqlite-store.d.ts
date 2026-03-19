/**
 * SQLite State Store
 *
 * Implements StateStore using native node:sqlite (via SqliteEngine).
 * Provides continuity-scope isolation via workspace/organization identity.
 *
 * Features:
 * - ACID transactions for data integrity
 * - Continuity scope isolation by default
 * - Queryable state (vs opaque JSON files)
 * - Automatic table creation and schema management
 * - File-backed natively (no manual persist() needed)
 *
 * Prerequisites:
 * - SqliteEngine must be initialized before using this store
 * - Table schema is defined in SqliteEngine's embedded schema
 */
import type { SqliteStateStoreConfig } from './interface.js';
import type { DatabasePort, StateStore, StateStoreOptions } from '../../../shared/types/persistence.js';
import type { Logger } from '../../logging/index.js';
export declare class SqliteStateStore<T> implements StateStore<T> {
    private readonly tableName;
    private readonly stateColumn;
    private readonly defaultState;
    private readonly logger?;
    private readonly db;
    private scopeColumnsCache?;
    constructor(db: DatabasePort, config: SqliteStateStoreConfig, logger?: Logger);
    ensureInitialized(): Promise<void>;
    load(options?: StateStoreOptions): Promise<T>;
    save(state: T, options?: StateStoreOptions): Promise<void>;
    exists(options?: StateStoreOptions): Promise<boolean>;
    delete(options?: StateStoreOptions): Promise<void>;
    /**
     * Get the table name (for debugging/testing)
     */
    getTableName(): string;
    /**
     * Execute a custom query on this store's table
     * Useful for domain-specific queries beyond simple CRUD
     */
    query<R>(sql: string, params?: unknown[]): R[];
    /**
     * Execute a custom query returning a single result
     */
    queryOne<R>(sql: string, params?: unknown[]): R | null;
    private normalizeScopeComponent;
    private resolveScope;
    private getScopeColumns;
    private findRowByScope;
}
