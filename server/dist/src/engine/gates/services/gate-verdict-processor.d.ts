import type { Logger } from '../../../infra/logging/index.js';
import type { ChainSession, ChainSessionService } from '../../../shared/types/index.js';
import type { ExecutionContext, SessionContext } from '../../execution/context/index.js';
import type { GateAction } from '../../execution/pipeline/decisions/index.js';
/**
 * Result of processing gate verdicts for a request.
 */
export interface VerdictProcessingResult {
    /** Whether a PASS verdict advanced the step in this call */
    readonly passClearedThisCall: boolean;
    /** Whether the pipeline should exit early after verdict processing */
    readonly earlyExit: boolean;
    /** User response (may be unchanged or set to undefined if consumed by verdict) */
    readonly userResponse: string | undefined;
}
/**
 * Processes gate verdicts, handles gate actions (retry/skip/abort),
 * and emits gate lifecycle events via hooks and notifications.
 *
 * Extracted from StepResponseCaptureStage (pipeline stage 08).
 */
export declare class GateVerdictProcessor {
    private readonly chainSessionManager;
    private readonly logger;
    constructor(chainSessionManager: ChainSessionService, logger: Logger);
    /**
     * Handle gate_action parameter (retry/skip/abort) when retry limit exceeded.
     * Delegates to GateEnforcementAuthority when available, falls back to direct session ops.
     *
     * @returns true if the pipeline should exit early (abort or action completed)
     */
    handleGateAction(context: ExecutionContext, sessionId: string, gateAction: GateAction, sessionContext: SessionContext): Promise<boolean>;
    /**
     * Process a deferred verdict (verdict without existing pending review).
     * Uses GateEnforcementAuthority to create/clear reviews as needed.
     */
    processDeferredVerdict(context: ExecutionContext, session: ChainSession, sessionId: string, currentStepAtStart: number, userResponse: string | undefined, sessionContext: SessionContext): Promise<VerdictProcessingResult>;
    /**
     * Process a verdict against an existing pending review.
     * Handles blocking/advisory/informational enforcement modes.
     */
    processPendingReviewVerdict(context: ExecutionContext, session: ChainSession, sessionId: string, currentStepAtStart: number, userResponse: string | undefined, sessionContext: SessionContext): Promise<VerdictProcessingResult>;
    /**
     * Handle a FAIL verdict based on enforcement mode.
     */
    private handleFailedVerdict;
    private handleBlockingFail;
    private handleAdvisoryFail;
    private handleInformationalFail;
    /**
     * Parse a gate verdict using the authority (preferred) or contract fallback.
     */
    private parseVerdict;
    private recordVerdictDetection;
    /**
     * Create hook execution context from the current execution state.
     */
    private createHookContext;
    /**
     * Emit gate events via hooks and notifications.
     */
    private emitGateEvents;
}
