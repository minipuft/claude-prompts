// @lifecycle canonical - Core gate enhancement logic for prompt enrichment.
import type { GateMetricsRecorder } from './gate-metrics-recorder.js';
import type { GateService } from './gate-service-interface.js';
import type { RegisteredGateResult } from './temporary-gate-registrar.js';
import type { Logger } from '../../../infra/logging/index.js';
import type { ExecutionContext } from '../../execution/context/index.js';
import type { ChainStepPrompt } from '../../execution/operators/types.js';
import type { FrameworkDecisionInput } from '../../execution/pipeline/decisions/index.js';
import type { GateSource } from '../../execution/pipeline/state/types.js';
import type { ConvertedPrompt, ExecutionModifiers } from '../../execution/types.js';
import type { FrameworkManager } from '../../frameworks/index.js';
import type { GateContext } from '../core/gate-definitions.js';
import type { GateDefinitionProvider } from '../core/gate-loader.js';
import type { TemporaryGateRegistry } from '../core/temporary-gate-registry.js';
import type { GateManager } from '../gate-manager.js';
import type { GateSelectionContext } from '../types/index.js';
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
export class GateEnhancementService {
  constructor(
    private readonly gateService: GateService | null,
    private readonly temporaryGateRegistry: TemporaryGateRegistry | undefined,
    private readonly frameworkManagerProvider: () => FrameworkManager | undefined,
    private readonly gateManagerProvider: () => GateManager | undefined,
    private readonly gateLoader: GateDefinitionProvider | undefined,
    private readonly metricsRecorder: GateMetricsRecorder,
    private readonly logger: Logger
  ) {}

  isAvailable(): boolean {
    return this.gateService !== null;
  }

  shouldSkip(modifiers?: ExecutionModifiers): boolean {
    if (!modifiers) {
      return false;
    }
    return modifiers.clean === true || modifiers.framework === true;
  }

  /**
   * Load methodology gate IDs from GateLoader for the current request.
   * Returns fresh data each call — GateLoader handles hot-reload internally.
   */
  async loadMethodologyGateIds(): Promise<Set<string>> {
    if (!this.gateLoader) {
      return new Set();
    }

    try {
      const ids = await this.gateLoader.getMethodologyGateIds();
      return new Set(ids);
    } catch (error) {
      this.logger.warn('[GateEnhancementService] Failed to load methodology gate IDs', { error });
      return new Set();
    }
  }

  /**
   * Type-safe resolution of gate enhancement context.
   */
  resolveGateContext(context: ExecutionContext): GateEnhancementContext | null {
    if (context.hasChainCommand()) {
      return { type: 'chain', steps: context.parsedCommand.steps };
    }

    if (context.parsedCommand?.steps !== undefined && context.parsedCommand.steps.length > 0) {
      return { type: 'chain', steps: context.parsedCommand.steps };
    }

    if (context.hasSinglePromptCommand()) {
      return {
        type: 'single',
        prompt: context.parsedCommand.convertedPrompt,
        inlineGateIds: context.parsedCommand.inlineGateIds ?? [],
      };
    }

    if (context.parsedCommand?.convertedPrompt !== undefined) {
      return {
        type: 'single',
        prompt: context.parsedCommand.convertedPrompt,
        inlineGateIds: context.parsedCommand.inlineGateIds ?? [],
      };
    }

    return null;
  }

