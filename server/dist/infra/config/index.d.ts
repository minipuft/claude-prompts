/**
 * Configuration Management Module
 * Handles loading and validation of server configuration from config.json
 */
import { EventEmitter } from 'events';
import { Config, AnalysisConfig, SemanticAnalysisConfig, LoggingConfig, FrameworksConfig, ExecutionConfig, ChainSessionConfig, TransportMode, VersioningConfig, ResourcesConfig, type InjectionConfig, type ConfigManager, type GatesConfig } from '../../shared/types/index.js';
/**
 * Configuration manager class
 */
export declare class ConfigLoader extends EventEmitter implements ConfigManager {
    private config;
    private configPath;
    private fileWatcher;
    private watching;
    private reloadDebounceTimer;
    private frameworksConfigCache;
    constructor(configPath: string);
    /**
     * Load configuration from file
     */
    loadConfig(): Promise<Config>;
    /**
     * Get current configuration
     */
    getConfig(): Config;
    /**
     * Get server configuration
     */
    getServerConfig(): import("../../shared/types/core-config.js").ServerConfig;
    /**
     * Get prompts configuration
     */
    getPromptsConfig(): import("../../shared/types/core-config.js").PromptsConfig;
    /**
     * Get global registerWithMcp default from prompts config
     * Returns undefined if not specified (allowing downstream defaults)
     */
    getPromptsRegisterWithMcp(): boolean | undefined;
    /**
     * Get the transport mode from config
     * Priority: CLI args (handled by caller) > config.transport > default
     */
    getTransportMode(): TransportMode;
    /**
     * Get analysis configuration
     */
    getAnalysisConfig(): AnalysisConfig;
    /**
     * Get semantic analysis configuration
     */
    getSemanticAnalysisConfig(): SemanticAnalysisConfig;
    /**
     * Get logging configuration with environment variable override
     * Supports LOG_LEVEL env var to override configured log level
     */
    getLoggingConfig(): LoggingConfig;
    /**
     * Get frameworks configuration (includes injection settings)
     * Reads from methodologies config section
     */
    getFrameworksConfig(): FrameworksConfig;
    /**
     * Get gates configuration (unified gate settings)
     * Reads from gates config section with new property names
     */
    getGatesConfig(): GatesConfig;
    /**
     * Get chain session lifecycle configuration
     * Reads from advanced.sessions config section
     */
    getChainSessionConfig(): ChainSessionConfig;
    /**
     * Get execution strategy configuration
     */
    getExecutionConfig(): ExecutionConfig;
    /**
     * Get judge enabled status (convenience method)
     */
    isJudgeEnabled(): boolean;
    /**
     * Get versioning configuration for resource history tracking
     */
    getVersioningConfig(): VersioningConfig;
    /**
     * Get MCP resources configuration
     */
    getResourcesConfig(): ResourcesConfig;
    /**
     * Get injection config for the internal InjectionDecisionService.
     * Translates from the user-friendly frameworks.injection format to the internal format.
     */
    getInjectionConfig(): InjectionConfig;
    /**
     * Get the port number, with environment variable override
     */
    getPort(): number;
    /**
     * Get config file path
     */
    getConfigPath(): string;
    /**
     * Get prompts directory path relative to config directory
     * @deprecated Use getPromptsDirectory() for YAML-based prompt discovery
     */
    getPromptsFilePath(): string;
    /**
     * Get prompts directory path (for YAML-based prompt discovery)
     * Resolves the prompts directory from config
     */
    getPromptsDirectory(): string;
    /**
     * Resolve prompts directory path with environment overrides and absolute fallback.
     *
     * Priority:
     *   1. overridePath parameter
     *   2. MCP_PROMPTS_PATH environment variable
     *   3. config.prompts.directory setting
     *
     * Note: PathResolver is the preferred source of truth for path resolution.
     * This method exists for backward compatibility and simple use cases.
     */
    getResolvedPromptsFilePath(overridePath?: string): string;
    /**
     * Get server root directory path
     */
    getServerRoot(): string;
    /**
     * Get gates directory path (for gate definitions)
     * Resolves to resources/gates relative to config directory
     */
    getGatesDirectory(): string;
    /**
     * Validate configuration and set defaults for missing properties
     */
    private validateAndSetDefaults;
    /**
     * Validate and merge analysis configuration with defaults
     */
    private validateAnalysisConfig;
    /**
     * Start watching the configuration file for changes
     */
    startWatching(debounceMs?: number): void;
    /**
     * Stop watching the configuration file
     */
    stopWatching(): void;
    /**
     * Shutdown the config manager and cleanup resources
     * Prevents async handle leaks by stopping file watcher and removing listeners
     */
    shutdown(): void;
    private handleExternalConfigChange;
    private emitConfigChange;
    private haveFrameworkConfigsChanged;
}
/**
 * Create and initialize a configuration manager
 */
export declare function createConfigLoader(configPath: string): Promise<ConfigLoader>;
