/**
 * Consolidated Type Index for MCP Prompts Server
 *
 * This module serves as the central type export hub, importing from domain-specific
 * type files and re-exporting them for easy consumption. Types are now organized
 * by domain for better maintainability and reduced duplication.
 *
 * Architecture: Domain-specific types -> This index -> Consumer modules
 */
import type { StateStoreOptions } from './persistence.js';
export type { StateStoreOptions, StateStore, DatabasePort, ToolIndexEntry } from './persistence.js';
export type { McpToolRequest } from './execution.js';
export type { ConfigManager } from './config-manager.js';
export * from './metrics.js';
export * from './injection.js';
export { type ChainSession, type ChainSessionLifecycle, type ChainSessionLookupOptions, type ChainSessionService, type ChainSessionSummary, type GateReviewOutcomeUpdate, type ParsedCommandSnapshot, type PersistedChainRunRegistry, type SessionBlueprint, } from './chain-session.js';
export { StepState, type StepMetadata, type GateReviewHistoryEntry, type GateReviewExecutionContext, type GateReviewPrompt, type PendingGateReview, type FormatterExecutionContext, type ChainState, } from './chain-execution.js';
import type { ConfirmationRequired, ExecutionModeFilterResult, LoadedScriptTool, ScriptExecutionRequest, ScriptExecutionResult, ToolDetectionMatch } from './automation.js';
import type { ContentAnalysisResult } from './core-config.js';
export type { AdvancedConfig, AnalysisConfig, BaseMessageContent, ChainSessionConfig, Config, ExecutionConfig, FrameworkInjectionConfig, FrameworksConfig, LLMIntegrationConfig, LLMProvider, LoggingConfig, Message, MessageContent, MessageRole, MethodologiesConfig, PromptsConfig, ResourcesConfig, SemanticAnalysisConfig, ServerConfig, TextMessageContent, ToolDescriptionsOptions, TransportMode, VerificationConfig, VersioningConfig, ContentAnalysisResult, ExecutionStrategyType, ExecutionModifier, ExecutionModifiers, ExecutionPlan, GateSystemSettings, ClientFamily, DelegationProfile, IdentityLaunchDefaults, IdentityPolicyMode, TelemetryMode, TelemetryAttributePolicy, TelemetryConfig, } from './core-config.js';
export { DEFAULT_VERSIONING_CONFIG, DEFAULT_TELEMETRY_CONFIG } from './core-config.js';
export type { RequestClientProfile, RequestClientProfileSource, RequestIdentity, RequestIdentityContext, RequestIdentityLaunchProfile, RequestIdentityProvenance, RequestIdentitySource, RequestIdentityTransport, } from './request-identity.js';
/**
 * Prompt argument definition (cross-layer contract type).
 */
export interface PromptArgument {
    /** Name of the argument */
    name: string;
    /** Optional description of the argument */
    description?: string;
    /** Whether this argument is required */
    required: boolean;
    /** Type of the argument value */
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    /** Default value if not provided */
    defaultValue?: string | number | boolean | null | object | Array<any>;
    /** Validation rules for the argument */
    validation?: {
        /** Regex pattern for string validation */
        pattern?: string;
        /** Minimum length for strings */
        minLength?: number;
        /** Maximum length for strings */
        maxLength?: number;
        /**
         * @deprecated Removed in v3.0.0 - LLM handles semantic variation better than strict enums.
         */
        allowedValues?: Array<string | number | boolean>;
    };
}
/**
 * Chain step execution result (cross-layer contract type).
 */
export interface ChainStepResult {
    result: string;
    metadata: {
        startTime: number;
        endTime: number;
        duration: number;
        status: 'completed' | 'failed' | 'skipped';
        error?: string;
    };
}
export { type GateSystemSettings as GatesConfig } from './core-config.js';
/**
 * Gate evaluation result (lightweight contract type for cross-layer use)
 */
export interface GateEvaluationResultContract {
    requirementId: string;
    passed: boolean;
    score?: number;
    message?: string;
    details?: unknown;
}
/**
 * Gate requirement (lightweight contract type for cross-layer use)
 */