  /**
   * Enhance a single prompt with gate instructions.
   * Uses GateAccumulator for centralized deduplication with priority-based conflict resolution.
   */
  async enhanceSinglePrompt(
    gateContext: SinglePromptGateContext,
    context: ExecutionContext,
    registeredGates: RegisteredGateResult,
    gatesConfig: GatesConfig | undefined,
    methodologyGates: Set<string>
  ): Promise<void> {
    const executionPlan = context.executionPlan;
    if (executionPlan === undefined) {
      return;
    }

    const { prompt, inlineGateIds } = gateContext;
    const clientSelectedGates = context.state.framework.clientSelectedGates ?? [];

    this.addGatesToAccumulator(context, inlineGateIds, 'inline-operator');
    this.addGatesToAccumulator(context, clientSelectedGates, 'client-selection');
    this.addGatesToAccumulator(context, registeredGates.temporaryGateIds, 'temporary-request');
    this.addGatesToAccumulator(context, executionPlan.gates, 'prompt-config');
    this.addGatesToAccumulator(context, registeredGates.canonicalGateIds, 'methodology');

    const activeFrameworkId = this.getActiveFrameworkId(context);
    const selectionContext: GateSelectionContext = { enabledOnly: true };
    if (prompt.category !== undefined) {
      selectionContext.promptCategory = prompt.category;
    }
    if (activeFrameworkId !== undefined) {
      selectionContext.framework = activeFrameworkId;
    }

    const registryGates = this.selectRegistryGates(selectionContext);
    this.addRegistryGatesWithRetryConfig(context, registryGates);

    let gateIds = [...context.gates.getAll()];
    gateIds = this.ensureDefaultMethodologyGate(
      gateIds,
      gatesConfig,
      activeFrameworkId,
      methodologyGates
    );

    if (gatesConfig !== undefined && !gatesConfig.enableMethodologyGates) {
      const beforeCount = gateIds.length;
      gateIds = gateIds.filter((gate) => !methodologyGates.has(gate));
      if (beforeCount !== gateIds.length) {
        context.diagnostics.info('GateEnhancement', 'Methodology gates filtered by config', {
          filtered: beforeCount - gateIds.length,
          remaining: gateIds.length,
        });
      }
    }

    if (gateIds.length === 0) {
      context.diagnostics.info('GateEnhancement', 'Gate enhancement skipped - no gates to apply');
      return;
    }

    context.diagnostics.info('GateEnhancement', 'Gates accumulated for single prompt', {
      totalGates: gateIds.length,
      sourceCounts: context.gates.getSourceCounts(),
    });

    try {
      const originalTemplate = prompt.userMessageTemplate ?? '';
      const gateService = this.requireGateService();

      const gateCtx: GateContext = {
        promptId: prompt.id,
        explicitGateIds: [...inlineGateIds, ...registeredGates.canonicalGateIds],
      };
      if (activeFrameworkId !== undefined) {
        gateCtx.framework = activeFrameworkId;
      }
      if (executionPlan.category !== undefined) {
        gateCtx.category = executionPlan.category;
      }

      const result = await gateService.enhancePrompt(prompt, gateIds, gateCtx);

      const enhancedTemplate = result.enhancedPrompt.userMessageTemplate ?? '';
      if (enhancedTemplate.startsWith(originalTemplate)) {
        context.gateInstructions = enhancedTemplate.substring(originalTemplate.length).trim();
      }

      executionPlan.gates = gateIds;

      if (result.validationResults !== undefined && result.validationResults.length > 0) {
        context.state.gates.validationResults = result.validationResults.map((r) => ({
          ...r,
          valid: r.passed,
        }));
      }

      this.metricsRecorder.recordGateUsageMetrics(
        context,
        gateIds,
        result.instructionLength,
        result.validationResults
      );

      context.state.gates.accumulatedGateIds = gateIds;

      const isSinglePrompt = !context.parsedCommand?.steps?.length;
      context.state.gates.hasBlockingGates = !isSinglePrompt && gateIds.length > 0;

      if (!context.state.gates.enforcementMode && gateIds.length > 0) {
        context.state.gates.enforcementMode = isSinglePrompt ? 'advisory' : 'blocking';
      }
    } catch (error) {
      this.logger.warn('[GateEnhancementService] Gate enhancement failed', { error });
    }
  }

