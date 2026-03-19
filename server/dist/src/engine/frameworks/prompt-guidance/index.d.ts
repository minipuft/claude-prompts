/**
 * Prompt Guidance System Index
 *
 * Central exports for the prompt guidance system that provides intelligent
 * methodology integration for MCP prompts.
 *
 * The prompt guidance system consists of:
 * - PromptGuidanceService: Unified service orchestrating all guidance components
 * - TemplateEnhancer: Enhances user templates with methodology-specific guidance
 *
 * Active framework state is read from FrameworkManager (SQLite-backed via FrameworkStateStore).
 */
export { TemplateEnhancer, createTemplateEnhancer, type TemplateEnhancerConfig, } from './template-enhancer.js';
export { PromptGuidanceService, createPromptGuidanceService, type PromptGuidanceServiceConfig, } from './service.js';
export type { PromptGuidanceResult as ServicePromptGuidanceResult } from './service.js';
export type { MethodologyState, MethodologySwitchRequest, PromptGuidanceConfig, PromptGuidanceResult, SystemPromptInjectionResult, TemplateProcessingGuidance, } from '../types/index.js';
