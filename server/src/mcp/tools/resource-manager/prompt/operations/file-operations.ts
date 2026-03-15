// @lifecycle canonical - Handles prompt file read/write operations.
/**
 * File system and category management operations for YAML-based prompts
 */

import { existsSync, readdirSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import {
  findYamlPromptInCategory,
  hasYamlPromptsInCategory,
  deleteYamlPrompt,
} from '../../../../../modules/prompts/category-maintenance.js';
import { safeWriteFile } from '../../../../../shared/utils/file-transactions.js';
import { serializeYaml } from '../../../../../shared/utils/yaml/yaml-parser.js';
import { OperationResult, PromptResourceDependencies } from '../core/types.js';

import type { ConfigManager, Logger } from '../../../../../shared/types/index.js';
import type { ToolDefinitionInput } from '../../core/types.js';

/**
 * File system operations for prompt management
 */
export class FileOperations {
  private logger: Logger;
  private configManager: ConfigManager;

  constructor(dependencies: Pick<PromptResourceDependencies, 'logger' | 'configManager'>) {
    this.logger = dependencies.logger;
    this.configManager = dependencies.configManager;
  }

  /**
   * Update prompt implementation (shared by create/update)
   * Creates YAML directory structure: {category}/{id}/prompt.yaml + message files
   */
  async updatePromptImplementation(promptData: any): Promise<OperationResult> {
    // Use resolved path that respects MCP_RESOURCES_PATH for user data persistence
    const promptsDir = this.configManager.getResolvedPromptsFilePath();
    const messages: string[] = [];
    const affectedFiles: string[] = [];

    // Normalize category ID (lowercase, hyphenated)
    const effectiveCategory = promptData.category.toLowerCase().replace(/\s+/g, '-');
    const categoryDir = path.join(promptsDir, effectiveCategory);

    // Ensure category directory exists
    if (!existsSync(categoryDir)) {
      await fs.mkdir(categoryDir, { recursive: true });
      messages.push(`✅ Created category directory: '${effectiveCategory}'`);
    }

    // Create/update YAML prompt
    const { exists: promptExists, paths } = await this.createOrUpdateYamlPrompt(
      promptData,
      effectiveCategory,
      promptsDir
    );

    messages.push(`✅ ${promptExists ? 'Updated' : 'Created'} prompt: ${promptData.id}`);
    affectedFiles.push(...paths);

    // Create/update tools if provided
    if (promptData.tools && promptData.tools.length > 0) {
      const promptDir = path.join(promptsDir, effectiveCategory, promptData.id);
      const toolResult = await this.createOrUpdateTools(promptDir, promptData.tools, promptData.id);
      messages.push(...toolResult.messages);
      affectedFiles.push(...toolResult.paths);
    }

    return {
      message: messages.join('\n'),
      affectedFiles,
    };
  }

  /**
   * Delete prompt implementation (YAML-only)
   *
   * Searches for YAML-format prompts in all category directories:
   * - Directory format: {category}/{id}/ (deleted recursively)
   * - File format: {category}/{id}.yaml (deleted as single file)
   *
   * Automatically cleans up empty category directories.
   */
  async deletePromptImplementation(id: string): Promise<OperationResult> {
    // Use resolved path that respects MCP_RESOURCES_PATH for user data persistence
    const promptsDir = this.configManager.getResolvedPromptsFilePath();
    const messages: string[] = [];
    const affectedFiles: string[] = [];

    let promptFound = false;
    let deletedFromCategoryDir: string | null = null;
    let deletedFromCategoryId: string | null = null;

    // Discover all category directories
    const categoryDirs = this.discoverCategoryDirectories(promptsDir);

    // Search for the prompt in each category
    for (const categoryDir of categoryDirs) {
      const yamlPrompt = findYamlPromptInCategory(categoryDir, id);

      if (yamlPrompt) {
        const deletedPaths = await deleteYamlPrompt(yamlPrompt);
        if (deletedPaths.length > 0) {
          const formatLabel = yamlPrompt.format === 'directory' ? 'directory' : 'file';
          messages.push(`✅ Deleted prompt ${formatLabel}: ${yamlPrompt.id}`);
          affectedFiles.push(...deletedPaths);
          promptFound = true;
          deletedFromCategoryDir = categoryDir;
          deletedFromCategoryId = path.basename(categoryDir);
          break;
        }
      }
    }

    if (!promptFound) {
      throw new Error(`Prompt not found: ${id}`);
    }

    // Check if category is now empty (no YAML prompts remaining)
    if (deletedFromCategoryDir && deletedFromCategoryId) {
      const hasRemainingPrompts = hasYamlPromptsInCategory(deletedFromCategoryDir);

      if (!hasRemainingPrompts) {
        // Clean up empty category directory (but preserve category.yaml if exists)
        const entries = readdirSync(deletedFromCategoryDir, { withFileTypes: true });
        const nonMetadataEntries = entries.filter(
          (e) => e.name !== 'category.yaml' && !e.name.startsWith('.')
        );

        if (nonMetadataEntries.length === 0) {
          try {
            await fs.rm(deletedFromCategoryDir, { recursive: true, force: true });
            messages.push(`🧹 Cleaned up empty category directory: ${deletedFromCategoryId}`);
            this.logger.info(`Deleted empty category directory: ${deletedFromCategoryId}`);
          } catch (rmError: any) {
            messages.push(`⚠️ Could not remove empty category: ${rmError.message}`);
          }
        }
      } else {
        this.logger.debug(`Category ${deletedFromCategoryId} still has prompts, keeping directory`);
      }
    }

    return {
      message: messages.join('\n'),
      affectedFiles,
    };
  }

  /**
   * Discover category directories in the prompts folder
   */
  private discoverCategoryDirectories(promptsDir: string): string[] {
    if (!existsSync(promptsDir)) {
      return [];
    }

    try {
      const entries = readdirSync(promptsDir, { withFileTypes: true });
      return entries
        .filter(
          (entry) =>
            entry.isDirectory() &&
            !entry.name.startsWith('.') &&
            !entry.name.startsWith('_') &&
            entry.name !== 'backup'
        )
        .map((entry) => path.join(promptsDir, entry.name));
    } catch {
      return [];
    }
  }

  /**
   * Create or update YAML prompt directory structure
   *
   * Creates/updates:
   * - {category}/{id}/prompt.yaml - Metadata (id, name, category, description, arguments, gates)
   * - {category}/{id}/user-message.md - User message template (required)
   * - {category}/{id}/system-message.md - System message (optional)
   */
  async createOrUpdateYamlPrompt(
    promptData: any,
    effectiveCategory: string,
    promptsDir: string
  ): Promise<{ exists: boolean; paths: string[] }> {
    const promptDir = path.join(promptsDir, effectiveCategory, promptData.id);
    const paths: string[] = [];

    // Check if prompt directory already exists
    const existsBefore = existsSync(promptDir);

    // Create prompt directory
    await fs.mkdir(promptDir, { recursive: true });
    paths.push(promptDir);

    // Build prompt.yaml metadata
    const promptYamlData: Record<string, unknown> = {
      id: promptData.id,
      name: promptData.name,
      category: effectiveCategory,
      description: promptData.description,
    };

    // Add optional fields
    if (promptData.systemMessage) {
      promptYamlData['systemMessageFile'] = 'system-message.md';
    }
    promptYamlData['userMessageTemplateFile'] = 'user-message.md';

    // Add arguments if present
    if (promptData.arguments && promptData.arguments.length > 0) {
      promptYamlData['arguments'] = promptData.arguments;
    }

    // Add gate configuration if present
    if (promptData.gateConfiguration) {
      promptYamlData['gateConfiguration'] = promptData.gateConfiguration;
      this.logger.debug(`[YAML-CREATE] Adding gate configuration to ${promptData.id}`);
    }

    // Add chain steps if present (for chain prompts)
    if (promptData.chainSteps && promptData.chainSteps.length > 0) {
      promptYamlData['chainSteps'] = promptData.chainSteps;
    }

    // Add tools reference if present (just tool IDs, not full definitions)
    if (promptData.tools && promptData.tools.length > 0) {
      promptYamlData['tools'] = promptData.tools.map((t: ToolDefinitionInput) => t.id);
    }

    // Write prompt.yaml
    const promptYamlPath = path.join(promptDir, 'prompt.yaml');
    const yamlContent = serializeYaml(promptYamlData, { sortKeys: false });
    await safeWriteFile(promptYamlPath, yamlContent, 'utf8');
    paths.push(promptYamlPath);

    // Write user-message.md (required)
    const userMessagePath = path.join(promptDir, 'user-message.md');
    await safeWriteFile(userMessagePath, promptData.userMessageTemplate || '', 'utf8');
    paths.push(userMessagePath);

    // Write system-message.md (optional)
    if (promptData.systemMessage) {
      const systemMessagePath = path.join(promptDir, 'system-message.md');
      await safeWriteFile(systemMessagePath, promptData.systemMessage, 'utf8');
      paths.push(systemMessagePath);
    }

    this.logger.info(`${existsBefore ? 'Updated' : 'Created'} YAML prompt: ${promptData.id}`);

    return {
      exists: existsBefore,
      paths,
    };
  }

  /**
   * Create or update script tools for a prompt
   *
   * Creates:
   * - {promptDir}/tools/{toolId}/tool.yaml - Tool configuration
   * - {promptDir}/tools/{toolId}/schema.json - Input schema (if provided)
   * - {promptDir}/tools/{toolId}/script.{ext} - Script file
   */
  async createOrUpdateTools(
    promptDir: string,
    tools: ToolDefinitionInput[],
    promptId: string
  ): Promise<{ messages: string[]; paths: string[] }> {
    const messages: string[] = [];
    const paths: string[] = [];

    const toolsDir = path.join(promptDir, 'tools');

    for (const tool of tools) {
      const toolDir = path.join(toolsDir, tool.id);

      // Create tool directory
      await fs.mkdir(toolDir, { recursive: true });
      paths.push(toolDir);

      // Build tool.yaml configuration
      const toolYaml: Record<string, unknown> = {
        id: tool.id,
        name: tool.name,
        description: tool.description || '',
        script: this.getScriptFilename(tool.runtime),
        runtime: tool.runtime || 'auto',
        timeout: tool.timeout || 30000,
        enabled: true,
        execution: {
          trigger: tool.trigger || 'schema_match',
          confirm: tool.confirm || false,
          strict: tool.strict || false,
        },
      };

      // Write tool.yaml
      const toolYamlPath = path.join(toolDir, 'tool.yaml');
      const yamlContent = serializeYaml(toolYaml, { sortKeys: false });
      await safeWriteFile(toolYamlPath, yamlContent, 'utf8');
      paths.push(toolYamlPath);

      // Write schema.json if provided
      if (tool.schema) {
        const schemaPath = path.join(toolDir, 'schema.json');
        const schemaContent = JSON.stringify(tool.schema, null, 2);
        await safeWriteFile(schemaPath, schemaContent, 'utf8');
        paths.push(schemaPath);
      }

      // Write script file
      const scriptFilename = this.getScriptFilename(tool.runtime);
      const scriptPath = path.join(toolDir, scriptFilename);
      await safeWriteFile(scriptPath, tool.script, 'utf8');
      paths.push(scriptPath);

      messages.push(`✅ Created tool '${tool.id}' in ${toolDir}`);
      this.logger.info(`Created script tool '${tool.id}' for prompt '${promptId}'`);
    }

    return { messages, paths };
  }

  /**
   * Get script filename based on runtime
   */
  private getScriptFilename(runtime?: string): string {
    switch (runtime) {
      case 'python':
        return 'script.py';
      case 'node':
        return 'script.js';
      case 'shell':
        return 'script.sh';
      default:
        return 'script.py'; // Default to Python
    }
  }
}
