// @lifecycle canonical - YAML-specific prompt loading, discovery, and conversion.
/**
 * YAML Prompt Loader
 *
 * Pure functions for YAML-based prompt discovery, loading, and conversion.
 * Extracted from PromptLoader to keep domain responsibilities focused.
 *
 * Architecture:
 *   PromptLoader ──delegates──▶ yaml-prompt-loader (YAML ops)
 *                  ──handles──▶ Markdown ops (inline)
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import * as path from 'node:path';

import { validatePromptYaml, type PromptYaml } from './prompt-schema.js';
import { type Logger, PromptArgument } from '../../shared/types/index.js';
import { loadYamlFileSync } from '../../shared/utils/yaml/index.js';

import type { PromptData } from './types.js';

// ============================================
// Shared Types (used by both YAML and Markdown loading)
// ============================================

/**
 * Loaded prompt file content (cached type)
 */
export interface LoadedPromptFile {
  systemMessage?: string;
  userMessageTemplate: string;
  isChain?: boolean;
  gateConfiguration?: {
    include?: string[];
    exclude?: string[];
    framework_gates?: boolean;
    inline_gate_definitions?: Array<{
      id?: string;
      name: string;
      type: 'validation' | 'guidance';
      scope: 'execution' | 'session' | 'chain' | 'step';
      description: string;
      guidance: string;
      pass_criteria: any[];
      expires_at?: number;
      source?: 'manual' | 'automatic' | 'analysis';
      context?: Record<string, any>;
    }>;
  };
  chainSteps?: Array<{
    promptId: string;
    stepName: string;
    inputMapping?: Record<string, string>;
    outputMapping?: Record<string, string>;
    retries?: number;
    subagentModel?: 'heavy' | 'standard' | 'fast';
  }>;
}

export type InlineGateDefinition = NonNullable<
  NonNullable<LoadedPromptFile['gateConfiguration']>['inline_gate_definitions']
>[number];
export type InlineGateDefinitions = InlineGateDefinition[];

// ============================================
// Context for stateful YAML operations
// ============================================

/**
 * Shared context for YAML loading operations that need cache/stats access.
 * Passed by reference from PromptLoader so mutations are shared.
 */
export interface YamlLoadContext {
  readonly logger: Logger;
  readonly cache: Map<string, LoadedPromptFile>;
  readonly stats: { cacheHits: number; cacheMisses: number; loadErrors: number };
  readonly enableCache: boolean;
  readonly debug: boolean;
}

// ============================================
// Pure Functions (no state dependencies)
// ============================================

/**
 * Normalize raw inline gate definitions into typed array.
 * Shared between YAML and Markdown loading paths.
 */
export function normalizeInlineGateDefinitions(
  definitions: unknown
): InlineGateDefinitions | undefined {
  if (!Array.isArray(definitions)) {
    return undefined;
  }

  const normalized: InlineGateDefinitions = [];

  for (const rawDefinition of definitions) {
    if (!rawDefinition || typeof rawDefinition !== 'object') {
      continue;
    }

    const definition = rawDefinition as Record<string, unknown>;
    const name = definition['name'];
    const type = definition['type'];
    const scope = definition['scope'];
    const description = definition['description'];
    const guidance = definition['guidance'];

    if (
      typeof name !== 'string' ||
      (type !== 'validation' && type !== 'guidance') ||
      (scope !== 'execution' && scope !== 'session' && scope !== 'chain' && scope !== 'step') ||
      typeof description !== 'string' ||
      typeof guidance !== 'string'
    ) {
      continue;
    }

    const inlineDefinition: InlineGateDefinition = {
      name,
      type,
      scope,
      description,
      guidance,
      pass_criteria: Array.isArray(definition['pass_criteria']) ? definition['pass_criteria'] : [],
    };

    const id = definition['id'];
    if (typeof id === 'string') {
      inlineDefinition.id = id;
    }

    const expiresAt = definition['expires_at'];
    if (typeof expiresAt === 'number') {
      inlineDefinition.expires_at = expiresAt;
    }

    const source = definition['source'];
    if (source === 'manual' || source === 'automatic' || source === 'analysis') {
      inlineDefinition.source = source;
    }

    const context = definition['context'];
    if (context && typeof context === 'object') {
      inlineDefinition.context = context as Record<string, unknown>;
    }

    normalized.push(inlineDefinition);
  }

  return normalized.length > 0 ? normalized : undefined;
}

