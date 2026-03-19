/**
 * Template Enhancer - Resource-Driven Implementation
 *
 * Enhances user templates by applying lightweight structural guidance.
 *
 * Architecture Shift:
 * - Legacy: Hardcoded TypeScript methods generating strings.
 * - Modern: DYNAMIC injection of Markdown resources loaded by PromptAssetManager.
 */
import { Logger } from '../../../infra/logging/index.js';
import type { ConvertedPrompt } from '../../execution/types.js';
/**
 * Template enhancement configuration
 */
export interface TemplateEnhancerConfig {
    enableArgumentSuggestions: boolean;
    enableStructureOptimization: boolean;
}
/**
 * Template Enhancer
 *
 * Applies lightweight structure improvements to user templates.
 */
export declare class TemplateEnhancer {
    private logger;
    private config;
    constructor(logger: Logger, config?: Partial<TemplateEnhancerConfig>);
    /**
     * Enhance template by injecting selected resources
     * Resource-Driven Architecture
     */
    enhanceTemplate(template: string, prompt: ConvertedPrompt, _methodologyGuide?: any, _framework?: any, _context?: any): Promise<{
        originalTemplate: string;
        enhancedTemplate: string;
        validation: {
            score: number;
            passed: boolean;
        };
        metadata: any;
    }>;
    /**
     * Update enhancer configuration
     */
    updateConfig(config: Partial<TemplateEnhancerConfig>): void;
}
/**
 * Create and configure a TemplateEnhancer instance
 */
export declare function createTemplateEnhancer(logger: Logger, config?: Partial<TemplateEnhancerConfig>): TemplateEnhancer;
