/**
 * Chain Execution Types
 *
 * Types that are consumed across multiple architectural layers (engine, modules, mcp).
 * Relocated from mcp/tools/prompt-engine/core/types.ts and engine/execution/types.ts
 * to shared/ to respect the dependency direction: shared → engine → modules → mcp.
 */
/**
 * Step lifecycle state values used when tracking chain execution progress.
 */
export declare enum StepState {
    PENDING = "pending",
    RENDERED = "rendered",
    RESPONSE_CAPTURED = "response_captured",
    COMPLETED = "completed"
}
/**
 * Metadata tracked for each chain step as it transitions through lifecycle states.
 */
export interface StepMetadata {
    state: StepState;
    isPlaceholder: boolean;
    renderedAt?: number;
    respondedAt?: number;
    completedAt?: number;
}
/**
 * History entry captured for each manual gate review attempt.
 */
export interface GateReviewHistoryEntry {
    timestamp: number;
    status: 'pending' | 'pass' | 'fail' | 'retry' | string;
    reasoning?: string;
    reviewer?: string;
}
/**
 * Execution context snapshot attached to a gate review prompt.
 */
export interface GateReviewExecutionContext {
    originalArgs: Record<string, unknown>;
    previousResults: Record<number, string>;
    currentStep?: number;
    totalSteps?: number;
    chainId?: string;
    sessionId?: string;
}
/**
 * Gate review prompt configuration for quality validation.
 */
export interface GateReviewPrompt {
    gateId?: string;
    gateName?: string;
    criteriaSummary: string;
    promptTemplate?: string;
    explicitInstructions?: string[];
    retryHints?: string[];
    previousResponse?: string;
    executionContext?: GateReviewExecutionContext;
    metadata?: Record<string, unknown>;
}
/**
 * Pending gate review payload stored on the session manager so multi-turn
 * reviews can resume after the user responds through the MCP session.
 */
export interface PendingGateReview {
    combinedPrompt: string;
    gateIds: string[];
    prompts: GateReviewPrompt[];
    createdAt: number;
    attemptCount: number;
    maxAttempts: number;
    retryHints?: string[];
    previousResponse?: string;
    /**
     * Extensible metadata. Known keys:
     * - `source`: Origin subsystem (e.g., 'phase-guard-verification', 'gate-enforcement')
     * - `phaseGuardContext`: When phase guards evaluated — `{ allPassed: boolean, phaseCount: number, evaluatedAt: number }`
     * - `failedPhases`: Phase names that failed phase guard checks (phase-guard-sourced reviews only)
     * - `mode`: Phase guard config mode ('enforce' | 'warn')
     */
    metadata?: Record<string, unknown>;
    history?: GateReviewHistoryEntry[];
}
/**
 * Serializable snapshot of pending shell verification state persisted to chain sessions.
 * Enables bounce-back resume across MCP requests (ephemeral ExecutionContext loses this state).
 * Mirrors engine-layer PendingShellVerification without importing engine types.
 */
export interface PendingShellVerificationSnapshot {
    gateId: string;
    shellVerify: {
        command: string;
        timeout?: number;
        workingDir?: string;
        preset?: 'fast' | 'full' | 'extended';
        loop?: boolean;
        maxIterations?: number;
    };
    attemptCount: number;
    maxAttempts: number;
    previousResults: Array<{
        passed: boolean;
        exitCode: number;
        stdout: string;
        stderr: string;
        durationMs: number;
        command: string;
        timedOut?: boolean;
    }>;
    originalGoal?: string;
    sourceGateIds?: string[];
}
/**
 * Framework execution context for prompt processing.
 */
export interface FormatterExecutionContext {
    executionId: string;
    executionType: 'single' | 'chain';
    startTime: number;
    endTime: number;
    frameworkUsed?: string;
    frameworkEnabled: boolean;
    success: boolean;
    stepsExecuted?: number;
    /** Public identifier surfaced to MCP clients */
    chainId?: string;
    /** Internal session handle retained for analytics/logging */
    sessionId?: string;
    chainProgress?: {
        currentStep?: number;
        totalSteps?: number;
        status: 'in_progress' | 'complete';
    };
}
/**
 * Chain state information with per-step lifecycle tracking.
 */
export interface ChainState {
    currentStep: number;
    totalSteps: number;
    lastUpdated: number;
    /** Map of step number -> lifecycle metadata */
    stepStates?: Map<number, StepMetadata>;
}
