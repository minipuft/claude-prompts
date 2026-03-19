/**
 * Unified Command Parser
 *
 * Robust multi-strategy command parsing system that replaces fragile regex-based parsing
 * with intelligent format detection, fallback strategies, and comprehensive validation.
 *
 * Features:
 * - Multi-format detection (simple >>prompt, JSON objects, structured commands)
 * - Fallback parsing strategies with confidence scoring
 * - Comprehensive error messages with suggestions
 * - Command validation and sanitization
 */
import { Logger } from '../../../infra/logging/index.js';
import type { ConvertedPrompt } from '../types.js';
import type { CommandParseResultBase } from './types/command-parse-types.js';
import type { OperatorDetectionResult, SymbolicExecutionPlan } from './types/operator-types.js';
export type CommandParseResult = CommandParseResultBase<OperatorDetectionResult, SymbolicExecutionPlan>;
/**
 * Unified Command Parser Class
 */
export declare class UnifiedCommandParser {
    private logger;
    private strategies;
    private symbolicParser;
    private registeredFrameworkIds;
    private stats;
    /**
     * @param logger - Logger instance
     * @param registeredFrameworkIds - Optional set of registered framework IDs (uppercase).
     *   When provided, only @framework operators matching registered IDs are detected.
     *   Unregistered @word patterns are silently skipped (treated as literal text).
     */
    constructor(logger: Logger, registeredFrameworkIds?: Set<string>);
    /**
     * Update the set of registered framework IDs.
     * This allows late binding when FrameworkManager becomes available after construction.
     * @param frameworkIds Set of framework IDs (will be normalized to uppercase)
     */
    updateRegisteredFrameworkIds(frameworkIds: Set<string>): void;
    /**
     * Extracts a single execution modifier prefix (e.g., %clean) from the command.
     * Returns the command with the modifier stripped and the normalized modifier value.
     */
    private extractModifier;
    private buildModifiers;
    /**
     * Parse command string using multi-strategy approach
     */
    parseCommand(command: string, availablePrompts: ConvertedPrompt[]): Promise<CommandParseResult>;
    private applyCommandType;
    /**
     * Initialize parsing strategies (STREAMLINED: 2 core strategies)
     */
    private initializeStrategies;
    private createSymbolicCommandStrategy;
    /**
     * Simple command strategy: >>prompt_name arguments (ENHANCED: More AI-friendly)
     */
    private createSimpleCommandStrategy;
    /**
     * JSON command strategy: {"command": ">>prompt", "args": {...}}
     */
    private createJsonCommandStrategy;
    /**
     * Validate that the prompt ID exists in available prompts
     */
    private validatePromptExists;
    /**
     * Check if command is a built-in system command
     */
    private isBuiltinCommand;
    /**
     * Generate helpful prompt suggestions using multi-factor scoring
     * Considers: prefix matches, word overlap, and Levenshtein distance
     */
    private generatePromptSuggestions;
    /**
     * Simple Levenshtein distance calculation
     */
    private levenshteinDistance;
    /**
     * Generate concise error message for parsing failures
     */
    private generateHelpfulError;
    /**
     * Update strategy usage statistics
     */
    private updateStrategyStats;
    /**
     * Update confidence statistics
     */
    private updateConfidenceStats;
    /**
     * Get parsing statistics for monitoring
     */
    getStats(): typeof this.stats;
    /**
     * Reset statistics (useful for testing or fresh starts)
     */
    resetStats(): void;
}
/**
 * Factory function to create unified command parser
 * @param logger - Logger instance
 * @param registeredFrameworkIds - Optional set of registered framework IDs (uppercase).
 *   When provided, only @framework operators matching registered IDs are detected.
 */
export declare function createUnifiedCommandParser(logger: Logger, registeredFrameworkIds?: Set<string>): UnifiedCommandParser;
