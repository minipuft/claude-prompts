// @lifecycle canonical - Unified resource handler pattern exports
/**
 * Resource Manager Module
 *
 * Provides a unified base class for resource handlers:
 * - BaseResourceHandler: Abstract base class with common patterns
 * - Types: Shared type definitions for handlers
 *
 * Architecture:
 * ```
 *                 BaseResourceHandler<T>
 *                        │
 *        ┌───────────────┼───────────────┐
 *        │               │               │
 *   GateManager   FrameworkManager  StyleManager
 * ```
 *
 * @example
 * ```typescript
 * import { BaseResourceHandler, ResourceManagerStats } from './core/resource-manager';
 *
 * class MyManager extends BaseResourceHandler<MyResource, MyEntry> {
 *   // Implement abstract methods...
 * }
 * ```
 */

export { BaseResourceHandler } from './base-resource-handler.js';

export type {
  ResourceManagerStats,
  ResourceManagerStatus,
  BaseResourceHandlerConfig,
  RegistryEntry,
  BaseRegistryStats,
} from './types.js';
