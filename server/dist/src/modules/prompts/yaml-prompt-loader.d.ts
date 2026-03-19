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
import { type PromptYaml } from './prompt-schema.js';
import { type Logger } from '../../shared/types/index.js';
import type { PromptData } from './types.js';
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
export type InlineGateDefinition = NonNullable<NonNullable<LoadedPromptFile['gateConfiguration']>['inline_gate_definitions']>[number];
export type InlineGateDefinitions = InlineGateDefinition[];
/**
 * Shared context for YAML loading operations that need cache/stats access.
 * Passed by reference from PromptLoader so mutations are shared.
 */
export interface YamlLoadContext {
    readonly logger: Logger;
    readonly cache: Map<string, LoadedPromptFile>;
    readonly stats: {
        cacheHits: number;
        cacheMisses: number;
        loadErrors: number;
    };
    readonly enableCache: boolean;
    readonly debug: boolean;
}
/**
 * Normalize raw inline gate definitions into typed array.
 * Shared between YAML and Markdown loading paths.
 */
export declare function normalizeInlineGateDefinitions(definitions: unknown): InlineGateDefinitions | undefined;
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
export declare function discoverYamlPrompts(categoryDir: string, prefix?: string): string[];
/**
 * Check if a directory contains YAML-format prompts.
 *
 * @param categoryDir - Path to the category directory
 * @returns true if any prompt.yaml files are found
 */
export declare function hasYamlPrompts(categoryDir: string): boolean;
/**
 * Convert YAML prompt definition to PromptData structure.
 *
 * @param yaml - Parsed and validated YAML data
 * @param filePath - Optional file path override (for single-file format)
 */
export declare function yamlToPromptData(yaml: PromptYaml, filePath?: string): PromptData;
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
export declare function loadYamlPrompt(promptPath: string, categoryRoot: string | undefined, ctx: YamlLoadContext): {
    promptData: PromptData;
    loadedContent: LoadedPromptFile;
} | null;
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
export declare function loadAllYamlPrompts(categoryDir: string, ctx: YamlLoadContext): PromptData[];
