/**
 * Tool Description Loader
 *
 * Manages externalized tool descriptions with methodology-aware overlays.
 * Base descriptions loaded from generated contracts (tool-descriptions.contracts.json).
 * Overlay resolution delegated to tool-description-overlays.ts.
 *
 * No file persistence — the in-memory descriptions Map is the runtime source of truth.
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
 */
export declare class ToolDescriptionLoader extends EventEmitter {
    private logger;
    private configPath;
    private descriptions;
    private defaults;
    private methodologyDescriptions;
    private styleDescriptions;
    private isInitialized;
    private configManager;
    private frameworksConfig;
    private frameworksConfigListener;
    private frameworkStateStore?;
    private lastLoadSource;
    private frameworkSwitchedListener?;
    private frameworkToggledListener?;
    constructor(logger: Logger, configManager: ConfigManager);
    private warnOnMethodologyConfigLeak;
    private readToolDescriptionsConfig;
    private loadBaseConfig;
    private setDescriptionsFromConfig;
    private getActiveFrameworkContext;
    getStyleResponseFormat(toolName: string, styleId: string): string | undefined;
    hasMethodologyResponseFormat(toolName: string): boolean;
    private synchronize;
    setFrameworkStateStore(frameworkStateStore: FrameworkStateStore): void;
    initialize(): Promise<void>;
    getDescription(toolName: string, frameworkEnabled?: boolean, activeMethodology?: string, options?: {
        applyMethodologyOverride?: boolean;
    }): string;
    getParameterDescription(toolName: string, paramName: string, frameworkEnabled?: boolean, activeMethodology?: string, options?: {
        applyMethodologyOverride?: boolean;
    }): string | undefined;
    getAvailableTools(): string[];
    isReady(): boolean;
    getConfigPath(): string;
    getStats(): {
        totalDescriptions: number;
        loadedFromFile: number;
        usingDefaults: number;
        configPath: string;
        isInitialized: boolean;
        source: string;
    };
    reload(): Promise<void>;
    shutdown(): void;
}
export declare function createToolDescriptionLoader(logger: Logger, configManager: ConfigManager): ToolDescriptionLoader;
