import { parseLLMReview } from './llm-review-parser.js';
import type { GateDefinitionProvider } from './gate-loader.js';
import type { GateReviewPrompt } from '../../execution/types.js';
import type { JudgeEvaluationDefaults } from '../judge/types.js';
import type { LightweightGateDefinition } from '../types.js';
export interface ReviewPromptTimestamps {
    createdAt?: number;
    updatedAt?: number;
    previousResponseAt?: number;
}
export interface ComposedReviewPrompt {
    combinedPrompt: string;
    gateIds: string[];
    instructions: string[];
    prompts: GateReviewPrompt[];
    createdAt: number;
    metadata: {
        previousResponse?: string;
        retryHints: string[];
        timestamps?: ReviewPromptTimestamps;
    };
}
/**
 * Build a deduplicated list of explicit review instructions pulled from gate prompts.
 * Falls back to the default instruction set when gates omit their own directives.
 */
export declare function buildReviewInstructions(prompts: GateReviewPrompt[]): string[];
/**
 * Compose a unified markdown prompt covering every gate review request.
 */
export declare function composeReviewPrompt(prompts: GateReviewPrompt[], previousResponse?: string, retryHints?: string[], timestamps?: ReviewPromptTimestamps): ComposedReviewPrompt;
/**
 * Categorize gate IDs into judge and self gates based on evaluation config.
 * Gates that cannot be loaded are silently skipped.
 */
export declare function resolveJudgeGates(gateIds: string[], loader: GateDefinitionProvider, globalDefaults?: Partial<JudgeEvaluationDefaults>): Promise<{
    judgeGates: LightweightGateDefinition[];
    selfGates: LightweightGateDefinition[];
}>;
export interface ComposedJudgeReviewPrompt {
    hasJudgeGates: boolean;
    judgePrompt: string;
    judgeGateIds: string[];
    modelHint?: string;
}
/**
 * Compose a context-isolated judge review prompt from judge-mode gates.
 * Delegates to judge-prompt-builder primitives for envelope construction and rendering.
 * Strips all generation context — judge sees only output + criteria.
 */
export declare function composeJudgeReviewPrompt(judgeGates: LightweightGateDefinition[], output: string): ComposedJudgeReviewPrompt;
export { parseLLMReview };