export interface GateRequirementContract {
    type: string;
    criteria: unknown;
    weight?: number;
    required?: boolean;
}
/**
 * Gate status information
 */
export interface GateStatus {
    gateId: string;
    passed: boolean;
    requirements: GateRequirementContract[];
    evaluationResults: GateEvaluationResultContract[];
    timestamp: number;
    retryCount?: number;
}
/**
 * Validation result (lightweight contract type for cross-layer use)
 */
export interface ValidationResultContract {
    valid: boolean;
    passed?: boolean;
    gateId?: string;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
        suggestion?: string;
    }>;
}
/**
 * Step result with gate information
 */
export interface StepResult {
    content: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    timestamp: number;
    validationResults?: ValidationResultContract[];
    gateResults?: GateStatus[];
    metadata?: Record<string, string | number | boolean | null>;
}
export interface ConversationHistoryItem {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    isProcessedTemplate?: boolean;
}
export interface ApiResponse {
    success: boolean;
    message: string;
    data?: unknown;
}
export interface ToolResponse {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
    structuredContent?: Record<string, any>;
}
export interface ToolParameter {
    description?: string;
    examples?: string[];
}
export interface ToolDescription {
    description: string;
    parameters?: Record<string, ToolParameter | string>;
    shortDescription?: string;
    category?: string;
    frameworkAware?: {
        enabled?: string;
        disabled?: string;
        parametersEnabled?: Record<string, ToolParameter | string>;
        parametersDisabled?: Record<string, ToolParameter | string>;
        methodologies?: Record<string, string>;
        methodologyParameters?: Record<string, Record<string, ToolParameter | string>>;
    };
}
export interface ToolDescriptionsConfig {
    version: string;
    lastUpdated?: string;
    tools: Record<string, ToolDescription>;
    activeFramework?: string;
    activeMethodology?: string;
    generatedFrom?: 'fallback' | 'legacy' | 'defaults' | string;
    generatedAt?: string;
}
export interface ServerRefreshOptions {
    restart?: boolean;
    reason?: string;
}
export interface ServerState {
    isStarted: boolean;
    transport: string;
    port?: number;
    startTime: number;
}
export interface FileOperation {
    (): Promise<boolean>;
}
export interface ModificationResult {
    success: boolean;
    message: string;
}
export interface ExpressRequest {
    body: any;
    params: Record<string, string>;
    headers: Record<string, string>;
    ip: string;
    method: string;
    url: string;
}
export interface ExpressResponse {
    json: (data: any) => void;
    status: (code: number) => ExpressResponse;
    send: (data: any) => void;
    setHeader: (name: string, value: string) => void;
    end: () => void;
    sendStatus: (code: number) => void;
    on: (event: string, callback: () => void) => void;
}
export interface ExecutionState {
    type: 'single' | 'chain';
    promptId: string;
    status: 'pending' | 'running' | 'waiting_gate' | 'completed' | 'failed' | 'retrying';
    currentStep?: number;
    totalSteps?: number;
    gates: GateStatus[];
    results: Record<string, string | ChainStepResult>;
    metadata: {
        startTime: number;
        endTime?: number;
        stepConfirmation?: boolean;
        gateValidation?: boolean;
        sessionId?: string;
    };
}
export interface EnhancedChainExecutionState {
    chainId: string;
    currentStepIndex: number;
    totalSteps: number;
    startTime: number;
    status: 'pending' | 'running' | 'waiting_gate' | 'completed' | 'failed';
    stepResults: Record<string, StepResult>;
    gates: Record<string, GateStatus>;
    executionMode: 'auto' | 'chain';
    gateValidation: boolean;
    stepConfirmation: boolean;
}
export interface ChainExecutionProgress {
    chainId: string;
    chainName: string;
    currentStep: number;
    totalSteps: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
    steps: ChainStepProgress[];
    startTime: number;
    endTime?: number;
    duration?: number;
    errorCount: number;
    autoExecute: boolean;
}
export interface ChainStepProgress {
    stepIndex: number;
    stepName: string;
    promptId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: number;
    endTime?: number;
    duration?: number;
    result?: string;
    error?: string;
    gateResults?: GateStatus[];
}
export interface AutoExecutionConfig {
    enabled: boolean;
    stepConfirmation: boolean;
    gateValidation: boolean;
    pauseOnError: boolean;
    maxRetries: number;
    retryDelay: number;
}
/**
 * Logger interface for dependency injection across all layers.
 */
