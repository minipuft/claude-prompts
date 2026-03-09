// @lifecycle canonical - Content hashing utilities for cache generation and sync.
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

import { createHash } from 'node:crypto';

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
export function computeContentHash(contents: string[]): string {
  const h = createHash('sha256');
  for (const c of contents.sort()) h.update(c);
  return h.digest('hex');
}

/**
 * Compute SHA256 hash from a single string.
 *
 * @param content - Content string to hash
 * @returns Hex-encoded SHA256 hash
 */
export function hashString(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
