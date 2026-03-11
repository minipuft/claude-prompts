/**
 * Unit tests for VersionHistoryService (SQLite-backed)
 *
 * Tests the core versioning functionality:
 * - saveVersion: Auto-versioning, FIFO pruning, disabled mode
 * - loadHistory: Loading existing/non-existing history
 * - getVersion: Retrieving specific version snapshots
 * - rollback: Pre-rollback save, restoring versions
 * - compareVersions: Comparing two version snapshots
 * - deleteHistory: Cleanup on resource deletion
 * - formatHistoryForDisplay: Display formatting
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import { createTestDatabaseManager } from '../../helpers/test-database.js';
import { VersionHistoryService } from '../../../src/modules/versioning/version-history-service.js';

import type { TestDatabaseContext } from '../../helpers/test-database.js';
import type { VersioningConfig } from '../../../src/shared/types/index.js';
import type { VersioningConfigProvider } from '../../../src/modules/versioning/version-history-service.js';

/**
 * Mock ConfigManager that implements VersioningConfigProvider
 * Allows tests to control versioning config dynamically
 */
class MockVersioningConfigProvider implements VersioningConfigProvider {
  private config: VersioningConfig;
  private serverRoot: string;

  constructor(config: VersioningConfig, serverRoot: string) {
    this.config = config;
    this.serverRoot = serverRoot;
  }

  getVersioningConfig(): VersioningConfig {
    return this.config;
  }

  getServerRoot(): string {
    return this.serverRoot;
  }

