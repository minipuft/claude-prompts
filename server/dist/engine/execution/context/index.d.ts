/**
 * Context System Export Module
 *
 * Centralizes all execution context infrastructure exports:
 * - ExecutionContext: Pipeline state carrier
 * - ContextResolver: Template variable resolution
 * - Context types: Interfaces for pipeline state
 */
export { ExecutionContext } from './execution-context.js';
export type { NamedInlineGate, ParsedCommand, SessionContext, ExecutionResults, } from './context-types.js';
export { ContextResolver, createContextResolver, type ContextResolution, type ContextProvider, type ContextSource, type ContextAggregationOptions, } from './context-resolver.js';
