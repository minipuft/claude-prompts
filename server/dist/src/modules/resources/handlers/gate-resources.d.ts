/**
 * Gate Resources Handler
 *
 * Registers MCP resources for token-efficient gate discovery and guidance retrieval.
 *
 * URI Patterns:
 * - resource://gate/           → List all gates (minimal metadata)
 * - resource://gate/{id}       → Gate definition + guidance content
 * - resource://gate/{id}/guidance → Raw guidance.md content only
 */
import type { ResourceDependencies } from '../types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Register gate-related MCP resources.
 *
 * Resources read from the gateManager at request time to ensure
 * hot-reload compatibility - changes are visible immediately.
 */
export declare function registerGateResources(server: McpServer, dependencies: ResourceDependencies): void;
