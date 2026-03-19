/**
 * Prompt Resources Handler
 *
 * Registers MCP resources for token-efficient prompt discovery and content retrieval.
 *
 * URI Patterns:
 * - resource://prompt/          → List all prompts (minimal metadata)
 * - resource://prompt/{id}      → Prompt metadata + template content
 * - resource://prompt/{id}/template → Raw template content only
 */
import type { ResourceDependencies } from '../types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Register prompt-related MCP resources.
 *
 * Resources read from the promptManager at request time to ensure
 * hot-reload compatibility - changes are visible immediately.
 */
export declare function registerPromptResources(server: McpServer, dependencies: ResourceDependencies): void;
