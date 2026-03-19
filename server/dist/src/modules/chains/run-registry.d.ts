import type { PersistedChainRunRegistry } from './types.js';
import type { Logger } from '../../shared/types/index.js';
import type { DatabasePort, StateStoreOptions, StateStore } from '../../shared/types/persistence.js';
export interface ChainRunRegistry {
    ensureInitialized(): Promise<void>;
    load(scope?: StateStoreOptions): Promise<PersistedChainRunRegistry>;
    save(store: PersistedChainRunRegistry, scope?: StateStoreOptions): Promise<void>;
}
export declare class SqliteChainRunRegistry implements ChainRunRegistry {
    private readonly store;
    constructor(store: StateStore<PersistedChainRunRegistry>, _logger?: Logger);
    ensureInitialized(): Promise<void>;
    load(scope?: StateStoreOptions): Promise<PersistedChainRunRegistry>;
    save(store: PersistedChainRunRegistry, scope?: StateStoreOptions): Promise<void>;
}
/**
 * Chain run registry backed directly by DatabasePort (no infra/ dependency).
 * Used when DatabasePort is injected from the runtime layer to avoid modules/ → infra/ imports.
 */
export declare class DirectChainRunRegistry implements ChainRunRegistry {
    private readonly db;
    private readonly _logger?;
    constructor(db: DatabasePort, _logger?: Logger | undefined);
    ensureInitialized(): Promise<void>;
    load(scope?: StateStoreOptions): Promise<PersistedChainRunRegistry>;
    save(store: PersistedChainRunRegistry, scope?: StateStoreOptions): Promise<void>;
}
