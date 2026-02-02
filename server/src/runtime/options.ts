// @lifecycle canonical - Parses runtime CLI options and flags.
/**
 * Runtime launch option parsing shared between the CLI entrypoint and the runtime application.
 * Centralizes CLI flag handling so verbose/quiet/test detection stays in sync.
 */

import { parseServerCliArgs, type ServerCliArgs } from './cli.js';
import { parsePathCliOptions, type PathResolverCliOptions } from './paths.js';

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
}

const TEST_ARG_HINTS = ['test', 'jest', 'mocha'];

/**
 * Determine whether the current process is executing under a test harness or CI.
 */
export function detectRuntimeTestEnvironment(
  fullArgv: string[] = process.argv,
  cli: ServerCliArgs = parseServerCliArgs()
): boolean {
  return (
    process.env['NODE_ENV'] === 'test' ||
    cli.suppressDebug ||
    cli.testMode ||
    process.env['GITHUB_ACTIONS'] === 'true' ||
    process.env['CI'] === 'true' ||
    fullArgv.some((arg) => TEST_ARG_HINTS.some((hint) => arg.includes(hint))) ||
    (fullArgv[1] ?? '').includes('tests/scripts/')
  );
}

/**
 * Resolve runtime launch options from pre-parsed CLI arguments.
 *
 * Zero-flag experience: When using STDIO transport (default), quiet mode is
 * automatically enabled unless --verbose is explicitly specified. This prevents
 * logging output from corrupting the MCP JSON-RPC protocol.
 */
export function resolveRuntimeLaunchOptions(
  cliArgs?: ServerCliArgs,
  fullArgv: string[] = process.argv
): RuntimeLaunchOptions {
  const cli = cliArgs ?? parseServerCliArgs();

  const isVerbose = cli.verbose || cli.debugStartup;
  const transport = cli.transport ?? 'stdio';
  const isStdioTransport = transport === 'stdio';
  const autoQuiet = isStdioTransport && !isVerbose;

  const paths = parsePathCliOptions(cli);

  const runtimeOptions: RuntimeLaunchOptions = {
    args: process.argv.slice(2),
    verbose: isVerbose,
    quiet: cli.quiet || autoQuiet,
    startupTest: cli.startupTest,
    testEnvironment: detectRuntimeTestEnvironment(fullArgv, cli),
    paths,
  };

  if (cli.logLevel !== undefined) {
    runtimeOptions.logLevel = cli.logLevel;
  }

  return runtimeOptions;
}
