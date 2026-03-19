/**
 * Metric View Policy
 *
 * Enforces low-cardinality labels on OTel metric instruments.
 * Prevents high-cardinality identifiers (prompt IDs, chain IDs, etc.)
 * from appearing as metric dimensions — those belong in trace attributes only.
 *
 * See Phase 6.0 Sampling + Metric Label Policy in the implementation plan.
 */
/**
 * Metric labels permitted on OTel metric instruments.
 * These have bounded cardinality (≤50 distinct values each).
 */
export declare const ALLOWED_METRIC_LABELS: readonly ["stage_name", "stage_type", "status", "execution_mode", "is_chain"];
export type AllowedMetricLabel = (typeof ALLOWED_METRIC_LABELS)[number];
/**
 * Labels that must NOT appear on metric instruments.
 * High-cardinality: unbounded or user-supplied identifiers.
 * These are safe as trace attributes but would explode metric cardinality.
 */
export declare const DISALLOWED_METRIC_LABELS: readonly ["prompt_id", "chain_id", "continuity_scope_id", "operator_types", "execution_id", "session_id", "framework_id"];
export type DisallowedMetricLabel = (typeof DISALLOWED_METRIC_LABELS)[number];
/**
 * Check if a label key is allowed on metric instruments.
 */
export declare function isAllowedMetricLabel(key: string): boolean;
/**
 * Check if a label key is explicitly disallowed on metric instruments.
 */
export declare function isDisallowedMetricLabel(key: string): boolean;
/**
 * Filter a label map to include only allowed metric labels.
 * Drops disallowed and unknown labels — safe for metric instrument use.
 */
export declare function filterMetricLabels(labels: Record<string, string | number | boolean>): Record<AllowedMetricLabel, string | number | boolean>;
/**
 * Validate that a set of label keys contains no disallowed entries.
 * Returns list of violations for diagnostic output.
 */
export declare function validateMetricLabels(keys: string[]): string[];
/**
 * Metric view definition for OTel SDK MeterProvider configuration.
 * Used in Phase 1.2 runtime setup to register attribute filters.
 */
export interface MetricViewDefinition {
    /** Metric instrument name pattern (glob). */
    instrumentName: string;
    /** Allowed attribute keys for this metric. */
    attributeKeys: AllowedMetricLabel[];
}
/**
 * Default metric views for the pipeline metrics.
 * Applied during MeterProvider configuration.
 */
export declare const DEFAULT_METRIC_VIEWS: MetricViewDefinition[];
