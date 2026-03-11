/**
 * HookRegistry - Server-side hook system for Claude Prompts MCP
 *
 * Provides extensible hooks for pipeline stages, gate evaluation, and chain execution.
 * Enables custom logic injection without modifying core pipeline stages.
 *
 * Architecture:
 * - Hooks are registered by consumers (internal services or extensions)
 * - Pipeline stages emit events at key points
 * - Registered hooks are invoked in registration order
 * - Errors in hooks are logged but don't halt pipeline execution
 */
import { EventEmitter } from 'events';
import type { GateDefinition, HookRegistryPort, Logger } from '../../shared/types/index.js';
/**
 * Minimal execution context for hook callbacks.
 * Provides read-only access to execution state.
 */
export interface HookExecutionContext {
    /** Unique ID for this execution */
    readonly executionId: string;
    /** Execution type (single prompt or chain) */
    readonly executionType: 'single' | 'chain';
    /** Chain ID if chain execution */
    readonly chainId?: string;
    /** Current step number if chain execution */
    readonly currentStep?: number;
    /** Whether framework enhancement is enabled */
    readonly frameworkEnabled: boolean;
    /** Active framework ID if any */
    readonly frameworkId?: string;
}
/**
 * Result from gate evaluation for hook callbacks.
 */
export interface GateEvaluationResult {
    /** Whether the gate passed */
    readonly passed: boolean;
    /** Reason for pass/fail */
    readonly reason?: string;
    /** Whether this gate has blockResponseOnFail enabled */
    readonly blocksResponse: boolean;
}
/**
 * Pipeline hooks for intercepting stage execution.
 * All methods are optional - implement only what you need.
 */
export interface PipelineHooks {
    /**
     * Called before a pipeline stage executes.
     * Can be used for logging, metrics, or pre-processing.
     */
    onBeforeStage?(stage: string, context: HookExecutionContext): Promise<void>;
    /**
     * Called after a pipeline stage completes successfully.
     * Can be used for logging, metrics, or post-processing.
     */
    onAfterStage?(stage: string, context: HookExecutionContext): Promise<void>;
    /**
     * Called when a pipeline stage throws an error.
     * The error will still propagate after hooks are called.
     */
    onStageError?(stage: string, error: Error, context: HookExecutionContext): Promise<void>;
}
/**
 * Gate hooks for responding to gate evaluation events.
 * All methods are optional - implement only what you need.
 */
export interface GateHooks {
    /**
     * Called after a gate is evaluated (pass or fail).
     */
    onGateEvaluated?(gate: GateDefinition, result: GateEvaluationResult, context: HookExecutionContext): Promise<void>;
    /**
     * Called when a gate fails evaluation.
     */
    onGateFailed?(gate: GateDefinition, reason: string, context: HookExecutionContext): Promise<void>;
    /**
     * Called when all retry attempts for a gate are exhausted.
     */
    onRetryExhausted?(gateIds: string[], chainId: string, context: HookExecutionContext): Promise<void>;
    /**
     * Called when response content is blocked due to gate failure.
     */
    onResponseBlocked?(gateIds: string[], context: HookExecutionContext): Promise<void>;
}
/**
 * Chain hooks for responding to chain execution events.
 * All methods are optional - implement only what you need.
 */
export interface ChainHooks {
    /**
     * Called when a chain step completes successfully.
     */
    onStepComplete?(chainId: string, stepIndex: number, output: string, context: HookExecutionContext): Promise<void>;
    /**
     * Called when an entire chain completes successfully.
     */
    onChainComplete?(chainId: string, context: HookExecutionContext): Promise<void>;
    /**
     * Called when a chain fails (unrecoverable error).
     */
    onChainFailed?(chainId: string, reason: string, context: HookExecutionContext): Promise<void>;
}
/**
 * HookRegistry manages server-side hooks for the execution pipeline.
 *
 * Usage:
 * ```typescript
 * const registry = new HookRegistry(logger);
 *
 * // Register hooks
 * registry.registerPipelineHooks({
 *   onBeforeStage: async (stage, ctx) => console.log(`Starting ${stage}`),
 *   onAfterStage: async (stage, ctx) => console.log(`Finished ${stage}`),
 * });
 *
 * // In pipeline stages
 * await registry.emitBeforeStage('ResponseFormatting', context);
 * // ... stage logic ...
 * await registry.emitAfterStage('ResponseFormatting', context);
 * ```
 */
export declare class HookRegistry extends EventEmitter implements HookRegistryPort {
    private readonly pipelineHooks;
    private readonly gateHooks;
    private readonly chainHooks;
    private readonly logger;
    constructor(logger: Logger);
    /**
     * Register pipeline lifecycle hooks.
     */
    registerPipelineHooks(hooks: PipelineHooks): void;
    /**
     * Register gate evaluation hooks.
     */
    registerGateHooks(hooks: GateHooks): void;
    /**
     * Register chain execution hooks.
     */
    registerChainHooks(hooks: ChainHooks): void;
    /**
     * Emit before-stage event to all registered pipeline hooks.
     */
    emitBeforeStage(stage: string, context: HookExecutionContext): Promise<void>;
    /**
     * Emit after-stage event to all registered pipeline hooks.
     */
    emitAfterStage(stage: string, context: HookExecutionContext): Promise<void>;
    /**
     * Emit stage-error event to all registered pipeline hooks.
     */
    emitStageError(stage: string, error: Error, context: HookExecutionContext): Promise<void>;
    /**
     * Emit gate-evaluated event to all registered gate hooks.
     */
    emitGateEvaluated(gate: GateDefinition, result: GateEvaluationResult, context: HookExecutionContext): Promise<void>;
    /**
     * Emit gate-failed event to all registered gate hooks.
     */
    emitGateFailed(gate: GateDefinition, reason: string, context: HookExecutionContext): Promise<void>;
    /**
     * Emit retry-exhausted event to all registered gate hooks.
     */
    emitRetryExhausted(gateIds: string[], chainId: string, context: HookExecutionContext): Promise<void>;
    /**
     * Emit response-blocked event to all registered gate hooks.
     */
    emitResponseBlocked(gateIds: string[], context: HookExecutionContext): Promise<void>;
    /**
     * Emit step-complete event to all registered chain hooks.
     */
    emitStepComplete(chainId: string, stepIndex: number, output: string, context: HookExecutionContext): Promise<void>;
    /**
     * Emit chain-complete event to all registered chain hooks.
     */
    emitChainComplete(chainId: string, context: HookExecutionContext): Promise<void>;
    /**
     * Emit chain-failed event to all registered chain hooks.
     */
    emitChainFailed(chainId: string, reason: string, context: HookExecutionContext): Promise<void>;
    /**
     * Clear all registered hooks (useful for testing).
     */
    clearAll(): void;
    /**
     * Get counts of registered hooks (useful for diagnostics).
     */
    getCounts(): {
        pipeline: number;
        gate: number;
        chain: number;
    };
}
