// @lifecycle canonical - Loads prompt and category definitions from disk into structured data.
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

import { existsSync, readdirSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';

import { CategoryManager, createCategoryManager } from './category-manager.js';
import {
  type LoadedPromptFile,
  normalizeInlineGateDefinitions,
  discoverYamlPrompts,
  hasYamlPrompts,
  loadYamlPrompt as loadYamlPromptFn,
  loadAllYamlPrompts as loadAllYamlPromptsFn,
} from './yaml-prompt-loader.js';
import { type Logger } from '../../shared/types/index.js';
import { safeWriteFile } from '../../shared/utils/file-transactions.js';
import { loadYamlFileSync } from '../../shared/utils/yaml/index.js';

import type { Category, CategoryPromptsResult, PromptData, PromptsConfigFile } from './types.js';

// Re-export types from yaml-prompt-loader for backward compatibility
export type { LoadedPromptFile } from './yaml-prompt-loader.js';

// ============================================
// Configuration Types
// ============================================

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

// ============================================
// Prompt Loader Class
// ============================================

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
export class PromptLoader {
  private logger: Logger;
  private categoryManager: CategoryManager;
  private enableCache: boolean;
  private debug: boolean;

  // Caching infrastructure (mirrors GateDefinitionLoader pattern)
  private promptFileCache = new Map<string, LoadedPromptFile>();
  private stats = { cacheHits: 0, cacheMisses: 0, loadErrors: 0 };

  constructor(logger: Logger, config: PromptLoaderConfig = {}) {
    this.logger = logger;
    this.categoryManager = createCategoryManager(logger);
    this.enableCache = config.enableCache ?? true;
    this.debug = config.debug ?? false;

    if (this.debug) {
      this.logger.info(
        `[PromptLoader] Initialized with caching ${this.enableCache ? 'enabled' : 'disabled'}`
      );
    }
  }

  /**
   * Clear the prompt file cache (all or specific file)
   *
   * @param filePath - Optional specific file path to clear; if omitted, clears all
   */
  clearCache(filePath?: string): void {
    if (filePath) {
      const normalizedPath = filePath.toLowerCase();
      this.promptFileCache.delete(normalizedPath);
      if (this.debug) {
        this.logger.info(`[PromptLoader] Cleared cache for: ${filePath}`);
      }
    } else {
      const previousSize = this.promptFileCache.size;
      this.promptFileCache.clear();
      if (this.debug) {
        this.logger.info(`[PromptLoader] Cleared entire cache (${previousSize} entries)`);
      }
    }
  }

  /**
   * Get loader statistics
   */
  getStats(): PromptLoaderStats {
    return {
      cacheSize: this.promptFileCache.size,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      loadErrors: this.stats.loadErrors,
    };
  }

  /**
   * Load prompts from category-specific prompts.json files
   */
  async loadCategoryPrompts(configPath: string): Promise<CategoryPromptsResult> {
    try {
      this.logger.info(`🔍 PromptLoader: Starting to load category prompts from: ${configPath}`);

      // Read the promptsConfig.json file
      this.logger.info('📖 Reading promptsConfig.json file...');
      const configContent = await readFile(configPath, 'utf8');
      this.logger.info(`✓ Config file read successfully, ${configContent.length} characters`);

      let promptsConfig: PromptsConfigFile;

      try {
        this.logger.info('🔧 Parsing promptsConfig.json...');
        promptsConfig = JSON.parse(configContent) as PromptsConfigFile;
        this.logger.info('✓ Config file parsed successfully');
      } catch (jsonError) {
        this.logger.error(`❌ Error parsing config file ${configPath}:`, jsonError);
        throw new Error(
          `Invalid JSON in config file: ${
            jsonError instanceof Error ? jsonError.message : String(jsonError)
          }`
        );
      }

      // Log the parsed config structure
      this.logger.info(`📋 Config structure analysis:`);
      this.logger.info(`   - Categories defined: ${promptsConfig.categories?.length || 0}`);
      this.logger.info(`   - Import paths defined: ${promptsConfig.imports?.length || 0}`);

      if (promptsConfig.categories?.length > 0) {
        this.logger.info('📂 Categories found:');
        promptsConfig.categories.forEach((cat) => {
          this.logger.info(`   - ${cat.name} (${cat.id}): ${cat.description}`);
        });
      }

      if (promptsConfig.imports?.length > 0) {
        this.logger.info('📥 Import paths to process:');
        promptsConfig.imports.forEach((importPath, index) => {
          this.logger.info(`   ${index + 1}. ${importPath}`);
        });
      }

      // Ensure required properties exist
      if (!promptsConfig.categories) {
        this.logger.warn(
          `⚠️ Config file ${configPath} does not have a 'categories' array. Initializing it.`
        );
        promptsConfig.categories = [];
      }

      if (!promptsConfig.imports || !Array.isArray(promptsConfig.imports)) {
        this.logger.warn(
          `⚠️ Config file ${configPath} does not have a valid 'imports' array. Initializing it.`
        );
        promptsConfig.imports = [];
      }

      // Load and validate categories using CategoryManager
      const categoryValidation = await this.categoryManager.loadCategories(
        promptsConfig.categories
      );

      if (!categoryValidation.isValid) {
        this.logger.error('❌ Category validation failed:');
        categoryValidation.issues.forEach((issue) => this.logger.error(`  - ${issue}`));
        throw new Error(`Category validation failed: ${categoryValidation.issues.join('; ')}`);
      }

      if (categoryValidation.warnings.length > 0) {
        this.logger.warn('⚠️ Category validation warnings:');
        categoryValidation.warnings.forEach((warning) => this.logger.warn(`  - ${warning}`));
      }

      // Get validated categories
      const categories = this.categoryManager.getCategories();

      // Initialize an array to store all prompts
      let allPrompts: PromptData[] = [];
      let totalImportProcessed = 0;
      let totalImportsFailed = 0;

      this.logger.info(`🚀 Starting to process ${promptsConfig.imports.length} import paths...`);

      // Load prompts from each import path
      for (const importPath of promptsConfig.imports) {
        totalImportProcessed++;
        this.logger.info(
          `\n📦 Processing import ${totalImportProcessed}/${promptsConfig.imports.length}: ${importPath}`
        );

        try {
          // Construct the full path to the import file
          const fullImportPath = path.join(path.dirname(configPath), importPath);

          this.logger.info(`   🔍 Full path: ${fullImportPath}`);

          // Check if the file exists
          try {
            await fs.access(fullImportPath);
            this.logger.info(`   ✓ Import file exists`);
          } catch (error) {
            this.logger.warn(`   ⚠️ Import file not found: ${importPath}. Creating empty file.`);

            // Create the directory if it doesn't exist
            const dir = path.dirname(fullImportPath);
            await fs.mkdir(dir, { recursive: true });

            // Create an empty prompts file
            await safeWriteFile(fullImportPath, JSON.stringify({ prompts: [] }, null, 2), 'utf8');
            this.logger.info(`   ✓ Created empty prompts file`);
          }

          // Read the file
          this.logger.info(`   📖 Reading import file...`);
          const fileContent = await readFile(fullImportPath, 'utf8');
          this.logger.info(`   ✓ File read successfully, ${fileContent.length} characters`);

          let categoryPromptsFile: any;

          try {
            categoryPromptsFile = JSON.parse(fileContent);
            this.logger.info(`   ✓ Import file parsed successfully`);
          } catch (jsonError) {
            this.logger.error(`   ❌ Error parsing import file ${importPath}:`, jsonError);
            this.logger.info(
              `   🔧 Creating empty prompts file for ${importPath} due to parsing error.`
            );
            categoryPromptsFile = { prompts: [] };
            await safeWriteFile(
              fullImportPath,
              JSON.stringify(categoryPromptsFile, null, 2),
              'utf8'
            );
          }

          // Ensure prompts property exists and is an array
          if (!categoryPromptsFile.prompts) {
            this.logger.warn(
              `   ⚠️ Import file ${importPath} does not have a 'prompts' array. Initializing it.`
            );
            categoryPromptsFile.prompts = [];
            await safeWriteFile(
              fullImportPath,
              JSON.stringify(categoryPromptsFile, null, 2),
              'utf8'
            );
          } else if (!Array.isArray(categoryPromptsFile.prompts)) {
            this.logger.warn(
              `   ⚠️ Import file ${importPath} has an invalid 'prompts' property (not an array). Resetting it.`
            );
            categoryPromptsFile.prompts = [];
            await safeWriteFile(
              fullImportPath,
              JSON.stringify(categoryPromptsFile, null, 2),
              'utf8'
            );
          }

          this.logger.info(
            `   📊 Found ${categoryPromptsFile.prompts.length} prompts in this import`
          );

          // Update the file path to be relative to the category folder
          const categoryPath = path.dirname(importPath);
          const beforeCount = categoryPromptsFile.prompts.length;

          const categoryPrompts = categoryPromptsFile.prompts
            .map((prompt: PromptData, index: number) => {
              // Ensure prompt has all required properties
              if (!prompt.id || !prompt.name || !prompt.file) {
                this.logger.warn(
                  `   ⚠️ Skipping invalid prompt ${
                    index + 1
                  } in ${importPath}: missing required properties (id: ${!!prompt.id}, name: ${!!prompt.name}, file: ${!!prompt.file})`
                );
                return null;
              }

              // If the file path is already absolute or starts with the category folder, keep it as is
              if (prompt.file.startsWith('/') || prompt.file.startsWith(categoryPath)) {
                return prompt;
              }

              // Otherwise, update the file path to include the category folder
              return {
                ...prompt,
                file: path.join(categoryPath, prompt.file),
              };
            })
            .filter(Boolean); // Remove any null entries (invalid prompts)

          const afterCount = categoryPrompts.length;
          if (beforeCount !== afterCount) {
            this.logger.warn(
              `   ⚠️ ${beforeCount - afterCount} prompts were filtered out due to validation issues`
            );
          }

          this.logger.info(
            `   ✅ Successfully processed ${afterCount} valid prompts from ${importPath}`
          );

          // Add the prompts to the array
          allPrompts = [...allPrompts, ...categoryPrompts];
        } catch (error) {
          totalImportsFailed++;
          this.logger.error(`   ❌ Error loading prompts from ${importPath}:`, error);
        }
      }

      this.logger.info(`\n🎯 JSON IMPORT PROCESSING SUMMARY:`);
      this.logger.info(`   Total imports processed: ${totalImportProcessed}`);
      this.logger.info(`   Imports failed: ${totalImportsFailed}`);
      this.logger.info(`   Imports succeeded: ${totalImportProcessed - totalImportsFailed}`);
      this.logger.info(`   JSON prompts collected: ${allPrompts.length}`);

      // Phase 2: Load YAML-format prompts from category directories
      const promptsBaseDir = path.dirname(configPath);
      let yamlPromptsLoaded = 0;
      let yamlPromptsSkipped = 0;
      const jsonPromptIds = new Set(allPrompts.map((p) => p.id));

      this.logger.info(`\n📦 Scanning for YAML-format prompts...`);

      for (const category of promptsConfig.categories) {
        const categoryDir = path.join(promptsBaseDir, category.id);
        if (!existsSync(categoryDir)) {
          continue;
        }

        const yamlPrompts = this.loadAllYamlPrompts(categoryDir);
        for (const yamlPrompt of yamlPrompts) {
          // Skip if JSON version already loaded (backward compatibility during transition)
          if (jsonPromptIds.has(yamlPrompt.id)) {
            if (this.debug) {
              this.logger.debug(
                `   ⏭️ Skipping YAML prompt ${yamlPrompt.id} (JSON version exists)`
              );
            }
            yamlPromptsSkipped++;
            continue;
          }

          // Ensure category is set correctly
          yamlPrompt.category = category.id;
          // Prepend category to file path (already has correct format from loadYamlPrompt)
          // - Directory format: {category}/{id}/prompt.yaml
          // - File format: {category}/{id}.yaml
          yamlPrompt.file = path.join(category.id, yamlPrompt.file);
          allPrompts.push(yamlPrompt);
          yamlPromptsLoaded++;
        }
      }

      if (yamlPromptsLoaded > 0 || yamlPromptsSkipped > 0) {
        this.logger.info(`🎯 YAML PROMPT LOADING SUMMARY:`);
        this.logger.info(`   YAML prompts loaded: ${yamlPromptsLoaded}`);
        this.logger.info(`   YAML prompts skipped (JSON exists): ${yamlPromptsSkipped}`);
      }

      this.logger.info(`\n📊 TOTAL PROMPTS: ${allPrompts.length}`);
      this.logger.info(`   Categories available: ${categories.length}`);

      // Attach category's registerWithMcp default to each prompt
      const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));
      allPrompts = allPrompts.map((prompt) => {
        const category = categoryMap.get(prompt.category);
        if (category?.registerWithMcp !== undefined) {
          return { ...prompt, _categoryRegisterWithMcp: category.registerWithMcp } as PromptData & {
            _categoryRegisterWithMcp?: boolean;
          };
        }
        return prompt;
      });

      // Validate category-prompt relationships using CategoryManager
      this.logger.info(`🔍 Validating category-prompt relationships...`);
      const promptCategoryValidation = this.categoryManager.validatePromptCategories(allPrompts);

      if (!promptCategoryValidation.isValid) {
        this.logger.error('❌ Category-prompt relationship validation failed:');
        promptCategoryValidation.issues.forEach((issue) => this.logger.error(`  - ${issue}`));
        this.logger.warn('Continuing with loading but some prompts may not display correctly');
      }

      if (promptCategoryValidation.warnings.length > 0) {
        this.logger.warn('⚠️ Category-prompt relationship warnings:');
        promptCategoryValidation.warnings.forEach((warning) => this.logger.warn(`  - ${warning}`));
      }

      // Generate category statistics for debugging
      const categoryStats = this.categoryManager.getCategoryStatistics(allPrompts);
      this.logger.info(`📊 Category Statistics:`);
      this.logger.info(
        `   Categories with prompts: ${categoryStats.categoriesWithPrompts}/${categoryStats.totalCategories}`
      );
      this.logger.info(`   Empty categories: ${categoryStats.emptyCategoriesCount}`);
      this.logger.info(
        `   Average prompts per category: ${categoryStats.averagePromptsPerCategory.toFixed(1)}`
      );

      const result = { promptsData: allPrompts, categories };
      this.logger.info(`✅ PromptLoader.loadCategoryPrompts() completed successfully`);

      return result;
    } catch (error) {
      this.logger.error(`❌ PromptLoader.loadCategoryPrompts() FAILED:`, error);
      throw error;
    }
  }

  /**
   * Get the CategoryManager instance for external access
   */
  getCategoryManager(): CategoryManager {
    return this.categoryManager;
  }

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
  async loadFromDirectories(promptsDir: string): Promise<CategoryPromptsResult> {
    this.logger.info(`📂 [PromptLoader] Loading prompts from directory structure: ${promptsDir}`);

    if (!existsSync(promptsDir)) {
      throw new Error(`Prompts directory not found: ${promptsDir}`);
    }

    // Phase 1: Discover categories from directory structure
    const entries = readdirSync(promptsDir, { withFileTypes: true });
    const categoryDirs = entries.filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        !entry.name.startsWith('_') &&
        entry.name !== 'backup'
    );

    this.logger.info(`   Found ${categoryDirs.length} category directories`);

    // Phase 2: Build category metadata and load prompts
    const categories: Category[] = [];
    const allPrompts: PromptData[] = [];

    for (const categoryEntry of categoryDirs) {
      const categoryId = categoryEntry.name;
      const categoryDir = path.join(promptsDir, categoryId);

      // Try to load category metadata from category.yaml (optional)
      let categoryMeta: Partial<Category> = {};
      const categoryYamlPath = path.join(categoryDir, 'category.yaml');
      if (existsSync(categoryYamlPath)) {
        try {
          categoryMeta = loadYamlFileSync(categoryYamlPath) as Partial<Category>;
        } catch (e) {
          this.logger.warn(`[PromptLoader] Failed to load category.yaml for ${categoryId}:`, e);
        }
      }

      // Build category with sensible defaults
      const category: Category = {
        id: categoryId,
        name: categoryMeta.name || this.formatCategoryName(categoryId),
        description: categoryMeta.description || `Prompts in the ${categoryId} category`,
      };
      if (categoryMeta.registerWithMcp !== undefined) {
        category.registerWithMcp = categoryMeta.registerWithMcp;
      }

      categories.push(category);

      // Discover and load YAML prompts in this category
      const yamlPrompts = this.loadAllYamlPrompts(categoryDir);

      for (const prompt of yamlPrompts) {
        // Ensure category is set correctly
        prompt.category = categoryId;
        // Prepend category to file path
        prompt.file = path.join(categoryId, prompt.file);

        // Attach category's registerWithMcp if set
        if (category.registerWithMcp !== undefined) {
          (prompt as PromptData & { _categoryRegisterWithMcp?: boolean })._categoryRegisterWithMcp =
            category.registerWithMcp;
        }

        allPrompts.push(prompt);
      }

      if (yamlPrompts.length > 0) {
        this.logger.info(`   📁 ${categoryId}: ${yamlPrompts.length} prompts`);
      }
    }

    // Load categories into CategoryManager
    await this.categoryManager.loadCategories(categories);

    this.logger.info(
      `✅ [PromptLoader] Loaded ${allPrompts.length} prompts from ${categories.length} categories`
    );

    return { promptsData: allPrompts, categories };
  }

  /**
   * Format a category ID into a human-readable name.
   * Example: "codebase-setup" -> "Codebase Setup"
   */
  private formatCategoryName(categoryId: string): string {
    return categoryId
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

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
  async loadPromptFile(filePath: string, basePath: string): Promise<LoadedPromptFile> {
    const fullPath = path.join(basePath, filePath);
    const cacheKey = fullPath.toLowerCase();

    // Check cache first
    if (this.enableCache) {
      const cached = this.promptFileCache.get(cacheKey);
      if (cached) {
        this.stats.cacheHits++;
        if (this.debug) {
          this.logger.debug(`[PromptLoader] Cache hit for: ${filePath}`);
        }
        return cached;
      }
      this.stats.cacheMisses++;
    }

    // Handle YAML format (both directory and single-file patterns)
    if (filePath.endsWith('.yaml')) {
      // Determine the correct path to pass to loadYamlPrompt:
      // - For directory format ({id}/prompt.yaml): pass directory path
      // - For file format ({id}.yaml): pass file path directly
      const promptPath =
        filePath.endsWith('/prompt.yaml') || filePath.endsWith('\\prompt.yaml')
          ? path.dirname(fullPath) // Directory format
          : fullPath; // File format
      const result = this.loadYamlPrompt(promptPath);
      if (result) {
        return result.loadedContent;
      }
      throw new Error(`Failed to load YAML prompt from ${filePath}`);
    }

    try {
      const content = await readFile(fullPath, 'utf8');

      // Extract system message and user message template from markdown
      const systemMessageMatch = content.match(/## System Message\s*\n([\s\S]*?)(?=\n##|$)/);
      const userMessageMatch = content.match(/## User Message Template\s*\n([\s\S]*)$/);

      const systemMessage = systemMessageMatch?.[1]?.trim();
      let userMessageTemplate = userMessageMatch?.[1]?.trim() ?? '';

      // Extract gate configuration if present (Enhanced gate configuration with inline gates)
      let gateConfiguration: LoadedPromptFile['gateConfiguration'];

      const gateConfigMatch = content.match(
        /## Gate Configuration\s*\n```json\s*\n([\s\S]*?)\n```/
      );

      if (gateConfigMatch) {
        try {
          const gateConfigContent = gateConfigMatch[1]?.trim();
          if (gateConfigContent) {
            const parsedConfig = JSON.parse(gateConfigContent);

            // Validate and normalize the gate configuration
            if (Array.isArray(parsedConfig)) {
              // Simple array format: ["gate1", "gate2"]
              gateConfiguration = {
                include: parsedConfig,
                framework_gates: true,
              };
            } else if (typeof parsedConfig === 'object' && parsedConfig !== null) {
              // Object format: {"include": [...], "exclude": [...], "framework_gates": true, "inline_gate_definitions": [...]}
              const normalizedGateConfiguration: LoadedPromptFile['gateConfiguration'] = {};
              if (Array.isArray(parsedConfig.include)) {
                normalizedGateConfiguration.include = parsedConfig.include;
              }
              if (Array.isArray(parsedConfig.exclude)) {
                normalizedGateConfiguration.exclude = parsedConfig.exclude;
              }
              if (typeof parsedConfig.framework_gates === 'boolean') {
                normalizedGateConfiguration.framework_gates = parsedConfig.framework_gates;
              }
              const inlineGateDefinitions = normalizeInlineGateDefinitions(
                parsedConfig.inline_gate_definitions
              );
              if (inlineGateDefinitions) {
                normalizedGateConfiguration.inline_gate_definitions = inlineGateDefinitions;
              }

              if (Object.keys(normalizedGateConfiguration).length > 0) {
                gateConfiguration = normalizedGateConfiguration;
              }
            }
          }

          this.logger.debug(
            `[LOADER] Gate configuration parsed for ${filePath}:`,
            gateConfiguration
          );

          // Fix: Strip Gate Configuration section from userMessageTemplate
          // so it doesn't appear in the output to the user
          if (gateConfigMatch) {
            const gateConfigSectionRegex = /## Gate Configuration\s*\n```json\s*\n[\s\S]*?\n```\s*/;
            userMessageTemplate = userMessageTemplate.replace(gateConfigSectionRegex, '').trim();
            this.logger.debug(
              `[LOADER] Stripped Gate Configuration section from user message template for ${filePath}`
            );
          }
        } catch (gateConfigError) {
          this.logger.warn(
            `[LOADER] Failed to parse gate configuration in ${filePath}:`,
            gateConfigError
          );
        }
      }

      // Extract chain information if present
      const chainMatch = content.match(/## Chain Steps\s*\n([\s\S]*?)(?=\n##|$)/);
      let chainSteps: Array<{
        promptId: string;
        stepName: string;
        inputMapping?: Record<string, string>;
        outputMapping?: Record<string, string>;
      }> = [];

      if (chainMatch) {
        const chainContent = chainMatch[1]?.trim();
        if (!chainContent) {
          this.logger.warn(`[LOADER] Chain steps section found but empty in ${filePath}`);
        } else {
          // Regex to match markdown chain step format
          const stepMatches = chainContent.matchAll(
            /(\d+)\.\s*promptId:\s*([^\n]+)\s*\n\s*stepName:\s*([^\n]+)(?:\s*\n\s*inputMapping:\s*([\s\S]*?)(?=\s*\n\s*(?:outputMapping|promptId|\d+\.|$)))?\s*(?:\n\s*outputMapping:\s*([\s\S]*?)(?=\s*\n\s*(?:promptId|\d+\.|$)))?\s*/g
          );

          for (const match of stepMatches) {
            const stepNumber = match[1];
            const promptId = match[2];
            const stepName = match[3];
            const inputMappingStr = match[4];
            const outputMappingStr = match[5];

            if (!promptId || !stepName) {
              this.logger.warn(
                `Skipping invalid chain step ${stepNumber ?? 'unknown'} in ${filePath}: missing promptId or stepName`
              );
              continue;
            }

            const step: {
              promptId: string;
              stepName: string;
              inputMapping?: Record<string, string>;
              outputMapping?: Record<string, string>;
            } = {
              promptId: promptId.trim(),
              stepName: stepName.trim(),
            };

            if (inputMappingStr) {
              try {
                // Parse YAML-style mapping into JSON object
                const inputMapping: Record<string, string> = {};
                const lines = inputMappingStr.trim().split('\n');
                for (const line of lines) {
                  const [key, value] = line
                    .trim()
                    .split(':')
                    .map((s) => s.trim());
                  if (key && value) {
                    inputMapping[key] = value;
                  }
                }
                step.inputMapping = inputMapping;
              } catch (e) {
                this.logger.warn(
                  `Invalid input mapping in chain step ${stepNumber} of ${filePath}: ${e}`
                );
              }
            }

            if (outputMappingStr) {
              try {
                // Parse YAML-style mapping into JSON object
                const outputMapping: Record<string, string> = {};
                const lines = outputMappingStr.trim().split('\n');
                for (const line of lines) {
                  const [key, value] = line
                    .trim()
                    .split(':')
                    .map((s) => s.trim());
                  if (key && value) {
                    outputMapping[key] = value;
                  }
                }
                step.outputMapping = outputMapping;
              } catch (e) {
                this.logger.warn(
                  `Invalid output mapping in chain step ${stepNumber} of ${filePath}: ${e}`
                );
              }
            }

            chainSteps.push(step);
          }

          this.logger.debug(`Loaded chain with ${chainSteps.length} steps from ${filePath}`);
        }
      }

      const hasNoUserMessage = userMessageTemplate === '';
      const hasNoChainSteps = chainSteps.length === 0;
      const hasNoSystemMessage = systemMessage === undefined || systemMessage === '';
      if (hasNoUserMessage && hasNoChainSteps && hasNoSystemMessage) {
        throw new Error(
          `Prompt requires user message template, chain steps, or system message: ${filePath}`
        );
      }

      const result: LoadedPromptFile = {
        userMessageTemplate,
        chainSteps,
      };

      if (systemMessage !== undefined) {
        result.systemMessage = systemMessage;
      }

      if (gateConfiguration) {
        result.gateConfiguration = gateConfiguration;
      }

      // Cache the result
      if (this.enableCache) {
        this.promptFileCache.set(cacheKey, result);
        if (this.debug) {
          this.logger.debug(
            `[PromptLoader] Cached prompt file: ${filePath} (cache size: ${this.promptFileCache.size})`
          );
        }
      }

      return result;
    } catch (error) {
      this.stats.loadErrors++;
      this.logger.error(`Error loading prompt file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Check if caching is enabled
   */
  isCacheEnabled(): boolean {
    return this.enableCache;
  }

  /**
   * Enable or disable caching at runtime
   */
  setCacheEnabled(enabled: boolean): void {
    this.enableCache = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }

  // ============================================
  // YAML Format Loading (delegated to yaml-prompt-loader)
  // ============================================

  /** Build the shared context for YAML loading functions. */
  private get yamlCtx() {
    return {
      logger: this.logger,
      cache: this.promptFileCache,
      stats: this.stats,
      enableCache: this.enableCache,
      debug: this.debug,
    };
  }

  /**
   * Discover YAML-based prompts in a category directory.
   * @see discoverYamlPrompts in yaml-prompt-loader.ts for full documentation.
   */
  discoverYamlPrompts(categoryDir: string, prefix: string = ''): string[] {
    return discoverYamlPrompts(categoryDir, prefix);
  }

  /**
   * Load a prompt from YAML format (directory or single file).
   * @see loadYamlPrompt in yaml-prompt-loader.ts for full documentation.
   */
  loadYamlPrompt(
    promptPath: string,
    categoryRoot?: string
  ): {
    promptData: PromptData;
    loadedContent: LoadedPromptFile;
  } | null {
    return loadYamlPromptFn(promptPath, categoryRoot, this.yamlCtx);
  }

  /**
   * Load all YAML prompts from a category directory.
   * @see loadAllYamlPrompts in yaml-prompt-loader.ts for full documentation.
   */
  loadAllYamlPrompts(categoryDir: string): PromptData[] {
    return loadAllYamlPromptsFn(categoryDir, this.yamlCtx);
  }

  /**
   * Check if a directory contains YAML-format prompts.
   */
  hasYamlPrompts(categoryDir: string): boolean {
    return hasYamlPrompts(categoryDir);
  }
}
