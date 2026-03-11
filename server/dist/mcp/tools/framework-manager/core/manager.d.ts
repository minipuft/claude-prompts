/**
 * Framework Tool Handler
 *
 * Thin routing layer for methodology lifecycle management.
 * Domain logic delegated to services:
 * - FrameworkLifecycleProcessor: create, update, delete, reload, switch
 * - FrameworkDiscoveryProcessor: list, inspect
 * - FrameworkVersioningProcessor: history, rollback, compare
 * - MethodologyValidator: scoring, error/success formatting
 * - MethodologyFileWriter: file I/O with merge support
 */
import type { FrameworkManagerInput, FrameworkManagerDependencies } from './types.js';
import type { FrameworkStateStore } from '../../../../engine/frameworks/framework-state-store.js';
import type { ToolResponse } from '../../../../shared/types/index.js';
export declare class FrameworkToolHandler {
    private readonly ctx;
    private readonly lifecycle;
    private readonly discovery;
    private readonly versioning;
    constructor(deps: FrameworkManagerDependencies);
    /**
     * Set framework state store (called during late initialization).
     * Updates the shared context so all services see the new store.
     */
    setFrameworkStateStore(fsm: FrameworkStateStore): void;
    handleAction(args: FrameworkManagerInput, _context: Record<string, unknown>): Promise<ToolResponse>;
}
export declare function createFrameworkToolHandler(deps: FrameworkManagerDependencies): FrameworkToolHandler;
