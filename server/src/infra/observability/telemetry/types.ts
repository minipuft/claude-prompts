// @lifecycle canonical - Typed contracts for the OpenTelemetry telemetry subsystem.
/**
 * Telemetry type contracts consumed by runtime, hook-observer, and pipeline instrumentation.
 *
 * Separates OTel-specific abstractions from existing in-memory analytics (metrics/)
 * and MCP notifications (notifications/).
 */

import type { Span, Tracer, SpanOptions } from '@opentelemetry/api';

// Re-export OTel types that consumers need without direct @opentelemetry/api dependency
export type { Span, Tracer, SpanOptions };

// ===== Telemetry Runtime Contract =====

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

// ===== Span Attribute Shapes =====
// Type-safe attribute maps for trace spans and events.
// Keys follow the `cpm.*` namespace to avoid collision with OTel semantic conventions.

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

// ===== Safe Business Context =====

/**
 * Allowlisted business-context attributes for trace enrichment.
 * These are explicitly safe — no raw commands, responses, or prompt bodies.
 * See Phase 5.0 Telemetry Semantics Contract in the implementation plan.
 */
export const SAFE_BUSINESS_ATTRIBUTES = [
  'cpm.command.type',
  'cpm.execution.mode',
  'cpm.prompt.id',
  'cpm.operator.types',
  'cpm.chain.current_step',
  'cpm.chain.total_steps',
  'cpm.gates.applied_count',
  'cpm.gates.temporary_count',
  'cpm.framework.id',
  'cpm.framework.enabled',
  'cpm.scope.continuity_source',
  // Wide-event enrichment (pipeline completion) — per /observability skill
  'cpm.stages.executed_count',
  'cpm.stages.skipped',
  'cpm.stages.slowest',
  'cpm.stages.slowest_ms',
  'cpm.duration.total_ms',
  'cpm.had_early_exit',
  'cpm.gates.names',
  'cpm.gates.passed_count',
  'cpm.gates.failed_count',
  'cpm.gates.blocked',
  'cpm.gates.retry_exhausted',
  'cpm.gates.enforcement_mode',
  'cpm.chain.is_chain',
  'cpm.chain.step_index',
  'cpm.chain.id',
  'cpm.scope.source',
  'cpm.error.type',
] as const;

export type SafeBusinessAttribute = (typeof SAFE_BUSINESS_ATTRIBUTES)[number];

// ===== Explicitly Excluded Attributes =====

/**
 * Attribute keys that must NEVER appear in default telemetry.
 * Enforced by AttributePolicyEnforcer.
 */
export const EXCLUDED_ATTRIBUTES = [
  'cpm.command.raw',
  'cpm.user_response.raw',
  'cpm.prompt.body',
  'cpm.prompt.rendered',
  'cpm.model.output',
  'cpm.template.body',
] as const;

export type ExcludedAttribute = (typeof EXCLUDED_ATTRIBUTES)[number];

// ===== Event Names =====

/** Canonical event names for trace events. */
export const TRACE_EVENTS = {
  // Gate lifecycle
  GATE_PASSED: 'gate.passed',
  GATE_FAILED: 'gate.failed',
  GATE_RETRY_EXHAUSTED: 'gate.retry_exhausted',
  GATE_RESPONSE_BLOCKED: 'gate.response_blocked',

  // Shell verification lifecycle
  SHELL_VERIFY_ATTEMPT: 'shell_verify.attempt',
  SHELL_VERIFY_PASSED: 'shell_verify.passed',
  SHELL_VERIFY_FAILED: 'shell_verify.failed',
  SHELL_VERIFY_ESCALATED: 'shell_verify.escalated',

  // Chain lifecycle
  CHAIN_STEP_COMPLETE: 'chain.step_complete',
  CHAIN_COMPLETE: 'chain.complete',
  CHAIN_FAILED: 'chain.failed',
} as const;

// ===== Span Names =====

/** Canonical span names. */
export const SPAN_NAMES = {
  /** Root span wrapping full pipeline execution. */
  PIPELINE_REQUEST: 'prompt_engine.request',
  /** Per-stage child span prefix. Full name: `pipeline.stage.<StageName>` */
  STAGE_PREFIX: 'pipeline.stage.',
} as const;
