import { afterEach, describe, expect, test } from '@jest/globals';

import { parseServerCliArgs } from '../../../src/runtime/cli.js';
import { resolveRuntimeLaunchOptions } from '../../../src/runtime/options.js';

describe('runtime identity launch options', () => {
  const originalWorkspaceId = process.env['MCP_WORKSPACE_ID'];
  const originalOrganizationId = process.env['MCP_ORGANIZATION_ID'];
  const originalIdentityMode = process.env['MCP_IDENTITY_MODE'];

  afterEach(() => {
    process.env['MCP_WORKSPACE_ID'] = originalWorkspaceId;
    process.env['MCP_ORGANIZATION_ID'] = originalOrganizationId;
    process.env['MCP_IDENTITY_MODE'] = originalIdentityMode;
  });

  test('parses identity CLI flags', () => {
    const cli = parseServerCliArgs([
      '--client',
      'codex',
      '--workspace-id',
      'workspace-cli',
      '--organization-id',
      'org-cli',
      '--identity-mode',
      'locked',
    ]);

    expect(cli.workspaceId).toBe('workspace-cli');
    expect(cli.organizationId).toBe('org-cli');
    expect(cli.identityMode).toBe('locked');
    expect(cli.client).toBe('codex');
  });

  test('uses CLI identity defaults and does not hydrate from environment variables', () => {
    process.env['MCP_WORKSPACE_ID'] = 'workspace-env';
    process.env['MCP_ORGANIZATION_ID'] = 'org-env';
    process.env['MCP_IDENTITY_MODE'] = 'strict';

    const options = resolveRuntimeLaunchOptions(
      parseServerCliArgs([
        '--transport',
        'stdio',
        '--identity-mode',
        'locked',
        '--client',
        'codex',
      ]),
      ['node', 'index.js']
    );

    expect(options.identityMode).toBe('locked');
    expect(options.identityDefaults).toEqual({
      clientFamily: 'codex',
      clientId: 'codex',
      delegationProfile: 'spawn_agent_v1',
    });
  });

  test('maps --client preset to client launch defaults', () => {
    const options = resolveRuntimeLaunchOptions(
      parseServerCliArgs(['--transport', 'stdio', '--client', 'codex']),
      ['node', 'index.js']
    );

    expect(options.identityDefaults).toEqual({
      clientFamily: 'codex',
      clientId: 'codex',
      delegationProfile: 'spawn_agent_v1',
    });
  });

  test('maps additional client presets to launch defaults', () => {
    const gemini = resolveRuntimeLaunchOptions(
      parseServerCliArgs(['--transport', 'stdio', '--client', 'gemini']),
      ['node', 'index.js']
    );
    expect(gemini.identityDefaults).toEqual({
      clientFamily: 'gemini',
      clientId: 'gemini',
      delegationProfile: 'gemini_subagent_v1',
    });

    const opencode = resolveRuntimeLaunchOptions(
      parseServerCliArgs(['--transport', 'stdio', '--client', 'opencode']),
      ['node', 'index.js']
    );
    expect(opencode.identityDefaults).toEqual({
      clientFamily: 'opencode',
      clientId: 'opencode',
      delegationProfile: 'opencode_agent_v1',
    });

    const cursor = resolveRuntimeLaunchOptions(
      parseServerCliArgs(['--transport', 'stdio', '--client', 'cursor']),
      ['node', 'index.js']
    );
    expect(cursor.identityDefaults).toEqual({
      clientFamily: 'cursor',
      clientId: 'cursor',
      delegationProfile: 'cursor_agent_v1',
    });
  });

  test('ignores invalid --client preset values', () => {
    const options = resolveRuntimeLaunchOptions(
      parseServerCliArgs(['--transport', 'stdio', '--client', 'not-a-client']),
      ['node', 'index.js']
    );

    expect(options.identityDefaults).toBeUndefined();
  });
});
