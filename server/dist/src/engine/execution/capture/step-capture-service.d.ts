import type { Logger } from '../../../infra/logging/index.js';
import type { ChainSession, ChainSessionService } from '../../../shared/types/index.js';
import type { ExecutionContext, SessionContext } from '../context/index.js';
/**
 * Input from verdict processing that affects step capture behavior.
 */
export interface StepCaptureInput {
    /** User response content (may have been consumed by verdict processing) */
    readonly userResponse: string | undefined;
    /** Whether a PASS verdict already advanced the step this call */
    readonly passClearedThisCall: boolean;
}
/**
 * Captures chain step results for STDIO transport compatibility.
 *
 * Records placeholder results to enable `{{previous_step_result}}` references
 * in downstream steps. Handles both placeholder capture (no user response)
 * and real response capture (user provided content).
 *
 * Extracted from StepResponseCaptureStage (pipeline stage 08).
 */
export declare class StepCaptureService {
    private readonly chainSessionManager;
    private readonly logger;
    constructor(chainSessionManager: ChainSessionService, logger: Logger);
    /**
     * Capture a step result and optionally advance the chain.
     *
     * Determines target step, checks eligibility, writes placeholder or real response,
     * and advances step unless blocked by a pending gate review.
     */
    captureStep(context: ExecutionContext, sessionId: string, session: ChainSession, sessionContext: SessionContext, currentStepAtStart: number, input: StepCaptureInput): Promise<void>;
    private shouldCaptureStep;
    private capturePlaceholder;
    private captureRealResponse;
    getStepOutputMapping(context: ExecutionContext, stepNumber: number): Record<string, string> | undefined;
    private buildPlaceholderContent;
    /**
     * Replace an existing placeholder with a real response and optionally advance.
     */
    private replaceplaceholderWithReal;
    /**
     * Capture a real response for a step that has no existing state, and optionally advance.
     */
    private captureRealAndAdvance;
    private syncSessionContext;
}
