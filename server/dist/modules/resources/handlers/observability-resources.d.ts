/**
 * Observability Resources Handler
 *
 * Registers MCP resources for token-efficient access to session state and metrics.
 * These provide read-only observability into the runtime system.
 *
 * URI Patterns:
 * - resource://session/              → List active chain sessions
 * - resource://session/{chainId}     → Individual session state
 * - resource://metrics/pipeline      → Pipeline execution metrics and analytics
 */
import type { ResourceDependencies } from '../types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Register observability-related MCP resources (sessions and metrics).
 *
 * Resources read from managers at request time to ensure
 * hot-reload compatibility and real-time data.
 */
export declare function registerObservabilityResources(server: McpServer, dependencies: ResourceDependencies): void;
/**
 * Register log-related MCP resources for debugging and observability.
 *
 * URI Patterns:
 * - resource://logs/              → List recent logs (all levels)
 * - resource://logs/{level}       → Filter by level (error/warn/info/debug)
 * - resource://logs/entry/{id}    → Individual log entry details
 */
export declare function registerLogResources(server: McpServer, dependencies: ResourceDependencies): void;
