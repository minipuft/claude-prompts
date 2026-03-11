/**
 * Resource Change Tracking Integration
 *
 * Provides auxiliary reload configuration to track filesystem changes
 * and integrates with the ResourceChangeTracker for audit logging.
 */
import { ConfigLoader } from '../infra/config/index.js';
import { ResourceChangeTracker, TrackedResourceType } from '../infra/observability/tracking/index.js';
import type { Logger } from '../infra/logging/index.js';
import type { AuxiliaryReloadConfig } from '../modules/hot-reload/hot-reload-observer.js';
/**
 * Initialize the ResourceChangeTracker
 * Should be called once during application startup
 */
export declare function initializeResourceChangeTracker(logger: Logger, serverRoot: string): Promise<ResourceChangeTracker>;
/**
 * Get the initialized tracker instance
 * Returns undefined if not yet initialized
 */
export declare function getResourceChangeTracker(): ResourceChangeTracker | undefined;
/**
 * Compare current resources against baseline and log external changes
 * Called at startup to detect changes made while server was down
 */
export declare function compareResourceBaseline(tracker: ResourceChangeTracker, configManager: ConfigLoader, logger: Logger): Promise<{
    added: number;
    modified: number;
    removed: number;
}>;
/**
 * Build auxiliary reload config for resource change tracking
 * Hooks into HotReloadObserver to track filesystem changes
 */
export declare function buildResourceChangeTrackerAuxiliaryReloadConfig(logger: Logger, configManager: ConfigLoader): AuxiliaryReloadConfig | undefined;
/**
 * Log an MCP tool change (for use in CRUD handlers)
 * Returns silently if tracker is not initialized
 */
export declare function logMcpToolChange(logger: Logger, params: {
    operation: 'added' | 'modified' | 'removed';
    resourceType: TrackedResourceType;
    resourceId: string;
    filePath: string;
    content?: string;
}): Promise<void>;
