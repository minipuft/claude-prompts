/**
 * Shell Preset Loader
 *
 * Loads shell verification presets from YAML configuration,
 * enabling runtime customization without code changes.
 *
 * @example
 * ```typescript
 * const presets = loadShellPresets();
 * const fastConfig = presets.fast;
 * // { maxIterations: 1, timeout: 30000 }
 * ```
 */
/**
 * Shell verification preset configuration.
 */
export interface ShellPresetConfig {
    readonly maxIterations: number;
    readonly timeout: number;
    readonly description?: string;
}
/**
 * All available shell presets.
 */
export interface ShellPresets {
    readonly fast: ShellPresetConfig;
    readonly full: ShellPresetConfig;
    readonly extended: ShellPresetConfig;
    [key: string]: ShellPresetConfig | undefined;
}
/**
 * Shell verification defaults.
 */
export interface ShellDefaults {
    readonly maxAttempts: number;
    readonly defaultTimeout: number;
    readonly maxTimeout: number;
}
/**
 * Load shell presets from YAML configuration.
 * Falls back to default presets if loading fails.
 *
 * @param forceReload - If true, bypass cache and reload from file
 * @returns Shell presets object
 */
export declare function loadShellPresets(forceReload?: boolean): ShellPresets;
/**
 * Get shell verification defaults.
 */
export declare function getShellDefaults(): ShellDefaults;
/**
 * Get a specific preset by name.
 * Returns undefined if preset doesn't exist.
 */
export declare function getShellPreset(name: string): ShellPresetConfig | undefined;
/**
 * Check if a preset name is valid.
 */
export declare function isValidPresetName(name: string): name is 'fast' | 'full' | 'extended';
/**
 * Clear cached presets (useful for testing or hot reload).
 */
export declare function clearShellPresetCache(): void;
/**
 * Get all preset names.
 */
export declare function getPresetNames(): string[];
