import type { SystemControlContext } from './types.js';
import type { FrameworkManager } from '../../../../engine/frameworks/framework-manager.js';
import type { FrameworkStateStore } from '../../../../engine/frameworks/framework-state-store.js';
import type { GateStateStore } from '../../../../engine/gates/gate-state-store.js';
import type { StateStoreOptions, ConfigManager, Logger, ToolResponse } from '../../../../shared/types/index.js';
import type { SafeConfigWriter } from '../../config-utils.js';
/**
 * Base class for system_control action handlers.
 *
 * Provides typed access to shared context and formatting helpers.
 */
export declare abstract class ActionHandler {
    protected readonly context: SystemControlContext;
    constructor(context: SystemControlContext);
    abstract execute(args: any): Promise<ToolResponse>;
    protected get logger(): Logger;
    protected get startTime(): number;
    protected get frameworkManager(): FrameworkManager | undefined;
    protected get frameworkStateStore(): FrameworkStateStore | undefined;
    protected get gateStateStore(): GateStateStore | undefined;
    protected get configManager(): ConfigManager | undefined;
    protected get safeConfigWriter(): SafeConfigWriter | undefined;
    protected get onRestart(): ((reason: string) => Promise<void>) | undefined;
    protected get mcpToolsManager(): any;
    protected get requestScope(): StateStoreOptions | undefined;
    protected createMinimalSystemResponse(text: string, action: string): ToolResponse;
    protected getExecutionsByMode(): Record<string, number>;
    protected formatUptime(uptime: number): string;
    protected formatExecutionTime(time: number): string;
    protected formatBytes(bytes: number): string;
    protected getHealthIcon(status: string): string;
    protected getSuccessRate(): number;
    protected formatTrendContext(trend: {
        framework?: string;
        executionMode?: string;
        success?: boolean;
    }): string;
    protected formatTrendValue(metric: string, value: number): string;
}
