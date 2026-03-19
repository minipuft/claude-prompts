import type { ToolResponse } from '../../../../shared/types/index.js';
import type { MethodologyCreationData, MethodologyValidationResult } from '../core/types.js';
export declare class MethodologyValidator {
    /**
     * Validate methodology with strict requirements.
     *
     * Required fields (80% threshold):
     * - system_prompt_guidance (core LLM guidance)
     * - phases (methodology structure)
     * - methodology_gates (quality validation)
     *
     * Returns structured errors for focused user guidance.
     */
    validate(data: MethodologyCreationData): MethodologyValidationResult;
    /**
     * Create structured error response for validation failures.
     * Shows one focused error with helpful example.
     */
    createErrorResponse(id: string, validation: MethodologyValidationResult): ToolResponse;
    /**
     * Format validation result into human-readable success message.
     */
    formatSuccess(id: string, validation: MethodologyValidationResult, paths: string[]): string;
}
