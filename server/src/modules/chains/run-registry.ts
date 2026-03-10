// @lifecycle canonical - Persists chain run registry data via SQLite.
import type { PersistedChainRunRegistry } from './types.js';
import type { Logger } from '../../shared/types/index.js';
import type { StateStoreOptions, StateStore } from '../../shared/types/persistence.js';

export interface ChainRunRegistry {
  ensureInitialized(): Promise<void>;
  load(scope?: StateStoreOptions): Promise<PersistedChainRunRegistry>;
  save(store: PersistedChainRunRegistry, scope?: StateStoreOptions): Promise<void>;
}

export class SqliteChainRunRegistry implements ChainRunRegistry {
  private readonly store: StateStore<PersistedChainRunRegistry>;

  constructor(store: StateStore<PersistedChainRunRegistry>, _logger?: Logger) {
    this.store = store;
  }

  async ensureInitialized(): Promise<void> {
    await this.store.ensureInitialized();
  }

  async load(scope?: StateStoreOptions): Promise<PersistedChainRunRegistry> {
    return this.store.load(scope);
  }

  async save(store: PersistedChainRunRegistry, scope?: StateStoreOptions): Promise<void> {
    await this.store.save(store, scope);
  }
}
