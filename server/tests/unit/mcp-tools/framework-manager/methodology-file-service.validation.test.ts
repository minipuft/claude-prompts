import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { MethodologyFileWriter } from '../../../../src/mcp/tools/framework-manager/services/index.js';

import type { ConfigManager, Logger } from '../../../../src/shared/types/index.js';

describe('MethodologyFileWriter canonical writes', () => {
  let workspaceDir: string;
  let logger: Logger;
  let configManager: ConfigManager;

  beforeEach(() => {
    workspaceDir = mkdtempSync(join(tmpdir(), 'cpm-method-file-'));
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as unknown as Logger;
    configManager = {
      getServerRoot: () => workspaceDir,
    } as unknown as ConfigManager;
  });

  afterEach(() => {
    rmSync(workspaceDir, { recursive: true, force: true });
  });

  it('rolls back id-only methodology payloads that fail schema validation', async () => {
    const service = new MethodologyFileWriter({ logger, configManager });
    const result = await service.writeMethodologyFiles({
      id: 'incomplete-method',
    });

    // id-only payload lacks required fields (name, methodology) — validation rejects and rolls back
    expect(result.success).toBe(false);
    expect(result.error).toContain('rolled back');
    const methodologyDir = service.getMethodologyDir('incomplete-method');
    expect(existsSync(methodologyDir)).toBe(false);
  });

  it('writes valid methodology payloads with all required fields', async () => {
    const service = new MethodologyFileWriter({ logger, configManager });
    const result = await service.writeMethodologyFiles({
      id: 'complete-method',
      name: 'Complete Method',
      methodology: 'COMPLETE',
      system_prompt_guidance: 'Apply complete principles.',
    });

    expect(result.success).toBe(true);
    const methodologyDir = service.getMethodologyDir('complete-method');
    const methodologyPath = join(methodologyDir, 'methodology.yaml');
    expect(existsSync(methodologyPath)).toBe(true);

    const content = readFileSync(methodologyPath, 'utf8');
    expect(content).toContain('id: complete-method');
    expect(content).toContain('name: Complete Method');
    expect(content).toContain('enabled: true');
    expect(content).toMatch(/version:\s*["']?1\.0\.0["']?/);
  });

  it('writes phases and prompt files for rich methodology payloads', async () => {
    const service = new MethodologyFileWriter({ logger, configManager });
    const result = await service.writeMethodologyFiles({
      id: 'e2e-test',
      name: 'E2E Test Methodology',
      methodology: 'E2E_TEST',
      system_prompt_guidance: 'Apply E2E principles.',
      judge_prompt: 'Evaluate against E2E policy.',
      phases: [{ id: 'phase-1', name: 'Phase 1', description: 'First phase' }],
    });

    expect(result.success).toBe(true);
    const methodologyDir = service.getMethodologyDir('e2e-test');
    expect(existsSync(join(methodologyDir, 'methodology.yaml'))).toBe(true);
    expect(existsSync(join(methodologyDir, 'system-prompt.md'))).toBe(true);
    expect(existsSync(join(methodologyDir, 'judge-prompt.md'))).toBe(true);
    expect(existsSync(join(methodologyDir, 'phases.yaml'))).toBe(true);
  });

  it('merges updates onto existing methodology data instead of overwriting', async () => {
    const service = new MethodologyFileWriter({ logger, configManager });
    await service.writeMethodologyFiles({
      id: 'merge-test',
      name: 'Merge Test',
      methodology: 'MERGE_BASE',
      system_prompt_guidance: 'Original guidance.',
    });

    const existing = await service.loadExistingMethodology('merge-test');
    expect(existing).not.toBeNull();

    const result = await service.writeMethodologyFiles(
      {
        id: 'merge-test',
        name: 'Merge Test Updated',
      },
      existing
    );
    expect(result.success).toBe(true);

    const methodologyDir = service.getMethodologyDir('merge-test');
    const yamlContent = readFileSync(join(methodologyDir, 'methodology.yaml'), 'utf8');
    const promptContent = readFileSync(join(methodologyDir, 'system-prompt.md'), 'utf8');
    expect(yamlContent).toContain('name: Merge Test Updated');
    expect(yamlContent).toContain('methodology: MERGE_BASE');
    expect(promptContent).toBe('Original guidance.');
  });
});
