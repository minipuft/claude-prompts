// @lifecycle canonical - Validates prompt definitions and metadata.
/**
 * Field validation and error handling utilities
 */

import { ValidationError } from '../../../../../shared/utils/index.js';
import { promptResourceMetadata } from '../../../../metadata/definitions/prompt-resource.js';
import { ValidationContext } from '../core/types.js';

import type { PromptResourceActionId } from '../../../../metadata/definitions/prompt-resource.js';
import type { ToolDefinitionInput } from '../../core/types.js';

/**
 * Maps MCP parameter names (snake_case) to internal promptData field names (camelCase).
 * Used by updatePrompt() to apply only explicitly provided fields.
 */
export const UPDATE_FIELDS: Record<string, string> = {
  name: 'name',
  category: 'category',
  description: 'description',
  system_message: 'systemMessage',
  user_message_template: 'userMessageTemplate',
  arguments: 'arguments',
  chain_steps: 'chainSteps',
};

/**
 * Action-specific parameter requirements and examples
 */
const ACTION_REQUIREMENTS: Record<string, { required: string[]; example: string }> = {
  create: {
    required: ['id', 'name', 'description', 'user_message_template'],
    example: `{action:'create', id:'my_prompt', name:'My Prompt', description:'What it does', user_message_template:'Process {{input}}'}`,
  },
  update: {
    required: ['id'],
    example: `{action:'update', id:'existing_prompt', description:'Updated description'}`,
  },
  delete: {
    required: ['id'],
    example: `{action:'delete', id:'prompt_to_remove'}`,
  },
  analyze_type: {
    required: ['id'],
    example: `{action:'analyze_type', id:'my_prompt'}`,
  },
  analyze_gates: {
    required: ['id'],
    example: `{action:'analyze_gates', id:'my_prompt'}`,
  },
};

const ACTION_METADATA_MAP = new Map<
  PromptResourceActionId,
  (typeof promptResourceMetadata.data.actions)[number]
>(
  promptResourceMetadata.data.actions.map((action) => [action.id as PromptResourceActionId, action])
);

/**
 * Validate required fields in operation arguments with contextual error messages
 */
export function validateRequiredFields(args: any, required: string[]): void {
  const missing: string[] = [];

  for (const field of required) {
    if (!args[field]) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    const action = args.action || 'unknown';
    const actionInfo = ACTION_REQUIREMENTS[action];

    let errorMessage = `❌ Missing required fields for action '${action}': ${missing.join(', ')}\n\n`;

    if (actionInfo) {
      errorMessage += `📋 Required parameters: ${actionInfo.required.join(', ')}\n`;
      errorMessage += `📚 Example: ${actionInfo.example}\n\n`;
    }

    const descriptor = ACTION_METADATA_MAP.get(action as PromptResourceActionId);
    if (descriptor) {
      errorMessage += `⚙️ Action: ${descriptor.displayName} (${descriptor.status})\n`;
      if (descriptor.issues && descriptor.issues.length > 0) {
        errorMessage += descriptor.issues
          .map((issue) => `- ${issue.severity === 'high' ? '❗' : '⚠️'} ${issue.summary}`)
          .join('\n');
        errorMessage += '\n';
      }
      if (descriptor.requiredArgs.length > 0) {
        errorMessage += `🔑 Requires: ${descriptor.requiredArgs.join(', ')}\n`;
      }
      errorMessage += '\n';
    }

    errorMessage += `💡 TIP: Check the 'action' parameter description for complete requirements.\n`;
    errorMessage += `📖 See: docs/mcp-tool-usage-guide.md for detailed examples`;

    throw new ValidationError(errorMessage);
  }
}

/**
 * Validate operation arguments with context
 */
export function validateOperationArgs(
  args: any,
  operation: string,
  required: string[]
): ValidationContext {
  const providedFields = Object.keys(args);

  validateRequiredFields(args, required);

  return {
    operation,
    requiredFields: required,
    providedFields,
  };
}

/**
 * Normalize a prompt ID to canonical form: lowercase, hyphens/spaces → underscores.
 * All prompt IDs are stored in this form. Users may type hyphens (e.g., "my-prompt")
 * but the canonical ID uses underscores ("my_prompt"). This means "my-prompt" and
 * "my_prompt" refer to the same prompt — duplicates are not allowed.
 */
export function normalizePromptId(id: string): string {
  return id
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Validate prompt ID format (operates on raw input, before normalization)
 */
export function validatePromptId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new ValidationError('Prompt ID must be a non-empty string');
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id)) {
    throw new ValidationError(
      'Prompt ID must start with a letter and contain only alphanumeric characters, underscores, and hyphens'
    );
  }

  if (id.length > 100) {
    throw new ValidationError('Prompt ID must be 100 characters or less');
  }
}

