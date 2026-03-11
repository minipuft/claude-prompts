/**
 * Prompt Loader Module
 * Handles loading prompts from category-specific configuration files and markdown templates
 *
 * Features:
 * - Runtime JSON parsing for prompts.json files
 * - Markdown file loading with section extraction
 * - Configurable caching for performance (parity with GateDefinitionLoader)
 * - Category-based organization
 * - YAML prompt discovery and loading (delegated to yaml-prompt-loader)
 *
 * @see GateDefinitionLoader for the caching pattern this follows
 */
import { CategoryManager } from './category-manager.js';
import { type LoadedPromptFile } from './yaml-prompt-loader.js';
import { type Logger } from '../../shared/types/index.js';
import type { CategoryPromptsResult, PromptData } from './types.js';
export type { LoadedPromptFile } from './yaml-prompt-loader.js';
/**
 * Configuration for PromptLoader
 */
export interface PromptLoaderConfig {
    /** Enable caching of loaded prompt files (default: true) */
    enableCache?: boolean;
    /** Log debug information */
    debug?: boolean;
}
/**
 * Statistics from the loader
 */
export interface PromptLoaderStats {
    /** Number of cached prompt files */
    cacheSize: number;
    /** Cache hit count */
    cacheHits: number;
    /** Cache miss count */
    cacheMisses: number;
    /** Number of load errors encountered */
    loadErrors: number;
}
/**
 * Prompt Loader class
 *
 * Provides loading of prompt definitions from JSON config files and markdown templates.
 * Includes configurable caching for performance optimization.
 *
 * @example
 * ```typescript
 * const loader = new PromptLoader(logger, { enableCache: true });
 *
 * // Load prompts from config
 * const { promptsData, categories } = await loader.loadCategoryPrompts('prompts/promptsConfig.json');
 *
 * // Load individual prompt file (cached)
 * const promptContent = await loader.loadPromptFile('development/code_review.md', 'prompts');
 *
 * // Clear cache when files change
 * loader.clearCache();
 * ```
 */
export declare class PromptLoader {
    private logger;
    private categoryManager;
    private enableCache;
    private debug;
    private promptFileCache;
    private stats;
    constructor(logger: Logger, config?: PromptLoaderConfig);
    /**
     * Clear the prompt file cache (all or specific file)
     *
     * @param filePath - Optional specific file path to clear; if omitted, clears all
     */
    clearCache(filePath?: string): void;
    /**
     * Get loader statistics
     */
    getStats(): PromptLoaderStats;
    /**
     * Load prompts from category-specific prompts.json files
     */
    loadCategoryPrompts(configPath: string): Promise<CategoryPromptsResult>;
    /**
     * Get the CategoryManager instance for external access
     */
    getCategoryManager(): CategoryManager;
    /**
     * Load prompts using directory-based discovery (no JSON registry required).
     *
     * This is the modern approach that treats the directory structure as the source of truth:
     * - Each subdirectory under promptsDir is a category
     * - Category metadata is derived from directory name (can be enhanced with category.yaml)
     * - Prompts are discovered via YAML files (both directory and single-file formats)
     *
     * @param promptsDir - Base directory containing category subdirectories
     * @returns Loaded prompts and discovered categories
     */
    loadFromDirectories(promptsDir: string): Promise<CategoryPromptsResult>;
    /**
     * Format a category ID into a human-readable name.
     * Example: "codebase-setup" -> "Codebase Setup"
     */
    private formatCategoryName;
    /**
     * Load prompt content from markdown file or YAML directory
     *
     * Uses caching when enabled to avoid repeated file reads.
     * Supports both legacy markdown format and new YAML directory format.
     *
     * @param filePath - Relative path to the prompt file (markdown or prompt.yaml)
     * @param basePath - Base directory for prompt files
     * @returns Parsed prompt content with system message, user template, and optional chain steps
     */
    loadPromptFile(filePath: string, basePath: string): Promise<LoadedPromptFile>;
    /**
     * Check if caching is enabled
     */
    isCacheEnabled(): boolean;
    /**
     * Enable or disable caching at runtime
     */
    setCacheEnabled(enabled: boolean): void;
    /** Build the shared context for YAML loading functions. */
    private get yamlCtx();
    /**
     * Discover YAML-based prompts in a category directory.
     * @see discoverYamlPrompts in yaml-prompt-loader.ts for full documentation.
     */
    discoverYamlPrompts(categoryDir: string, prefix?: string): string[];
    /**
     * Load a prompt from YAML format (directory or single file).
     * @see loadYamlPrompt in yaml-prompt-loader.ts for full documentation.
     */
    loadYamlPrompt(promptPath: string, categoryRoot?: string): {
        promptData: PromptData;
        loadedContent: LoadedPromptFile;
    } | null;
    /**
     * Load all YAML prompts from a category directory.
     * @see loadAllYamlPrompts in yaml-prompt-loader.ts for full documentation.
     */
    loadAllYamlPrompts(categoryDir: string): PromptData[];
    /**
     * Check if a directory contains YAML-format prompts.
     */
    hasYamlPrompts(categoryDir: string): boolean;
}
