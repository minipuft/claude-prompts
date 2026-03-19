/**
 * Telemetry Hook Observer
 *
 * Registers as a consumer of HookRegistry events and converts them
 * into OpenTelemetry trace events (span events). This is the single
 * telemetry consumer that listens to the hook fan-out point.
 *
 * Architecture:
 * - Pipeline stages emit hook events (Phase 1.3b)
 * - HookRegistry fans out to registered consumers
 * - This observer converts hook events → OTel span events
 * - Attribute policy enforces data safety on all emitted attributes
 *
 * Does NOT create spans — spans are managed by the pipeline instrumentation (Phase 1.4).
 * This observer only adds events to the active span context.
 */
import { AttributePolicyEnforcer } from './attribute-policy.js';
import type { TelemetryRuntime } from './types.js';
import type { Logger } from '../../../shared/types/index.js';
import type { HookRegistry } from '../../hooks/hook-registry.js';
/**
 * Observes hook events and emits them as OTel trace events.
 *
 * Usage:
 * ```typescript
 * const observer = new TelemetryHookObserver(runtime, policy, logger);
 * observer.register(hookRegistry);
 * // Now hook events automatically become trace events
 * ```
 */
export declare class TelemetryHookObserver {
    private readonly runtime;
    private readonly policy;
    private readonly logger;
    constructor(runtime: TelemetryRuntime, policy: AttributePolicyEnforcer, logger: Logger);
    /**
     * Register as a hook consumer on the given HookRegistry.
     * Safe to call when telemetry is disabled — hooks will no-op.
     */
    register(hookRegistry: HookRegistry): void;
    private buildPipelineHooks;
    private buildGateHooks;
    private buildChainHooks;
    /**
     * Add an event to the currently active span, if any.
     * Applies attribute policy before emission.
     */
    private addEventToActiveSpan;
}
