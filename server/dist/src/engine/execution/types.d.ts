/**
 * Execution System Type Definitions
 *
 * Contains all types related to prompt execution, strategies, contexts, and results.
 * This includes execution strategies, converted prompts, contexts, and chain execution.
 */
import type { CustomCheck, GateScope, GateSpecification, TemporaryGateInput } from '../../shared/types/execution.js';
import type { ChainStep, ExecutionModifier, ExecutionModifiers, ExecutionPlan, ExecutionStrategyType, GateDefinition, LoadedScriptTool, PromptArgument } from '../../shared/types/index.js';
export type { CustomCheck, GateScope, GateSpecification, TemporaryGateInput };
export type { ExecutionModifier, ExecutionModifiers, ExecutionPlan, ExecutionStrategyType };
/**
 * Execution types for semantic analysis
 */
export type ExecutionType = 'single' | 'chain' | 'auto';
export type { ChainStep };
/**
 * Comprehensive converted prompt for execution context
 * Consolidates all previous ConvertedPrompt definitions
 */
export interface ConvertedPrompt {
    id: string;
    name: string;
    description: string;
    category: string;
    systemMessage?: string;
    userMessageTemplate: string;
    arguments: PromptArgument[];
    chainSteps?: ChainStep[];
    gates?: GateDefinition[];
    /** Whether to register this prompt with MCP. Resolved from prompt/category/global defaults. */
    registerWithMcp?: boolean;
    gateConfiguration?: {
        include?: string[];
        exclude?: string[];
        framework_gates?: boolean;
        inline_gate_definitions?: TemporaryGateDefinition[];
    };
    enhancedGateConfiguration?: EnhancedGateConfiguration;
    executionModifiers?: ExecutionModifiers;
    requiresExecution?: boolean;
    /** Loaded script tools for this prompt (populated by loader when tools declared in prompt.yaml) */
    scriptTools?: LoadedScriptTool[];
    /** Raw tool IDs from prompt definition (before loading) */
    tools?: string[];
    /** Directory path for prompt-local script resolution (populated during conversion) */
    promptDir?: string;
    /** When true, all chain steps for this prompt are delegated to sub-agents */
    delegation?: boolean;
    /** Default agent type for delegation (overridden by step-level agentType) */
    delegationAgent?: string;
    /** Client-agnostic capability hint for delegation model selection */
    subagentModel?: 'heavy' | 'standard' | 'fast';
}
/**
 * Base execution context for all strategies
 * Provides common execution metadata across all strategy types
 */
export interface BaseExecutionContext {
    /** Unique execution identifier */
    id: string;
    /** Strategy type being used */
    type: ExecutionStrategyType;
    /** Execution start timestamp */
    startTime: number;
    /** Input parameters for execution */
    inputs: Record<string, string | number | boolean | null>;
    /** Strategy-specific and user options */
    options: Record<string, string | number | boolean | null | unknown[]>;
}
/**
 * Chain execution result structure
 */
export interface ChainExecutionResult {
    results: Record<string, string>;
    messages: {
        role: 'user' | 'assistant';
        content: {
            type: 'text';
            text: string;
        };
    }[];
}
/**
 * Unified execution result interface
 * Standardizes results across all execution strategies
 */
export interface UnifiedExecutionResult {
    /** Unique execution identifier */
    executionId: string;
    /** Strategy type that was used */
    type: ExecutionStrategyType;
    /** Final execution status */
    status: 'completed' | 'failed' | 'timeout' | 'cancelled';
    /** Execution start timestamp */
    startTime: number;
    /** Execution end timestamp */
    endTime: number;
    /** Strategy-specific result content */
    result: string | ChainExecutionResult;
    /** Error information if execution failed */
    error?: {
        message: string;
        code?: string;
        context?: Record<string, unknown>;
    };
}
/**
 * Base execution strategy interface
 * Defines the contract that all execution strategies must implement
 */
export interface ExecutionStrategy {
    /** Strategy type identifier */
    readonly type: ExecutionStrategyType;
    /**
     * Execute using this strategy
     * @param context Base execution context
     * @param promptId ID of prompt to execute
     * @param args Execution arguments
     */
    execute(context: BaseExecutionContext, promptId: string, args: Record<string, string | number | boolean | null>): Promise<UnifiedExecutionResult>;
    /**
     * Validate if this strategy can handle the given prompt
     * @param prompt The prompt to validate
     */
    canHandle(prompt: ConvertedPrompt): boolean;
    /**
     * Get strategy-specific default options
     */
    getOptions(): Record<string, string | number | boolean | null | unknown[]>;
}
/**
 * Execution engine statistics
 * Comprehensive performance and usage metrics
 */