export interface Logger {
    info: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
}
export declare const MAX_HISTORY_SIZE = 100;
export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}
export declare enum TransportType {
    STDIO = "stdio",
    SSE = "sse"
}
export declare enum StepStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    SKIPPED = "skipped"
}
/**
 * Standardized error codes for MCP tool responses.
 * Enables programmatic error routing in client hooks.
 */
export declare enum McpErrorCode {
    /** Gate verdict is required to continue chain execution */
    GATE_VERDICT_REQUIRED = "GATE_VERDICT_REQUIRED",
    /** Maximum gate retry attempts have been exceeded */
    GATE_RETRY_EXCEEDED = "GATE_RETRY_EXCEEDED",
    /** Response content blocked due to gate failure with blockResponseOnFail */
    GATE_RESPONSE_BLOCKED = "GATE_RESPONSE_BLOCKED",
    /** Chain session not found for the provided chain_id */
    CHAIN_SESSION_NOT_FOUND = "CHAIN_SESSION_NOT_FOUND",
    /** Framework is disabled but framework-specific operation was requested */
    FRAMEWORK_DISABLED = "FRAMEWORK_DISABLED",
    /** Prompt not found in registry */
    PROMPT_NOT_FOUND = "PROMPT_NOT_FOUND",
    /** Invalid gate verdict format */
    INVALID_GATE_VERDICT = "INVALID_GATE_VERDICT"
}
/**
 * Gate retry information for structured responses.
 * Provides clients with retry state for implementing retry logic.
 */
export interface GateRetryInfo {
    /** Maximum number of retry attempts allowed */
    maxAttempts: number;
    /** Current attempt number (1-indexed) */
    currentAttempt: number;
    /** Whether more retries are allowed */
    retryAllowed: boolean;
}
/**
 * Extended gate validation info for structured responses.
 * Provides explicit fields for client hook consumption.
 */
export interface GateValidationInfo {
    /** Whether gate validation is enabled */
    enabled: boolean;
    /** Whether all gates passed */
    passed: boolean;
    /** Total number of gates evaluated */
    totalGates: number;
    /** Gates that failed with reasons */
    failedGates: Array<{
        id: string;
        reason: string;
    }>;
    /** Gates that passed (optional, for debugging) */
    passedGates?: Array<{
        id: string;
    }>;
    /** Gate evaluation execution time in ms */
    executionTime: number;
    /** Legacy retry count field */
    retryCount?: number;
    /** Gate IDs awaiting verdict from client */
    pendingGateIds: string[];
    /** Whether client must provide gate_verdict to proceed */
    requiresGateVerdict: boolean;
    /** Whether response content was suppressed due to gate failure */
    responseBlocked: boolean;
    /** Detailed retry information for client retry logic */
    gateRetryInfo: GateRetryInfo;
}
/**
 * Minimal API manager interface for HTTP server bootstrapping.
 * infra/http imports this interface; mcp/http provides the concrete class.
 */
export interface ApiRouterPort {
    /** Create an Express-compatible application for HTTP transport */
    createApp(): any;
}
/** Source of a resource change event */
export type ChangeSource = 'filesystem' | 'mcp-tool' | 'external';
/** Type of tracked resource */
export type TrackedResourceType = 'prompt' | 'gate';
export * from './automation.js';
/**
 * Gate definition for prompt-level gate configuration (cross-layer contract type).
 */
