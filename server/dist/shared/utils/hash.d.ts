/**
 * Hash Utilities
 *
 * Provides deterministic content hashing for cache invalidation and sync manifests.
 * Single source of truth for SHA-256 hashing across the codebase.
 *
 * Design: Returns raw hex digest. Consumers add their own formatting (e.g., `sha256:` prefix)
 * if needed for their specific use case.
 *
 * Consumers:
 * - ResourceIndexer: Content hashes for incremental sync (resource_index table)
 * - skills-sync.ts: Manifest hashing for drift detection
 * - ResourceChangeTracker: Audit log hashing (adds `sha256:` prefix)
 */
/**
 * Compute SHA256 hash from content strings.
 * Sorts inputs for deterministic output regardless of order.
 *
 * @param contents - Array of content strings to hash
 * @returns Hex-encoded SHA256 hash
 *
 * @example
 * ```typescript
 * const hash = computeContentHash([schemaJson, configYaml, description]);
 * ```
 */
export declare function computeContentHash(contents: string[]): string;
/**
 * Compute SHA256 hash from a single string.
 *
 * @param content - Content string to hash
 * @returns Hex-encoded SHA256 hash
 */
export declare function hashString(content: string): string;
