/**
 * Shell Verify Message Formatter
 *
 * Pure functions for formatting shell verification feedback messages.
 * Handles bounce-back messages (retry prompts) and escalation messages
 * (max attempts reached, user decision required).
 *
 * Extracted from ShellVerificationStage to maintain orchestration layer limits.
 */
import type { ShellVerifyResult, PendingShellVerification } from './types.js';
/**
 * Gate-level shell verification result.
 * Wraps ShellVerifyResult with gate metadata for gate review feedback.
 */
export interface GateShellVerifyResult {
    gateId: string;
    gateName: string;
    command: string;
    passed: boolean;
    exitCode: number;
    stdout: string;
    stderr: string;
    durationMs: number;
    timedOut?: boolean;
}
/**
 * Shell verification feedback types.
 */
export type ShellVerifyFeedbackType = 'bounce_back' | 'escalation';
/**
 * Formatted feedback ready for display.
 */
export interface ShellVerifyFeedback {
    type: ShellVerifyFeedbackType;
    message: string;
}
/**
 * Truncate output for display, keeping the end (most relevant for errors).
 */
export declare function truncateForDisplay(output: string, maxLength?: number): string;
/**
 * Extract the most relevant error output from a verification result.
 * Prefers stderr, falls back to stdout, then default message.
 */
export declare function extractErrorOutput(result: ShellVerifyResult): string;
/**
 * Format bounce-back message for retry attempts.
 *
 * Displayed when verification fails but attempts remain.
 * Encourages Claude to fix issues and try again.
 */
export declare function formatBounceBackMessage(result: ShellVerifyResult, pending: PendingShellVerification, errorOutput: string): string;
/**
 * Format escalation message after max attempts reached.
 *
 * Displayed when all attempts exhausted. Prompts user for
 * gate_action decision (retry/skip/abort).
 */
export declare function formatEscalationMessage(result: ShellVerifyResult, pending: PendingShellVerification, errorOutput: string): string;
/**
 * Create bounce-back feedback for a failed verification.
 */
export declare function createBounceBackFeedback(result: ShellVerifyResult, pending: PendingShellVerification): ShellVerifyFeedback;
/**
 * Create escalation feedback after max attempts reached.
 */
export declare function createEscalationFeedback(result: ShellVerifyResult, pending: PendingShellVerification): ShellVerifyFeedback;
/**
 * Format a markdown section summarizing gate-level shell verification results.
 *
 * Used by GateReviewStage to enrich gate review feedback with actual command
 * output (test failures, lint errors) instead of generic "review your work".
 *
 * @returns Markdown string, or empty string when no results to display.
 */
export declare function formatGateShellVerifySection(results: GateShellVerifyResult[]): string;
