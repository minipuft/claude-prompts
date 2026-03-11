/**
 * MCP Resources Module
 *
 * Provides token-efficient read-only access to prompts, gates, methodologies,
 * and observability data via MCP Resources protocol (resources/list, resources/read).
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ registerResources()                                             │
 * │   │                                                             │
 * │   ├── registerPromptResources()      → resource://prompt/...    │
 * │   ├── registerGateResources()        → resource://gate/...      │
 * │   ├── registerMethodologyResources() → resource://methodology/..│
 * │   └── registerObservabilityResources()                          │
 * │       ├── Sessions                   → resource://session/...   │
 * │       └── Metrics                    → resource://metrics/...   │
 * │                                                                 │
 * │ Hot-reload: Handlers read from singleton registries at          │
 * │ request time, so changes are visible immediately.               │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * @module resources
 */
import type { ResourceDependencies } from './types.js';
import type { Logger } from '../../shared/types/index.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export { RESOURCE_URI_PATTERNS, ResourceNotFoundError } from './types.js';
export type { GateResourceMetadata, MethodologyResourceMetadata, PromptResourceMetadata, ResourceContent, ResourceDependencies, ResourceListItem, ResourceReadResult, ResourceRegistrationContext, SessionResourceMetadata, } from './types.js';
/**
 * Register all MCP resources with the server.
 *
 * Resources are registered once at startup but read from singleton registries
 * at request time, ensuring hot-reload compatibility.
 *
 * Respects granular config flags in dependencies.resourcesConfig:
 * - prompts.enabled: Enable prompt resources
 * - gates.enabled: Enable gate resources
 * - methodologies.enabled: Enable methodology resources
 * - observability.enabled: Enable observability resources (sessions + metrics)
 * - logs.enabled: Enable logs resources
 *
 * @param server - The MCP server instance
 * @param dependencies - Singleton manager references for data access
 */
export declare function registerResources(server: McpServer, dependencies: ResourceDependencies): void;
/**
 * Notify connected clients that resources have changed.
 * Call this after hot-reload events to prompt clients to refresh.
 *
 * @param server - The MCP server instance
 * @param logger - Logger for diagnostics
 */
export declare function notifyResourcesChanged(server: McpServer, logger: Logger): void;
