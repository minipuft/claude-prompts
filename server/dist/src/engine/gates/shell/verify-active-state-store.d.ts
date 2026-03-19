/**
 * Verify Active State Store
 *
 * Manages the verify-state.db SQLite database for Stop hook integration.
 * This enables autonomous loops where the Stop hook reads verification
 * config and blocks Claude from stopping until verification passes.
 *
 * Uses a standalone SQLite database (not the main state.db) so Python
 * hooks can read it independently without going through the Node.js process.
 *
 * Implementation: node:sqlite (DatabaseSync) — file-backed natively,
 * WAL mode for concurrent reader access, no WASM or manual persist().
 *
 * Extracted from ShellVerificationStage to maintain orchestration layer limits.
 */
import type { PendingShellVerification, VerifyActiveState } from './types.js';
import type { Logger } from '../../../infra/logging/index.js';
/**
 * Configuration for the state store.
 */
export interface VerifyActiveStateStoreConfig {
    /** Directory for runtime state files (required - no default) */
    runtimeStateDir: string;
}
/**
 * Manages verify-state.db for Stop hook coordination.
 *
 * When loop mode is enabled (`:: verify:"cmd" loop:true`), this store
 * writes state that the Stop hook reads to determine if Claude should
 * be allowed to stop or must continue trying.
 */
export declare class VerifyActiveStateStore {
    private readonly runtimeStateDir;
    private readonly logger;
    constructor(logger: Logger, config: VerifyActiveStateStoreConfig);
    /**
     * Get the path to verify-state.db.
     */
    get stateDbPath(): string;
    /**
     * Write verify-active state for Stop hook integration.
     *
     * Called when loop mode is enabled. The Stop hook reads this state
     * to determine if verification is pending and whether to block stop.
     *
     * @param sessionId - Chain session ID for tracking
     * @param pending - Current pending verification state
     */
    writeState(sessionId: string, pending: PendingShellVerification): Promise<void>;
    /**
     * Clear verify-active state after verification completes.
     *
     * Called when:
     * - Verification passes (exit 0)
     * - Max attempts reached (Stop hook shouldn't keep trying)
     * - User chooses skip/abort
     */
    clearState(sessionId?: string): Promise<void>;
    /**
     * Read current verify-active state (for Stop hook use).
     *
     * @returns The current state, or null if no active verification
     */
    readState(sessionId?: string): Promise<VerifyActiveState | null>;
    /**
     * Check if there's an active verification pending.
     */
    hasActiveVerification(): Promise<boolean>;
    /**
     * Open database, run operation, close. File-backed natively via DatabaseSync —
     * no export/persist step needed. WAL mode enables concurrent reader access
     * from Python hooks.
     */
    private withDb;
    private ensureSchema;
}
/**
 * Factory function for creating the state store.
 */
export declare function createVerifyActiveStateStore(logger: Logger, config: VerifyActiveStateStoreConfig): VerifyActiveStateStore;
