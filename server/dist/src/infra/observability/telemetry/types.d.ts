/**
 * Telemetry type contracts consumed by runtime, hook-observer, and pipeline instrumentation.
 *
 * Separates OTel-specific abstractions from existing in-memory analytics (metrics/)
 * and MCP notifications (notifications/).
 */
import type { Span, Tracer, SpanOptions } from '@opentelemetry/api';
export type { Span, Tracer, SpanOptions };
/**
 * Lifecycle interface for the OTel SDK wrapper.
 * Consumed by runtime/telemetry-lifecycle.ts for startup/shutdown orchestration.
 */
export interface TelemetryRuntime {
    /** Initialize the OTel SDK and start trace export. */
    start(): Promise<void>;
    /** Graceful shutdown: flush pending spans, then tear down SDK. */
    shutdown(): Promise<void>;
    /** Whether telemetry is active and collecting. */
    isEnabled(): boolean;
    /** Get a named tracer for span creation. Returns no-op tracer when disabled. */
    getTracer(name: string, version?: string): Tracer;
}
/**
 * Status snapshot for telemetry runtime health.
 * Exposed via resource://telemetry/status in Phase 1.6.
 */
export interface TelemetryStatus {
    enabled: boolean;
    mode: 'off' | 'traces' | 'full';
    exporterEndpoint: string;
    samplingRate: number;
    startedAt?: number;
}
/**
 * Root pipeline span attributes — set on `prompt_engine.request`.
 */
export interface PipelineRootAttributes {
    'cpm.execution.id': string;
    'cpm.execution.mode': string;
    'cpm.command.type'?: string;
    'cpm.prompt.id'?: string;
    'cpm.chain.current_step'?: number;
    'cpm.chain.total_steps'?: number;
    'cpm.framework.id'?: string;
    'cpm.framework.enabled'?: boolean;
}
/**
 * Per-stage child span attributes — set on `pipeline.stage.<StageName>`.
 */
export interface PipelineStageAttributes {
    'cpm.stage.name': string;
    'cpm.stage.index': number;
    'cpm.execution.id': string;
}
/**
 * Gate lifecycle event attributes — attached to trace events.
 */
export interface GateEventAttributes {
    'cpm.gate.id': string;
    'cpm.gate.passed': boolean;
    'cpm.gate.reason'?: string;
    'cpm.gate.blocks_response': boolean;
}
/**
 * Shell verification event attributes.
 */
export interface ShellVerifyEventAttributes {
    'cpm.shell_verify.stage': 'attempt' | 'passed' | 'failed' | 'escalated';
    'cpm.shell_verify.command'?: string;
    'cpm.shell_verify.exit_code'?: number;
}
/**
 * Chain lifecycle event attributes.
 */
export interface ChainEventAttributes {
    'cpm.chain.id': string;
    'cpm.chain.step_index'?: number;
    'cpm.chain.total_steps'?: number;
}
/**
 * Allowlisted business-context attributes for trace enrichment.
 * These are explicitly safe — no raw commands, responses, or prompt bodies.
 * See Phase 5.0 Telemetry Semantics Contract in the implementation plan.
 */
export declare const SAFE_BUSINESS_ATTRIBUTES: readonly ["cpm.command.type", "cpm.execution.mode", "cpm.prompt.id", "cpm.operator.types", "cpm.chain.current_step", "cpm.chain.total_steps", "cpm.gates.applied_count", "cpm.gates.temporary_count", "cpm.framework.id", "cpm.framework.enabled", "cpm.scope.continuity_source", "cpm.stages.executed_count", "cpm.stages.skipped", "cpm.stages.slowest", "cpm.stages.slowest_ms", "cpm.duration.total_ms", "cpm.had_early_exit", "cpm.gates.names", "cpm.gates.passed_count", "cpm.gates.failed_count", "cpm.gates.blocked", "cpm.gates.retry_exhausted", "cpm.gates.enforcement_mode", "cpm.chain.is_chain", "cpm.chain.step_index", "cpm.chain.id", "cpm.scope.source", "cpm.error.type"];
export type SafeBusinessAttribute = (typeof SAFE_BUSINESS_ATTRIBUTES)[number];
/**
 * Attribute keys that must NEVER appear in default telemetry.
 * Enforced by AttributePolicyEnforcer.
 */
export declare const EXCLUDED_ATTRIBUTES: readonly ["cpm.command.raw", "cpm.user_response.raw", "cpm.prompt.body", "cpm.prompt.rendered", "cpm.model.output", "cpm.template.body"];
export type ExcludedAttribute = (typeof EXCLUDED_ATTRIBUTES)[number];
/** Canonical event names for trace events. */
export declare const TRACE_EVENTS: {
    readonly GATE_PASSED: "gate.passed";
    readonly GATE_FAILED: "gate.failed";
    readonly GATE_RETRY_EXHAUSTED: "gate.retry_exhausted";
    readonly GATE_RESPONSE_BLOCKED: "gate.response_blocked";
    readonly SHELL_VERIFY_ATTEMPT: "shell_verify.attempt";
    readonly SHELL_VERIFY_PASSED: "shell_verify.passed";
    readonly SHELL_VERIFY_FAILED: "shell_verify.failed";
    readonly SHELL_VERIFY_ESCALATED: "shell_verify.escalated";
    readonly CHAIN_STEP_COMPLETE: "chain.step_complete";
    readonly CHAIN_COMPLETE: "chain.complete";
    readonly CHAIN_FAILED: "chain.failed";
};
/** Canonical span names. */
export declare const SPAN_NAMES: {
    /** Root span wrapping full pipeline execution. */
    readonly PIPELINE_REQUEST: "prompt_engine.request";
    /** Per-stage child span prefix. Full name: `pipeline.stage.<StageName>` */
    readonly STAGE_PREFIX: "pipeline.stage.";
};
