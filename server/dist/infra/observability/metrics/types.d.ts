/**
 * Analytics Service Types
 *
 * Canonical definitions live in shared/types/metrics.ts.
 * This file re-exports for backward compatibility within the infra/ layer.
 */
export type { ExecutionData, GateValidationData, GateValidationResult, GateUsageMetric, FrameworkSwitchData, ExecutionStats, SystemMetrics, PerformanceTrend, FrameworkUsage, AnalyticsEvent, AnalyticsQueryOptions, AnalyticsSummary, PipelineStageType, PipelineStageStatus, PipelineStageMetadata, PipelineStageMetric, MetricStatus, CommandExecutionMode, CommandExecutionMetric, MetricsCollector, } from '../../../shared/types/metrics.js';
