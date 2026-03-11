import type { ActionResult, CreateReviewOptions, GateVerdict, EnforcementMode, GateAction, GateEnforcementDecision, GateEnforcementInput, ParsedVerdict, PendingGateReview, ReviewOutcome, RetryConfig, VerdictSource } from './gate-enforcement-types.js';
import type { Logger } from '../../../../../infra/logging/index.js';
import type { ChainSessionService } from '../../../../../shared/types/index.js';
import type { GateDefinitionProvider } from '../../../../gates/core/gate-loader.js';
/**
 * Single source of truth for gate enforcement decisions.
 *
 * All pipeline stages MUST consult this authority for:
 * - Verdict parsing (consistent pattern matching)
 * - Enforcement mode resolution
 * - Retry limit tracking
 * - Gate action handling (retry/skip/abort)
 *
 * The authority bridges ephemeral pipeline state and persistent session state,
 * ensuring consistent behavior across request boundaries.
 *
 * @example
 * ```typescript
 * // In a pipeline stage
 * const verdict = gateEnforcement.parseVerdict(raw, 'gate_verdict');
 * if (verdict) {
 *   const outcome = await gateEnforcement.recordOutcome(sessionId, verdict);
 *   // Handle outcome.nextAction
 * }
 * ```
 */
export declare class GateEnforcementAuthority {
    private readonly logger;
    private readonly chainSessionManager;
    private readonly gateLoader;
    private enforcementDecision;
    private verdictPatterns;
    constructor(chainSessionManager: ChainSessionService, logger: Logger, gateLoader?: GateDefinitionProvider);
    /**
     * Get verdict patterns, loading from YAML config on first access.
     */
    private getVerdictPatterns;
    /**
     * Parse a raw string into a structured verdict.
     * Supports multiple formats for flexibility while maintaining security.
     * Patterns are loaded from YAML configuration for runtime customization.
     *
     * @param raw - Raw verdict string from user input
     * @param source - Where the verdict came from (affects security validation)
     * @returns Parsed verdict or null if no pattern matched
     */
    parseVerdict(raw: string | undefined, source: VerdictSource): ParsedVerdict | null;
    /**
     * Parse per-gate verdicts from a GATE_VERDICTS (or legacy CRITERION_VERDICTS) block.
     * Called alongside parseVerdict() — overall verdict drives PASS/FAIL,
     * gate verdicts provide granular delivery tracking.
     *
     * @param raw - Raw response containing GATE_VERDICTS block
     * @returns Array of parsed gate verdicts (empty if no block found)
     */
    parseGateVerdicts(raw: string): GateVerdict[];
    /**
     * Resolve enforcement mode for a set of gates.
     * Currently returns the configured mode or defaults to 'blocking'.
     *
     * @param configuredMode - Mode from pipeline state or undefined
     * @returns Resolved enforcement mode
     */
    resolveEnforcementMode(configuredMode?: EnforcementMode): EnforcementMode;
    /**
     * Get retry configuration for a session.
     *
     * @param sessionId - Session to check
     * @returns Retry config with current state
     */
    getRetryConfig(sessionId: string): RetryConfig;
    /**
     * Check if retry limit is exceeded for a session.
     * Delegates to session manager for persistent state.
     *
     * @param sessionId - Session to check
     * @returns True if retry limit exceeded
     */
    isRetryLimitExceeded(sessionId: string): boolean;
    /**
     * Get pending gate review for a session.
     *
     * @param sessionId - Session to check
     * @returns Pending review or undefined
     */
    getPendingReview(sessionId: string): PendingGateReview | undefined;
    /**
     * Create a new pending gate review.
     * Loads gate definitions to populate review prompts with criteria summaries.
     *
     * @param options - Review creation options
     * @returns Created pending review with enriched gate prompts
     */
    createPendingReview(options: CreateReviewOptions): Promise<PendingGateReview>;
    /**
     * Build GateReviewPrompt objects from gate definitions.
     * Falls back to empty array if gate loader is unavailable or loading fails.
     */
    private buildReviewPrompts;
    /**
     * Extract a human-readable criteria summary from a gate definition.
     * Prefers guidance text (human-readable) over description (brief).
     */
    private buildCriteriaSummary;
    /**
     * Record a gate review outcome and return the next action.
     *
     * @param sessionId - Session to update
     * @param verdict - Parsed verdict to record
     * @param enforcementMode - Current enforcement mode
     * @returns Outcome indicating next action
     */
    recordOutcome(sessionId: string, verdict: ParsedVerdict, enforcementMode?: EnforcementMode): Promise<ReviewOutcome>;
    /**
     * Resolve a gate action (retry/skip/abort) when retry limit is exceeded.
     *
     * @param sessionId - Session to update
     * @param action - User's chosen action
     * @returns Result of the action
     */
    resolveAction(sessionId: string, action: GateAction): Promise<ActionResult>;
    /**
     * Set a pending gate review on a session.
     *
     * @param sessionId - Session to update
     * @param review - Pending review to set
     */
    setPendingReview(sessionId: string, review: PendingGateReview): Promise<void>;
    /**
     * Clear pending gate review from a session.
     *
     * @param sessionId - Session to update
     */
    clearPendingReview(sessionId: string): Promise<void>;
    /**
     * Get the enforcement decision. Computes on first call, returns cached thereafter.
     */
    decide(input: GateEnforcementInput): GateEnforcementDecision;
    /**
     * Check if decision has been made.
     */
    hasDecided(): boolean;
    /**
     * Get the cached decision without computing (returns null if not decided).
     */
    getCachedDecision(): GateEnforcementDecision | null;
    /**
     * Reset the authority (for testing or request reprocessing).
     */
    reset(): void;
    private computeDecision;
}