  /**
   * Enhance gate instructions for each step in a multi-step command.
   * Uses GateAccumulator for global gates while handling step-specific gates per step.
   */
  async enhanceChainSteps(
    gateContext: ChainStepGateContext,
    context: ExecutionContext,
    registeredGates: RegisteredGateResult,
    gatesConfig: GatesConfig | undefined,
    methodologyGates: Set<string>
  ): Promise<void> {
    const gateService = this.requireGateService();
    const { steps } = gateContext;
    let totalGatesApplied = 0;

    const clientSelectedGates = context.state.framework.clientSelectedGates ?? [];
    this.addGatesToAccumulator(context, clientSelectedGates, 'client-selection');
    this.addGatesToAccumulator(context, registeredGates.temporaryGateIds, 'temporary-request');
    this.addGatesToAccumulator(context, registeredGates.canonicalGateIds, 'methodology');

    for (const step of steps) {
      const prompt = step.convertedPrompt;
      if (prompt === undefined) {
        this.logger.warn(
          `[GateEnhancementService] Skipping step ${step.stepNumber} - no convertedPrompt`
        );
        continue;
      }

      if (this.shouldSkip(step.executionPlan?.modifiers)) {
        continue;
      }

      const plannedGates =
        Array.isArray(step.executionPlan?.gates) && step.executionPlan.gates.length > 0
          ? step.executionPlan.gates
          : [];
      const stepInlineGates = Array.isArray(step.inlineGateIds) ? step.inlineGateIds : [];

      const activeFrameworkId = this.getActiveFrameworkId(context);
      const stepFrameworkId = step.frameworkContext?.selectedFramework?.id ?? activeFrameworkId;

      const registrySelectionContext: GateSelectionContext = { enabledOnly: true };
      if (prompt.category !== undefined && prompt.category.length > 0) {
        registrySelectionContext.promptCategory = prompt.category;
      }
      if (stepFrameworkId !== undefined) {
        registrySelectionContext.framework = stepFrameworkId;
      }

      const registryGates =
        registrySelectionContext.promptCategory !== undefined
          ? this.selectRegistryGates(registrySelectionContext)
          : [];

      this.addGatesToAccumulator(context, stepInlineGates, 'inline-operator');
      this.addGatesToAccumulator(context, plannedGates, 'prompt-config');
      this.addRegistryGatesWithRetryConfig(context, registryGates);

      let gateIds = [...context.gates.getAll()];
      gateIds = this.ensureDefaultMethodologyGate(
        gateIds,
        gatesConfig,
        activeFrameworkId,
        methodologyGates
      );

      if (gatesConfig !== undefined && !gatesConfig.enableMethodologyGates) {
        gateIds = gateIds.filter((gate) => !methodologyGates.has(gate));
      }

      gateIds = this.filterGatesByStepNumber(gateIds, step.stepNumber);

      if (gateIds.length === 0) {
        continue;
      }

      try {
        const originalTemplate = prompt.userMessageTemplate ?? '';

        const stepGateContext: GateContext = { promptId: prompt.id };
        if (Array.isArray(step.inlineGateIds)) {
          stepGateContext.explicitGateIds = step.inlineGateIds;
        }
        if (stepFrameworkId !== undefined) {
          stepGateContext.framework = stepFrameworkId;
        }
        if (prompt.category !== undefined) {
          stepGateContext.category = prompt.category;
        }

        const result = await gateService.enhancePrompt(prompt, gateIds, stepGateContext);

        const enhancedTemplate = result.enhancedPrompt.userMessageTemplate ?? '';
        if (enhancedTemplate.startsWith(originalTemplate)) {
          const stepGateInstructions = enhancedTemplate.substring(originalTemplate.length).trim();
          step.metadata ??= {};
          step.metadata['gateInstructions'] = stepGateInstructions;
        }

        totalGatesApplied += gateIds.length;

        this.metricsRecorder.recordGateUsageMetrics(
          context,
          gateIds,
          result.instructionLength,
          result.validationResults
        );
      } catch (error) {
        this.logger.warn(
          `[GateEnhancementService] Gate enhancement failed for step ${step.stepNumber}`,
          { error, promptId: step.promptId }
        );
      }
    }

    const allGateIds = [...context.gates.getAll()];
    context.state.gates.accumulatedGateIds = allGateIds;
    context.state.gates.hasBlockingGates = totalGatesApplied > 0;

    if (!context.state.gates.enforcementMode && allGateIds.length > 0) {
      context.state.gates.enforcementMode = 'blocking';
    }
  }

  private requireGateService(): GateService {
    if (this.gateService === null) {
      throw new Error('Gate service not available');
    }
    return this.gateService;
  }

  private addGatesToAccumulator(
    context: ExecutionContext,
    gateIds: readonly string[] | undefined,
    source: GateSource
  ): void {
    if (!gateIds || gateIds.length === 0) {
      return;
    }
    const added = context.gates.addAll(gateIds, source);
    if (added > 0) {
      this.logger.debug('[GateEnhancementService] Added gates to accumulator', {
        source,
        added,
        total: context.gates.size,
      });
    }
  }

