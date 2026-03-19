/**
 * Runtime Context / Foundation Builder
 *
 * Constructs shared runtime dependencies (logger, config, options, transport, service manager)
 * using existing utilities to avoid duplicate initialization logic.
 */
import { RuntimeLaunchOptions } from './options.js';
import { PathResolver } from './paths.js';
import { ConfigLoader } from '../infra/config/index.js';
import { Logger } from '../infra/logging/index.js';
import { ServiceOrchestrator } from '../shared/utils/service-orchestrator.js';
import type { Config, ConfigManager, TransportMode } from '../shared/types/index.js';
export interface RuntimeFoundation {
    logger: Logger;
    configManager: ConfigManager;
    serviceOrchestrator: ServiceOrchestrator;
    runtimeOptions: RuntimeLaunchOptions;
    serverRoot: string;
    transport: TransportMode;
    /** Centralized path resolver for all configurable paths */
    pathResolver: PathResolver;
}
export interface RuntimeFoundationDependencies {
    logger?: Logger;
    configManager?: ConfigLoader;
    serviceOrchestrator?: ServiceOrchestrator;
    pathResolver?: PathResolver;
}
export declare function applyRuntimeIdentityOverrides(config: Config, runtimeOptions: RuntimeLaunchOptions): void;
export declare function createRuntimeFoundation(runtimeOptions?: RuntimeLaunchOptions, dependencies?: RuntimeFoundationDependencies): Promise<RuntimeFoundation>;
