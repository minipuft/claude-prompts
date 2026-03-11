import { describe, expect, test } from '@jest/globals';

import { applyRuntimeIdentityOverrides } from '../../../src/runtime/context.js';

import type { Config } from '../../../src/shared/types/index.js';
import type { RuntimeLaunchOptions } from '../../../src/runtime/options.js';

function createBaseConfig(): Config {
  return {
    server: {
      name: 'test-server',
      version: '1.0.0',
      port: 3456,
    },
    prompts: {
      directory: 'resources/prompts',
    },
  };
}

function createRuntimeOptions(overrides: Partial<RuntimeLaunchOptions> = {}): RuntimeLaunchOptions {
  return {
    args: [],
    verbose: false,
    quiet: true,
    startupTest: false,
    testEnvironment: true,
    paths: {},
    ...overrides,
  };
}

describe('applyRuntimeIdentityOverrides', () => {
  test('applies runtime client defaults when config has no identity section', () => {
    const config = createBaseConfig();
    const runtimeOptions = createRuntimeOptions({
      identityDefaults: {
        clientFamily: 'codex',
        clientId: 'codex-cli',
        delegationProfile: 'spawn_agent_v1',
      },
    });

    applyRuntimeIdentityOverrides(config, runtimeOptions);

    expect(config.identity).toEqual({
      launchDefaults: {
        clientFamily: 'codex',
        clientId: 'codex-cli',
        delegationProfile: 'spawn_agent_v1',
      },
    });
  });

  test('merges runtime identity defaults with existing config identity defaults', () => {
    const config = createBaseConfig();
    config.identity = {
      mode: 'permissive',
      allowPerRequestOverride: false,
      launchDefaults: {
        workspaceId: 'workspace-from-config',
        clientFamily: 'claude-code',
      },
    };

    const runtimeOptions = createRuntimeOptions({
      identityMode: 'locked',
      identityDefaults: {
        clientFamily: 'codex',
        delegationProfile: 'spawn_agent_v1',
      },
    });

    applyRuntimeIdentityOverrides(config, runtimeOptions);

    expect(config.identity).toEqual({
      mode: 'locked',
      allowPerRequestOverride: false,
      launchDefaults: {
        workspaceId: 'workspace-from-config',
        clientFamily: 'codex',
        delegationProfile: 'spawn_agent_v1',
      },
    });
  });
});
