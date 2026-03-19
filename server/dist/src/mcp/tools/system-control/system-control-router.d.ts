import { SafeConfigWriter } from '../config-utils.js';
import { ResponseFormatter } from '../prompt-engine/processors/response-formatter.js';
import { ToolDescriptionLoader } from '../tool-description-loader.js';
import { FrameworkManager } from '../../../engine/frameworks/framework-manager.js';
import { FrameworkStateStore } from '../../../engine/frameworks/framework-state-store.js';
import { GateStateStore } from '../../../engine/gates/gate-state-store.js';
import { type ConfigManager, type MetricsCollector, type Logger, type ToolResponse, type ChainSessionService, StateStoreOptions } from '../../../shared/types/index.js';
import type { SystemAnalytics, SystemControlContext } from './core/types.js';
import type { PromptGuidanceService } from '../../../engine/frameworks/prompt-guidance/index.js';
import type { GateGuidanceRenderer } from '../../../engine/gates/guidance/GateGuidanceRenderer.js';
/**
 * System control router — thin orchestrator dispatching to focused action handlers.
 *
 * Implements SystemControlContext to provide type-safe shared state to all handlers.
 * Domain logic lives in the handler classes, not here.
 */
export declare class ConsolidatedSystemControl implements SystemControlContext {
    readonly logger: Logger;
    readonly responseFormatter: ResponseFormatter;
    readonly startTime: number;
    frameworkStateStore?: FrameworkStateStore;
    frameworkManager?: FrameworkManager;
    gateStateStore?: GateStateStore;
    gateGuidanceRenderer?: GateGuidanceRenderer;
    chainSessionManager?: ChainSessionService;
    configManager?: ConfigManager;
    safeConfigWriter?: SafeConfigWriter;
    onRestart?: (reason: string) => Promise<void>;
    mcpToolsManager?: any;
    analyticsService?: MetricsCollector;
    promptGuidanceService?: PromptGuidanceService;
    systemAnalytics: SystemAnalytics;
    requestScope?: StateStoreOptions;
    private lastMemoryUsage;
    constructor(logger: Logger, _mcpServer: any, onRestart?: (reason: string) => Promise<void>);
    setFrameworkStateStore(frameworkStateStore: FrameworkStateStore): void;
    setFrameworkManager(frameworkManager: FrameworkManager): void;
    setToolDescriptionLoader(_manager: ToolDescriptionLoader): void;
    setAnalyticsService(analyticsService: MetricsCollector): void;
    setConfigManager(configManager: ConfigManager): void;
    setRestartCallback(onRestart: (reason: string) => Promise<void>): void;
    setMCPToolsManager(mcpToolsManager: any): void;
    setGateStateStore(gateStateStore: GateStateStore): void;
    setChainSessionManager(chainSessionManager: ChainSessionService): void;
    setGateGuidanceRenderer(renderer: GateGuidanceRenderer): void;
    createMinimalSystemResponse(text: string, action: string): ToolResponse;
    persistGateConfig(enabled: boolean): Promise<string | undefined>;
    persistFrameworkConfig(enabled: boolean): Promise<string | undefined>;
    updateAnalytics(analytics: Partial<SystemAnalytics> & {
        currentExecution?: any;
    }): void;
    private calculateMemoryDelta;
    handleAction(args: {
        action: string;
        [key: string]: any;
    }, extra: any): Promise<ToolResponse>;
    private extractScope;
    private getActionHandler;
}
export declare function createConsolidatedSystemControl(logger: Logger, mcpServer: any, onRestart?: (reason: string) => Promise<void>): ConsolidatedSystemControl;
