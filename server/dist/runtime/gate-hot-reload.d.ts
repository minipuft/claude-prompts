import type { GateManager } from '../engine/gates/gate-manager.js';
import type { Logger } from '../infra/logging/index.js';
import type { AuxiliaryReloadConfig } from '../modules/hot-reload/hot-reload-observer.js';
/**
 * Build gate auxiliary reload configuration for HotReloadObserver.
 * Follows the same pattern as buildMethodologyAuxiliaryReloadConfig.
 *
 * @param logger - Logger instance
 * @param gateManager - GateManager instance (optional)
 * @returns AuxiliaryReloadConfig or undefined if gate manager unavailable
 */
export declare function buildGateAuxiliaryReloadConfig(logger: Logger, gateManager?: GateManager): AuxiliaryReloadConfig | undefined;
