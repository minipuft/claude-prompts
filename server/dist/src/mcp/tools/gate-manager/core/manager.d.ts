/**
 * Gate Tool Handler
 *
 * Thin routing layer for gate lifecycle management.
 * Domain logic delegated to:
 * - GateLifecycleProcessor: create, update, delete, reload
 * - GateDiscoveryProcessor: list, inspect
 * - GateVersioningProcessor: history, rollback, compare
 */
import type { GateManagerInput, GateManagerDependencies } from './types.js';
import type { ToolResponse } from '../../../../shared/types/index.js';
export declare class GateToolHandler {
    private readonly lifecycle;
    private readonly discovery;
    private readonly versioning;
    private readonly versionHistoryService;
    constructor(deps: GateManagerDependencies);
    setDatabasePort(db: import('../../../../shared/types/persistence.js').DatabasePort): void;
    handleAction(args: GateManagerInput, _context: Record<string, any>): Promise<ToolResponse>;
}
export declare function createGateToolHandler(deps: GateManagerDependencies): GateToolHandler;
