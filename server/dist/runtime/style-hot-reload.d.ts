import type { Logger } from '../infra/logging/index.js';
import type { StyleManager } from '../modules/formatting/index.js';
import type { AuxiliaryReloadConfig } from '../modules/hot-reload/hot-reload-observer.js';
/**
 * Build style auxiliary reload configuration for HotReloadObserver.
 * Follows the same pattern as buildGateAuxiliaryReloadConfig.
 *
 * @param logger - Logger instance
 * @param styleManager - StyleManager instance (optional)
 * @returns AuxiliaryReloadConfig or undefined if style manager unavailable
 */
export declare function buildStyleAuxiliaryReloadConfig(logger: Logger, styleManager?: StyleManager): AuxiliaryReloadConfig | undefined;
