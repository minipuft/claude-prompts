/**
 * Config Input Validator — Pure validation for config.json keys and values.
 *
 * Extracted from mcp/tools/config-utils.ts to satisfy cli-shared isolation
 * (no runtime dependencies). SafeConfigWriter re-imports from here.
 */
export declare const CONFIG_VALID_KEYS: readonly ["server.name", "server.port", "server.transport", "logging.level", "logging.directory", "gates.mode", "gates.methodologyGates", "execution.judge", "methodologies.mode", "methodologies.dynamicToolDescriptions", "methodologies.systemPromptFrequency", "methodologies.styleGuidance", "resources.mode", "resources.prompts.mode", "resources.prompts.defaultRegistration", "resources.gates.mode", "resources.methodologies.mode", "resources.observability.mode", "resources.observability.sessions", "resources.observability.metrics", "resources.logs.mode", "resources.logs.maxEntries", "resources.logs.defaultLevel", "identity.mode", "identity.launchDefaults.organizationId", "identity.launchDefaults.workspaceId", "identity.launchDefaults.clientFamily", "identity.launchDefaults.clientId", "identity.launchDefaults.clientVersion", "identity.launchDefaults.delegationProfile", "identity.allowPerRequestOverride", "verification.inContextAttempts", "verification.isolation.mode", "verification.isolation.timeout", "analysis.semanticAnalysis.llmIntegration.mode", "analysis.semanticAnalysis.llmIntegration.endpoint", "analysis.semanticAnalysis.llmIntegration.model", "analysis.semanticAnalysis.llmIntegration.maxTokens", "analysis.semanticAnalysis.llmIntegration.temperature", "versioning.mode", "versioning.maxVersions", "prompts.directory", "gates.directory", "gates.enforcePendingVerdict", "hooks.expandedOutput", "phaseGuards.mode", "phaseGuards.maxRetries", "advanced.sessions.timeoutMinutes", "advanced.sessions.reviewTimeoutMinutes", "advanced.sessions.cleanupIntervalMinutes", "gates.enabled", "methodologies.enabled", "prompts.registerWithMcp", "resources.registerWithMcp", "resources.prompts.enabled", "resources.gates.enabled", "resources.methodologies.enabled", "resources.observability.enabled", "resources.logs.enabled", "verification.isolation.enabled", "verification.isolation.maxBudget", "verification.isolation.permissionMode", "versioning.enabled", "versioning.autoVersion"];
export type ConfigKey = (typeof CONFIG_VALID_KEYS)[number];
export declare const CONFIG_RESTART_REQUIRED_KEYS: ConfigKey[];
export interface ConfigInputValidationResult {
    valid: boolean;
    error?: string;
    convertedValue?: any;
    valueType?: 'string' | 'number' | 'boolean';
}
export declare function validateConfigInput(key: string, value: string): ConfigInputValidationResult;
