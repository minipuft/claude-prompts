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
import type { JudgeEnvelope, JudgeEvaluationConfig, JudgeEvaluationDefaults, ResolvedJudgeConfig } from './types.js';
/**
 * Resolve per-gate evaluation config against global defaults.
 * Gate-level settings override global defaults.
 *
 * Resolution hierarchy: gate.evaluation.mode > config.gates.evaluation.defaultMode > 'self'
 */
export declare function resolveJudgeConfig(gateConfig?: Partial<JudgeEvaluationConfig>, globalDefaults?: Partial<JudgeEvaluationDefaults>): ResolvedJudgeConfig;
/**
 * Build a judge evaluation envelope from gate criteria and output.
 * Strips all generation context — judge sees only output + criteria.
 */
export declare function buildJudgeEnvelope(output: string, gateName: string, gateId: string, criteria: readonly string[], strict?: boolean): JudgeEnvelope;
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
export declare function renderJudgePrompt(envelope: JudgeEnvelope): string;
/**
 * Check if a gate should use judge evaluation mode.
 */
export declare function isJudgeMode(resolved: ResolvedJudgeConfig): boolean;
