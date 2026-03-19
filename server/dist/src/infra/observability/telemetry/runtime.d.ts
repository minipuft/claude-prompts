/**
 * Telemetry Runtime
 *
 * Wraps @opentelemetry/sdk-node for MCP server lifecycle management.
 * Handles:
 * - SDK initialization from TelemetryConfig
 * - Graceful shutdown with span flush
 * - Disabled/no-op mode when telemetry is off
 * - Tracer access for span creation
 *
 * Architecture: OOP shell (lifecycle class) + FP internals (config validation).
 * Cannot be added to existing analytics-service.ts (different concern: OTel SDK vs in-memory analytics).
 */
import type { TelemetryRuntime, TelemetryStatus } from './types.js';
import type { Logger, TelemetryConfig } from '../../../shared/types/index.js';
import type { Tracer } from '@opentelemetry/api';
/**
 * Manages the OpenTelemetry NodeSDK lifecycle.
 *
 * Usage:
 * ```typescript
 * const runtime = new TelemetryRuntimeImpl(config, logger, 'claude-prompts', '2.0.0');
 * await runtime.start();
 * const tracer = runtime.getTracer('pipeline');
 * // ... create spans ...
 * await runtime.shutdown();
 * ```
 */
export declare class TelemetryRuntimeImpl implements TelemetryRuntime {
    private sdk;
    private enabled;
    private startedAt;
    private readonly config;
    private readonly logger;
    private readonly serviceName;
    private readonly serviceVersion;
    constructor(config: TelemetryConfig, logger: Logger, serviceName: string, serviceVersion: string);
    start(): Promise<void>;
    shutdown(): Promise<void>;
    isEnabled(): boolean;
    /**
     * Get a named tracer for creating spans.
     * Returns the global no-op tracer when telemetry is disabled,
     * so callers don't need to check isEnabled() before creating spans.
     */
    getTracer(name: string, version?: string): Tracer;
    /**
     * Get runtime status snapshot for observability resources.
     */
    getStatus(): TelemetryStatus;
}
/**
 * Create a telemetry runtime from config.
 * Does NOT start the runtime — call `start()` separately during application bootstrap.
 */
export declare function createTelemetryRuntime(config: TelemetryConfig, logger: Logger, serviceName: string, serviceVersion: string): TelemetryRuntimeImpl;
