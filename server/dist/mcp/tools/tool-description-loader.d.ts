/**
 * Tool Description Manager
 *
 * Manages externalized tool descriptions with methodology-aware overlays.
 * Methodology-specific overlays are sourced solely from runtime YAML definitions (SOT); config
 * may define baseline/non-methodology text but methodology entries are ignored (warned).
 *
 * Base descriptions loaded from generated contracts (tool-descriptions.contracts.json).
 * Methodology overlays applied in-memory from YAML guides. No file persistence needed —
 * the in-memory descriptions Map is the runtime source of truth.
 */
import { EventEmitter } from 'events';
import { FrameworkStateStore } from '../../engine/frameworks/framework-state-store.js';
import type { ConfigManager, Logger, ToolDescription } from '../../shared/types/index.js';
export declare function getDefaultToolDescription(toolName: string): ToolDescription | undefined;
/**
 * Manages tool descriptions loaded from generated contracts with methodology overlays.
 *
 * Load flow:
 *   contracts JSON → in-memory Map → methodology overlays applied → getDescription() serves result
 *
 * No file persistence — the Map IS the runtime state.
 */
export declare class ToolDescriptionLoader extends EventEmitter {
    private logger;
    private configPath;
    private descriptions;
    private defaults;
    private methodologyDescriptions;
    private isInitialized;
    private configManager;
    private frameworksConfig;
    private frameworksConfigListener;
    private frameworkStateStore?;
    private lastLoadSource;
    private frameworkSwitchedListener?;
    private frameworkToggledListener?;
    constructor(logger: Logger, configManager: ConfigManager);
    /**
     * Normalize methodology keys for consistent lookup (case-insensitive)
     */
    private normalizeMethodologyKey;
    /**
     * Create default descriptions as fallback
     */
    private createDefaults;
    /**
     * Warn if config attempts to define methodology-specific overlays (YAML is SOT for methodology).
     */
    private warnOnMethodologyConfigLeak;
    /**
     * Pre-load all methodology descriptions for dynamic switching
     * Uses RuntimeMethodologyLoader for YAML-based methodology loading
     */
    private preloadMethodologyDescriptions;
    private readToolDescriptionsConfig;
    private createConfigFromMap;
    private loadBaseConfig;
    private setDescriptionsFromConfig;
    private getActiveFrameworkContext;
    private buildActiveConfig;
    /**
     * Synchronize in-memory descriptions from contracts + methodology overlays.
     */
    private synchronize;
    setFrameworkStateStore(frameworkStateStore: FrameworkStateStore): void;
    /**
     * Initialize by loading descriptions from contracts and applying methodology overlays
     */
    initialize(): Promise<void>;
    /**
     * Get description for a specific tool with corrected priority hierarchy
     */
    getDescription(toolName: string, frameworkEnabled?: boolean, activeMethodology?: string, options?: {
        applyMethodologyOverride?: boolean;
    }): string;
    /**
     * Get parameter description for a specific tool parameter
     */
    getParameterDescription(toolName: string, paramName: string, frameworkEnabled?: boolean, activeMethodology?: string, options?: {
        applyMethodologyOverride?: boolean;
    }): string | undefined;
    /**
     * Get all available tool names
     */
    getAvailableTools(): string[];
    /**
     * Check if manager is properly initialized
     */
    isReady(): boolean;
    /**
     * Get contracts source path for debugging
     */
    getConfigPath(): string;
    /**
     * Get statistics about loaded descriptions
     */
    getStats(): {
        totalDescriptions: number;
        loadedFromFile: number;
        usingDefaults: number;
        configPath: string;
        isInitialized: boolean;
        source: string;
    };
    /**
     * Reload descriptions from contracts and reapply methodology overlays
     */
    reload(): Promise<void>;
    /**
     * Cleanup resources on shutdown
     */
    shutdown(): void;
}
/**
 * Factory function following established pattern
 */
export declare function createToolDescriptionLoader(logger: Logger, configManager: ConfigManager): ToolDescriptionLoader;