/**
 * Validate category name format
 */
export function validateCategoryName(category: string): void {
  if (!category || typeof category !== 'string') {
    throw new ValidationError('Category must be a non-empty string');
  }

  if (category.length > 50) {
    throw new ValidationError('Category name must be 50 characters or less');
  }
}

/**
 * Validate execution mode
 */
/**
 * Validate prompt content structure
 */
export function validatePromptContent(content: any): void {
  if (!content) {
    throw new ValidationError('Prompt content cannot be empty');
  }

  if (typeof content !== 'object') {
    throw new ValidationError('Prompt content must be an object');
  }

  if (!content.user_message_template && !content.userMessageTemplate) {
    throw new ValidationError('Prompt must have a user message template');
  }
}

/**
 * Validate prompt arguments structure
 */
export function validatePromptArguments(args: any[]): void {
  if (!Array.isArray(args)) {
    throw new ValidationError('Arguments must be an array');
  }

  for (const arg of args) {
    if (!arg.name || typeof arg.name !== 'string') {
      throw new ValidationError('Each argument must have a name');
    }

    if (!arg.type || typeof arg.type !== 'string') {
      throw new ValidationError('Each argument must have a type');
    }

    if (!arg.description || typeof arg.description !== 'string') {
      throw new ValidationError('Each argument must have a description');
    }
  }
}

/**
 * Validate tool definitions for inline tool creation
 * Returns array of error messages (empty if valid)
 */
export function validateToolDefinitions(tools: ToolDefinitionInput[]): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  if (!Array.isArray(tools)) {
    errors.push('Tools must be an array');
    return errors;
  }

  for (const tool of tools) {
    // Required fields
    if (!tool.id) {
      errors.push('Tool missing required field: id');
    }
    if (!tool.name) {
      errors.push('Tool missing required field: name');
    }
    if (!tool.script) {
      errors.push(`Tool '${tool.id || 'unknown'}' missing required field: script`);
    }

    // ID format validation (lowercase alphanumeric with underscores/hyphens)
    if (tool.id && !/^[a-z][a-z0-9_-]*$/.test(tool.id)) {
      errors.push(
        `Tool ID '${tool.id}' must start with lowercase letter and contain only lowercase alphanumeric, underscores, or hyphens`
      );
    }

    // Duplicate ID check
    if (tool.id) {
      if (seenIds.has(tool.id)) {
        errors.push(`Duplicate tool ID: '${tool.id}'`);
      }
      seenIds.add(tool.id);
    }

    // Valid runtime values
    const validRuntimes = ['python', 'node', 'shell', 'auto'];
    if (tool.runtime && !validRuntimes.includes(tool.runtime)) {
      errors.push(
        `Tool '${tool.id}' has invalid runtime: '${tool.runtime}'. Valid: ${validRuntimes.join(', ')}`
      );
    }

    // Valid trigger values
    const validTriggers = ['schema_match', 'explicit', 'always', 'never'];
    if (tool.trigger && !validTriggers.includes(tool.trigger)) {
      errors.push(
        `Tool '${tool.id}' has invalid trigger: '${tool.trigger}'. Valid: ${validTriggers.join(', ')}`
      );
    }

    // Timeout must be positive
    if (tool.timeout !== undefined && (typeof tool.timeout !== 'number' || tool.timeout <= 0)) {
      errors.push(`Tool '${tool.id}' has invalid timeout: must be a positive number`);
    }

    // Schema should be an object if provided
    if (tool.schema !== undefined && (typeof tool.schema !== 'object' || tool.schema === null)) {
      errors.push(`Tool '${tool.id}' has invalid schema: must be an object`);
    }
  }

  return errors;
}

/**
 * Sanitize user input for safe processing
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate filter syntax
 */
export function validateFilterSyntax(filter: string): void {
  if (!filter || typeof filter !== 'string') {
    return; // Empty filter is valid
  }

  // Check for balanced quotes
  const quotes = filter.match(/"/g);
  if (quotes && quotes.length % 2 !== 0) {
    throw new ValidationError('Unbalanced quotes in filter expression');
  }

  // Validate filter patterns
  const validFilterPatterns = [
    /^type:\w+$/,
    /^category:[a-z-_]+$/,
    /^intent:[a-z-_\s]+$/i,
    /^confidence:[<>]?\d+(?:-\d+)?$/,
    /^execution:(required|optional)$/,
    /^gates:(yes|no)$/,
  ];

  const filterParts = filter.split(/\s+/);
  for (const part of filterParts) {
    if (part.includes(':')) {
      const isValid = validFilterPatterns.some((pattern) => pattern.test(part));
      if (!isValid) {
        throw new ValidationError(`Invalid filter syntax: ${part}`);
      }
    }
  }
}
