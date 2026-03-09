// @lifecycle canonical - Generic state store interface for SQLite backend.
/**
 * State Store Interface
 *
 * Provides a unified interface for persisting state to SQLite via native node:sqlite.
 *
 * Design Notes:
 * - Generic over the state shape T
 * - All operations are async to accommodate SQLite backend
 * - Continuity scope defaults to 'default' for backward compatibility
 */

/**
 * Common options for state store operations
 */
export interface StateStoreOptions {
  /** Canonical continuity scope ID (highest-priority explicit scope override) */
  continuityScopeId?: string;
  /** Canonical workspace scope for continuity isolation */
  workspaceId?: string;
  /** Canonical organization fallback when workspaceId is unavailable */
  organizationId?: string;
}

/**
 * Generic state store interface
 *
 * @typeParam T - The shape of the persisted state
 */
export interface StateStore<T> {
  /**
   * Ensure the store is ready for operations (create tables, etc.)
   */
  ensureInitialized(): Promise<void>;

  /**
   * Load state from the store
   * @param options - Optional identity scope selection
   * @returns The persisted state, or an empty/default state if none exists
   */
  load(options?: StateStoreOptions): Promise<T>;

  /**
   * Save state to the store
   * @param state - The state to persist
   * @param options - Optional identity scope selection
   */
  save(state: T, options?: StateStoreOptions): Promise<void>;

  /**
   * Check if state exists for a given identity scope
   * @param options - Optional identity scope selection
   */
  exists(options?: StateStoreOptions): Promise<boolean>;

  /**
   * Delete state (useful for testing and cleanup)
   * @param options - Optional identity scope selection
   */
  delete(options?: StateStoreOptions): Promise<void>;
}

/**
 * Options for creating a SQLite-based state store
 */
export interface SqliteStateStoreConfig {
  /** Table name in the database */
  tableName: string;
  /** Column name for the state data (default: 'state') */
  stateColumn?: string;
  /** Default state to return when no record exists */
  defaultState: () => unknown;
}
