import { Logger } from '../../../infra/logging/index.js';
import type { ChainStepExecutionInput, ChainStepRenderResult } from './types.js';
import type { ScriptReferenceResolverPort } from '../../../shared/utils/jsonUtils.js';
import type { PromptReferenceResolver } from '../reference/index.js';
import type { ConvertedPrompt } from '../types.js';
export declare class ChainOperatorExecutor {
    private readonly logger;
    private readonly convertedPrompts;
    private readonly gateGuidanceRenderer?;
    private readonly getFrameworkContext?;
    private readonly referenceResolver?;
    private readonly scriptReferenceResolver?;
    constructor(logger: Logger, convertedPrompts: ConvertedPrompt[], gateGuidanceRenderer?: any | undefined, getFrameworkContext?: ((promptId: string) => Promise<{
        selectedFramework?: {
            methodology: string;
            name: string;
        };
        category?: string;
        systemPrompt?: string;
    } | null>) | undefined, referenceResolver?: PromptReferenceResolver | undefined, scriptReferenceResolver?: ScriptReferenceResolverPort | undefined);
    renderStep(input: ChainStepExecutionInput): Promise<ChainStepRenderResult>;
    /**
     * Renders a gate review step (synthetic validation step)
     */
    private renderGateReviewStep;
    /**
     * Renders a normal step (non-review execution)
     */
    private renderNormalStep;
    private renderSimpleGateGuidance;
    /**
     * Determine whether gate guidance injection is enabled for the current chain context.
     */
    private isGateGuidanceEnabled;
    /**
     * Determine whether framework injection is enabled for gate reviews.
     * Checks both the inject flag and the target configuration.
     */
    private isFrameworkInjectionEnabledForGates;
    /**
     * Determine whether framework injection should be suppressed for normal steps.
     * Returns true if injection should be skipped (target is 'gates' only).
     */
    private shouldSuppressFrameworkForSteps;
    private buildFrameworkGuidance;
    private resolveFrameworkContext;
    /**
     * Build a delegation CTA using the existing DelegationRenderer infrastructure.
     * Produces a Task tool directive instructing the LLM to spawn a sub-agent.
     */
    private buildDelegationCTA;
    private extractClientProfile;
    private asRequestClientProfile;
    /**
     * Build Original Request Intent section from chainContext original_args.
     * Provides delivery context so each step knows what the chain was initiated for.
     */
    private buildOriginalIntentSection;
    /**
     * Build Required Response Format section for structured delivery verification.
     */
    private buildResponseFormatSection;
    private isInlineGateId;
    private getStoredStepResult;
    private normalizeStepArgs;
    private renderTemplate;
    private renderTemplateString;
    private getPromptDisplayName;
    private resolveReviewStep;
    private extractStepIndexFromContext;
    private extractStepIndexFromMetadata;
    private clampStepIndex;
    private collectReviewGateIds;
    private extractInlineGateIdsFromMetadata;
}
