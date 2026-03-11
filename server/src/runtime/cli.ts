// @lifecycle canonical - Single parseArgs call for the entire server process.
import { parseArgs } from 'node:util';

export interface ServerCliArgs {
  help: boolean;
  init?: string;
  transport?: string;
  logLevel?: string;
  verbose: boolean;
  quiet: boolean;
  debugStartup: boolean;
  startupTest: boolean;
  suppressDebug: boolean;
  testMode: boolean;
  workspace?: string;
  config?: string;
  prompts?: string;
  methodologies?: string;
  gates?: string;
  scripts?: string;
  styles?: string;
  workspaceId?: string;
  organizationId?: string;
  identityMode?: string;
  client?: string;
}

export function parseServerCliArgs(args: string[] = process.argv.slice(2)): ServerCliArgs {
  const { values } = parseArgs({
    args,
    options: {
      help: { type: 'boolean', short: 'h' },
      init: { type: 'string' },
      transport: { type: 'string' },
      'log-level': { type: 'string' },
      verbose: { type: 'boolean' },
      quiet: { type: 'boolean' },
      'debug-startup': { type: 'boolean' },
      'startup-test': { type: 'boolean' },
      'suppress-debug': { type: 'boolean' },
      'test-mode': { type: 'boolean' },
      workspace: { type: 'string' },
      config: { type: 'string' },
      prompts: { type: 'string' },
      methodologies: { type: 'string' },
      gates: { type: 'string' },
      scripts: { type: 'string' },
      styles: { type: 'string' },
      'workspace-id': { type: 'string' },
      'organization-id': { type: 'string' },
      'identity-mode': { type: 'string' },
      client: { type: 'string' },
    },
    strict: false,
    allowPositionals: true,
  });

  return {
    help: Boolean(values.help),
    init: values.init as string | undefined,
    transport: values.transport as string | undefined,
    logLevel: values['log-level'] as string | undefined,
    verbose: Boolean(values.verbose),
    quiet: Boolean(values.quiet),
    debugStartup: Boolean(values['debug-startup']),
    startupTest: Boolean(values['startup-test']),
    suppressDebug: Boolean(values['suppress-debug']),
    testMode: Boolean(values['test-mode']),
    workspace: values.workspace as string | undefined,
    config: values.config as string | undefined,
    prompts: values.prompts as string | undefined,
    methodologies: values.methodologies as string | undefined,
    gates: values.gates as string | undefined,
    scripts: values.scripts as string | undefined,
    styles: values.styles as string | undefined,
    workspaceId: values['workspace-id'] as string | undefined,
    organizationId: values['organization-id'] as string | undefined,
    identityMode: values['identity-mode'] as string | undefined,
    client: values.client as string | undefined,
  };
}
