import type { Logger } from '../../shared/types/index.js';
/** Minimal interface for checking YAML prompt presence in a directory. */
export interface YamlPromptChecker {
    hasYamlPrompts(dir: string): boolean;
}
export interface WatchTarget {
    path: string;
    category?: string;
}
/**
 * Discover prompt category directories suitable for file watching.
 *
 * Categories are identified by containing YAML prompt files
 * (either {id}/prompt.yaml subdirectories or {id}.yaml files).
 * Non-prompt directories are included as watch targets too
 * (they might gain prompts later).
 */
export declare function discoverPromptDirectories(promptsDir: string, checker: YamlPromptChecker, logger: Logger): Promise<WatchTarget[]>;
/**
 * Build a deduplicated map of watch targets from prompt directories,
 * methodology directories, and auxiliary reload directories.
 */
export declare function buildWatchTargets(promptsDir: string, categoryDirs: WatchTarget[], options?: {
    methodologyDirectories?: string[];
    auxiliaryDirectories?: string[][];
}): WatchTarget[];
