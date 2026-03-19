/**
 * Gate Shell Verify Runner
 *
 * Thin service that loads gate definitions, filters for `shell_verify` criteria,
 * executes each via ShellVerifyExecutor, and returns structured results.
 *
 * Used by GateReviewStage to surface actual command output (test failures,
 * lint errors) in the gate review feedback — instead of generic "review your work".
 */
import type { GateDefinitionProvider } from '../core/gate-loader.js';
import type { GateShellVerifyResult } from '../shell/shell-verify-message-formatter.js';
/**
 * Run shell verification for all gates that have `shell_verify` pass criteria.
 *
 * @param gateIds - Gate IDs from the pending review
 * @param gateDefinitionProvider - Provider to load gate definitions
 * @returns Results for each gate that had shell_verify criteria (may be empty)
 */
export declare function runGateShellVerifications(gateIds: string[], gateDefinitionProvider: GateDefinitionProvider): Promise<GateShellVerifyResult[]>;
