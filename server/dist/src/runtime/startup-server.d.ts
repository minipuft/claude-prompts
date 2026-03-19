/**
 * Encapsulates server startup flow (transport manager + API manager + MCP server).
 * Reuses shared utilities and avoids duplicating transport detection.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TransportRouter } from '../infra/http/index.js';
import type { RuntimeLaunchOptions } from './options.js';
import type { ConvertedPrompt } from '../engine/execution/types.js';
import type { ConfigLoader } from '../infra/config/index.js';
import type { ServerLifecycle } from '../infra/http/index.js';
import type { Logger } from '../infra/logging/index.js';
import type { ApiRouter } from '../mcp/http/api.js';
import type { McpToolRouter } from '../mcp/tools/index.js';
import type { PromptAssetManager } from '../modules/prompts/index.js';
import type { Category, PromptData } from '../modules/prompts/types.js';
import type { TransportMode } from '../shared/types/index.js';
export interface ServerStartupParams {
    logger: Logger;
    configManager: ConfigLoader;
    promptManager: PromptAssetManager;
    mcpToolsManager: McpToolRouter;
    mcpServer: McpServer;
    runtimeOptions: RuntimeLaunchOptions;
    transportType?: TransportMode;
    promptsData: PromptData[];
    categories: Category[];
    convertedPrompts: ConvertedPrompt[];
}
export interface ServerStartupResult {
    transportRouter: TransportRouter;
    apiRouter?: ApiRouter;
    serverLifecycle: ServerLifecycle;
}
export declare function startServerWithManagers(params: ServerStartupParams): Promise<ServerStartupResult>;
