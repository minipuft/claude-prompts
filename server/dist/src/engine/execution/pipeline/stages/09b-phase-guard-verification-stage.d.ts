/**
 * Pipeline Stage 09b: Phase Guard Verification
 *
 * Deterministic structural validation of LLM output against methodology phase guards.
 * Evaluates phase markers and content rules (min_length, contains_any, etc.) without LLM cost.
 *
 * Position: After StepExecutionStage (09), before GateReviewStage (10-gate)
 *
 * Integration: On failure, creates a PendingGateReview via the gate enforcement authority
 * so the existing gate lifecycle handles persistence, advancement blocking, retry tracking,
 * and review rendering. Phase guards do NOT independently short-circuit via setResponse().
 *
 * Flow:
 * 1. Check if framework active AND methodology has phases with guards
 * 2. If no guards → pass through (no-op)
 * 3. Evaluate user_response against phase markers/guards
 * 4. If all pass → merge guard summary into pending gate review (if any)
 * 5. If any fail → create PendingGateReview (gate system handles lifecycle)
 */
import { BasePipelineStage } from '../stage.js';
import type { Logger } from '../../../../infra/logging/index.js';
import type { ChainSessionService } from '../../../../shared/types/chain-session.js';
import type { PhaseGuardsConfig } from '../../../../shared/types/core-config.js';
import type { MethodologyGuide } from '../../../frameworks/types/methodology-types.js';
import type { ExecutionContext } from '../../context/index.js';
/** Sentinel gate ID used for phase-guard-created pending reviews. */
export declare const PHASE_GUARD_GATE_ID = "__phase_guard__";
type FrameworkRegistryProvider = () => {
    getMethodologyGuide(id: string): MethodologyGuide | undefined;
} | undefined;
type PhaseGuardsConfigProvider = () => PhaseGuardsConfig | undefined;
/**
 * Phase Guard Verification Stage — thin orchestration layer.
 *
 * Delegates to:
 * - evaluatePhaseGuards(): Pure evaluation logic (from phase-guards module)
 * - FrameworkRegistry: Phase definitions with markers and guards
 * - ChainSessionStore: Pending review persistence (via gate lifecycle)
 * - Config: Phase guard mode
 */
export declare class PhaseGuardVerificationStage extends BasePipelineStage {
    private readonly frameworkRegistryProvider;
    private readonly configProvider;
    private readonly chainSessionStore;
    readonly name = "PhaseGuardVerification";
    constructor(frameworkRegistryProvider: FrameworkRegistryProvider, configProvider: PhaseGuardsConfigProvider, chainSessionStore: ChainSessionService, logger: Logger);
    execute(context: ExecutionContext): Promise<void>;
    /**
     * Resolve the active framework ID from context or cached authority decision.
     *
     * On first request: Stage 06 populates frameworkContext → read from there.
     * On chain continuation: Stage 06 skips (blueprint-restored) → fall back to
     * FrameworkDecisionAuthority which was populated by Stage 05.
     */
    private resolveFrameworkId;
    /**
     * Extract processing steps that have guards from the methodology guide.
     */
    private getPhasesWithGuards;
    /**
     * Extract the LLM's previous response for phase guard evaluation.
     *
     * Reads `user_response` from the MCP request — the LLM's actual output
     * from the previous turn. This is what guards should validate (did the
     * LLM follow methodology phases?), NOT the rendered template from Stage 09.
     */
    private extractOutputText;
}
/**
 * Factory function for creating the phase guard verification stage.
 */
export declare function createPhaseGuardVerificationStage(frameworkRegistryProvider: FrameworkRegistryProvider, configProvider: PhaseGuardsConfigProvider, chainSessionStore: ChainSessionService, logger: Logger): PhaseGuardVerificationStage;
export {};
