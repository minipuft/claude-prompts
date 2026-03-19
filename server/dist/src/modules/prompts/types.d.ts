/**
 * Prompt System Type Definitions
 *
 * Contains all types related to prompt management, processing, and organization.
 * This includes prompt data structures, arguments, categories, and file handling.
 */
import type { ChainStep, PromptData } from '../../shared/types/index.js';
/**
 * A category for organizing prompts
 */
export interface Category {
    /** Unique identifier for the category */
    id: string;
    /** Display name for the category */
    name: string;
    /** Description of the category */
    description: string;
    /** MCP registration default for prompts in this category. Default: true */
    registerWithMcp?: boolean;
}
export type { ChainStep, GateDefinition, PromptData, PromptGateConfiguration, } from '../../shared/types/index.js';
/**
 * Structure of an individual prompt file
 */
export interface PromptFile {
    /** Title of the prompt */
    title: string;
    /** Description of the prompt */
    description: string;
    /** Optional system message for the prompt */
    systemMessage?: string;
    /** Template for generating the user message */
    userMessageTemplate: string;
}
/**
 * Structure of the prompts registry file
 */
export interface PromptsFile {
    /** Available categories for organizing prompts */
    categories: Category[];
    /** Available prompts */
    prompts: PromptData[];
}
/**
 * Configuration for the prompts subsystem with category imports
 */
export interface PromptsConfigFile {
    /** Available categories for organizing prompts */
    categories: Category[];
    /** Paths to prompts.json files to import from category folders */
    imports: string[];
}
export type { PromptsConfig } from '../../shared/types/core-config.js';
/**
 * Prompt file content structure
 */
export interface PromptFileContent {
    systemMessage?: string;
    userMessageTemplate: string;
    chainSteps?: ChainStep[];
}
/**
 * Result of loading category prompts
 */
export interface CategoryPromptsResult {
    promptsData: PromptData[];
    categories: Category[];
}
/**
 * Category validation result
 */
export interface CategoryValidationResult {
    isValid: boolean;
    issues: string[];
    warnings: string[];
}
/**
 * Category statistics
 */
export interface CategoryStatistics {
    totalCategories: number;
    categoriesWithPrompts: number;
    emptyCategoriesCount: number;
    averagePromptsPerCategory: number;
    categoryBreakdown: Array<{
        category: Category;
        promptCount: number;
    }>;
}
/**
 * Category-prompt relationship data
 */
export interface CategoryPromptRelationship {
    categoryId: string;
    categoryName: string;
    promptIds: string[];
    promptCount: number;
    hasChains: boolean;
    hasTemplates: boolean;
}
