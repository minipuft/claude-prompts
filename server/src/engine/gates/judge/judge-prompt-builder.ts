// @lifecycle canonical - Builds strict judge evaluation prompts.
/**
 * Judge Prompt Builder
 *
 * Constructs context-isolated evaluation prompts for gate judge mode.
 * The judge sub-agent receives ONLY the output + criteria — no generation
 * reasoning, chain history, or framework context. This prevents context
 * contamination and self-evaluation bias.
 *
 * Uses the same `GATE_REVIEW: PASS|FAIL - reason` verdict format as
 * self-review, so existing verdict parsing works unchanged.
 */

import { GATE_VERDICT_REQUIRED_FORMAT } from '../core/gate-verdict-contract.js';

import type {
  JudgeEnvelope,
  JudgeEvaluationConfig,
  JudgeEvaluationDefaults,
  ResolvedJudgeConfig,
} from './types.js';

/**
 * Resolve per-gate evaluation config against global defaults.
 * Gate-level settings override global defaults.
 *
 * Resolution hierarchy: gate.evaluation.mode > config.gates.evaluation.defaultMode > 'self'
 */
export function resolveJudgeConfig(
  gateConfig?: Partial<JudgeEvaluationConfig>,
  globalDefaults?: Partial<JudgeEvaluationDefaults>
): ResolvedJudgeConfig {
  const mode = gateConfig?.mode ?? globalDefaults?.defaultMode ?? 'self';
  const model = gateConfig?.model ?? globalDefaults?.defaultModel;
  const strict = gateConfig?.strict ?? globalDefaults?.strict ?? mode === 'judge';

  return { mode, model, strict };
}

/**
 * Build a judge evaluation envelope from gate criteria and output.
 * Strips all generation context — judge sees only output + criteria.
 */
export function buildJudgeEnvelope(
  output: string,
  gateName: string,
  gateId: string,
  criteria: readonly string[],
  strict: boolean = true
): JudgeEnvelope {
  return {
    output,
    criteria,
    gateName,
    gateId,
    strict,
    verdictFormat: GATE_VERDICT_REQUIRED_FORMAT,
  };
}

/**
 * Render a judge evaluation prompt from a JudgeEnvelope.
 * This is the actual text sent to the judge sub-agent.
 *
 * Key design decisions:
 * - "You did NOT produce this output" — prevents self-identification bias
 * - "List failures FIRST" — strict framing forces evidence-based evaluation
 * - No generation reasoning included — prevents context contamination
 * - Standard verdict format — reuses existing verdict parsing infrastructure
 */
export function renderJudgePrompt(envelope: JudgeEnvelope): string {
  const sections: string[] = [];

  // Header — establish role and independence
  sections.push('## Judge Evaluation — Independent Quality Audit');
  sections.push('');
  sections.push(
    'You are an independent quality reviewer. ' +
      'Evaluate the following output against the criteria below.'
  );
  sections.push('');
  sections.push('**IMPORTANT: You did NOT produce this output. Evaluate it objectively.**');

  // Output section — the ONLY content from the original execution
  sections.push('');
  sections.push('### Output Under Review');
  sections.push('');
  sections.push('```');
  sections.push(envelope.output);
  sections.push('```');

  // Criteria section
  sections.push('');
  sections.push(`### Evaluation Criteria (${envelope.gateName})`);
  sections.push('');
  for (const criterion of envelope.criteria) {
    sections.push(`- ${criterion}`);
  }

  // Evaluation protocol — strict or balanced
  sections.push('');
  sections.push('### Evaluation Protocol');
  sections.push('');

  if (envelope.strict) {
    sections.push('1. For each criterion, list specific ways the output **FAILS** to meet it');
    sections.push('2. Provide direct evidence from the output for each failure');
    sections.push('3. Only PASS if you cannot find genuine failures after thorough examination');
  } else {
    sections.push('1. For each criterion, assess whether the output meets the requirement');
    sections.push('2. Provide evidence from the output supporting your assessment');
    sections.push('3. PASS if the output substantially meets all criteria; FAIL otherwise');
  }

  // Verdict format
  sections.push('');
  sections.push(`Respond with: \`${envelope.verdictFormat}\``);

  return sections.join('\n');
}

/**
 * Check if a gate should use judge evaluation mode.
 */
export function isJudgeMode(resolved: ResolvedJudgeConfig): boolean {
  return resolved.mode === 'judge';
}
