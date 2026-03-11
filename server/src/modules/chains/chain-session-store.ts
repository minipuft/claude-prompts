// @lifecycle canonical - Compatibility exports for chain session store APIs.
// Re-export ChainSessionStore and related types from canonical location.
// Tests and new consumers import from this path.
export {
  ChainSessionStore,
  ChainSessionManager,
  createChainSessionStore,
  createChainSessionManager,
  type ChainSessionStoreOptions,
  type ChainSessionManagerOptions,
  type SessionClearedCallback,
} from './manager.js';

export type {
  ChainSession,
  ChainSessionService,
  ChainSessionSummary,
  SessionBlueprint,
} from './types.js';
