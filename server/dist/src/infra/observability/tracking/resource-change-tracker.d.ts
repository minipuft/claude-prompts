/**
 * Resource Change Tracker Module
 * Provides content hashing, change logging, and startup baseline comparison
 * for prompts and gates resources.
 *
 * Architecture:
 * ┌─────────────────┐    ┌─────────────────┐
 * │  HotReloadMgr   │    │ resource_manager│
 * │  (filesystem)   │    │   (mcp-tool)    │
 * └────────┬────────┘    └────────┬────────┘
 *          │                      │
 *          └──────────┬───────────┘
 *                     ↓
 *          ┌─────────────────────┐
 *          │ ResourceChangeTracker│
 *          │  - logChange()      │
 *          │  - getChanges()     │
 *          │  - compareBaseline()│
 *          └─────────┬───────────┘
 *                    ↓
 *     ┌──────────────┴──────────────┐
 *     │                             │
 *     ↓                             ↓
 * resource_changes (SQLite)  resource_hash_cache (SQLite)
 * (structured log)           (hash cache blob)
 */
import { Logger } from '../../logging/index.js';
import type { ChangeSource, TrackedResourceType } from '../../../shared/types/index.js';
export type { ChangeSource, TrackedResourceType } from '../../../shared/types/index.js';
/**
 * Type of change operation
 */
export type ChangeOperation = 'added' | 'modified' | 'removed';
/**
 * Individual change entry in the log
 */
export interface ResourceChangeEntry {
    timestamp: string;
    source: ChangeSource;
    operation: ChangeOperation;
    resourceType: TrackedResourceType;
    resourceId: string;
    filePath: string;
    contentHash: string;
    previousHash?: string;
}
/**
 * Parameters for logging a change
 */
export interface LogChangeParams {
    source: ChangeSource;
    operation: ChangeOperation;
    resourceType: TrackedResourceType;
    resourceId: string;
    filePath: string;
    content?: string;
}
/**
 * Query parameters for retrieving changes
 */
export interface GetChangesParams {
    limit?: number;
    source?: ChangeSource;
    resourceType?: TrackedResourceType;
    since?: string;
    resourceId?: string;
}
/**
 * Configuration for the tracker
 */
export interface ResourceChangeTrackerConfig {
    /** Maximum entries to retain (default: 1000) */
    maxEntries: number;
    /** Server root directory (for SqliteEngine singleton) */
    serverRoot: string;
    /** Whether to track prompts */
    trackPrompts: boolean;
    /** Whether to track gates */
    trackGates: boolean;
}
/**
 * ResourceChangeTracker class
 * Provides audit logging and hash tracking for resource changes via SQLite
 */
export declare class ResourceChangeTracker {
    private logger;
    private config;
    private hashCache;
    private dbManager?;
    private hashStore?;
    private initialized;
    constructor(logger: Logger, config?: Partial<ResourceChangeTrackerConfig>);
    /**
     * Initialize the tracker by loading existing state from SQLite
     */
    initialize(): Promise<void>;
    /**
     * Load hash cache from SQLite
     */
    private loadHashCache;
    /**
     * Save hash cache to SQLite
     */
    private saveHashCache;
    /**
     * Compute SHA-256 hash of content
     */
    private computeHash;
    /**
     * Get cache key for a resource
     */
    private getCacheKey;
    /**
     * Log a resource change
     */
    logChange(params: LogChangeParams): Promise<void>;
    /**
     * Rotate log if it exceeds maxEntries (SQL DELETE)
     */
    private rotateLogIfNeeded;
    /**
     * Get changes from the log with optional filtering
     */
    getChanges(params?: GetChangesParams): Promise<ResourceChangeEntry[]>;
    /**
     * Compare current resources against cached baseline and log external changes
     * Called at startup to detect changes made while server was down
     */
    compareBaseline(resources: Array<{
        resourceType: TrackedResourceType;
        resourceId: string;
        filePath: string;
    }>): Promise<{
        added: number;
        modified: number;
        removed: number;
    }>;
    /**
     * Get the current hash for a resource
     */
    getResourceHash(resourceType: TrackedResourceType, resourceId: string): string | undefined;
    /**
     * Get all cached hashes
     */
    getAllHashes(): Map<string, string>;
    /**
     * Get tracker statistics
     */
    getStats(): Promise<{
        cachedHashes: number;
        totalChanges: number;
    }>;
    /**
     * Clear all tracking data (for testing or reset)
     */
    clear(): Promise<void>;
}
/**
 * Factory function to create a ResourceChangeTracker instance
 */
export declare function createResourceChangeTracker(logger: Logger, config?: Partial<ResourceChangeTrackerConfig>): ResourceChangeTracker;
