/**
 * Gate Tool Handler MCP Tool
 *
 * Thin routing layer for gate lifecycle management.
 * Domain logic delegated to services:
 * - GateLifecycleProcessor: create, update, delete, reload
 * - GateDiscoveryProcessor: list, inspect
 * - GateVersioningProcessor: history, rollback, compare
 * - GateFileWriter: file I/O with transactions
 */
export { GateToolHandler, createGateToolHandler } from './core/manager.js';
export type { GateResourceContext } from './core/context.js';
export type { GateManagerActionId, GateManagerInput, GateManagerDependencies, } from './core/types.js';
