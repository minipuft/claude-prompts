import type { ChainFormattingContext, SinglePromptFormattingContext } from './formatting-context.js';
import type { ExecutionContext } from '../context/index.js';
/**
 * Assembles response content sections for different execution types.
 *
 * Handles chain responses (with footers, gate instructions, advisory warnings),
 * single prompt responses, blocked responses, script confirmations, validation
 * errors, gate validation info, and legacy footer building.
 *
 * Extracted from ResponseFormattingStage (pipeline stage 10).
 */
export declare class ResponseAssembler {
    constructor();
    /**
     * Formats response for chain execution with session tracking.
     */
    formatChainResponse(context: ExecutionContext, _formatterContext: ChainFormattingContext): string;
    /**
     * Formats response for single prompt execution.
     */
    formatSinglePromptResponse(context: ExecutionContext, _formatterContext: SinglePromptFormattingContext): string;
    /**
     * Formats a blocked response when gate failure suppresses content.
     */
    formatBlockedResponse(context: ExecutionContext): string;
    /**
     * Builds GateValidationInfo for structured response contract.
     */
    buildGateValidationInfo(context: ExecutionContext): {
        enabled: boolean;
        passed: boolean;
        totalGates: number;
        failedGates: Array<{
            id: string;
            reason: string;
        }>;
        executionTime: number;
        pendingGateIds: string[];
        requiresGateVerdict: boolean;
        responseBlocked: boolean;
        gateRetryInfo: {
            maxAttempts: number;
            currentAttempt: number;
            retryAllowed: boolean;
        };
    } | undefined;
    /**
     * Builds chain footer with session and progress tracking.
     */
    buildChainFooter(context: ExecutionContext): string;
    /**
     * Builds a handoff section using DelegationRenderer with an ExecutionEnvelope
     * containing gate instructions and framework context for sub-agent isolation.
     *
     * Reads from Stage 09 metadata when available, falls back to parsed step metadata
     * when pendingReview blocked Stage 09 execution.
     */
    private buildHandoffSection;
    private resolveClientProfile;
    private buildHandoffFooterLine;
    /**
     * Builds an ExecutionEnvelope from gate instructions and framework context.
     * Returns null when neither source has content.
     */
    private buildHandoffEnvelope;
    /**
     * Formats script tool confirmation request for user approval.
     */
    formatConfirmationRequest(confirmation: NonNullable<typeof ExecutionContext.prototype.state.scripts>['confirmationRequired']): string;
    /**
     * Formats validation errors from script tool validation.
     */
    formatValidationErrors(errors: string[]): string;
    /**
     * Detects whether the next step is delegated.
     * Checks Stage 09 metadata first, falls back to parsed step `delegated` flag
     * (always available from Stage 01, even when pendingReview blocked Stage 09).
     */
    private isNextStepDelegated;
    /**
     * Finds the next step in parsed command steps that has `delegated: true`.
     * Returns undefined if no delegation is found.
     */
    private findNextDelegatedStep;
    /**
     * Resolves the prompt name for the next delegated step from parsed steps.
     */
    private resolveNextStepPromptName;
    /**
     * Builds gate review CTA with verdict template, attempt counter, and submit instructions.
     * Retry hints are NOT included here — they are SSOT in chain-operator-executor supplementalSections
     * (already present in base content).
     */
    private buildGateReviewCTA;
    /**
     * Builds completion message for the final chain step when no gate review is pending.
     */
    private buildFinalStepMessage;
    /**
     * Checks whether the current step is the final step of a chain execution.
     */
    private isFinalChainStep;
    /**
     * Builds a dynamic GATE_VERDICTS template keyed to actual gate names.
     */
    private buildGateVerdictTemplate;
    /**
     * Builds a lookup map from gate ID to its review prompt.
     */
    private buildPromptLookup;
    /**
     * Central gate content suppression check.
     * Returns true when gate-related content (CTAs, validation info,
     * instructions, advisory warnings) should NOT appear in the response.
     *
     * Called once per format method as `gateActive = !isGateContentSuppressed()`,
     * then threaded to all gate-emitting sections. Sub-methods do NOT call this
     * directly — the orchestrator decides, sub-methods obey.
     *
     * Entry points: formatChainResponse, formatSinglePromptResponse (top-level),
     *               buildGateValidationInfo (external entry from Stage 10)
     */
    private isGateContentSuppressed;
    /** Checks injection control setting for gate guidance (not suppression — caller handles that). */
    private isGateGuidanceInjectionEnabled;
    private extractBaseContent;
    /**
     * Builds a usage CTA with re-run and chain suggestions.
     * Shown for single prompt and chain completion scenarios.
     */
    private buildUsageCTA;
    /**
     * Builds context-aware CTA from all active operators.
     * Composition: primary action (exclusive) + hints (additive) + re-run (always).
     * Gate action is only appended when gateActive is true (decided by caller).
     */
    private buildNextActionCTA;
    /** Appends gate verdict CTA when gates are active and a session exists. */
    private appendGateAction;
    /** Appends shell verification command hint when :: verify:"cmd" operators are present. */
    private appendVerifyHint;
    /** Appends Ralph loop hint when :: verify:"cmd" loop:true is active. */
    private appendLoopHint;
    /** Appends session resume CTA when session exists but no gates. */
    private appendSessionAction;
    /** Appends re-run invocation line (always shown). */
    private appendRerunLine;
    /** Resolves the prompt ID for CTA display from prompt or execution metadata. */
    private resolvePromptIdForCTA;
    /** Checks whether a prompt defines built-in chain steps (auto-chain). */
    private isAutoChainPrompt;
    /**
     * Resolves the ConvertedPrompt for the current execution.
     * Single prompt: direct convertedPrompt. Chain completion: last step's prompt.
     */
    private resolveCurrentPrompt;
    /**
     * Builds the full invocation string from parsed context data.
     * Includes user-specified operators when includeOperators is true.
     */
    private buildInvocationString;
    /** Appends modifier, framework, and style operator prefixes to parts. */
    private appendOperatorPrefixes;
    /** Resolves the framework operator token for CTA display. */
    private resolveFrameworkToken;
    /** Resolves the modifier token from execution modifiers. */
    private resolveModifierToken;
    /** Appends inline gate criteria and named gates as suffixes. */
    private appendGateSuffixes;
    /**
     * Builds the argument portion of an invocation string from prompt schema + user values.
     */
    private buildArgString;
    /** Formats a single argument for CTA display. */
    private formatArgForCTA;
    private formatExtractedInputsSummary;
}
