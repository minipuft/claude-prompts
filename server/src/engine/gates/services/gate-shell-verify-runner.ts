// @lifecycle canonical - Runs shell_verify criteria for gates during gate review.
/**
 * Gate Shell Verify Runner
 *
 * Thin service that loads gate definitions, filters for `shell_verify` criteria,
 * executes each via ShellVerifyExecutor, and returns structured results.
 *
 * Used by GateReviewStage to surface actual command output (test failures,
 * lint errors) in the gate review feedback — instead of generic "review your work".
 */

import { getShellPreset } from '../config/shell-preset-loader.js';
import { getDefaultShellVerifyExecutor } from '../shell/shell-verify-executor.js';

import type { GateDefinitionProvider } from '../core/gate-loader.js';
import type { GateShellVerifyResult } from '../shell/shell-verify-message-formatter.js';
import type { ShellVerifyGate } from '../shell/types.js';

/**
 * Run shell verification for all gates that have `shell_verify` pass criteria.
 *
 * @param gateIds - Gate IDs from the pending review
 * @param gateDefinitionProvider - Provider to load gate definitions
 * @returns Results for each gate that had shell_verify criteria (may be empty)
 */
export async function runGateShellVerifications(
  gateIds: string[],
  gateDefinitionProvider: GateDefinitionProvider
): Promise<GateShellVerifyResult[]> {
  const results: GateShellVerifyResult[] = [];
  const executor = getDefaultShellVerifyExecutor();

  const gates = await gateDefinitionProvider.loadGates(gateIds);

  for (const gate of gates) {
    const shellCriteria = gate.pass_criteria?.filter((c) => c.type === 'shell_verify');
    if (!shellCriteria || shellCriteria.length === 0) {
      continue;
    }

    for (const criteria of shellCriteria) {
      const command = criteria.shell_command;
      if (command == null || command.trim() === '') {
        continue;
      }

      const presetValues =
        criteria.shell_preset != null ? getShellPreset(criteria.shell_preset) : undefined;

      const gateConfig: ShellVerifyGate = {
        command,
        timeout: criteria.shell_timeout ?? presetValues?.timeout,
        workingDir: criteria.shell_working_dir,
        env: criteria.shell_env,
        maxIterations: criteria.shell_max_attempts ?? presetValues?.maxIterations,
        preset: criteria.shell_preset,
      };

      const result = await executor.execute(gateConfig);

      results.push({
        gateId: gate.id,
        gateName: gate.name,
        command,
        passed: result.passed,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: result.durationMs,
        timedOut: result.timedOut,
      });
    }
  }

  return results;
}
