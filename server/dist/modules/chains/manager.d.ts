/**
 * Chain Session Store
 *
 * Manages chain execution sessions, providing the bridge between MCP session IDs
 * and the persisted chain state/step capture utilities. This enables stateful
 * chain execution across multiple MCP tool calls.
 *
 * CRITICAL: Uses SQLite-backed persistence to survive STDIO transport's ephemeral processes.
 * Sessions are saved to disk after every change and loaded on initialization.
 */
import { type ChainRunRegistry } from './run-registry.js';
import { StepState } from '../../shared/types/chain-execution.js';
import { ArgumentHistoryTracker, TextReferenceStore } from '../text-refs/index.js';
import type { ChainSession, ChainSessionLookupOptions, ChainSessionService, ChainSessionSummary, GateReviewOutcomeUpdate, SessionBlueprint } from './types.js';
import type { PendingGateReview, PendingShellVerificationSnapshot, StepMetadata } from '../../shared/types/chain-execution.js';
import type { Logger } from '../../shared/types/index.js';
import type { DatabasePort, StateStoreOptions } from '../../shared/types/persistence.js';
/** Callback invoked when a session is cleared (cleanup or explicit). */
export type SessionClearedCallback = (sessionId: string, session: ChainSession) => void | Promise<void>;
export interface ChainSessionStoreOptions {
    serverRoot?: string;
    defaultSessionTimeoutMs?: number;
    reviewSessionTimeoutMs?: number;
    cleanupIntervalMs?: number;
}
/** @deprecated Use ChainSessionStoreOptions */
export type ChainSessionManagerOptions = ChainSessionStoreOptions;
/**
 * Chain Session Store
 *
 * Coordinates session state between MCP protocol, step capture, and execution context tracking.
 * Provides session-aware context retrieval for chain execution.
 */
