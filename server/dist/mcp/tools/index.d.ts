/**
 * MCP Tools Module - Consolidated Architecture
 *
 * This module provides 3 core MCP tools with framework-aware descriptions:
 *
 * CORE TOOLS:
 * - prompt_engine: Universal execution engine with framework integration
 * - system_control: Framework and system management with analytics
 * - resource_manager: Unified CRUD for prompts, gates, and methodologies
 *
 * ARCHITECTURE:
 * - Framework-aware tool descriptions that change based on active methodology
 * - Single source of truth for each functional area
 * - Integrated ToolDescriptionLoader for dynamic descriptions
 * - Improved maintainability and clear separation of concerns
 */
import { ToolDescriptionLoader } from './tool-description-loader.js';
import { FrameworkManager } from '../../engine/frameworks/framework-manager.js';
import { FrameworkStateStore } from '../../engine/frameworks/framework-state-store.js';
import { PromptAssetManager } from '../../modules/prompts/index.js';
import { ConversationStore } from '../../modules/text-refs/conversation.js';
import { TextReferenceStore } from '../../modules/text-refs/index.js';
import { type ConfigManager, type MetricsCollector, type Logger, type HookRegistryPort, type McpNotificationEmitterPort } from '../../shared/types/index.js';
import type { ConvertedPrompt } from '../../engine/execution/types.js';
import type { GateManager } from '../../engine/gates/gate-manager.js';
import type { ChainSessionManager } from '../../modules/chains/manager.js';
import type { Category, PromptData } from '../../modules/prompts/types.js';
/**
 * MCP Tool Router
 *
 * Manages 3 intelligent consolidated tools: prompt_engine, system_control, resource_manager
 */
export declare class McpToolRouter {
    private logger;
    private mcpServer;
    private promptManager;
    private configManager;
    private promptExecutor;
    private promptResourceHandler;
    private systemControl;
    private gateManagerTool;
    private frameworkManagerTool;
    private resourceManagerRouter?;
    private semanticAnalyzer;
    private frameworkStateStore?;
    private frameworkManager?;
    private conversationStore;
    private textReferenceStore;
    private toolDescriptionLoader?;
    private gateStateStore?;
    private gateManager;
    private analyticsService;
    private onRestart?;
    private promptsData;
    private convertedPrompts;
    private categories;
    private pendingAnalytics;
    private toolsInitialized;
    constructor(logger: Logger, mcpServer: any, promptManager: PromptAssetManager, configManager: ConfigManager, conversationStore: ConversationStore, textReferenceStore: TextReferenceStore, gateManager: GateManager);
    /**
     * Initialize the MCP tools with async configuration
     */
    initialize(onRefresh: () => Promise<void>, onRestart: (reason: string) => Promise<void>, metricsCollector: MetricsCollector): Promise<void>;
    /**
     * Set framework state manager (called after initialization)
     */
    setFrameworkStateStore(frameworkStateStore: FrameworkStateStore): void;
    /**
     * Set tool description manager (called after initialization)
     */
    setToolDescriptionLoader(manager: ToolDescriptionLoader): void;
    /**
     * Set hook registry for pipeline event emissions
     */
    setHookRegistry(hookRegistry: HookRegistryPort): void;
    /**
     * Set notification emitter for MCP client notifications
     */
    setNotificationEmitter(emitter: McpNotificationEmitterPort): void;
    /**
     * Read client info detected from the MCP initialize handshake.
     * Returns { name, version } if available, undefined otherwise.
     */
    private getDetectedClientInfo;
    /**
     * Enrich the MCP SDK extra with clientInfo from the initialize handshake.
     * The SDK does not forward clientInfo to tool handler extras, so we inject it
     * from server.getClientVersion() to enable automatic client detection.
     */
    private enrichExtraWithClientInfo;
    /**
     * Setup hot-reload event listeners for tool descriptions
     */
    private setupToolDescriptionHotReload;
    /**
     * Handle tool description changes
     */
    private handleToolDescriptionChange;
    /**
     * Initialize and set framework manager (called after framework state manager)
     */
    setFrameworkManager(existingFrameworkManager?: FrameworkManager): Promise<void>;
    /**
     * Expose the framework manager for runtime integrations (e.g., methodology hot reload).
     */
    getFrameworkManager(): FrameworkManager | undefined;
    /**
     * Get chain session manager for MCP resource access.
     * Delegates to PromptExecutor which owns the canonical instance.
     */
    getChainSessionManager(): ChainSessionManager | undefined;
    /**
     * Get metrics collector for MCP resource access.
     */
    getMetricsCollector(): MetricsCollector;
    /**
     * Get resource manager handler for auto-execute functionality.
     * Returns a function that can execute resource_manager actions internally.
     */
    getResourceManagerHandler(): ((args: Record<string, unknown>, context: Record<string, unknown>) => Promise<import('../../shared/types/index.js').ToolResponse>) | null;
    /**
     * Register all consolidated MCP tools with the server (centralized registration)
     */
    registerAllTools(): Promise<void>;
    /**
     * Update tool descriptions for framework switching without re-registering tools.
     * The MCP SDK does not support re-registering already registered tools.
     * Instead, we sync the description manager and notify clients of the change.
     */
    reregisterToolsWithUpdatedDescriptions(): Promise<void>;
    /**
     * Update internal data references
     */
    updateData(promptsData: PromptData[], convertedPrompts: ConvertedPrompt[], categories: Category[]): void;
    /**
     * Update system analytics (from consolidated tools)
     */
    updateAnalytics(analytics: any): void;
    /**
     * Flush pending analytics data to systemControl after initialization
     */
    private flushPendingAnalytics;
    /**
     * Shutdown all components and cleanup resources
     */
    shutdown(): void;
}
/**
 * Create MCP tool router
 */
export declare function createMcpToolRouter(logger: Logger, mcpServer: any, promptManager: PromptAssetManager, configManager: ConfigManager, conversationStore: ConversationStore, textReferenceStore: TextReferenceStore, onRefresh: () => Promise<void>, onRestart: (reason: string) => Promise<void>, gateManager: GateManager, metricsCollector: MetricsCollector): Promise<McpToolRouter>;
export { McpToolRouter as McpToolsManager };
export declare const createMcpToolsManager: typeof createMcpToolRouter;
