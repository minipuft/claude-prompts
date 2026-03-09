// @lifecycle canonical - Persists chain run registry data via SQLite.
import { SqliteEngine } from '../../infra/database/sqlite-engine.js';
import { SqliteStateStore } from '../../infra/database/stores/sqlite-store.js';

import type { PersistedChainRunRegistry } from './types.js';
import type { Logger } from '../../shared/types/index.js';

export interface ChainRunRegistry {
  ensureInitialized(): Promise<void>;
  load(): Promise<PersistedChainRunRegistry>;
  save(store: PersistedChainRunRegistry): Promise<void>;
}

export class SqliteChainRunRegistry implements ChainRunRegistry {
  private readonly store: SqliteStateStore<PersistedChainRunRegistry>;

  constructor(dbManager: SqliteEngine, logger?: Logger) {
    this.store = new SqliteStateStore<PersistedChainRunRegistry>(
      dbManager,
      {
        tableName: 'chain_run_registry',
        stateColumn: 'state',
        defaultState: () => ({}),
      },
      logger
    );
  }

  async ensureInitialized(): Promise<void> {
    await this.store.ensureInitialized();
  }

  async load(): Promise<PersistedChainRunRegistry> {
    return this.store.load();
  }

  async save(store: PersistedChainRunRegistry): Promise<void> {
    await this.store.save(store);
  }
}
