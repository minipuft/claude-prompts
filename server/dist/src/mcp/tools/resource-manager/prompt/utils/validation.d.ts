/**
 * Field validation and error handling utilities
 */
import { ValidationContext } from '../core/types.js';
import type { ToolDefinitionInput } from '../../core/types.js';
/**
 * Maps MCP parameter names (snake_case) to internal promptData field names (camelCase).
 * Used by updatePrompt() to apply only explicitly provided fields.
 */
export declare const UPDATE_FIELDS: Record<string, string>;
/**
 * Validate required fields in operation arguments with contextual error messages
 */
export declare function validateRequiredFields(args: any, required: string[]): void;
/**
 * Validate operation arguments with context
 */
export declare function validateOperationArgs(args: any, operation: string, required: string[]): ValidationContext;
/**
 * Normalize a prompt ID to canonical form: lowercase, hyphens/spaces → underscores.
 * All prompt IDs are stored in this form. Users may type hyphens (e.g., "my-prompt")
 * but the canonical ID uses underscores ("my_prompt"). This means "my-prompt" and
 * "my_prompt" refer to the same prompt — duplicates are not allowed.
 */
export declare function normalizePromptId(id: string): string;
/**
 * Validate prompt ID format (operates on raw input, before normalization)
 */
export declare function validatePromptId(id: string): void;
/**
 * Validate category name format
 */
export declare function validateCategoryName(category: string): void;
/**
 * Validate execution mode
 */
/**
 * Validate prompt content structure
 */
export declare function validatePromptContent(content: any): void;
/**
 * Validate prompt arguments structure
 */
export declare function validatePromptArguments(args: any[]): void;
/**
 * Validate tool definitions for inline tool creation
 * Returns array of error messages (empty if valid)
 */
export declare function validateToolDefinitions(tools: ToolDefinitionInput[]): string[];
/**
 * Sanitize user input for safe processing
 */
export declare function sanitizeInput(input: string): string;
/**
 * Validate filter syntax
 */
export declare function validateFilterSyntax(filter: string): void;
