/**
 * Prompt Asset System
 * Main module that orchestrates prompt loading, conversion, and registration
 */
export * from './converter.js';
export * from './loader.js';
export * from './registry.js';
export * from './prompt-schema.js';
export * from './category-manager.js';
import { PromptConverter } from './converter.js';
import { PromptLoader } from './loader.js';
import { PromptRegistry } from './registry.js';
import { type ConfigManager, type Logger } from '../../shared/types/index.js';
import { HotReloadObserver, type AuxiliaryReloadConfig, type HotReloadEvent as PromptHotReloadEvent } from '../hot-reload/hot-reload-observer.js';
import { ConversationStore } from '../text-refs/conversation.js';
import { TextReferenceStore } from '../text-refs/index.js';
import type { Category, CategoryPromptsResult, PromptData } from './types.js';
import type { ConvertedPrompt } from '../../engine/execution/types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Main Prompt Asset Manager class that coordinates all prompt operations
 */
export declare class PromptAssetManager {
    private logger;
    private textReferenceStore;
    private conversationStore;
    private configManager;
    private converter;
    private loader;
    private registry;
    private hotReloadObserver;
    constructor(logger: Logger, textReferenceStore: TextReferenceStore, conversationStore: ConversationStore, configManager: ConfigManager, mcpServer?: McpServer);
    /**
     * Load prompts using directory-based discovery.
     * Each subdirectory under promptsDir is a category containing YAML prompt files.
     */
    loadFromDirectories(promptsDir: string): Promise<CategoryPromptsResult>;
    /**
     * Convert markdown prompts to JSON structure
     */
    convertMarkdownPromptsToJson(promptsData: PromptData[], basePath?: string): Promise<ConvertedPrompt[]>;
    /**
     * Set prompt IDs exported as client skills (auto-deregistered from MCP).
     * Format: "category/id" (e.g., "development/review")
     */
    setExportedPromptIds(ids: Set<string>): void;
    /**
     * Register prompts with MCP server
     */
    registerAllPrompts(prompts: ConvertedPrompt[]): Promise<number>;
    /**
     * Notify clients that prompt list has changed (for hot-reload)
     */
    notifyPromptsListChanged(): Promise<void>;
    /**
     * Load and convert prompts in one operation.
     */
    loadAndConvertPrompts(configPathOrDir: string, basePath?: string): Promise<{
        promptsData: PromptData[];
        categories: Category[];
        convertedPrompts: ConvertedPrompt[];
    }>;
    /**
     * Clear the loader's file cache.
     * Call this before reloading prompts to ensure fresh content is read from disk.
     */
    clearLoaderCache(): void;
    /**
     * Complete prompt system initialization
     */
    initializePromptSystem(configPath: string, basePath?: string): Promise<{
        promptsData: PromptData[];
        categories: Category[];
        convertedPrompts: ConvertedPrompt[];
        registeredCount: number;
    }>;
    /**
     * Reload prompts (useful for hot-reloading)
     */
    reloadPrompts(configPath: string, basePath?: string): Promise<{
        promptsData: PromptData[];
        categories: Category[];
        convertedPrompts: ConvertedPrompt[];
        registeredCount: number;
    }>;
    /**
     * Start automatic file watching for hot reload
     */
    startHotReload(promptsConfigPath: string, onReloadCallback?: (event: PromptHotReloadEvent) => Promise<void>, options?: {
        methodologyHotReload?: {
            handler: (event: PromptHotReloadEvent) => Promise<void>;
            directories?: string[];
        };
        auxiliaryReloads?: AuxiliaryReloadConfig[];
    }): Promise<void>;
    /**
     * Stop automatic file watching
     */
    stopHotReload(): Promise<void>;
    private logCategoryBreakdown;
    private logConversionSummary;
    getModules(): {
        converter: PromptConverter;
        loader: PromptLoader;
        registry: PromptRegistry | undefined;
        categoryManager: import("./category-manager.js").CategoryManager;
        hotReloadObserver: HotReloadObserver | undefined;
    };
    getTextReferenceStore(): TextReferenceStore;
    /**
     * Get system statistics
     */
    getStats(prompts?: ConvertedPrompt[]): any;
    /**
     * Shutdown prompt assets and cleanup resources
     * Prevents async handle leaks by stopping hot reload manager
     */
    shutdown(): Promise<void>;
}
