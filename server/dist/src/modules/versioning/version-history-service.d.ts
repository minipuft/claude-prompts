import type { VersionEntry, HistoryFile, SaveVersionResult, RollbackResult, SaveVersionOptions } from './types.js';
import type { VersioningConfig, Logger } from '../../shared/types/index.js';
import type { DatabasePort } from '../../shared/types/persistence.js';
type ResourceType = 'prompt' | 'gate' | 'methodology';
/**
 * Interface for config provider - allows ConfigManager or test doubles.
 * Requires both versioning config and serverRoot for SQLite access.
 */
export interface VersioningConfigProvider {
    getVersioningConfig(): VersioningConfig;
    getServerRoot(): string;
}
/**
 * Service for managing version history of resources (prompts, gates, methodologies).
 *
 * Persists version snapshots in the SQLite `version_history` table via SqliteEngine.
 * Supports automatic versioning on updates, rollback, and version comparison.
 *
 * Config is read from ConfigManager on each operation to support hot-reload.
 */
export declare class VersionHistoryService {
    private logger;
    private configProvider;
    private dbManager;
    constructor(deps: {
        logger: Logger;
        configManager: VersioningConfigProvider;
        dbManager?: DatabasePort;
    });
    /** Late-bind DatabasePort (setter injection, matching codebase convention). */
    setDatabasePort(db: DatabasePort): void;
    /**
     * Get database instance.
     * Requires DatabasePort to be injected via constructor or setDatabasePort().
     */
    private getDb;
    private getConfig;
    isEnabled(): boolean;
    isAutoVersionEnabled(): boolean;
    /**
     * Save a version snapshot before an update.
     */
    saveVersion(resourceType: ResourceType, resourceId: string, snapshot: Record<string, unknown>, options?: SaveVersionOptions): Promise<SaveVersionResult>;
    /**
     * Load version history for a resource.
     */
    loadHistory(resourceType: ResourceType, resourceId: string): Promise<HistoryFile | null>;
    /**
     * Get a specific version snapshot.
     */
    getVersion(resourceType: ResourceType, resourceId: string, version: number): Promise<VersionEntry | null>;
    /**
     * Get the latest version number for a resource.
     */
    getLatestVersion(resourceType: ResourceType, resourceId: string): Promise<number>;
    /**
     * Rollback to a previous version.
     *
     * Saves the current state as a new version, then returns the snapshot
     * of the requested version for the caller to restore.
     */
    rollback(resourceType: ResourceType, resourceId: string, targetVersion: number, currentSnapshot: Record<string, unknown>): Promise<RollbackResult & {
        snapshot?: Record<string, unknown>;
    }>;
    /**
     * Compare two versions and return their snapshots for diffing.
     */
    compareVersions(resourceType: ResourceType, resourceId: string, fromVersion: number, toVersion: number): Promise<{
        success: boolean;
        from?: VersionEntry;
        to?: VersionEntry;
        error?: string;
    }>;
    /**
     * Delete version history for a resource.
     * Called when a resource is deleted.
     */
    deleteHistory(resourceType: ResourceType, resourceId: string): Promise<boolean>;
    /**
     * Format history for display in MCP response.
     */
    formatHistoryForDisplay(history: HistoryFile, limit?: number): string;
}
export {};