/**
 * Discover YAML-based prompts in a category directory.
 *
 * Supports two patterns:
 * 1. **Directory pattern** (complex prompts): `{category}/{prompt_id}/prompt.yaml`
 *    - Supports external file references (user-message.md, system-message.md)
 *    - Best for prompts with long templates or multiple components
 *
 * 2. **File pattern** (simple prompts): `{category}/{prompt_id}.yaml`
 *    - All content inline in a single YAML file
 *    - Best for simple prompts with short templates
 *
 * 3. **Nested pattern** (chain sub-folders): `{category}/{folder}/{prompt_id}.yaml`
 *    - Organize related prompts (e.g., chain steps) in sub-folders
 *    - IDs include folder prefix: "folder/prompt_id"
 *
 * @param categoryDir - Path to the category directory
 * @param prefix - Optional prefix for nested prompt IDs (used in recursion)
 * @returns Array of prompt paths (directories take precedence over files with same ID)
 */
export function discoverYamlPrompts(categoryDir: string, prefix: string = ''): string[] {
  if (!existsSync(categoryDir)) {
    return [];
  }

  const entries = readdirSync(categoryDir, { withFileTypes: true });
  const discoveries: Map<string, { path: string; format: 'directory' | 'file' }> = new Map();
  const nestedPaths: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;

    if (entry.isDirectory()) {
      // Directory pattern: {prompt_id}/prompt.yaml
      const promptYamlPath = path.join(categoryDir, entry.name, 'prompt.yaml');
      const nestedPrefix = prefix.length > 0 ? `${prefix}/${entry.name}` : entry.name;

      if (existsSync(promptYamlPath)) {
        // Directory takes precedence over file with same ID
        discoveries.set(nestedPrefix, {
          path: path.join(categoryDir, entry.name),
          format: 'directory',
        });
      }

      // ALWAYS recurse into subdirectories (parent-child pattern)
      // This enables chain directories to contain both the parent prompt AND nested step prompts
      const nested = discoverYamlPrompts(path.join(categoryDir, entry.name), nestedPrefix);
      nestedPaths.push(...nested);
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.yaml') &&
      entry.name !== 'prompts.yaml' &&
      entry.name !== 'category.yaml' &&
      entry.name !== 'prompt.yaml'
    ) {
      // File pattern: {prompt_id}.yaml (skip metadata and directory-indicator files)
      const baseName = entry.name.replace(/\.yaml$/, '');
      const id = prefix.length > 0 ? `${prefix}/${baseName}` : baseName;
      // Only add if no directory version exists
      if (!discoveries.has(id)) {
        discoveries.set(id, {
          path: path.join(categoryDir, entry.name),
          format: 'file',
        });
      }
    }
  }

  // Return paths (backward compatible - just paths, format handled in loadYamlPrompt)
  const directPaths = Array.from(discoveries.values()).map((d) => d.path);
  return [...directPaths, ...nestedPaths];
}

/**
 * Check if a directory contains YAML-format prompts.
 *
 * @param categoryDir - Path to the category directory
 * @returns true if any prompt.yaml files are found
 */
export function hasYamlPrompts(categoryDir: string): boolean {
  return discoverYamlPrompts(categoryDir).length > 0;
}

/**
 * Normalize YAML argument definitions to PromptArgument format.
 * Handles required defaults and validation object filtering.
 */
