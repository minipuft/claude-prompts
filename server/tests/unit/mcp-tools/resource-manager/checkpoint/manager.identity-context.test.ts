import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createCheckpointToolHandler } from '../../../../../src/mcp/tools/resource-manager/checkpoint/index.js';

import type { CheckpointState } from '../../../../../src/mcp/tools/resource-manager/checkpoint/types.js';
import type { Logger } from '../../../../../src/shared/types/index.js';

const createLogger = (): Logger => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

describe('CheckpointToolHandler identity context behavior', () => {
  let serverRoot: string;

  beforeEach(async () => {
    serverRoot = await mkdtemp(join(tmpdir(), 'checkpoint-identity-'));
  });

  afterEach(async () => {
    await rm(serverRoot, { recursive: true, force: true });
  });

  test('accepts identity context payload for list action', async () => {
    const manager = createCheckpointToolHandler({
      logger: createLogger(),
      configManager: {
        getServerRoot: () => serverRoot,
      } as any,
    });
    await manager.initialize();

    const result = await manager.handleAction(
      { action: 'list' },
      {
        organizationId: 'org-acme',
        workspaceId: 'workspace-shared',
        continuityScopeId: 'workspace-shared',
      }
    );

    expect(result.isError).toBe(false);
    expect((result.content[0] as { text: string }).text).toContain('No checkpoints found');
  });

  test('checkpoint list is global runtime state across identity contexts', async () => {
    const statePath = join(serverRoot, 'runtime-state', 'checkpoints.json');
    const seededState: CheckpointState = {
      checkpoints: [
        {
          name: 'global-checkpoint',
          ref: 'stash@{0}',
          createdAt: '2026-01-01T00:00:00.000Z',
          description: 'seeded checkpoint',
          fileCount: 1,
        },
      ],
      lastUpdated: '2026-01-01T00:00:00.000Z',
    };

    await mkdir(join(serverRoot, 'runtime-state'), { recursive: true });
    await writeFile(statePath, JSON.stringify(seededState), 'utf8');

    const manager = createCheckpointToolHandler({
      logger: createLogger(),
      configManager: {
        getServerRoot: () => serverRoot,
      } as any,
    });
    await manager.initialize();

    const workspaceScoped = await manager.handleAction(
      { action: 'list' },
      {
        organizationId: 'org-a',
        workspaceId: 'workspace-a',
        continuityScopeId: 'workspace-a',
      }
    );
    const orgScoped = await manager.handleAction(
      { action: 'list' },
      {
        organizationId: 'org-b',
        continuityScopeId: 'org-b',
      }
    );

    expect(workspaceScoped.isError).toBe(false);
    expect(orgScoped.isError).toBe(false);
    expect((workspaceScoped.content[0] as { text: string }).text).toContain('global-checkpoint');
    expect((orgScoped.content[0] as { text: string }).text).toContain('global-checkpoint');
  });
});
