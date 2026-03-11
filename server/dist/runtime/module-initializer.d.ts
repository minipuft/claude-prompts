/**
 * Initializes framework state, MCP tools, tool descriptions, and prompt registration.
 * Reuses existing managers without duplicating orchestration inside Application.
 */
import { FrameworkStateStore } from '../engine/frameworks/framework-state-store.js';
import { GateManager } from '../engine/gates/gate-manager.js';
import { ResourceChangeTracker } from '../infra/observability/tracking/index.js';
import { McpToolRouter } from '../mcp/tools/index.js';
import { ToolDescriptionLoader } from '../mcp/tools/tool-description-loader.js';
import type { RuntimeLaunchOptions } from './options.js';
import type { PathResolver } from './paths.js';
import type { ConvertedPrompt } from '../engine/execution/types.js';
import type { ConfigLoader } from '../infra/config/index.js';
import type { Logger } from '../infra/logging/index.js';
import type { PromptAssetManager } from '../modules/prompts/index.js';
import type { Category, PromptData } from '../modules/prompts/types.js';
import type { ConversationStore } from '../modules/text-refs/conversation.js';
import type { TextReferenceStore } from '../modules/text-refs/index.js';
import type { FrameworksConfig, HookRegistryPort, McpNotificationEmitterPort } from '../shared/types/index.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export interface ModuleInitCallbacks {
    fullServerRefresh: () => Promise<void>;
    restartServer: (reason: string) => Promise<void>;
    handleFrameworkConfigChange: (config: FrameworksConfig, previous?: FrameworksConfig) => void;
}
export interface ModuleInitParams {
    logger: Logger;
    configManager: ConfigLoader;
    runtimeOptions: RuntimeLaunchOptions;
    promptsData: PromptData[];
    categories: Category[];
    convertedPrompts: ConvertedPrompt[];
    promptManager: PromptAssetManager;
    conversationStore: ConversationStore;
    textReferenceStore: TextReferenceStore;
    mcpServer: McpServer;
    callbacks: ModuleInitCallbacks;
    /** Server root for runtime state directories */
    serverRoot?: string;
    /** Path resolver for workspace-derived resource overlays */
    pathResolver?: PathResolver;
    /** Hook registry for pipeline event emissions */
    hookRegistry?: HookRegistryPort;
    /** Notification emitter for MCP client notifications */
    notificationEmitter?: McpNotificationEmitterPort;
}
export interface ModuleInitResult {
    frameworkStateStore: FrameworkStateStore;
    gateManager: GateManager;
    mcpToolsManager: McpToolRouter;
    toolDescriptionLoader: ToolDescriptionLoader;
    /** Resource change tracker for audit logging (undefined if serverRoot not provided) */
    resourceChangeTracker?: ResourceChangeTracker;
}
export declare function initializeModules(params: ModuleInitParams): Promise<ModuleInitResult>;
