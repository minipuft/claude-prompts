/**
 * Application Runtime Management
 * Manages application lifecycle, module coordination, and system health
 *
 * This is the streamlined version of the original ApplicationOrchestrator,
 * focused on runtime concerns while delegating execution to the execution engine.
 */
import { RuntimeLaunchOptions } from './options.js';
import { ConfigLoader } from '../infra/config/index.js';
import { Logger } from '../infra/logging/index.js';
import { PromptAssetManager } from '../modules/prompts/index.js';
import { ConversationStore } from '../modules/text-refs/conversation.js';
import { TextReferenceStore } from '../modules/text-refs/index.js';
import type { ConvertedPrompt } from '../engine/execution/types.js';
import type { ServerLifecycle } from '../infra/http/index.js';
import type { ApiRouter } from '../mcp/http/api.js';
import type { McpToolRouter } from '../mcp/tools/index.js';
import type { Category, PromptData } from '../modules/prompts/types.js';
/**
 * Application Runtime class
 * Coordinates all modules and manages application lifecycle
 */
export declare class Application {
    private logger;
    private configManager;
    private textReferenceStore;
    private conversationStore;
    private promptManager;
    private mcpToolsManager;
    private toolDescriptionLoader;
    private frameworkStateStore;
    private gateManager?;
    private hookRegistry;
    private notificationEmitter;
    private pathResolver;
    private transportRouter;
    private apiRouter;
    private serverLifecycle;
    private mcpServer;
    private _promptsData;
    private _categories;
    private _convertedPrompts;
    private promptsFilePath?;
    private hotReloadInitialized;
    private promptReloadInProgress;
    private promptHotReloadHandler;
    private memoryOptimizationInterval;
    private debugOutput;
    private runtimeOptions;
    private serviceOrchestrator;
    private serverRoot?;
    private transportType?;
    private frameworksConfigListener;
    private pendingFrameworkSystemState;
    /**
     * Conditional debug logging to prevent output flood during tests
     */
    private debugLog;
    constructor(logger?: Logger, runtimeOptions?: RuntimeLaunchOptions);
    /**
     * Initialize all modules in the correct order
     */
    startup(): Promise<void>;
    /**
     * Public test methods for GitHub Actions compatibility
     */
    loadConfiguration(): Promise<void>;
    loadPromptsData(): Promise<void>;
    initializeModules(): Promise<void>;
    get config(): import("../shared/types/core-config.js").Config;
    get promptsData(): PromptData[];
    get convertedPrompts(): ConvertedPrompt[];
    get categories(): Category[];
    /**
     *  Initialize foundation (configuration, logging, basic services)
     */
    private initializeFoundation;
    /**
     * Load and process prompt data
     */
    private loadAndProcessData;
    /**
     * Initialize remaining modules with loaded data
     */
    private initializeModulesPrivate;
    /**
     * Register MCP resources for prompts, gates, methodologies, and observability.
     * Resources provide 5-16x more token-efficient discovery than tool-based list operations.
     */
    private registerMcpResources;
    /**
     * Setup and start the server
     */
    private startServer;
    /**
     * Switch to a different framework by ID (built-in or custom)
     * Core functionality: Allow switching between registered frameworks to guide the system
     */
    switchFramework(frameworkId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Get current framework information
     */
    getCurrentFrameworkInfo(): {
        id: string;
        name: string;
        availableFrameworks: string[];
        isHealthy: boolean;
    };
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
    /**
     * Perform a full server refresh (hot-reload).
     * This reloads all prompts from disk and updates all relevant modules.
     */
    fullServerRefresh(): Promise<void>;
    private ensurePromptHotReload;
    private handlePromptHotReload;
    /**
     * Restart the application by shutting down and exiting with a restart code.
     * Relies on a process manager (e.g., PM2) to restart the process.
     */
    restartServer(reason?: string): Promise<void>;
    /**
     * Get application status
     */
    getStatus(): {
        running: boolean;
        transport?: string;
        promptsLoaded: number;
        categoriesLoaded: number;
        serverStatus?: any;
        executionCoordinator?: {
            totalExecutions: number;
            promptExecutions: number;
            chainExecutions: number;
            successRate: number;
        };
    };
    /**
     * Get all module instances (for debugging/testing)
     */
    getModules(): {
        logger: Logger;
        configManager: ConfigLoader;
        promptManager: PromptAssetManager;
        textReferenceStore: TextReferenceStore;
        conversationStore: ConversationStore;
        mcpToolsManager: McpToolRouter;
        apiRouter: ApiRouter | undefined;
        serverLifecycle: ServerLifecycle | undefined;
    };
    /**
     * Validate application health - comprehensive health check
     */
    validateHealth(): {
        healthy: boolean;
        modules: {
            foundation: boolean;
            dataLoaded: boolean;
            modulesInitialized: boolean;
            serverRunning: boolean;
        };
        details: {
            promptsLoaded: number;
            categoriesLoaded: number;
            serverStatus?: any;
            moduleStatus: Record<string, boolean>;
        };
        issues: string[];
    };
    /**
     * Get performance metrics for monitoring
     */
    getPerformanceMetrics(): {
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
        process: {
            pid: number;
            nodeVersion: string;
            platform: string;
            arch: string;
        };
        application: {
            promptsLoaded: number;
            categoriesLoaded: number;
            serverConnections?: number;
        };
        executionCoordinator?: {
            statistics: any;
        };
    };
    /**
     * Cleanup resources and stop timers
     */
    cleanup(): void;
    private setupFrameworkConfigListener;
    private handleFrameworkConfigChange;
    private syncFrameworkSystemStateFromConfig;
    private describeDisabledFrameworkFeatures;
    /**
     * Emergency diagnostic information for troubleshooting
     */
    getDiagnosticInfo(): {
        timestamp: string;
        health: ReturnType<Application['validateHealth']>;
        performance: ReturnType<Application['getPerformanceMetrics']>;
        configuration: {
            transport: string;
            configLoaded: boolean;
        };
        errors: string[];
    };
}
/**
 * Create and configure an application runtime
 */
export declare function createApplication(logger?: Logger, runtimeOptions?: RuntimeLaunchOptions): Application;
/**
 * Main application entry point
 */
export declare function startApplication(runtimeOptions?: RuntimeLaunchOptions): Promise<Application>;