export interface GateDefinition {
    id: string;
    name: string;
    type: 'validation' | 'guidance';
    requirements: any[];
    failureAction: 'stop' | 'retry' | 'skip' | 'rollback';
    retryPolicy?: {
        maxRetries: number;
        retryDelay: number;
    };
}
/**
 * Semantic content analyzer interface (engine/ contract).
 * Concrete: modules/semantic/configurable-semantic-analyzer.ts ContentAnalyzer
 */
export interface ContentAnalyzerPort {
    analyzePrompt(prompt: unknown): Promise<ContentAnalysisResult>;
    isLLMEnabled(): boolean;
}
/**
 * Style manager interface (engine/ contract).
 * Concrete: modules/formatting/style-manager.ts StyleManager
 */
export interface StyleManagerPort {
    listStyles(): string[];
    getStyle(styleId: string): {
        name?: string;
        description?: string;
    } | undefined;
    getStyleGuidance(styleId: string): string | null;
}
/**
 * Tool detection service interface (engine/ contract).
 * Concrete: modules/automation/detection/tool-detection-service.ts ToolDetectionService
 */
export interface ToolDetectionServicePort {
    detectTools(input: string, args: Record<string, unknown>, availableTools: LoadedScriptTool[]): ToolDetectionMatch[];
}
/**
 * Execution mode service interface (engine/ contract).
 * Concrete: modules/automation/execution/execution-mode-service.ts ExecutionModeService
 */
export interface ExecutionModeServicePort {
    filterByExecutionMode(matches: ToolDetectionMatch[], tools: LoadedScriptTool[], promptId: string): ExecutionModeFilterResult;
    buildConfirmationResponse(filterResult: ExecutionModeFilterResult, promptId: string): ConfirmationRequired;
    logManualOverride(toolId: string): void;
}
/**
 * Script executor interface (engine/ contract).
 * Concrete: modules/automation/execution/script-executor.ts ScriptExecutor
 */
export interface ScriptExecutorPort {
    execute(request: ScriptExecutionRequest, tool: LoadedScriptTool): Promise<ScriptExecutionResult>;
}
/**
 * Response formatter interface (engine/ contract).
 * Concrete: mcp/tools/prompt-engine/processors/response-formatter.ts ResponseFormatter
 */
export interface ResponseFormatterPort {
    formatPromptEngineResponse(response: unknown, executionContext?: unknown, options?: unknown, gateResults?: unknown): ToolResponse;
}
/**
 * Chain management service interface (engine/ contract).
 * Concrete: mcp/tools/prompt-engine/core/chain-management.ts ChainSessionRouter
 */
export interface ChainSessionRouterPort {
    tryHandleCommand(command: string, scope?: StateStoreOptions): Promise<ToolResponse | null>;
}
/**
 * Telemetry runtime interface (engine/ contract).
 * Provides read-only telemetry status for layers that don't need tracer access.
 * Concrete: infra/observability/telemetry/runtime.ts TelemetryRuntimeImpl
 */
export interface TelemetryRuntimePort {
    /** Whether telemetry is active and collecting. */
    isEnabled(): boolean;
    /** Get runtime status snapshot (enabled, mode, endpoint, sampling). */
    getStatus(): {
        enabled: boolean;
        mode: string;
        exporterEndpoint: string;
        samplingRate: number;
    };
}
/**
 * Lightweight hook execution context for pipeline emissions.
 * Compatible with HookExecutionContext in infra/hooks/.
 */
export interface PipelineHookContext {
    readonly executionId: string;
    readonly executionType: 'single' | 'chain';
    readonly chainId?: string;
    readonly currentStep?: number;
    readonly frameworkEnabled: boolean;
    readonly frameworkId?: string;
}
/**
 * Hook registry interface (mcp/ contract).
 * mcp/ stores and forwards to engine/ pipeline stages.
 * Concrete: infra/hooks/hook-registry.ts HookRegistry
 */
