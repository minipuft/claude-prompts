/**
 * Metrics Module Exports
 *
 * Centralized exports for the metrics collector and related types.
 * Provides event-driven metrics collection separated from execution logic.
 */
export { InMemoryMetricsCollector, createMetricsCollector } from './analytics-service.js';
export type { ExecutionData, GateValidationData, GateUsageMetric, GateValidationResult, FrameworkSwitchData, ExecutionStats, SystemMetrics, FrameworkUsage, AnalyticsEvent, AnalyticsQueryOptions, AnalyticsSummary, PerformanceTrend, PipelineStageType, PipelineStageStatus, PipelineStageMetric, PipelineStageMetadata, MetricStatus, CommandExecutionMode, CommandExecutionMetric, MetricsCollector, } from './types.js';