  private addRegistryGatesWithRetryConfig(
    context: ExecutionContext,
    gateIds: readonly string[]
  ): void {
    if (!gateIds || gateIds.length === 0) {
      return;
    }

    const gateManager = this.gateManagerProvider?.();
    let added = 0;

    for (const gateId of gateIds) {
      let retryLimit: number | undefined;
      let blockResponseOnFail = false;

      if (gateManager) {
        try {
          const registry = gateManager.getGateRegistry();
          const gate = registry?.getGuide(gateId);

          if (gate) {
            const retryConfig = gate.getRetryConfig();
            if (retryConfig?.max_attempts !== undefined) {
              retryLimit = retryConfig.max_attempts;
            }

            const definition = gate.getDefinition();
            if (definition.blockResponseOnFail === true) {
              blockResponseOnFail = true;
              context.gates.addBlockingGate(gateId);
            }
          }
        } catch {
          // Gate registry lookup failed - continue without config
        }
      }

      const metadata = retryLimit !== undefined ? { retryLimit, blockResponseOnFail } : undefined;
      if (context.gates.add(gateId, 'registry-auto', metadata)) {
        added++;
      }
    }

    if (added > 0) {
      this.logger.debug('[GateEnhancementService] Added registry gates with config', {
        added,
        total: context.gates.size,
        blockingGates: context.gates.getBlockingGateIds(),
      });
    }
  }

  private selectRegistryGates(selectionContext: GateSelectionContext): string[] {
    const gateManager = this.gateManagerProvider?.();
    if (!gateManager) {
      return [];
    }

    try {
      const result = gateManager.selectGates(selectionContext);
      this.logger.debug('[GateEnhancementService] Registry gate selection', {
        category: selectionContext.promptCategory,
        framework: selectionContext.framework,
        selectedCount: result.selectedIds.length,
        skippedCount: result.skippedIds.length,
      });
      return result.selectedIds;
    } catch (error) {
      this.logger.warn('[GateEnhancementService] Registry selection failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  private filterGatesByStepNumber(gateIds: string[], stepNumber: number): string[] {
    if (!this.temporaryGateRegistry) {
      return gateIds;
    }

    return gateIds.filter((gateId) => {
      const tempGate = this.temporaryGateRegistry!.getTemporaryGate(gateId);
      if (!tempGate) {
        return true;
      }
      if (tempGate.target_step_number !== undefined) {
        return tempGate.target_step_number === stepNumber;
      }
      if (tempGate.apply_to_steps !== undefined && tempGate.apply_to_steps.length > 0) {
        return tempGate.apply_to_steps.includes(stepNumber);
      }
      return true;
    });
  }

  private getActiveFrameworkId(context: ExecutionContext): string | undefined {
    const decisionInput = this.buildDecisionInput(context);
    return context.frameworkAuthority.getFrameworkId(decisionInput);
  }

  private buildDecisionInput(context: ExecutionContext): FrameworkDecisionInput {
    let globalActiveFramework = context.frameworkContext?.selectedFramework?.id;

    const frameworkManager = this.frameworkManagerProvider();

    if (!globalActiveFramework && frameworkManager) {
      try {
        const activeFramework = frameworkManager.selectFramework({});
        globalActiveFramework = activeFramework?.id;
      } catch (error) {
        this.logger.warn('[GateEnhancementService] selectFramework failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const result: FrameworkDecisionInput = {};
    if (context.executionPlan?.modifiers !== undefined) {
      result.modifiers = context.executionPlan.modifiers;
    }
    const operatorOverride = context.parsedCommand?.executionPlan?.frameworkOverride;
    if (operatorOverride !== undefined) {
      result.operatorOverride = operatorOverride;
    }
    if (context.state.framework.clientOverride !== undefined) {
      result.clientOverride = context.state.framework.clientOverride;
    }
    if (globalActiveFramework !== undefined) {
      result.globalActiveFramework = globalActiveFramework;
    }

    return result;
  }

  private ensureDefaultMethodologyGate(
    gateIds: string[],
    gatesConfig: GatesConfig | undefined,
    activeFrameworkId: string | undefined,
    methodologyGates: Set<string>
  ): string[] {
    if (!gatesConfig?.enableMethodologyGates || !activeFrameworkId) {
      return gateIds;
    }
    const hasMethodologyGate = gateIds.some((gate) => methodologyGates.has(gate));
    if (hasMethodologyGate) {
      return gateIds;
    }
    return [...gateIds, 'framework-compliance'];
  }
}
