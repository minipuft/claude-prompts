import { BasePipelineStage } from '../stage.js';
import type { Logger } from '../../../../infra/logging/index.js';
import type { FrameworkValidator } from '../../../frameworks/framework-validator.js';
import type { ExecutionContext } from '../../context/index.js';
/**
 * Pipeline Stage 3: Operator Validation
 *
 * Validates and normalizes symbolic operators from parsed commands,
 * ensuring framework overrides are valid before execution planning.
 *
 * Dependencies: context.parsedCommand, context.parsedCommand.operators
 * Output: Validated operators (framework names normalized)
 * Can Early Exit: No
 */
export declare class OperatorValidationStage extends BasePipelineStage {
    private readonly frameworkValidator;
    readonly name = "OperatorValidation";
    constructor(frameworkValidator: FrameworkValidator | null, logger: Logger);
    execute(context: ExecutionContext): Promise<void>;
    private normalizeFrameworkOperators;
    /**
     * Normalize delegation flags on chain steps.
     *
     * Two sources of delegation:
     * 1. Prompt-level `delegation: true` → all steps become delegated
     * 2. Per-step `subagentModel` → that step becomes delegated (implies sub-agent execution)
     *
     * Propagates to both parsedCommand.steps (ChainStepPrompt) and operator steps (ChainStep).
     */
    private normalizeDelegation;
    /** Mark ChainStepPrompt[] entries as delegated based on prompt-level or per-step subagentModel. */
    private markDelegatedStepPrompts;
    /** Propagate delegation from ChainStepPrompt[] to positionally-aligned operator ChainStep[]. */
    private syncDelegationToOperators;
    private applyDelegationToChainOp;
}
