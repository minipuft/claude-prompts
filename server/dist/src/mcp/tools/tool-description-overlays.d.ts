/**
 * Tool Description Overlays
 *
 * Pure functions for preloading methodology/style descriptions and building
 * overlay-applied tool description configs. No class state — all dependencies
 * passed as parameters.
 *
 * Extracted from ToolDescriptionLoader to separate overlay resolution from
 * base description loading and event management.
 */
import type { MethodologyToolDescriptions } from '../../engine/frameworks/types/index.js';
import type { StyleToolDescriptionYaml } from '../../modules/formatting/core/style-schema.js';
import type { Logger, ToolDescription, ToolDescriptionsConfig } from '../../shared/types/index.js';
/**
 * Normalize methodology keys for consistent lookup (case-insensitive)
 */
export declare function normalizeMethodologyKey(methodology?: string): string | undefined;
/**
 * Deep-clone a ToolDescription to prevent shared-reference mutation.
 */
export declare function cloneToolDescription(description: ToolDescription): ToolDescription;
/**
 * Pre-load all methodology tool descriptions from YAML definitions.
 * Returns a Map keyed by normalized methodology/framework ID.
 */
export declare function preloadMethodologyDescriptions(logger: Logger): Map<string, MethodologyToolDescriptions>;
/**
 * Pre-load style tool descriptions for responseFormat overlay.
 * Returns a Map keyed by lowercase style ID.
 */
export declare function preloadStyleDescriptions(logger: Logger): Map<string, Record<string, StyleToolDescriptionYaml>>;
/**
 * Weave responseFormat guidance into tool description text.
 * Appended as a dedicated section so the LLM reads it before invocation.
 */
export declare function weaveResponseFormat(description: string, responseFormat: string): string;
/**
 * Build active tool description config by applying methodology overlays to base config.
 */
export declare function buildActiveConfig(baseConfig: ToolDescriptionsConfig, activeContext: {
    activeFramework?: string;
    activeMethodology?: string;
    frameworkSystemEnabled?: boolean;
}, methodologyDescriptions: Map<string, MethodologyToolDescriptions>, dynamicDescriptionsEnabled: boolean): ToolDescriptionsConfig;
