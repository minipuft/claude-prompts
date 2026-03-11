/**
 * Shell Verification Gates Module
 *
 * Exports types and services for shell-based verification gates
 * that enable ground-truth validation via command execution.
 */
export type { ShellVerifyGate, ShellVerifyResult, PendingShellVerification, ShellVerifyExecutorConfig, VerifyActiveState, } from './types.js';
export { SHELL_OUTPUT_MAX_CHARS, SHELL_VERIFY_DEFAULT_MAX_ITERATIONS } from './types.js';
export { ShellVerifyExecutor, createShellVerifyExecutor, getDefaultShellVerifyExecutor, resetDefaultShellVerifyExecutor, } from './shell-verify-executor.js';
export type { GateShellVerifyResult, ShellVerifyFeedback, ShellVerifyFeedbackType, } from './shell-verify-message-formatter.js';
export { truncateForDisplay, extractErrorOutput, formatBounceBackMessage, formatEscalationMessage, createBounceBackFeedback, createEscalationFeedback, formatGateShellVerifySection, } from './shell-verify-message-formatter.js';
export type { VerifyActiveStateStoreConfig } from './verify-active-state-store.js';
export { VerifyActiveStateStore, createVerifyActiveStateStore, } from './verify-active-state-store.js';
