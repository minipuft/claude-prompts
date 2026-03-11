/**
 * Type definitions for the prompt management system
 *
 * This file is a backward-compatibility re-export layer.
 * Canonical type definitions live in shared/types/ sub-modules.
 */
export type { AdvancedConfig, AnalysisConfig, BaseMessageContent, ChainSessionConfig, Config, ExecutionConfig, FrameworkInjectionConfig, FrameworksConfig, LLMIntegrationConfig, LLMProvider, LoggingConfig, Message, MessageContent, MessageRole, MethodologiesConfig, PromptsConfig, ResourcesConfig, SemanticAnalysisConfig, ServerConfig, TextMessageContent, ToolDescriptionsOptions, TransportMode, VerificationConfig, VersioningConfig, } from './shared/types/core-config.js';
export { DEFAULT_VERSIONING_CONFIG } from './shared/types/core-config.js';
export type { GatesConfig } from './shared/types/core-config.js';
export type { PromptArgument } from './shared/types/index.js';
export type { Category, PromptData, PromptsFile, PromptFile, PromptsConfigFile, } from './modules/prompts/types.js';