export declare class ChainSessionStore implements ChainSessionService {
    private logger;
    private textReferenceStore;
    private argumentHistoryTracker?;
    private activeSessions;
    private chainSessionMapping;
    private baseChainMapping;
    private runChainToBase;
    private runRegistry;
    private readonly sessionClearedCallbacks;
    private readonly serverRoot;
    private readonly defaultSessionTimeoutMs;
    private readonly reviewSessionTimeoutMs;
    private readonly cleanupIntervalMs;
    private cleanupIntervalHandle?;
    private injectedDbEngine?;
    private resolvedDbEngine?;
    private readonly serverPid;
    private readonly pidScope;
    private initPromise;
    constructor(logger: Logger, textReferenceStore: TextReferenceStore, options: ChainSessionStoreOptions, dbEngineOrTracker?: DatabasePort | ArgumentHistoryTracker, sessionStore?: ChainRunRegistry);
    /**
     * Initialize the manager asynchronously
     */
    private initialize;
    /**
     * Register a callback invoked when any session is cleared (explicit or stale cleanup).
     * Used by pipeline wiring to clean up cross-layer state (e.g., verify-state.db).
     */
    onSessionCleared(callback: SessionClearedCallback): void;
    /**
     * Fire-and-forget cleanup scheduler (unref to avoid blocking shutdown)
     */
    private startCleanupScheduler;
    /**
     * Load sessions from file (for STDIO transport persistence)
     */
    private loadSessions;
    /**
     * Save sessions to file (for STDIO transport persistence)
     */
    private saveSessions;
    private serializeSessions;
    private persistSessions;
    /**
     * Dual-write active canonical sessions to the per-row `chain_sessions` table
     * with `process.pid` as `tenant_id` for cross-client isolation.
     *
     * Hooks query this table with PID liveness checks to avoid blocking
     * unrelated Claude Code instances sharing the same MCP server.
     */
    private syncToSessionTable;
    /**
     * Collect active canonical sessions that need hook visibility.
     * A session is "active" if it has steps remaining or pending review/verification.
     */
    private collectActiveSessionRows;
    /** Whether a session should be visible to hooks (in-progress or pending review). */
    private isSessionActiveForHooks;
    /**
     * Collect tenant_id values from a table where the PID is dead (not alive).
     * Skips non-numeric IDs and optionally skips the current process PID.
     */
    /** Lazy-resolve the database engine via dynamic import (avoids static infra dependency). */
    private resolveDbEngine;
    private collectDeadPidTenants;
    /**
     * Remove rows belonging to dead server processes from both chain_sessions
     * and chain_run_registry tables. Called once at startup to prevent stale
     * rows from blocking hooks or consuming storage.
     */
    private cleanupStalePidRows;
    private persistSessionsAsync;
    /**
     * Create a new chain session
     */
    createSession(sessionId: string, chainId: string, totalSteps: number, originalArgs?: Record<string, any>, options?: StateStoreOptions & {
        blueprint?: SessionBlueprint;
    }): Promise<ChainSession>;
    /**
     * Get session by ID
     */
    getSession(sessionId: string, scope?: StateStoreOptions): ChainSession | undefined;
    /**
     * Set step state for a specific step
     */
    setStepState(sessionId: string, stepNumber: number, state: StepState, isPlaceholder?: boolean): boolean;
    /**
     * Get step state for a specific step
     */
    getStepState(sessionId: string, stepNumber: number): StepMetadata | undefined;
    /**
     * Transition step to a new state
     */
    transitionStepState(sessionId: string, stepNumber: number, newState: StepState, isPlaceholder?: boolean): Promise<boolean>;
    /**
     * Check if a step is complete (not a placeholder and in COMPLETED state)
     */
    isStepComplete(sessionId: string, stepNumber: number): boolean;
    /**
     * Update session state after step rendering or completion
     * IMPORTANT: This method now handles both rendering (template storage) and completion
     */
    updateSessionState(sessionId: string, stepNumber: number, stepResult: string, stepMetadata?: Record<string, any>): Promise<boolean>;
    /**
     * Update an existing step result (e.g., replace placeholder with LLM output)
     */
    updateStepResult(sessionId: string, stepNumber: number, stepResult: string, stepMetadata?: Record<string, any>): Promise<boolean>;
    /**
     * Mark a step as COMPLETED and advance the step counter
     * This should be called AFTER the step response has been captured and validated
     */
    completeStep(sessionId: string, stepNumber: number, options?: {
        preservePlaceholder?: boolean;
    }): Promise<boolean>;
    /**
     * Advance to the next step after gate validation passes.
     * This should be called ONLY when:
     * - Gate review passes (PASS verdict)
     * - No gates are configured for this step
     * - Enforcement mode is advisory/informational (non-blocking)
     *
     * @param sessionId - The session identifier
     * @param stepNumber - The step that was completed (will advance to stepNumber + 1)
     * @returns true if advanced successfully, false if session not found
     */
    advanceStep(sessionId: string, stepNumber: number): Promise<number | false>;
    /**
     * Persist a step result to storage and optional tracking systems.
     */
    private persistStepResult;
    /**
     * Get chain context for session - this is the critical method for fixing contextData
     */
    getChainContext(sessionId: string, _scope?: StateStoreOptions): Record<string, any>;
    /**
     * Get original arguments for session
     */
    getOriginalArgs(sessionId: string): Record<string, any>;
    getSessionBlueprint(sessionId: string, _scope?: StateStoreOptions): SessionBlueprint | undefined;
    updateSessionBlueprint(sessionId: string, blueprint: SessionBlueprint): Promise<void>;
    getInlineGateIds(sessionId: string, _scope?: StateStoreOptions): string[] | undefined;
    setPendingGateReview(sessionId: string, review: PendingGateReview): Promise<void>;
    getPendingGateReview(sessionId: string): PendingGateReview | undefined;
    /**
     * Check if the retry limit has been exceeded for a pending gate review.
     * Returns true if attemptCount >= maxAttempts.
     * @remarks Uses DEFAULT_RETRY_LIMIT (2) when maxAttempts not specified.
     */
    isRetryLimitExceeded(sessionId: string): boolean;
    /**
     * Reset the retry count for a pending gate review.
     * Used when user chooses to retry after retry exhaustion.
     */
    resetRetryCount(sessionId: string): Promise<void>;
    clearPendingGateReview(sessionId: string): Promise<void>;
    setPendingShellVerification(sessionId: string, state: PendingShellVerificationSnapshot): Promise<void>;
    getPendingShellVerification(sessionId: string): PendingShellVerificationSnapshot | undefined;
    clearPendingShellVerification(sessionId: string): Promise<void>;
    recordGateReviewOutcome(sessionId: string, outcome: GateReviewOutcomeUpdate): Promise<'cleared' | 'pending'>;
    /**
     * Check if session exists and is active
     */
    hasActiveSession(sessionId: string): boolean;
    /**
     * Check if chain has any active sessions
     */
    hasActiveSessionForChain(chainId: string): boolean;
    getRunHistory(baseChainId: string): string[];
    getLatestSessionForBaseChain(baseChainId: string): ChainSession | undefined;
    getSessionByChainIdentifier(chainId: string, options?: ChainSessionLookupOptions): ChainSession | undefined;
    /**
     * Find the best session for a chainId that matches the scope filter.
     * Prefers active over dormant, most recent by lastActivity.
     */
    private findScopedSessionForChain;
    listActiveSessions(limit?: number, scope?: StateStoreOptions): ChainSessionSummary[];
    /**
     * Get active session for chain (returns first active session)
     */
    getActiveSessionForChain(chainId: string): ChainSession | undefined;
    /**
     * Clear session
     */
    clearSession(sessionId: string): Promise<boolean>;
    /**
     * Clear all sessions for a chain
     */
    clearSessionsForChain(chainId: string, scope?: StateStoreOptions): Promise<void>;
    /**
     * Cleanup stale sessions (older than 24 hours)
     */
    cleanupStaleSessions(): Promise<number>;
    private registerRunHistory;
    private pruneExcessRuns;
    private removeRunChainSessions;
    private notifySessionCleared;
    private removeSessionArtifacts;
    private removeRunFromBaseTracking;
    private extractBaseChainId;
    private getRunNumber;
    private ensureRunMappingConsistency;
    /**
     * Get session statistics
     */
    getSessionStats(): {
        totalSessions: number;
        totalChains: number;
        averageStepsPerChain: number;
        oldestSessionAge: number;
    };
    /**
     * Validate session integrity
     */
    validateSession(sessionId: string): {
        valid: boolean;
        issues: string[];
    };
    /**
     * Cleanup the chain session manager and persist state
     * Prevents async handle leaks by finalizing all file operations
     */
    cleanup(): Promise<void>;
    private isDormantSession;
    private promoteSessionLifecycle;
    private getDormantSessionForChain;
    private getDormantSessionForBaseChain;
    private buildChainMetadata;
    private collectInlineGateIds;
    private getCurrentStepArgs;
    private cloneBlueprint;
    /**
     * Resolve scope filter string from optional scope options.
     * Returns undefined when no scope filtering should be applied.
     * Checks explicit continuityScopeId first, then resolves from workspaceId/organizationId.
     */
    private resolveScopeFilter;
    /**
     * Check if a session matches the resolved scope filter.
     * If no filter is set (undefined), all sessions match.
     */
    private matchesScope;
    /**
     * Remove sessions for a chain that match the scope filter.
     * If no scope filter, removes all sessions for the chain (backward compatible).
     */
    private removeRunChainSessionsForScope;
}
/** @deprecated Use ChainSessionStore */
export declare const ChainSessionManager: typeof ChainSessionStore;
/** @deprecated Use ChainSessionStore */
export type ChainSessionManager = ChainSessionStore;
export type { ChainSession, ChainSessionService, ChainSessionSummary, SessionBlueprint, } from './types.js';
/**
 * Create and configure a chain session store
 */
export declare function createChainSessionStore(logger: Logger, textReferenceStore: TextReferenceStore, serverRoot: string, options?: Omit<ChainSessionStoreOptions, 'serverRoot'>, argumentHistoryTracker?: ArgumentHistoryTracker): ChainSessionStore;
/** @deprecated Use createChainSessionStore */
export declare const createChainSessionManager: typeof createChainSessionStore;
