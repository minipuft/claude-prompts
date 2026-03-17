// @lifecycle canonical - Interface for ConfigManager, consumed by all layers except runtime/.
/**
 * ConfigManager decouples modules/, mcp/, and engine/ from the concrete
 * ConfigManager in infra/config.  Only the runtime/ composition root
 * creates and manages the concrete class.
 */

import type {
  Config,
  AnalysisConfig,
  SemanticAnalysisConfig,
  LoggingConfig,
  FrameworksConfig,
  GateSystemSettings as GatesConfig,
  ChainSessionConfig,
  ExecutionConfig,
  VersioningConfig,
  ResourcesConfig,
  TelemetryConfig,
  TransportMode,
} from './core-config.js';
import type { InjectionConfig } from './injection.js';

/**
 * Read-only configuration access + event subscription for hot-reload.
 *
 * Lifecycle methods (startWatching, stopWatching, shutdown) are intentionally
 * excluded — only the runtime/ composition root manages ConfigManager lifecycle.
 */
export interface ConfigManager {
  // ── Core config access ───────────────────────────────────────────────

  getConfig(): Config;
  getServerConfig(): Config['server'];
  getPromptsConfig(): Config['prompts'];
  getPromptsRegisterWithMcp(): boolean | undefined;
  getTransportMode(): TransportMode;

  // ── Domain config getters ────────────────────────────────────────────

  getAnalysisConfig(): AnalysisConfig;
  getSemanticAnalysisConfig(): SemanticAnalysisConfig;
  getLoggingConfig(): LoggingConfig;
  getFrameworksConfig(): FrameworksConfig;
  getGatesConfig(): GatesConfig;
  getChainSessionConfig(): ChainSessionConfig;
  getExecutionConfig(): ExecutionConfig;
  isJudgeEnabled(): boolean;
  getVersioningConfig(): VersioningConfig;
  getResourcesConfig(): ResourcesConfig;
  getTelemetryConfig(): TelemetryConfig;
  getInjectionConfig(): InjectionConfig;

  // ── Path resolution ──────────────────────────────────────────────────

  getPort(): number;
  getConfigPath(): string;
  /** @deprecated Use getPromptsDirectory() for YAML-based prompt discovery */
  getPromptsFilePath(): string;
  getPromptsDirectory(): string;
  getResolvedPromptsFilePath(overridePath?: string): string;
  getServerRoot(): string;
  getGatesDirectory(): string;

  // ── Config reload ────────────────────────────────────────────────────

  loadConfig(): Promise<Config>;

  // ── Event subscription (hot-reload) ──────────────────────────────────

  on(event: 'configChanged', listener: (config: Config) => void): this;
  on(
    event: 'frameworksConfigChanged',
    listener: (current: FrameworksConfig, previous: FrameworksConfig) => void
  ): this;
  off(event: 'configChanged', listener: (config: Config) => void): this;
  off(
    event: 'frameworksConfigChanged',
    listener: (current: FrameworksConfig, previous: FrameworksConfig) => void
  ): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, listener: (...args: any[]) => void): this;
}
