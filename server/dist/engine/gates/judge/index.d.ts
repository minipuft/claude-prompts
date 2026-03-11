/**
 * Judge Evaluation Module
 *
 * Context-isolated gate evaluation via delegation. When a gate has
 * `evaluation.mode: 'judge'`, the review is rendered as a delegation CTA
 * with strict (failure-first) framing instead of a self-review prompt.
 *
 * ```
 * gate.yaml evaluation.mode → resolveJudgeConfig() → buildJudgeEnvelope() → renderJudgePrompt()
 *                                      ↑                                            ↓
 *                            config.json defaults                    Standard GATE_REVIEW verdict
 * ```
 */
export type { JudgeEvaluationMode, JudgeEvaluationConfig, JudgeEnvelope, JudgeEvaluationDefaults, ResolvedJudgeConfig, } from './types.js';
export { resolveJudgeConfig, buildJudgeEnvelope, renderJudgePrompt, isJudgeMode, } from './judge-prompt-builder.js';
export { JudgeResourceCollector, type ResourceMenu } from './judge-resource-collector.js';
export { JudgeMenuFormatter, type OperatorContext } from './judge-menu-formatter.js';
