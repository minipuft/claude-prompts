/**
 * cli-shared — Re-export barrel for schemas and utilities shared between server and CLI.
 *
 * CRITICAL CONSTRAINT: This module uses ONLY relative imports.
 * No @shared/*, @engine/*, @modules/* path aliases.
 * This keeps the dependency graph transparent for the CLI's esbuild alias.
 *
 * Import isolation is enforced by:
 *   1. dependency-cruiser rule `cli-shared-no-runtime`
 *   2. Unit test `import-isolation.test.ts`
 */
export { ArgumentValidationSchema, PromptArgumentSchema, ChainStepSchema, PromptGateConfigurationSchema, CategorySchema, PromptDataSchema, PromptsFileSchema, PromptsConfigSchema, PromptYamlSchema, validatePromptYaml, isValidPromptYaml, validatePromptSchema, validatePromptsFile, validatePromptsConfig, isValidPromptData, isValidCategory, type ArgumentValidationYaml, type PromptArgumentYaml, type ChainStepYaml, type PromptGateConfigurationYaml, type CategoryYaml, type PromptDataYaml, type PromptsFileYaml, type PromptsConfigYaml, type PromptYaml, type PromptYamlValidationResult, type PromptSchemaValidationResult, } from '../modules/prompts/prompt-schema.js';
export { GatePassCriteriaSchema, GateActivationSchema, GateRetryConfigSchema, GateDefinitionSchema, validateGateSchema, isValidGateDefinition, type GatePassCriteriaYaml, type GateActivationYaml, type GateRetryConfigYaml, type GateDefinitionYaml, type GateSchemaValidationResult, } from '../engine/gates/core/gate-schema.js';
export { MethodologyGateSchema, TemplateSuggestionSchema, MethodologySchema, validateMethodologySchema, type MethodologyGate, type TemplateSuggestion, type MethodologyYaml, type MethodologySchemaValidationResult, } from '../engine/frameworks/methodology/methodology-schema.js';
export { StyleActivationSchema, StyleDefinitionSchema, validateStyleSchema, isValidStyleDefinition, type StyleActivationYaml, type StyleDefinitionYaml, type StyleSchemaValidationResult, } from '../modules/formatting/core/style-schema.js';
export { parseYaml, parseYamlOrThrow, serializeYaml, formatYamlError, loadYamlFile, loadYamlFileSync, loadYamlFileWithResult, discoverYamlFiles, discoverYamlDirectories, discoverNestedYamlDirectories, isYamlFile, getYamlBaseName, type YamlParseOptions, type YamlParseError, type YamlParseResult, type YamlFileLoadOptions, type YamlFileLoadResult, } from '../shared/utils/yaml/index.js';
export type { VersionEntry, HistoryFile, SaveVersionResult, RollbackResult, SaveVersionOptions, } from '../modules/versioning/types.js';
export { loadHistory, getVersion, compareVersions, saveVersion, rollbackVersion, deleteHistoryFile, renameHistoryResource, formatHistoryTable, } from './version-history.js';
export { createResourceDir, deleteResourceDir, resourceExists } from './resource-scaffold.js';
export type { CreateResourceOptions, CreateResourceResult } from './resource-scaffold.js';
export { validateResourceDocument, validateResourceFile, formatValidationIssues, type ResourceValidationType, type ResourceValidationIssue, type ResourceValidationResult, } from './resource-validation.js';
export { renameResource, movePromptCategory, toggleEnabled, linkGate, runValidatedMutation, type RenameResult, type MoveResult, type ToggleResult, type LinkGateResult, type ResourceMutationResult, type ValidatedMutationOptions, type ValidatedMutationResult, } from './resource-operations.js';
export { CONFIG_VALID_KEYS, CONFIG_RESTART_REQUIRED_KEYS, validateConfigInput, type ConfigKey, type ConfigInputValidationResult, } from './config-input-validator.js';
export { resolveConfigPath, readConfig, getConfigValue, setConfigValue, writeConfigAtomic, backupConfig, generateDefaultConfig, initConfig, validateConfig, getConfigKeyInfo, type ConfigReadResult, type ConfigSetResult, type ConfigInitResult, type ConfigValidationResult, type ConfigKeyInfo, } from './config-operations.js';
export { initWorkspace, formatStarterPromptYaml, STARTER_PROMPTS } from './workspace-init.js';
export type { StarterPrompt, WorkspaceInitResult } from './workspace-init.js';
