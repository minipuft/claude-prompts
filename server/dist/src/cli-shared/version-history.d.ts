/**
 * Standalone version-history functions for CLI consumption.
 *
 * SQLite-backed implementation (runtime-state/state.db), replacing legacy sidecar history files.
 * Uses a small embedded Python sqlite3 helper so APIs remain synchronous.
 */
import type { VersionEntry, HistoryFile, SaveVersionResult, RollbackResult, SaveVersionOptions } from '../modules/versioning/types.js';
type ResourceType = 'prompt' | 'gate' | 'methodology' | 'style';
export declare function loadHistory(resourceDir: string): HistoryFile | null;
export declare function getVersion(resourceDir: string, version: number): VersionEntry | null;
export declare function compareVersions(resourceDir: string, fromVersion: number, toVersion: number): {
    success: boolean;
    from?: VersionEntry;
    to?: VersionEntry;
    error?: string;
};
export declare function saveVersion(resourceDir: string, resourceType: ResourceType, resourceId: string, snapshot: Record<string, unknown>, options?: SaveVersionOptions): SaveVersionResult;
export declare function rollbackVersion(resourceDir: string, resourceType: ResourceType, resourceId: string, targetVersion: number, currentSnapshot: Record<string, unknown>): RollbackResult & {
    snapshot?: Record<string, unknown>;
};
export declare function deleteHistoryFile(resourceDir: string): boolean;
export declare function renameHistoryResource(resourceDir: string, oldId: string, newId: string): boolean;
export declare function formatHistoryTable(history: HistoryFile, limit?: number): string;
export {};
