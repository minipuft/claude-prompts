/**
 * Verdict Pattern Loader
 *
 * Loads gate verdict parsing patterns from YAML configuration,
 * enabling runtime customization without code changes.
 *
 * @example
 * ```typescript
 * const patterns = loadVerdictPatterns();
 * for (const { regex, priority } of patterns) {
 *   // Use pattern for verdict parsing
 * }
 * ```
 */
/**
 * Priority levels for verdict pattern matching.
 * Higher priority patterns are tried first.
 */
export type VerdictPatternPriority = 'primary' | 'high' | 'medium' | 'fallback';
/**
 * A verdict pattern with compiled regex and metadata.
 */
export interface VerdictPattern {
    readonly id: string;
    readonly regex: RegExp;
    readonly priority: VerdictPatternPriority;
    readonly description?: string;
    readonly restrictedSources?: string[];
}
/**
 * Load verdict patterns from YAML configuration.
 * Falls back to default patterns if loading fails.
 *
 * @param forceReload - If true, bypass cache and reload from file
 * @returns Array of compiled verdict patterns
 */
export declare function loadVerdictPatterns(forceReload?: boolean): VerdictPattern[];
/**
 * Get validation settings for verdict parsing.
 */
export declare function getVerdictValidationSettings(): {
    requireRationale: boolean;
    minRationaleLength: number;
};
/**
 * Clear cached patterns (useful for testing or hot reload).
 */
export declare function clearVerdictPatternCache(): void;
/**
 * Get patterns by priority level.
 */
export declare function getPatternsByPriority(priority: VerdictPatternPriority): VerdictPattern[];
/**
 * Check if a pattern is restricted to specific sources.
 */
export declare function isPatternRestrictedToSource(pattern: VerdictPattern, source: string): boolean;
