import { BasePipelineStage } from '../stage.js';
import type { Logger } from '../../../../infra/logging/index.js';
import type { ChainSessionService, HookRegistryPort, McpNotificationEmitterPort, MetricsCollector } from '../../../../shared/types/index.js';
import type { GateDefinitionProvider } from '../../../gates/core/gate-loader.js';
import type { TemporaryGateRegistry } from '../../../gates/core/temporary-gate-registry.js';
import type { ExecutionContext } from '../../context/index.js';
type MetricsProvider = () => MetricsCollector | undefined;
type FrameworkEnabledProvider = () => boolean;
/**
 * Canonical Pipeline Stage 0.2: Dependency Injection
 *
 * Records execution dependencies (framework state, gate registry, analytics,
 * hook registry, notification emitter) directly on the ExecutionContext so
 * downstream stages can access a single source of truth without recreating
 * wiring from PromptExecutor.
 */
export declare class DependencyInjectionStage extends BasePipelineStage {
    private readonly temporaryGateRegistry;
    private readonly chainSessionManager;
    private readonly frameworkEnabledProvider;
    private readonly metricsProvider;
    private readonly pipelineVersion;
    private readonly hookRegistry?;
    private readonly notificationEmitter?;
    private readonly gateLoader?;
    readonly name = "DependencyInjection";
    constructor(temporaryGateRegistry: TemporaryGateRegistry, chainSessionManager: ChainSessionService, frameworkEnabledProvider: FrameworkEnabledProvider | null, metricsProvider: MetricsProvider | null, pipelineVersion: string, logger: Logger, hookRegistry?: HookRegistryPort | undefined, notificationEmitter?: McpNotificationEmitterPort | undefined, gateLoader?: GateDefinitionProvider | undefined);
    execute(context: ExecutionContext): Promise<void>;
}
export {};
