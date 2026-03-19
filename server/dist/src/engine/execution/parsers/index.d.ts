/**
 * Execution Parsers Export Module
 *
 * Centralizes all parsing infrastructure exports including:
 * - Unified Command Parser with multi-strategy parsing
 * - Argument Processing Pipeline with validation and enrichment
 * - Schema Validation (minLength, maxLength, pattern enforcement)
 * - Compatibility Wrapper for backward compatibility
 */
export { UnifiedCommandParser, createUnifiedCommandParser, type CommandParseResult, } from './command-parser.js';
export { ArgumentParser, createArgumentParser, type ArgumentParsingResult, type ExecutionContext, } from './argument-parser.js';
export { ArgumentSchemaValidator, type SchemaValidationIssue, type SchemaValidationResult, type PromptSchemaOverrides, } from './argument-schema.js';
export { ChainBlueprintResolver } from './chain-blueprint-resolver.js';
export { SymbolicCommandBuilder, type PromptLookup, type CollectedGateCriteria, type CollectedNamedGate, } from './symbolic-command-builder.js';
export { ContextResolver, createContextResolver, type ContextResolution, type ContextProvider, type ContextSource, type ContextAggregationOptions, } from '../context/context-resolver.js';
export type { PromptData } from '../../../shared/types/index.js';
export type { PromptArgument } from '../../../shared/types/index.js';
export type { ConvertedPrompt } from '../types.js';
export type { ValidationResult, ValidationError, ValidationWarning } from '../types.js';
import { ArgumentParser } from './argument-parser.js';
import { UnifiedCommandParser } from './command-parser.js';
import { Logger } from '../../../infra/logging/index.js';
import { ContextResolver } from '../context/context-resolver.js';
/**
 * Complete parsing system with all components
 */
export interface ParsingSystem {
    commandParser: UnifiedCommandParser;
    argumentParser: ArgumentParser;
    contextResolver: ContextResolver;
    /**
     * Update the set of registered framework IDs for quote-aware @framework detection.
     * Call this when FrameworkManager becomes available.
     */
    updateRegisteredFrameworkIds(frameworkIds: Set<string>): void;
}
/**
 * Factory function to create complete parsing system
 *
 * Creates a fully configured parsing system with:
 * - Unified command parser with multi-strategy support
 * - Argument processor with validation and type coercion
 * - Context resolver with intelligent fallbacks
 *
 * @param logger Logger instance for system-wide logging
 * @param registeredFrameworkIds Optional set of registered framework IDs (uppercase).
 *   When provided, only @framework operators matching registered IDs are detected.
 *   Unregistered @word patterns (like @docs/, @mention) are silently skipped.
 * @returns Complete parsing system ready for use
 */
export declare function createParsingSystem(logger: Logger, registeredFrameworkIds?: Set<string>): ParsingSystem;