export interface HookRegistryPort {
    getCounts(): {
        pipeline: number;
        gate: number;
        chain: number;
    };
    clearAll(): void;
    emitBeforeStage(stage: string, context: PipelineHookContext): Promise<void>;
    emitAfterStage(stage: string, context: PipelineHookContext): Promise<void>;
    emitStageError(stage: string, error: Error, context: PipelineHookContext): Promise<void>;
}
/**
 * MCP notification emitter interface (mcp/ contract).
 * mcp/ stores and forwards to engine/ pipeline stages.
 * Concrete: infra/observability/notifications/mcp-notification-emitter.ts McpNotificationEmitter
 */
export interface McpNotificationEmitterPort {
    canSend(): boolean;
    setServer(server: {
        notification(params: {
            method: string;
            params?: Record<string, unknown>;
        }): void;
    }): void;
}
/**
 * Hot reload event types
 */
export type HotReloadEventType = 'prompt_changed' | 'config_changed' | 'category_changed' | 'methodology_changed' | 'gate_changed' | 'reload_required';
/**
 * File change operation types for hot reload events
 */
export type FileChangeOperation = 'added' | 'modified' | 'removed';
/**
 * Hot reload event data
 */
export interface HotReloadEvent {
    type: HotReloadEventType;
    reason: string;
    affectedFiles: string[];
    category?: string;
    /** Methodology ID for methodology_changed events */
    methodologyId?: string;
    /** Gate ID for gate_changed events */
    gateId?: string;
    /** The type of file change (added, modified, removed) */
    changeType?: FileChangeOperation;
    timestamp: number;
    requiresFullReload: boolean;
}
/**
 * Gate configuration for prompts (YAML format)
 */
export interface PromptGateConfiguration {
    /** Gate IDs to include */
    include?: string[];
    /** Gate IDs to exclude */
    exclude?: string[];
    /** Whether to include framework gates (default: true) */
    framework_gates?: boolean;
    /** Inline gate definitions */
    inline_gate_definitions?: Array<{
        id?: string;
        name: string;
        type: string;
        scope?: 'execution' | 'session' | 'chain' | 'step';
        description?: string;
        guidance?: string;
        pass_criteria?: any[];
        expires_at?: number;
        source?: 'manual' | 'automatic' | 'analysis';
        context?: Record<string, any>;
    }>;
}
/**
 * Chain step definition (cross-layer contract type).
 *
 * Defines a single step in a chain workflow with support for:
 * - inputMapping: Map previous step results to semantic variable names
 * - outputMapping: Name this step's output for downstream reference
 * - retries: Per-step retry count for resilient chains
 */
export interface ChainStep {
    /** ID of the prompt to execute in this step */
    promptId: string;
    /** Name/identifier of this step */
    stepName: string;
    /** Map step results to semantic names (e.g., { "research": "step1_result" }) */
    inputMapping?: Record<string, string>;
    /** Name this step's output for downstream steps */
    outputMapping?: Record<string, string>;
    /** Number of retry attempts on failure (default: 0) */
    retries?: number;
    /** Client-agnostic capability hint for delegation model selection (per-step override) */
    subagentModel?: 'heavy' | 'standard' | 'fast';
}
/**
 * Complete prompt metadata structure (cross-layer contract type).
 */
export interface PromptData {
    /** Unique identifier for the prompt */
    id: string;
    /** Display name for the prompt */
    name: string;
    /** Category this prompt belongs to */
    category: string;
    /** Description of the prompt */
    description: string;
    /** Path to the prompt file */
    file: string;
    /** Arguments accepted by this prompt */
    arguments: PromptArgument[];
    /** Optional gates for validation (legacy format) */
    gates?: GateDefinition[];
    /** Gate configuration (YAML format) */
    gateConfiguration?: PromptGateConfiguration;
    /** Chain steps for multi-step execution (YAML format) */
    chainSteps?: ChainStep[];
    /** Whether to register this prompt with MCP. Overrides category default. */
    registerWithMcp?: boolean;
    /** Script tool IDs declared by this prompt (references tools/{id}/ directories) */
    tools?: string[];
    /** Client-agnostic capability hint for delegation model selection */
    subagentModel?: 'heavy' | 'standard' | 'fast';
}
