import type { Logger } from '../../../../../infra/logging/index.js';
import type { GateEntry, GateSource, GateSourceCounts } from '../types.js';
/**
 * Centralized gate collection with automatic deduplication.
 *
 * All pipeline stages MUST use this accumulator to add gates.
 * Direct mutation of gate arrays is prohibited.
 *
 * @example
 * ```typescript
 * // In a pipeline stage
 * context.gates.add('research-quality', 'registry-auto');
 * context.gates.addAll(methodologyGates, 'methodology');
 *
 * // Get final deduplicated list
 * const finalGates = context.gates.getAll();
 * ```
 */
export declare class GateAccumulator {
    private readonly gates;
    private readonly blockingGates;
    private readonly logger;
    private frozen;
    constructor(logger: Logger);
    /**
     * Add a gate with source tracking and automatic deduplication.
     *
     * If gate already exists:
     * - Higher priority source wins
     * - Same priority: first-in wins (no override)
     *
     * @returns true if gate was added/updated, false if skipped
     */
    add(gateId: string, source: GateSource, metadata?: Record<string, unknown>): boolean;
    /**
     * Add multiple gates from the same source.
     *
     * @returns Number of gates actually added (excluding duplicates)
     */
    addAll(gateIds: readonly string[] | undefined, source: GateSource, metadata?: Record<string, unknown>): number;
    /**
     * Check if a gate has been added (from any source).
     */
    has(gateId: string): boolean;
    /**
     * Get all accumulated gate IDs (deduplicated).
     */
    getAll(): readonly string[];
    /**
     * Get gates filtered by source.
     */
    getBySource(source: GateSource): readonly string[];
    /**
     * Get full entry details (for debugging/auditing).
     */
    getEntries(): readonly GateEntry[];
    /**
     * Get count of gates by source (for metrics).
     */
    getSourceCounts(): GateSourceCounts;
    /**
     * Freeze the accumulator - no more additions allowed.
     * Call this after all stages have contributed.
     */
    freeze(): void;
    /**
     * Check if accumulator is frozen.
     */
    isFrozen(): boolean;
    /**
     * Clear all gates (for testing or reset).
     */
    clear(): void;
    /**
     * Get total gate count.
     */
    get size(): number;
    /**
     * Get the maximum retry limit from all gate entries that have retry config.
     * Returns undefined if no gates have retry config.
     *
     * Used to determine maxAttempts when creating pending reviews.
     * Uses maximum across all gates to be most lenient.
     */
    getMaxRetryLimit(): number | undefined;
    /**
     * Get the entry for a specific gate ID.
     */
    getEntry(gateId: string): GateEntry | undefined;
    /**
     * Mark a gate as a response-blocking gate.
     * When a blocking gate fails, the execution response content will be suppressed.
     *
     * @param gateId - The gate ID to mark as blocking
     */
    addBlockingGate(gateId: string): void;
    /**
     * Check if any blocking gates have been registered.
     */
    hasBlockingGates(): boolean;
    /**
     * Get all blocking gate IDs.
     */
    getBlockingGateIds(): readonly string[];
    /**
     * Check if a specific gate is marked as blocking.
     */
    isBlockingGate(gateId: string): boolean;
}