  setConfig(config: Partial<VersioningConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

describe('VersionHistoryService', () => {
  let service: VersionHistoryService;
  let mockConfigProvider: MockVersioningConfigProvider;
  let dbCtx: TestDatabaseContext;

  beforeEach(async () => {
    dbCtx = await createTestDatabaseManager('version-history');
    mockConfigProvider = new MockVersioningConfigProvider(
      {
        enabled: true,
        max_versions: 5,
        auto_version: true,
      },
      dbCtx.testDir
    );
    service = new VersionHistoryService({
      logger: dbCtx.logger,
      configManager: mockConfigProvider,
    });
  });

  afterEach(async () => {
    await dbCtx.cleanup();
  });

  // ==========================================================================
  // Configuration Tests
  // ==========================================================================

  describe('configuration', () => {
    it('should report enabled status correctly', () => {
      expect(service.isEnabled()).toBe(true);
      expect(service.isAutoVersionEnabled()).toBe(true);
    });

    it('should reflect config changes from ConfigManager', () => {
      mockConfigProvider.setConfig({ enabled: false });
      expect(service.isEnabled()).toBe(false);
      expect(service.isAutoVersionEnabled()).toBe(false);
    });

    it('should reflect partial config updates', () => {
      mockConfigProvider.setConfig({ max_versions: 100 });
      expect(service.isEnabled()).toBe(true);
    });
  });

  // ==========================================================================
  // saveVersion Tests
  // ==========================================================================

  describe('saveVersion', () => {
    it('should save first version successfully', async () => {
      const snapshot = { name: 'test', content: 'hello' };

      const result = await service.saveVersion('prompt', 'test-prompt', snapshot, {
        description: 'Initial version',
      });

      expect(result.success).toBe(true);
      expect(result.version).toBe(1);

      const history = await service.loadHistory('prompt', 'test-prompt');
      expect(history).not.toBeNull();
      expect(history!.current_version).toBe(1);
      expect(history!.versions).toHaveLength(1);
      expect(history!.versions[0].snapshot).toEqual(snapshot);
    });

    it('should increment version on subsequent saves', async () => {
      await service.saveVersion('prompt', 'test-prompt', { v: 1 });
      const result = await service.saveVersion('prompt', 'test-prompt', { v: 2 });

      expect(result.success).toBe(true);
      expect(result.version).toBe(2);

      const history = await service.loadHistory('prompt', 'test-prompt');
      expect(history!.versions).toHaveLength(2);
      expect(history!.versions[0].version).toBe(2); // newest first
      expect(history!.versions[1].version).toBe(1);
    });

    it('should prune old versions when exceeding max_versions', async () => {
      for (let i = 1; i <= 6; i++) {
        await service.saveVersion('prompt', 'test-prompt', { version: i });
      }

      const history = await service.loadHistory('prompt', 'test-prompt');
      expect(history!.versions).toHaveLength(5);
      expect(history!.current_version).toBe(6);

      const versions = history!.versions.map((v) => v.version);
      expect(versions).toEqual([6, 5, 4, 3, 2]);
    });

    it('should include diff_summary and description in entry', async () => {
      await service.saveVersion(
        'gate',
        'test-gate',
        { criteria: 'x' },
        {
          description: 'Added criteria field',
          diff_summary: '+1/-0',
        }
      );

      const history = await service.loadHistory('gate', 'test-gate');
      expect(history!.versions[0].description).toBe('Added criteria field');
      expect(history!.versions[0].diff_summary).toBe('+1/-0');
    });

    it('should return version 0 when disabled', async () => {
      mockConfigProvider.setConfig({ enabled: false });

      const result = await service.saveVersion('prompt', 'test', { x: 1 });

      expect(result.success).toBe(true);
      expect(result.version).toBe(0);

      const history = await service.loadHistory('prompt', 'test');
      expect(history).toBeNull();
    });
  });

  // ==========================================================================
  // loadHistory Tests
  // ==========================================================================

  describe('loadHistory', () => {
    it('should return null for non-existent history', async () => {
      const history = await service.loadHistory('prompt', 'nonexistent');
      expect(history).toBeNull();
    });

    it('should load existing history', async () => {
      await service.saveVersion('methodology', 'test-method', { phases: [] });

      const history = await service.loadHistory('methodology', 'test-method');
      expect(history).not.toBeNull();
      expect(history!.resource_type).toBe('methodology');
      expect(history!.resource_id).toBe('test-method');
    });
  });

  // ==========================================================================
  // getVersion Tests
  // ==========================================================================

  describe('getVersion', () => {
    beforeEach(async () => {
      await service.saveVersion('prompt', 'test', { state: 'v1' });
      await service.saveVersion('prompt', 'test', { state: 'v2' });
      await service.saveVersion('prompt', 'test', { state: 'v3' });
    });

    it('should retrieve specific version', async () => {
      const entry = await service.getVersion('prompt', 'test', 2);

      expect(entry).not.toBeNull();
      expect(entry!.version).toBe(2);
      expect(entry!.snapshot).toEqual({ state: 'v2' });
    });

    it('should return null for non-existent version', async () => {
      const entry = await service.getVersion('prompt', 'test', 99);
      expect(entry).toBeNull();
    });
  });

  // ==========================================================================
  // getLatestVersion Tests
  // ==========================================================================

  describe('getLatestVersion', () => {
    it('should return 0 when no history exists', async () => {
      const version = await service.getLatestVersion('prompt', 'nonexistent');
      expect(version).toBe(0);
    });

    it('should return current version number', async () => {
      await service.saveVersion('prompt', 'test', { x: 1 });
      await service.saveVersion('prompt', 'test', { x: 2 });

      const version = await service.getLatestVersion('prompt', 'test');
      expect(version).toBe(2);
    });
  });

  // ==========================================================================
  // rollback Tests
  // ==========================================================================

  describe('rollback', () => {
    beforeEach(async () => {
      await service.saveVersion('gate', 'test-gate', { criteria: 'original' });
      await service.saveVersion('gate', 'test-gate', { criteria: 'modified' });
      await service.saveVersion('gate', 'test-gate', { criteria: 'latest' });
    });

    it('should rollback to previous version successfully', async () => {
      const currentSnapshot = { criteria: 'current-state' };

      const result = await service.rollback('gate', 'test-gate', 1, currentSnapshot);

      expect(result.success).toBe(true);
      expect(result.restored_version).toBe(1);
      expect(result.saved_version).toBe(4); // v4 = pre-rollback snapshot
      expect(result.snapshot).toEqual({ criteria: 'original' });

      const history = await service.loadHistory('gate', 'test-gate');
      expect(history!.current_version).toBe(4);
    });

    it('should fail when target version does not exist', async () => {
      const result = await service.rollback('gate', 'test-gate', 99, { x: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Version 99 not found');
    });

    it('should fail when versioning is disabled', async () => {
      mockConfigProvider.setConfig({ enabled: false });

      const result = await service.rollback('gate', 'test-gate', 1, { x: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled');
    });
  });

  // ==========================================================================
  // compareVersions Tests
  // ==========================================================================

  describe('compareVersions', () => {
    beforeEach(async () => {
      await service.saveVersion('prompt', 'test', { content: 'version 1' });
      await service.saveVersion('prompt', 'test', { content: 'version 2' });
    });

    it('should compare two existing versions', async () => {
      const result = await service.compareVersions('prompt', 'test', 1, 2);

      expect(result.success).toBe(true);
      expect(result.from).toBeDefined();
      expect(result.to).toBeDefined();
      expect(result.from!.version).toBe(1);
      expect(result.to!.version).toBe(2);
      expect(result.from!.snapshot).toEqual({ content: 'version 1' });
      expect(result.to!.snapshot).toEqual({ content: 'version 2' });
    });

    it('should fail when from_version does not exist', async () => {
      const result = await service.compareVersions('prompt', 'test', 99, 2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Version 99 not found');
    });

    it('should fail when to_version does not exist', async () => {
      const result = await service.compareVersions('prompt', 'test', 1, 99);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Version 99 not found');
    });
  });

  // ==========================================================================
  // deleteHistory Tests
  // ==========================================================================

  describe('deleteHistory', () => {
    it('should delete existing history', async () => {
      await service.saveVersion('prompt', 'test', { x: 1 });

      let history = await service.loadHistory('prompt', 'test');
      expect(history).not.toBeNull();

      const result = await service.deleteHistory('prompt', 'test');
      expect(result).toBe(true);

      history = await service.loadHistory('prompt', 'test');
      expect(history).toBeNull();
    });

    it('should return true when no history exists', async () => {
      const result = await service.deleteHistory('prompt', 'nonexistent');
      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // formatHistoryForDisplay Tests
  // ==========================================================================

  describe('formatHistoryForDisplay', () => {
    it('should format history with table headers', async () => {
      await service.saveVersion('prompt', 'test-prompt', { x: 1 }, { description: 'Initial' });

      const history = await service.loadHistory('prompt', 'test-prompt');
      const formatted = service.formatHistoryForDisplay(history!, 10);

      expect(formatted).toContain('**Version History**');
      expect(formatted).toContain('test-prompt');
      expect(formatted).toContain('| Version | Date | Changes | Description |');
      expect(formatted).toContain('Initial');
    });

    it('should mark current version', async () => {
      await service.saveVersion('prompt', 'test', { x: 1 });
      await service.saveVersion('prompt', 'test', { x: 2 });

      const history = await service.loadHistory('prompt', 'test');
      const formatted = service.formatHistoryForDisplay(history!, 10);

      expect(formatted).toContain('(latest)');
    });

    it('should respect limit parameter', async () => {
      for (let i = 1; i <= 5; i++) {
        await service.saveVersion('prompt', 'test', { v: i });
      }

      const history = await service.loadHistory('prompt', 'test');
      const formatted = service.formatHistoryForDisplay(history!, 2);

      expect(formatted).toContain('and 3 more versions');
    });

    it('should show diff_summary when present', async () => {
      await service.saveVersion(
        'prompt',
        'test',
        { x: 1 },
        { description: 'Test', diff_summary: '+5/-2' }
      );

      const history = await service.loadHistory('prompt', 'test');
      const formatted = service.formatHistoryForDisplay(history!, 10);

      expect(formatted).toContain('+5/-2');
    });
  });

  // ==========================================================================
  // Resource Type Isolation Tests
  // ==========================================================================

  describe('resource type isolation', () => {
    it('should isolate history by resource type and id', async () => {
      await service.saveVersion('prompt', 'my-prompt', { template: 'x' });
      await service.saveVersion('gate', 'code-quality', { criteria: 'y' });
      await service.saveVersion('methodology', 'CAGEERF', { phases: [] });

      const promptHistory = await service.loadHistory('prompt', 'my-prompt');
      expect(promptHistory!.resource_type).toBe('prompt');
      expect(promptHistory!.resource_id).toBe('my-prompt');
      expect(promptHistory!.versions).toHaveLength(1);

      const gateHistory = await service.loadHistory('gate', 'code-quality');
      expect(gateHistory!.resource_type).toBe('gate');
      expect(gateHistory!.resource_id).toBe('code-quality');

      const methodHistory = await service.loadHistory('methodology', 'CAGEERF');
      expect(methodHistory!.resource_type).toBe('methodology');
      expect(methodHistory!.resource_id).toBe('CAGEERF');
    });

    it('should not cross-contaminate between resource ids', async () => {
      await service.saveVersion('prompt', 'prompt-a', { x: 1 });
      await service.saveVersion('prompt', 'prompt-b', { y: 2 });

      const historyA = await service.loadHistory('prompt', 'prompt-a');
      expect(historyA!.versions).toHaveLength(1);
      expect(historyA!.versions[0].snapshot).toEqual({ x: 1 });

      const historyB = await service.loadHistory('prompt', 'prompt-b');
      expect(historyB!.versions).toHaveLength(1);
      expect(historyB!.versions[0].snapshot).toEqual({ y: 2 });
    });
  });
});
