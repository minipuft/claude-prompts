// @lifecycle canonical - Core prompt engine orchestrator exports.
/**
 * Prompt Engine Core Module Exports
 *
 * This index file provides unified access to all core prompt engine functionality
 * to resolve module resolution issues in CI/CD environments.
 */

// Re-export the main execution service (excluding conflicting types)
export { PromptExecutor, createPromptExecutor, cleanupPromptExecutor } from './prompt-executor.js';

// Re-export pipeline construction
export { PipelineBuilder } from './pipeline-builder.js';
export type { PipelineDependencies } from './pipeline-dependencies.js';

// Re-export all core types and interfaces (primary source for PromptClassification)
export * from './types.js';
