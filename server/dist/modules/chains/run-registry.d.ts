import type { PersistedChainRunRegistry } from './types.js';
import type { Logger } from '../../shared/types/index.js';
import type { StateStoreOptions, StateStore } from '../../shared/types/persistence.js';
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
