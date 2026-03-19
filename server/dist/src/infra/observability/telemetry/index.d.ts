/**
 * OpenTelemetry Telemetry Module
 *
 * Provides trace/event emission with attribute policy enforcement.
 * Separate from metrics/ (in-memory analytics) and notifications/ (MCP client events).
 */
export { SAFE_BUSINESS_ATTRIBUTES, EXCLUDED_ATTRIBUTES, TRACE_EVENTS, SPAN_NAMES, } from './types.js';
export type { TelemetryRuntime, TelemetryStatus, PipelineRootAttributes, PipelineStageAttributes, GateEventAttributes, ShellVerifyEventAttributes, ChainEventAttributes, SafeBusinessAttribute, ExcludedAttribute, Span, Tracer, SpanOptions, } from './types.js';
export { AttributePolicyEnforcer, redactAttributes } from './attribute-policy.js';
export { ALLOWED_METRIC_LABELS, DISALLOWED_METRIC_LABELS, DEFAULT_METRIC_VIEWS, isAllowedMetricLabel, isDisallowedMetricLabel, filterMetricLabels, validateMetricLabels, } from './metric-view-policy.js';
export type { AllowedMetricLabel, DisallowedMetricLabel, MetricViewDefinition, } from './metric-view-policy.js';
export { TelemetryRuntimeImpl, createTelemetryRuntime } from './runtime.js';
export { TelemetryHookObserver } from './hook-observer.js';
