/**
 * Telemetry Lifecycle
 *
 * Extracts telemetry startup/shutdown from application.ts (1303 lines, Critical severity).
 * Owns: SDK initialization, hook observer registration, graceful shutdown flush.
 *
 * Architecture: Thin orchestration shell — delegates to TelemetryRuntimeImpl,
 * AttributePolicyEnforcer, and TelemetryHookObserver. No embedded domain logic.
 */
import { HookRegistry } from '../infra/hooks/index.js';
import { TelemetryRuntimeImpl } from '../infra/observability/telemetry/index.js';
import type { TelemetryStatus } from '../infra/observability/telemetry/index.js';
import type { Logger, TelemetryConfig } from '../shared/types/index.js';
export interface TelemetryLifecycleParams {
    config: TelemetryConfig;
    logger: Logger;
    hookRegistry: HookRegistry;
    serviceName: string;
    serviceVersion: string;
}
/**
 * Orchestrates the telemetry subsystem lifecycle.
 *
 * Usage in application.ts:
 * ```typescript
 * this.telemetryLifecycle = new TelemetryLifecycle({ config, logger, hookRegistry, ... });
 * await this.telemetryLifecycle.start();  // In startup()
 * await this.telemetryLifecycle.shutdown(); // In shutdown()
 * ```
 */
export declare class TelemetryLifecycle {
    private readonly runtime;
    private readonly observer;
    private readonly logger;
    private started;
    constructor(params: TelemetryLifecycleParams);
    /**
     * Start the telemetry runtime (SDK initialization + exporter connection).
     * Safe to call when telemetry is disabled — will log and no-op.
     */
    start(): Promise<void>;
    /**
     * Graceful shutdown: flush pending spans, tear down SDK.
     */
    shutdown(): Promise<void>;
    /**
     * Whether the telemetry runtime is active and collecting.
     */
    isEnabled(): boolean;
    /**
     * Get the underlying runtime for consumers that need tracer access (Phase 1.4).
     */
    getRuntime(): TelemetryRuntimeImpl;
    /**
     * Get status snapshot for observability resources (Phase 1.6).
     */
    getStatus(): TelemetryStatus;
}
