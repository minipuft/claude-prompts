/**
 * Methodology Resources Handler
 *
 * Registers MCP resources for token-efficient methodology/framework discovery and content retrieval.
 *
 * URI Patterns:
 * - resource://methodology/              → List all methodologies (minimal metadata)
 * - resource://methodology/{id}          → Methodology definition + guidelines
 * - resource://methodology/{id}/system-prompt → Raw system prompt template only
 */
import type { ResourceDependencies } from '../types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Register methodology-related MCP resources.
 *
 * Resources read from the frameworkManager at request time to ensure
 * hot-reload compatibility - changes are visible immediately.
 */
export declare function registerMethodologyResources(server: McpServer, dependencies: ResourceDependencies): void;