function normalizeArguments(args: PromptYaml['arguments']): PromptArgument[] {
  if (!args) return [];
  return args.map((arg) => {
    const normalized: PromptArgument = {
      name: arg.name,
      required: arg.required ?? false,
    };
    if (arg.description !== undefined) normalized.description = arg.description;
    if (arg.type !== undefined) normalized.type = arg.type;
    if (arg.defaultValue !== undefined) normalized.defaultValue = arg.defaultValue;
    if (arg.validation) {
      const validation: NonNullable<PromptArgument['validation']> = {};
      if (arg.validation.pattern !== undefined) validation.pattern = arg.validation.pattern;
      if (arg.validation.minLength !== undefined) validation.minLength = arg.validation.minLength;
      if (arg.validation.maxLength !== undefined) validation.maxLength = arg.validation.maxLength;
      if (arg.validation.allowedValues !== undefined) {
        validation.allowedValues = arg.validation.allowedValues;
      }
      if (Object.keys(validation).length > 0) normalized.validation = validation;
    }
    return normalized;
  });
}

/**
 * Normalize YAML chain step definitions.
 * Shared between yamlToPromptData (PromptData path) and loadYamlPrompt (LoadedPromptFile path).
 */
function normalizeChainSteps(
  steps: PromptYaml['chainSteps']
): NonNullable<PromptData['chainSteps']> | undefined {
  if (!steps) return undefined;
  return steps.map((step) => {
    const normalized: NonNullable<PromptData['chainSteps']>[number] = {
      promptId: step.promptId,
      stepName: step.stepName,
    };
    if (step.inputMapping) normalized.inputMapping = step.inputMapping;
    if (step.outputMapping) normalized.outputMapping = step.outputMapping;
    if (typeof step.retries === 'number') normalized.retries = step.retries;
    if (step.subagentModel != null) normalized.subagentModel = step.subagentModel;
    return normalized;
  });
}

/**
 * Normalize gate configuration from YAML format.
 * Shared between yamlToPromptData (PromptData path) and loadYamlPrompt (LoadedPromptFile path).
 */
