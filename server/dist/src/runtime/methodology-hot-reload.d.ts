import type { Logger } from '../infra/logging/index.js';
import type { McpToolRouter } from '../mcp/tools/index.js';
import type { AuxiliaryReloadConfig } from '../modules/hot-reload/hot-reload-observer.js';
export declare function buildMethodologyAuxiliaryReloadConfig(logger: Logger, mcpToolsManager?: McpToolRouter): AuxiliaryReloadConfig | undefined;
