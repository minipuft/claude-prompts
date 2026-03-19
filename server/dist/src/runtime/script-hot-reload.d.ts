import type { Logger } from '../infra/logging/index.js';
import type { ScriptToolDefinitionLoader } from '../modules/automation/core/script-definition-loader.js';
import type { AuxiliaryReloadConfig } from '../modules/hot-reload/hot-reload-observer.js';
/**
 * Build script tool auxiliary reload configuration for HotReloadObserver.
 * Follows the same pattern as buildGateAuxiliaryReloadConfig.
 *
 * @param logger - Logger instance
 * @param scriptLoader - Script tool definition loader (optional)
 * @param promptsDir - Base prompts directory
 * @returns AuxiliaryReloadConfig or undefined if script loader unavailable
 */
export declare function buildScriptAuxiliaryReloadConfig(logger: Logger, scriptLoader: ScriptToolDefinitionLoader | undefined, promptsDir: string): AuxiliaryReloadConfig | undefined;
