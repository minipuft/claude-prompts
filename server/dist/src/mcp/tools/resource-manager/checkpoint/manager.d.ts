/**
 * Checkpoint Tool Handler
 *
 * Provides MCP tool interface for git-based checkpoint management.
 * Wraps GitCheckpoint from gates/shell for resource_manager integration.
 *
 * Actions:
 * - create: Create a checkpoint (git stash) before risky operations
 * - rollback: Restore a checkpoint (git stash pop)
 * - list: List all active checkpoints
 * - delete: Remove a checkpoint without applying (git stash drop)
 * - clear: Clear all checkpoints
 */
import type { CheckpointManagerInput, CheckpointManagerDependencies } from './types.js';
import type { ToolResponse } from '../../../../shared/types/index.js';
/**
 * Checkpoint Tool Handler
 */
export declare class CheckpointToolHandler {
    private readonly logger;
    private readonly configManager;
    private readonly gitCheckpoint;
    private state;
    constructor(deps: CheckpointManagerDependencies);
    /**
     * Initialize the manager (load state from disk)
     */
    initialize(): Promise<void>;
    /**
     * Handle checkpoint manager action
     */
    handleAction(args: CheckpointManagerInput, _context: Record<string, unknown>): Promise<ToolResponse>;
    private handleCreate;
    private handleRollback;
    private handleList;
    private handleDelete;
    private handleClear;
    private getStatePath;
    private loadState;
    private saveState;
    private extractFileCount;
    private formatAge;
    private createSuccessResponse;
    private createErrorResponse;
}
/**
 * Create consolidated checkpoint manager
 */
export declare function createCheckpointToolHandler(deps: CheckpointManagerDependencies): CheckpointToolHandler;
