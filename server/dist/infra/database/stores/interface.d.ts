/**
 * State Store Interface
 *
 * StateStoreOptions and StateStore<T> are defined in shared/types/persistence.ts (Layer 0)
 * and re-exported here for backward compatibility. SqliteStateStoreConfig is infra-specific.
 */
export type { StateStoreOptions, StateStore } from '../../../shared/types/persistence.js';
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
