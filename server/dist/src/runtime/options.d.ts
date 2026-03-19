/**
 * Runtime launch option parsing shared between the CLI entrypoint and the runtime application.
 * Centralizes CLI flag handling so verbose/quiet/test detection stays in sync.
 */
import { type ServerCliArgs } from './cli.js';
import { type PathResolverCliOptions } from './paths.js';
import type { IdentityLaunchDefaults, IdentityPolicyMode } from '../shared/types/core-config.js';
/**
 * Path-related options parsed from CLI flags and environment variables
 */
export interface PathOptions {
    /** Base workspace directory for user assets */
    workspace?: string;
    /** Direct path to config.json */
    configPath?: string;
    /** Direct path to prompts configuration file */
    promptsPath?: string;
    /** Custom methodologies directory */
    methodologiesPath?: string;
    /** Custom gates directory */
    gatesPath?: string;
}
export interface RuntimeLaunchOptions {
    args: string[];
    verbose: boolean;
    quiet: boolean;
    startupTest: boolean;
    testEnvironment: boolean;
    /** Path-related options from CLI flags */
    paths: PathResolverCliOptions;
    /** Log level override from --log-level flag */
    logLevel?: string;
    /** Identity policy mode from --identity-mode flag */
    identityMode?: IdentityPolicyMode;
    /** Launch-time identity defaults from identity and client CLI flags */
    identityDefaults?: IdentityLaunchDefaults;
    /** Explicit server root override from --server-root flag */
    serverRoot?: string;
}
/**
 * Determine whether the current process is executing under a test harness or CI.
 */
export declare function detectRuntimeTestEnvironment(fullArgv?: string[], cli?: ServerCliArgs): boolean;
/**
 * Resolve runtime launch options from pre-parsed CLI arguments.
 *
 * Zero-flag experience: When using STDIO transport (default), quiet mode is
 * automatically enabled unless --verbose is explicitly specified. This prevents
 * logging output from corrupting the MCP JSON-RPC protocol.
 */
export declare function resolveRuntimeLaunchOptions(cliArgs?: ServerCliArgs, fullArgv?: string[]): RuntimeLaunchOptions;