export interface ExecutionStats {
    /** Total number of executions */
    totalExecutions: number;
    /** Number of prompt strategy executions */
    promptExecutions: number;
    /** Number of chain strategy executions */
    chainExecutions: number;
    /** Number of failed executions */
    failedExecutions: number;
    /** Average execution time in milliseconds */
    averageExecutionTime: number;
    /** Currently active executions */
    activeExecutions: number;
    /** Conversation manager statistics */
    conversationStats: any;
}
/**
 * Performance metrics for ExecutionEngine monitoring
 * Provides detailed performance and health metrics
 */
export interface PerformanceMetrics {
    /** Strategy cache hit rate (0.0 to 1.0) */
    cacheHitRate: number;
    /** Memory usage information */
    memoryUsage: {
        /** Size of strategy selection cache */
        strategyCacheSize: number;
        /** Number of stored execution times */
        executionTimesSize: number;
        /** Number of currently active executions */
        activeExecutionsSize: number;
    };
    /** Execution health metrics */
    executionHealth: {
        /** Success rate (0.0 to 1.0) */
        successRate: number;
        /** Average execution time in milliseconds */
        averageTime: number;
        /** Number of recent executions tracked */
        recentExecutions: number;
    };
}
/**
 * Chain execution state
 */
export interface ChainExecutionState {
    chainId: string;
    currentStepIndex: number;
    totalSteps: number;
    stepResults: Record<string, string>;
    startTime: number;
}
/**
 * Template processing context
 */
export interface TemplateContext {
    specialContext?: Record<string, string>;
}
/**
 * Validation error detail structure
 */
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    suggestion?: string;
    example?: string;
}
/**
 * Validation warning structure
 */
export interface ValidationWarning {
    field: string;
    message: string;
    suggestion?: string;
}
/**
 * Unified validation result structure
 * Supports both simple validation and comprehensive gate validation
 */
export interface ValidationResult {
    /** Whether validation passed (supports both 'valid' and 'passed' patterns) */
    valid: boolean;
    /** Alternative field name for gate validation compatibility */
    passed?: boolean;
    /** Detailed validation errors */
    errors?: ValidationError[];
    /** Validation warnings */
    warnings?: ValidationWarning[];
    /** Sanitized arguments for simple validation */
    sanitizedArgs?: Record<string, string | number | boolean | null>;
    /** Gate that was validated (for gate validation) */
    gateId?: string;
    /** Individual check results (for comprehensive validation) */
    checks?: ValidationCheck[];
    /** Hints for improvement on failure (for gate validation) */
    retryHints?: string[];
    /** Validation metadata (for comprehensive validation) */
    metadata?: {
        validationTime: number;
        checksPerformed: number;
        llmValidationUsed: boolean;
    };
    /** Argument name (for argument validation) */
    argumentName?: string;
    /** Original value before processing */
    originalValue?: unknown;
    /** Processed value after validation */
    processedValue?: string | number | boolean | null;
    /** Applied validation rules */
    appliedRules?: string[];
}
/**
 * Individual validation check result (used in comprehensive validation)
 */
export interface ValidationCheck {
    /** Type of check performed */
    type: string;
    /** Did this check pass */
    passed: boolean;
    /** Score if applicable (0.0-1.0) */
    score?: number;
    /** Details about the check */
    message: string;
    /** Additional context */
    details?: Record<string, any>;
}
/**
 * Enhanced gate configuration supporting inline gate definitions
 * Extends basic gate configuration with inline gate support
 */
export interface EnhancedGateConfiguration {
    /** Gates to explicitly include */
    include?: string[];
    /** Gates to explicitly exclude */
    exclude?: string[];
    /** Whether to include framework-based gates (default: true) */
    framework_gates?: boolean;
    /** Inline gate definitions for this execution */
    inline_gate_definitions?: TemporaryGateDefinition[];
}
/**
 * Temporary gate definition for enhanced configuration
 */
export interface TemporaryGateDefinition {
    /** Unique identifier (will be auto-generated if not provided) */
    id?: string;
    /** Human-readable name */
    name: string;
    /** Gate type: 'validation' runs checks, 'guidance' only provides instructional text */
    type: 'validation' | 'guidance';
    /** Scope of the temporary gate */
    scope: 'execution' | 'session' | 'chain' | 'step';
    /** Description of what this gate checks/guides */
    description: string;
    /** Guidance text injected into prompts */
    guidance: string;
    /** Pass/fail criteria for validation gates */
    pass_criteria?: ValidationCheck[];
    /** Expiration timestamp (optional) */
    expires_at?: number;
    /** Source of gate creation */
    source?: 'manual' | 'automatic' | 'analysis';
    /** Additional context for gate creation */
    context?: Record<string, any>;
}
export type { GateReviewExecutionContext, GateReviewPrompt, } from '../../shared/types/chain-execution.js';
