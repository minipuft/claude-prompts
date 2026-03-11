/**
 * Framework Tool Handler MCP Tool
 *
 * Thin routing layer for methodology lifecycle management.
 * Domain logic delegated to services:
 * - FrameworkLifecycleProcessor: create, update, delete, reload, switch
 * - FrameworkDiscoveryProcessor: list, inspect
 * - FrameworkVersioningProcessor: history, rollback, compare
 * - MethodologyValidator: scoring, error/success formatting
 * - MethodologyFileWriter: file I/O with merge support
 */
export { FrameworkToolHandler, createFrameworkToolHandler } from './core/manager.js';
export type { FrameworkResourceContext } from './core/context.js';
export type { FrameworkManagerActionId, FrameworkManagerInput, FrameworkManagerDependencies, } from './core/types.js';
export { MethodologyFileWriter, MethodologyValidator, FrameworkLifecycleProcessor, FrameworkDiscoveryProcessor, FrameworkVersioningProcessor, type MethodologyFileWriterDependencies, type ExistingMethodologyData, type MethodologyFileResult, } from './services/index.js';
