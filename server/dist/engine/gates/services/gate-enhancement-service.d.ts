import type { GateMetricsRecorder } from './gate-metrics-recorder.js';
import type { GateService } from './gate-service-interface.js';
import type { RegisteredGateResult } from './temporary-gate-registrar.js';
import type { Logger } from '../../../infra/logging/index.js';
import type { ExecutionContext } from '../../execution/context/index.js';
import type { ChainStepPrompt } from '../../execution/operators/types.js';
import type { ConvertedPrompt, ExecutionModifiers } from '../../execution/types.js';
/** Narrow provider: returns active framework ID without importing FrameworkManager. */
type ActiveFrameworkIdProvider = () => string | undefined;
import type { GateDefinitionProvider } from '../core/gate-loader.js';
import type { TemporaryGateRegistry } from '../core/temporary-gate-registry.js';
import type { GateManager } from '../gate-manager.js';
import type { GatesConfig } from '../types.js';
/**
 * Discriminated union for gate enhancement contexts.
 */
export interface SinglePromptGateContext {
    readonly type: 'single';
    readonly prompt: ConvertedPrompt;
    readonly inlineGateIds: string[];
}
export interface ChainStepGateContext {
    readonly type: 'chain';
    readonly steps: ChainStepPrompt[];
}
export type GateEnhancementContext = SinglePromptGateContext | ChainStepGateContext;
/**
 * Core gate enhancement logic extracted from GateEnhancementStage.
 *
 * Handles gate selection, framework coordination, accumulator management,
 * and prompt enrichment for both single-prompt and chain-step execution.
 */
export declare class GateEnhancementService {
    private readonly gateService;
    private readonly temporaryGateRegistry;
    private readonly activeFrameworkIdProvider;
    private readonly gateManagerProvider;
    private readonly gateLoader;
    private readonly metricsRecorder;
    private readonly logger;
    constructor(gateService: GateService | null, temporaryGateRegistry: TemporaryGateRegistry | undefined, activeFrameworkIdProvider: ActiveFrameworkIdProvider, gateManagerProvider: () => GateManager | undefined, gateLoader: GateDefinitionProvider | undefined, metricsRecorder: GateMetricsRecorder, logger: Logger);
    isAvailable(): boolean;
    shouldSkip(modifiers?: ExecutionModifiers): boolean;
    /**
     * Load methodology gate IDs from GateLoader for the current request.
     * Returns fresh data each call — GateLoader handles hot-reload internally.
     */
    loadMethodologyGateIds(): Promise<Set<string>>;
    /**
     * Type-safe resolution of gate enhancement context.
     */
    resolveGateContext(context: ExecutionContext): GateEnhancementContext | null;
    /**
     * Enhance a single prompt with gate instructions.
     * Uses GateAccumulator for centralized deduplication with priority-based conflict resolution.
     */
    enhanceSinglePrompt(gateContext: SinglePromptGateContext, context: ExecutionContext, registeredGates: RegisteredGateResult, gatesConfig: GatesConfig | undefined, methodologyGates: Set<string>): Promise<void>;
    /**
     * Enhance gate instructions for each step in a multi-step command.
     * Uses GateAccumulator for global gates while handling step-specific gates per step.
     */
    enhanceChainSteps(gateContext: ChainStepGateContext, context: ExecutionContext, registeredGates: RegisteredGateResult, gatesConfig: GatesConfig | undefined, methodologyGates: Set<string>): Promise<void>;
    private requireGateService;
    private addGatesToAccumulator;
    private addRegistryGatesWithRetryConfig;
    private selectRegistryGates;
    private filterGatesByStepNumber;
    private getActiveFrameworkId;
    private buildDecisionInput;
    private ensureDefaultMethodologyGate;
}
export {};
