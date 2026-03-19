/**
 * Config Operations — Pure file operations for config.json management.
 *
 * Uses only node:fs and node:path. No runtime dependencies.
 * Follows the same atomic-write pattern as SafeConfigWriter but synchronous
 * and without Logger/ConfigManager dependencies.
 */
export interface ConfigReadResult {
    success: boolean;
    config?: Record<string, unknown>;
    configPath?: string;
    error?: string;
}
export interface ConfigSetResult {
    success: boolean;
    key: string;
    previousValue?: unknown;
    newValue?: unknown;
    message: string;
    backupPath?: string;
    restartRequired?: boolean;
    error?: string;
}
export interface ConfigInitResult {
    success: boolean;
    created: boolean;
    configPath: string;
    message: string;
}
export interface ConfigValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface ConfigKeyInfo {
    key: string;
    type: 'string' | 'number' | 'boolean';
    description: string;
    restartRequired: boolean;
}
export declare function resolveConfigPath(workspace: string): string;
export declare function readConfig(workspace: string): ConfigReadResult;
export declare function getConfigValue(config: Record<string, unknown>, key: string): unknown;
export declare function setConfigValue(workspace: string, key: string, value: string): ConfigSetResult;
export declare function writeConfigAtomic(configPath: string, config: Record<string, unknown>): void;
export declare function backupConfig(configPath: string): string;
export declare function generateDefaultConfig(): Record<string, unknown>;
export declare function initConfig(targetPath: string): ConfigInitResult;
export declare function validateConfig(workspace: string): ConfigValidationResult;
export declare function getConfigKeyInfo(): ConfigKeyInfo[];
