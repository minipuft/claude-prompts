import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { GateToolHandler } from '../../../../src/mcp/tools/gate-manager/core/manager.js';

import type { GateManager } from '../../../../src/engine/gates/gate-manager.js';
import type { ConfigManager, Logger } from '../../../../src/shared/types/index.js';

const createLogger = (): Logger =>
  ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }) as unknown as Logger;

describe('GateToolHandler', () => {
  let workspaceDir: string;
  let gatesDir: string;
  let logger: Logger;
  let gateManager: jest.Mocked<
    Pick<GateManager, 'has' | 'unregister' | 'reload' | 'list' | 'getStats'>
  >;
  let manager: GateToolHandler;
  let onRefresh: jest.Mock<() => Promise<void>>;

  beforeEach(() => {
    workspaceDir = mkdtempSync(join(tmpdir(), 'cpm-gate-manager-'));
    gatesDir = join(workspaceDir, 'gates');
    mkdirSync(gatesDir, { recursive: true });

    logger = createLogger();
    onRefresh = jest.fn(async () => undefined);

    gateManager = {
      has: jest.fn(() => false),
      unregister: jest.fn(() => true),
      reload: jest.fn(async () => true),
      list: jest.fn(() => []),
      getStats: jest.fn(() => ({
        totalGates: 0,
        enabledGates: 0,
        disabledGates: 0,
        cacheHitRate: 1,
      })),
    };

    const configManager = {
      getGatesDirectory: () => gatesDir,
      getVersioningConfig: () => ({ mode: 'off', maxVersions: 50 }),
    } as unknown as ConfigManager;

    manager = new GateToolHandler({
      logger,
      gateManager: gateManager as unknown as GateManager,
      configManager,
      onRefresh,
    });
  });

  afterEach(() => {
    rmSync(workspaceDir, { recursive: true, force: true });
  });

  test('create writes gate files and triggers refresh', async () => {
    const result = await manager.handleAction(
      {
        action: 'create',
        id: 'new-gate',
        name: 'New Gate',
        description: 'Gate description',
        guidance: 'Gate guidance',
      },
      {}
    );

    const gateDir = join(gatesDir, 'new-gate');
    expect(result.isError).toBe(false);
    expect(existsSync(join(gateDir, 'gate.yaml'))).toBe(true);
    expect(existsSync(join(gateDir, 'guidance.md'))).toBe(true);
    expect(readFileSync(join(gateDir, 'guidance.md'), 'utf8')).toBe('Gate guidance');
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect((result.content[0] as { text: string }).text).toContain('created successfully');
  });

  test('create fails when gate already exists in registry', async () => {
    gateManager.has.mockReturnValue(true);

    const result = await manager.handleAction(
      {
        action: 'create',
        id: 'new-gate',
        name: 'New Gate',
        description: 'Gate description',
        guidance: 'Gate guidance',
      },
      {}
    );

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain(
      "Gate 'new-gate' already exists"
    );
    expect(onRefresh).not.toHaveBeenCalled();
  });

  test('delete removes gate directory and unregisters from registry', async () => {
    const gateDir = join(gatesDir, 'existing-gate');
    mkdirSync(gateDir, { recursive: true });
    gateManager.has.mockReturnValue(true);

    const result = await manager.handleAction(
      {
        action: 'delete',
        id: 'existing-gate',
        confirm: true,
      },
      {}
    );

    expect(result.isError).toBe(false);
    expect(existsSync(gateDir)).toBe(false);
    expect(gateManager.unregister).toHaveBeenCalledWith('existing-gate');
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect((result.content[0] as { text: string }).text).toContain('deleted successfully');
  });

  test('delete fails cleanly when gate is missing from registry', async () => {
    gateManager.has.mockReturnValue(false);

    const result = await manager.handleAction(
      {
        action: 'delete',
        id: 'missing-gate',
        confirm: true,
      },
      {}
    );

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain("Gate 'missing-gate' not found");
  });

  test('delete requires explicit confirmation', async () => {
    gateManager.has.mockReturnValue(true);

    const result = await manager.handleAction(
      {
        action: 'delete',
        id: 'existing-gate',
      },
      {}
    );

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('Delete requires confirmation');
    expect(gateManager.unregister).not.toHaveBeenCalled();
  });
});
