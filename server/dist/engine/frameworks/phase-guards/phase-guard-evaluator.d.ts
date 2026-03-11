/**
 * Phase Guard Evaluator
 *
 * Pure-function service that evaluates LLM output against methodology phase guards.
 * Zero external dependencies. Takes output text + phase definitions, returns structured results.
 */
import type { PhaseGuardEvaluationResult } from './types.js';
import type { ProcessingStep } from '../types/methodology-types.js';
/**
 * Evaluate LLM output against all phase guards.
 *
 * Only phases with both a `section_header` and `guards` are checked.
 * Phases without guards are silently skipped.
 *
 * @param output - Full LLM output text
 * @param phases - Processing steps from methodology (may include steps without guards)
 * @returns Structured evaluation result with per-phase details and concatenated feedback
 */
export declare function evaluatePhaseGuards(output: string, phases: ProcessingStep[]): PhaseGuardEvaluationResult;
/**
 * Build a structured markdown summary of passed phase guard results.
 * Injected into gate review prompts so the LLM reviewer knows structure is verified
 * and can focus on content quality.
 */
export declare function buildPhaseGuardPassSummary(result: PhaseGuardEvaluationResult): string;
