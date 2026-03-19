/**
 * Pipeline Stage 8b: Shell Verification
 *
 * Executes shell verification gates that enable "Ralph Wiggum" style autonomous loops
 * where Claude's work is validated by real shell command execution (ground truth)
 * rather than LLM self-evaluation.
 *
 * Position: After StepResponseCaptureStage (08), before ExecutionStage (09)
 *
 * Flow:
 * 1. Check for pendingShellVerification in state
 * 2. Execute shell command via ShellVerifyExecutor
 * 3. If PASS (exit 0): Clear verification, proceed
 * 4. If FAIL (exit != 0):
 *    - If attempts < 5: Return formatted error to chat (bounce-back)
 *    - If attempts >= 5: Return escalation with gate_action options
 *
 * @see plans/ralph-mode-shell-verification-gates.md for the implementation plan
 */
import { type ShellVerifyExecutor, type VerifyActiveStateStore } from '../../../gates/shell/index.js';
import { BasePipelineStage } from '../stage.js';
import type { Logger } from '../../../../infra/logging/index.js';
import type { ChainSessionService } from '../../../../shared/types/chain-session.js';
import type { ExecutionContext } from '../../context/index.js';
/**
 * Shell Verification Stage - thin orchestration layer.
 *
 * Delegates to:
 * - ShellVerifyExecutor: Command execution
 * - VerifyActiveStateStore: State file for Stop hook
 * - createBounceBackFeedback/createEscalationFeedback: Message formatting
 *
 * Note: Checkpoint/rollback functionality is available via resource_manager.
 */
export declare class ShellVerificationStage extends BasePipelineStage {
    private readonly shellVerifyExecutor;
    private readonly stateManager;
    private readonly chainSessionService;
    readonly name = "ShellVerification";
    constructor(shellVerifyExecutor: ShellVerifyExecutor, stateManager: VerifyActiveStateStore, chainSessionService: ChainSessionService, logger: Logger);
    execute(context: ExecutionContext): Promise<void>;
    /**
     * Handle verification success - clear state and proceed.
     */
    private handleVerificationPassed;
    /**
     * Handle verification failure - bounce-back or escalate.
     */
    private handleVerificationFailed;
    /**
     * Resolve verify-state.db key: prefer chain ID (human-readable, Stop hook uses it),
     * fall back to session ID (guaranteed unique) to avoid 'unknown' key collisions.
     */
    private resolveVerifyStateKey;
    /**
     * Restore pendingShellVerification from the chain session (for response-only resume).
     * On resume, Stage 02 is skipped so the ephemeral context has no pending state.
     */
    private restoreFromSession;
    /**
     * Save pending state to session for cross-request persistence.
     */
    private saveToSession;
    /**
     * Clear pending state from session (on pass, skip, abort, or escalation).
     */
    private clearFromSession;
    /**
     * Handle gate_action user decision (retry/skip/abort).
     */
    private handleGateAction;
}
/**
 * Factory function for creating the shell verification stage.
 */
export declare function createShellVerificationStage(shellVerifyExecutor: ShellVerifyExecutor, stateManager: VerifyActiveStateStore, chainSessionService: ChainSessionService, logger: Logger): ShellVerificationStage;
