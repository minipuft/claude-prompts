/**
 * Pipeline-driven prompt execution service.
 *
 * Wires the canonical PromptExecutionPipeline together with the surrounding
 * services (sessions, gates, framework state) so the MCP tool only needs to
 * pass validated requests into the pipeline.
 *
 * Architecture:
 *   PromptExecutor (this file — orchestration)
 *     └── PipelineBuilder (pipeline-builder.ts — factory)
 *           └── PromptExecutionPipeline (coordinator)
 *                 └── PipelineStage[] (stages 00-11)
 */
import { createSymbolicCommandParser } from '../../../../engine/execution/parsers/symbolic-operator-parser.js';
import { FrameworkManager } from '../../../../engine/frameworks/framework-manager.js';
import { FrameworkStateStore } from '../../../../engine/frameworks/framework-state-store.js';
import { PromptGuidanceService } from '../../../../engine/frameworks/prompt-guidance/index.js';
import { LightweightGateSystem } from '../../../../engine/gates/core/index.js';
import { GateGuidanceRenderer } from '../../../../engine/gates/guidance/GateGuidanceRenderer.js';
import { PromptAssetManager } from '../../../../modules/prompts/index.js';
import { ContentAnalyzer } from '../../../../modules/semantic/configurable-semantic-analyzer.js';
import { ConversationStore } from '../../../../modules/text-refs/conversation.js';
import { TextReferenceStore } from '../../../../modules/text-refs/index.js';
import { type Logger, type MetricsCollector, type HookRegistryPort, type McpNotificationEmitterPort, ToolResponse, ConfigManager, ChainSessionService } from '../../../../shared/types/index.js';
import { ToolDescriptionLoader } from '../../tool-description-loader.js';
import type { ConvertedPrompt } from '../../../../engine/execution/types.js';
import type { GateManager } from '../../../../engine/gates/gate-manager.js';
import type { PromptData } from '../../../../modules/prompts/types.js';
export declare class PromptExecutor {
    readonly inlineGateParser: ReturnType<typeof createSymbolicCommandParser>;
    private readonly logger;
    private readonly mcpServer;
    private readonly promptManager;
    private readonly configManager;
    private readonly semanticAnalyzer;
    private readonly conversationStore;
    private readonly textReferenceStore;
    private readonly responseFormatter;
    private readonly executionPlanner;
    private readonly parsingSystem;
    private readonly chainSessionRouter;
    private readonly lightweightGateSystem;
    private readonly gateReferenceResolver;
    private readonly gateGuidanceRenderer;
    private readonly chainSessionManager;
    private readonly argumentHistoryTracker;
    private frameworkStateStore?;
    private frameworkManager?;
    private promptGuidanceService;
    private chainOperatorExecutor?;
    private frameworkValidator;
    private toolDescriptionLoader?;
    private analyticsService?;
    private promptPipeline;
    private mcpToolsManager?;
    /** GateManager for registry-based gate selection in pipeline stages */
    private readonly gateManager;
    /** StyleManager for dynamic style guidance (# operator) */
    private styleManager?;
    /** Resolver for {{ref:prompt_id}} references in templates */
    private referenceResolver?;
    /** Resolver for {{script:id}} references in templates */
    private scriptReferenceResolver?;
    /** Hook registry for pipeline event emissions */
    private hookRegistry?;
    /** Notification emitter for MCP client notifications */
    private notificationEmitter?;
    private convertedPrompts;
    private readonly serverRoot;
    constructor(logger: Logger, mcpServer: any, promptManager: PromptAssetManager, configManager: ConfigManager, semanticAnalyzer: ContentAnalyzer, conversationStore: ConversationStore, textReferenceStore: TextReferenceStore, gateManager: GateManager, mcpToolsManager?: any, promptGuidanceService?: PromptGuidanceService);
    updateData(_promptsData: PromptData[], convertedPrompts: ConvertedPrompt[]): void;
    setFrameworkStateStore(frameworkStateStore: FrameworkStateStore): void;
    setFrameworkManager(frameworkManager: FrameworkManager): void;
    setToolDescriptionLoader(manager: ToolDescriptionLoader): void;
    setAnalyticsService(analyticsService: MetricsCollector): void;
    setDatabasePort(db: import('../../../../shared/types/persistence.js').DatabasePort): void;
    setHookRegistry(hookRegistry: HookRegistryPort): void;
    setNotificationEmitter(emitter: McpNotificationEmitterPort): void;
    setGateStateStore(gateStateStore: any): void;
    getLightweightGateSystem(): LightweightGateSystem;
    getGateGuidanceRenderer(): GateGuidanceRenderer;
    /**
     * Get chain session manager for external access (MCP resources).
     * This is the canonical instance that tracks all chain sessions.
     */
    getChainSessionManager(): ChainSessionService;
    cleanup(): Promise<void>;
    executePromptCommand(args: {
        command?: string;
        force_restart?: boolean;
        chain_id?: string;
        gate_verdict?: string;
        gate_action?: 'retry' | 'skip' | 'abort';
        user_response?: string;
        /** Unified gate specifications (canonical in v3.0.0+). Accepts gate IDs, simple checks, or full definitions. */
        gates?: import('../../../../shared/types/execution.js').GateSpecification[];
        options?: Record<string, unknown>;
    }, extra: any): Promise<ToolResponse>;
    /**
     * Extracts a chain_id from a bare command string when users send chain resumes
     * as the command value (common with LLM-generated calls). Only used for resume
     * scenarios to avoid colliding with real commands.
     */
    private extractChainId;
    private routeToTool;
    private buildPromptListFallback;
    private generatePromptEngineGuide;
    private initializePromptGuidanceService;
    private initializeStyleManager;
    private resetPipeline;
    private rebuildFrameworkValidator;
    private createChainOperatorExecutor;
    private resolveFrameworkContextForPrompt;
    private getFrameworkExecutionContext;
    private getPromptExecutionPipeline;
}
export declare function createPromptExecutor(logger: Logger, mcpServer: any, promptManager: PromptAssetManager, configManager: ConfigManager, semanticAnalyzer: ContentAnalyzer, conversationStore: ConversationStore, textReferenceStore: TextReferenceStore, gateManager: GateManager, mcpToolsManager?: any, promptGuidanceService?: PromptGuidanceService): PromptExecutor;
export declare function cleanupPromptExecutor(tool: PromptExecutor): Promise<void>;