function normalizeGateConfiguration(
  config: PromptYaml['gateConfiguration']
): PromptData['gateConfiguration'] | undefined {
  if (!config) return undefined;
  const normalized: NonNullable<PromptData['gateConfiguration']> = {};
  if (Array.isArray(config.include)) normalized.include = config.include;
  if (Array.isArray(config.exclude)) normalized.exclude = config.exclude;
  if (typeof config.framework_gates === 'boolean')
    normalized.framework_gates = config.framework_gates;
  const inlineGateDefs = normalizeInlineGateDefinitions(config.inline_gate_definitions);
  if (inlineGateDefs) normalized.inline_gate_definitions = inlineGateDefs;
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

/**
 * Convert YAML prompt definition to PromptData structure.
 *
 * @param yaml - Parsed and validated YAML data
 * @param filePath - Optional file path override (for single-file format)
 */
export function yamlToPromptData(yaml: PromptYaml, filePath?: string): PromptData {
  // Destructure YAML-only fields (not in PromptData) and fields needing transformation.
  // Everything else spreads through automatically — new simple fields flow without loader changes.
  const {
    systemMessageFile: _smf,
    userMessageTemplateFile: _umtf,
    systemMessage: _sm,
    userMessageTemplate: _umt,
    arguments: rawArgs,
    category,
    chainSteps: rawChainSteps,
    gateConfiguration: rawGateConfig,
    ...passthroughFields
  } = yaml;

  return {
    ...passthroughFields,
    category: category ?? 'general',
    file: filePath ?? `${yaml.id}/prompt.yaml`,
    arguments: normalizeArguments(rawArgs),
    chainSteps: normalizeChainSteps(rawChainSteps),
    gateConfiguration: normalizeGateConfiguration(rawGateConfig),
  };
}

// ============================================
// Stateful Functions (need YamlLoadContext)
// ============================================

/**
 * Load a prompt from YAML format (directory or single file).
 *
 * Supports three patterns:
 *
 * **Directory pattern** (for complex prompts with external files):
 * ```
 * {prompt_id}/
 * ├── prompt.yaml           # Main definition with file references
 * ├── user-message.md       # Template content (referenced via userMessageTemplateFile)
 * └── system-message.md     # Optional system prompt (referenced via systemMessageFile)
 * ```
 *
 * **File pattern** (for simple prompts with inline content):
 * ```
 * {prompt_id}.yaml          # Complete prompt with inline userMessageTemplate
 * ```
 *
 * **Nested pattern** (for chain sub-folders):
 * ```
 * {folder}/
 * ├── step1.yaml            # ID: "folder/step1"
 * └── step2.yaml            # ID: "folder/step2"
 * ```
 *
 * @param promptPath - Path to the prompt directory OR single YAML file
 * @param categoryRoot - Optional category root for calculating relative IDs (enables nested prompts)
 * @param ctx - Shared loading context (logger, cache, stats)
 * @returns Loaded prompt data with inlined content
 */
export function loadYamlPrompt(
  promptPath: string,
  categoryRoot: string | undefined,
  ctx: YamlLoadContext
): {
  promptData: PromptData;
  loadedContent: LoadedPromptFile;
} | null {
  // Determine format: directory or single file
  const isFile = promptPath.endsWith('.yaml');
  const yamlPath = isFile ? promptPath : path.join(promptPath, 'prompt.yaml');
  const baseDir = isFile ? path.dirname(promptPath) : promptPath;

  // Derive prompt ID from relative path if categoryRoot provided, otherwise use basename
  let promptId: string;
  if (categoryRoot !== undefined) {
    // For nested prompts: derive ID from relative path to category root
    const relativePath = path.relative(categoryRoot, promptPath);
    promptId = isFile ? relativePath.replace(/\.yaml$/, '') : relativePath;
    // Normalize path separators for consistent IDs across platforms
    promptId = promptId.split(path.sep).join('/');
  } else {
    // Backwards compatible: use basename only
    promptId = isFile ? path.basename(promptPath, '.yaml') : path.basename(promptPath);
  }

  // Check cache first
  // Compute relative file path for PromptData.file
  // - Directory format: {id}/prompt.yaml
  // - File format: {id}.yaml
  // For nested prompts, include the full relative path
  const relativeFilePath = isFile ? `${promptId}.yaml` : `${promptId}/prompt.yaml`;

  const cacheKey = yamlPath.toLowerCase();
  if (ctx.enableCache && ctx.cache.has(cacheKey)) {
    ctx.stats.cacheHits++;
    const cached = ctx.cache.get(cacheKey)!;
    // Reconstruct promptData from cached content - need to reload yaml for metadata
    const yamlData = loadYamlFileSync(yamlPath) as PromptYaml;
    const promptData = yamlToPromptData(yamlData, relativeFilePath);
    // Override ID with path-based ID for nested prompts (parent-child pattern)
    promptData.id = promptId;
    return {
      promptData,
      loadedContent: cached,
    };
  }
  ctx.stats.cacheMisses++;

  if (!existsSync(yamlPath)) {
    ctx.logger.warn(`[PromptLoader] YAML file not found: ${yamlPath}`);
    return null;
  }

  // Load and validate YAML
  let yamlData: PromptYaml;
  try {
    const rawData = loadYamlFileSync(yamlPath);
    // For validation, use the basename (last segment) of the promptId
    // This allows nested prompts to have IDs like "step_one" while being
    // discovered as "my_chain/step_one" based on their directory path
    const validationId = promptId.includes('/')
      ? (promptId.split('/').pop() ?? promptId)
      : promptId;
    const validation = validatePromptYaml(rawData, validationId);

    if (!validation.valid) {
      ctx.logger.error(
        `[PromptLoader] Invalid YAML in ${yamlPath}: ${validation.errors.join(', ')}`
      );
      ctx.stats.loadErrors++;
      return null;
    }

    if (validation.warnings.length > 0 && ctx.debug) {
      ctx.logger.warn(`[PromptLoader] Warnings for ${promptId}: ${validation.warnings.join(', ')}`);
    }

    yamlData = validation.data!;
  } catch (e) {
    ctx.logger.error(`[PromptLoader] Failed to load YAML from ${yamlPath}:`, e);
    ctx.stats.loadErrors++;
    return null;
  }

  // Inline file references (only applicable for directory format)
  let systemMessage: string | undefined;
  let userMessageTemplate: string;

  // System message (optional)
  if (yamlData.systemMessageFile) {
    const systemMessagePath = path.join(baseDir, yamlData.systemMessageFile);
    if (existsSync(systemMessagePath)) {
      systemMessage = readFileSync(systemMessagePath, 'utf-8');
    } else {
      ctx.logger.warn(`[PromptLoader] systemMessageFile not found: ${systemMessagePath}`);
    }
  } else if (yamlData.systemMessage) {
    systemMessage = yamlData.systemMessage;
  }

  // User message template (required unless chain)
  if (yamlData.userMessageTemplateFile) {
    const userMessagePath = path.join(baseDir, yamlData.userMessageTemplateFile);
    if (existsSync(userMessagePath)) {
      userMessageTemplate = readFileSync(userMessagePath, 'utf-8');
    } else {
      ctx.logger.error(`[PromptLoader] userMessageTemplateFile not found: ${userMessagePath}`);
      ctx.stats.loadErrors++;
      return null;
    }
  } else if (yamlData.userMessageTemplate) {
    userMessageTemplate = yamlData.userMessageTemplate;
  } else if (yamlData.chainSteps && yamlData.chainSteps.length > 0) {
    // Chain prompts may not have a user message template
    userMessageTemplate = '';
  } else if (systemMessage !== undefined && systemMessage !== '') {
    // System-only prompts (guidance, overlays) don't require user message
    userMessageTemplate = '';
    ctx.logger.debug(`[PromptLoader] System-only prompt (no user message template): ${yamlPath}`);
  } else {
    ctx.logger.error(
      `[PromptLoader] Prompt requires userMessageTemplate, userMessageTemplateFile, chainSteps, or systemMessage: ${yamlPath}`
    );
    ctx.stats.loadErrors++;
    return null;
  }

  const loadedContent: LoadedPromptFile = {
    userMessageTemplate,
  };

  if (systemMessage !== undefined) {
    loadedContent.systemMessage = systemMessage;
  }

  const normalizedGateConfig = normalizeGateConfiguration(yamlData.gateConfiguration);
  if (normalizedGateConfig) {
    // LoadedPromptFile.gateConfiguration has narrower inline_gate_definitions.type
    // ('validation' | 'guidance' vs string). Safe because normalizeInlineGateDefinitions
    // only emits these two values.
    loadedContent.gateConfiguration = normalizedGateConfig as LoadedPromptFile['gateConfiguration'];
  }

  const normalizedChainSteps = normalizeChainSteps(yamlData.chainSteps);
  if (normalizedChainSteps) {
    loadedContent.chainSteps = normalizedChainSteps;
    loadedContent.isChain = normalizedChainSteps.length > 0;
  }

  // Cache the result
  if (ctx.enableCache) {
    ctx.cache.set(cacheKey, loadedContent);
    if (ctx.debug) {
      ctx.logger.debug(
        `[PromptLoader] Cached YAML prompt: ${promptId} (cache size: ${ctx.cache.size})`
      );
    }
  }

  const promptData = yamlToPromptData(yamlData, relativeFilePath);
  // Override ID with path-based ID for nested prompts (parent-child pattern)
  promptData.id = promptId;

  return {
    promptData,
    loadedContent,
  };
}

/**
 * Load all YAML prompts from a category directory.
 *
 * Supports nested directories for organizing related prompts (e.g., chain steps).
 * Nested prompts get IDs based on their relative path from categoryDir.
 *
 * @param categoryDir - Path to the category directory
 * @param ctx - Shared loading context (logger, cache, stats)
 * @returns Array of loaded prompt data
 */
export function loadAllYamlPrompts(categoryDir: string, ctx: YamlLoadContext): PromptData[] {
  const promptDirs = discoverYamlPrompts(categoryDir);
  const prompts: PromptData[] = [];

  for (const promptDir of promptDirs) {
    // Pass categoryDir as root to enable relative ID calculation for nested prompts
    const result = loadYamlPrompt(promptDir, categoryDir, ctx);
    if (result) {
      prompts.push(result.promptData);
    }
  }

  if (ctx.debug && prompts.length > 0) {
    ctx.logger.info(`[PromptLoader] Loaded ${prompts.length} YAML prompts from ${categoryDir}`);
  }

  return prompts;
}
