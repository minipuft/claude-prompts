/**
 * Hot Reload Module
 *
 * Cross-cutting infrastructure for file system watching and reload orchestration.
 * Serves all resource types: prompts, methodologies, gates, styles, scripts.
 *
 * Architecture:
 *   FileObserver (chokidar) ──events──▶ HotReloadObserver ──callbacks──▶ Domain handlers
 */
export * from './file-observer.js';
export * from './hot-reload-observer.js';
