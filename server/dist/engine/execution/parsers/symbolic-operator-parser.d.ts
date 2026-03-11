import { type OperatorDetectionResult, type SymbolicCommandParseResult, type SymbolicExecutionPlan } from './types/operator-types.js';
import { Logger } from '../../../infra/logging/index.js';
/**
 * Parser responsible for detecting and structuring symbolic command operators.
 *
 * The parser keeps regex-based detection isolated from the unified parser so that
 * the higher-level parsing flow only needs to reason about parsed operator metadata.
 */
export declare class SymbolicCommandParser {
    private readonly logger;
    /**
     * Set of registered framework IDs (normalized to uppercase).
     * Used to validate @framework operators - unregistered IDs are skipped.
     */
    private readonly registeredFrameworkIds;
    /**
     * Operator patterns derived from SSOT registry.
     * Pattern documentation and examples: see mcp-contracts/schemas/operators.json
     *
     * Gate pattern groups: 1=operator, 2=namedColonId, 3=namedColonText, 4=anonQuoted, 5=canonicalOrUnquoted
     */
    private readonly OPERATOR_PATTERNS;
    /**
     * @param logger - Logger instance
     * @param registeredFrameworkIds - Optional set of registered framework IDs (uppercase).
     *   When provided, only @framework operators matching registered IDs are detected.
     *   Unregistered @word patterns are silently skipped (treated as literal text).
     */
    constructor(logger: Logger, registeredFrameworkIds?: Set<string>);
    /**
     * Preprocess command to expand repetition operator.
     * Call this before strategy selection so all strategies see the expanded form.
     *
     * @example ">>prompt *3" → ">>prompt --> >>prompt --> >>prompt"
     */
    preprocessRepetition(command: string): string;
    /**
     * Expand repetition operator into chain syntax.
     *
     * Transforms `>>prompt * 3` into `>>prompt --> >>prompt --> >>prompt`
     * before other operator detection runs.
     *
     * Handles combinations like:
     * - `>>prompt * 3` → `>>prompt --> >>prompt --> >>prompt`
     * - `>>prompt topic:"AI" * 2` → `>>prompt topic:"AI" --> >>prompt topic:"AI"`
     * - `>>step1 * 2 --> >>step2` → `>>step1 --> >>step1 --> >>step2`
     *
     * @returns Object with expandedCommand and optional RepetitionOperator
     */
    private expandRepetition;
    /**
     * Split command by --> delimiter while respecting quoted strings.
     * Used for repetition expansion to find the segment to repeat.
     */
    private splitByChainDelimiter;
    /**
     * Find the position of --> delimiter outside of quoted strings.
     * Returns -1 if no delimiter found outside quotes.
     * Used to separate arguments from chain continuation in repetition expansion.
     */
    private findChainDelimiterOutsideQuotes;
    detectOperators(command: string): OperatorDetectionResult;
    private parseChainOperator;
    /**
     * Clean operators from a chain step string before validation.
     * Strips %modifiers and @framework operators that may appear on individual steps.
     * This allows syntax like: %judge @CAGEERF >>step1 --> %lean @ReACT >>step2
     * Note: Operators apply at execution-level, not per-step. This method only
     * removes them for parsing validation purposes.
     */
    private cleanStepOperators;
    /**
     * Split chain steps by --> and ==> delimiters while respecting quoted string boundaries.
     * Returns metadata about which delimiter preceded each step.
     *
     * - `-->` produces a normal step (delegated: false)
     * - `==>` produces a delegated step (delegated: true) — executed via Task tool sub-agent
     *
     * Handles: >>prompt1 input="test --> quoted" --> prompt2 ==> prompt3
     */
    private splitChainSteps;
    /**
     * Detect a chain delimiter at position i in the command string.
     * Returns 'delegation' for ==>, 'chain' for -->, or null if no delimiter.
     * Checks ==> before --> to prevent gate operator pattern conflict.
     */
    private detectChainDelimiter;
    private parseParallelOperator;
    private parseCriteria;
    /**
     * Parse verify-specific options from command string.
     *
     * Options:
     * - loop:true/false - Enable Stop hook integration for autonomous loops
     * - max:N - Maximum iterations (default 5)
     * - timeout:N - Timeout in seconds (converted to ms internally)
     *
     * Presets (shorthand for common configurations):
     * - :fast     → max:1, timeout:30   (quick feedback during development)
     * - :full     → max:5, timeout:300  (CI-style validation)
     * - :extended → max:10, timeout:600 (long-running test suites)
     *
     * @example :: verify:"npm test" :fast
     * @example :: verify:"npm test" max:3 timeout:60
     * @example :: verify:"npm test" loop:true :full
     */
    private parseVerifyOptions;
    private calculateComplexity;
    generateExecutionPlan(detection: OperatorDetectionResult, basePromptId: string, baseArgs: string): SymbolicExecutionPlan;
    buildParseResult(command: string, operators: OperatorDetectionResult, basePromptId: string, baseArgs: string): SymbolicCommandParseResult;
}
export declare function createSymbolicCommandParser(logger: Logger, registeredFrameworkIds?: Set<string>): SymbolicCommandParser;
