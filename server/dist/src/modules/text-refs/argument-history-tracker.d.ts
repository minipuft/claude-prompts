/**
 * Argument History Tracker
 *
 * Tracks execution arguments and context independent of conversation history.
 * Provides execution context for gate reviews and chain execution.
 *
 * Key Features:
 * - Stores original arguments and step results per chain
 * - Entry limit per chain (FIFO cleanup)
 * - SQLite persistence via SqliteStateStore
 * - Lightweight tracking (<ms overhead)
 * - Independent of semantic layer and conversation history
 */
import { ArgumentHistoryEntry, ReviewContext } from './types.js';
import type { Logger } from '../../shared/types/index.js';
import type { DatabasePort } from '../../shared/types/persistence.js';
/**
 * ArgumentHistoryTracker Class
 *
 * Tracks execution arguments and step results for gate reviews and chain execution.
 * Operates independently of conversation history to ensure reliable execution context.
 */
export declare class ArgumentHistoryTracker {
    private logger;
    /** Chain ID to entries mapping */
    private chainHistory;
    /** Session ID to chain ID mapping */
    private sessionToChain;
    /** Maximum entries per chain (FIFO cleanup) */
    private readonly maxEntriesPerChain;
    /** Database port for direct SQL persistence */
    private db?;
    /** Whether initialization has completed */
    private initialized;
    /**
     * Create an ArgumentHistoryTracker instance.
     *
     * @param logger - Logger instance
     * @param maxEntriesPerChain - Maximum entries per chain (default: 50)
     * @param dbManager - Optional DatabasePort for persistence (set later via setDatabasePort if not provided)
     */
    constructor(logger: Logger, maxEntriesPerChain?: number, dbManager?: DatabasePort);
    /** Late-bind DatabasePort (setter injection, matching codebase convention). */
    setDatabasePort(db: DatabasePort): void;
    /**
     * Initialize: load persisted data from database.
     * Must be called before first use.
     */
    initialize(): Promise<void>;
    /**
     * Track arguments for an execution
     *
     * Records original arguments and optional step results for later retrieval.
     * Automatically enforces max entries limit per chain (FIFO).
     *
     * @param options - Tracking options
     * @returns Unique entry ID
     */
    trackExecution(options: {
        promptId: string;
        sessionId?: string;
        originalArgs: Record<string, any>;
        stepNumber?: number;
        stepResult?: string;
        metadata?: Record<string, any>;
    }): Promise<string>;
    /**
     * Get argument history for a specific chain
     */
    getChainHistory(chainId: string): ArgumentHistoryEntry[];
    /**
     * Get argument history for a session
     */
    getSessionHistory(sessionId: string): ArgumentHistoryEntry[];
    /**
     * Get latest arguments for a session
     */
    getLatestArguments(sessionId: string): Record<string, any> | null;
    /**
     * Build execution context for gate review
     */
    buildReviewContext(sessionId: string, currentStepNumber?: number): ReviewContext;
    /**
     * Clear history for a specific session
     */
    clearSession(sessionId: string): Promise<void>;
    /**
     * Clear history for a specific chain
     */
    clearChain(chainId: string): Promise<void>;
    /**
     * Clear all history
     */
    clearAll(): Promise<void>;
    /**
     * Get statistics about tracked history
     */
    getStats(): {
        totalChains: number;
        totalEntries: number;
        totalSessions: number;
        averageEntriesPerChain: number;
    };
    /**
     * Check if a session has any tracked history
     */
    hasSessionHistory(sessionId: string): boolean;
    /**
     * Save argument history to SQLite via DatabasePort.
     */
    private saveToStore;
    /**
     * Load argument history from SQLite via DatabasePort.
     */
    private loadFromStore;
    /**
     * Stop tracker and cleanup resources
     */
    shutdown(): Promise<void>;
}
