/**
 * Configuration Utilities for Safe Config Management
 *
 * Provides atomic config operations with backup/rollback capabilities
 * for secure configuration management in system_control tool.
 */
import { type ConfigManager, type Logger, Config } from '../../shared/types/index.js';
export declare const CONFIG_VALID_KEYS: readonly ["server.name", "server.port", "server.transport", "logging.level", "logging.directory", "gates.enabled", "gates.methodologyGates", "execution.judge", "methodologies.enabled", "methodologies.dynamicToolDescriptions", "methodologies.systemPromptFrequency", "methodologies.styleGuidance", "verification.inContextAttempts", "verification.isolation.enabled", "verification.isolation.maxBudget", "verification.isolation.timeout", "analysis.semanticAnalysis.llmIntegration.enabled", "analysis.semanticAnalysis.llmIntegration.model", "analysis.semanticAnalysis.llmIntegration.maxTokens", "analysis.semanticAnalysis.llmIntegration.temperature"];
export type ConfigKey = (typeof CONFIG_VALID_KEYS)[number];
export declare const CONFIG_RESTART_REQUIRED_KEYS: ConfigKey[];
export interface ConfigInputValidationResult {
    valid: boolean;
    error?: string;
    convertedValue?: any;
    valueType?: 'string' | 'number' | 'boolean';
}
export declare function validateConfigInput(key: string, value: string): ConfigInputValidationResult;
/**
 * Configuration write result
 */
export interface ConfigWriteResult {
    success: boolean;
    message: string;
    backupPath?: string;
    error?: string;
    restartRequired?: boolean;
}
/**
 * Configuration backup information
 */
export interface ConfigBackup {
    backupPath: string;
    timestamp: number;
    originalConfig: Config;
}
/**
 * Safe Configuration Writer
 * Provides atomic config operations with automatic backup and rollback
 */
export declare class SafeConfigWriter {
    private logger;
    private configManager;
    private configPath;
    constructor(logger: Logger, configManager: ConfigManager, configPath: string);
    /**
     * Safely update a configuration value with atomic operations
     */
    updateConfigValue(key: string, value: string, options?: {
        createBackup?: boolean;
    }): Promise<ConfigWriteResult>;
    /**
     * Create a timestamped backup of the current configuration
     */
    private createConfigBackup;
    /**
     * Restore configuration from backup
     */
    restoreFromBackup(backupPath: string): Promise<ConfigWriteResult>;
    /**
     * Write configuration file atomically (write to temp file, then rename)
     */
    private writeConfigAtomic;
    /**
     * Apply a configuration change to a config object
     */
    private applyConfigChange;
    /**
     * Validate the entire configuration object
     */
    private validateFullConfig;
    /**
     * Check if a configuration key requires server restart
     */
    private requiresRestart;
    /**
     * Get the configuration file path for debugging/info purposes
     */
    getConfigPath(): string;
}
/**
 * Create a SafeConfigWriter instance
 */
export declare function createSafeConfigWriter(logger: Logger, configManager: ConfigManager, configPath: string): SafeConfigWriter;
