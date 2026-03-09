import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { FileOperations } from '../../../../../src/mcp/tools/resource-manager/prompt/operations/file-operations.js';

import type { ConfigManager, Logger } from '../../../../../src/shared/types/index.js';

describe('FileOperations canonical prompt writes', () => {
  let workspaceDir: string;
  let promptsDir: string;
  let logger: Logger;
  let configManager: ConfigManager;

  beforeEach(() => {
    workspaceDir = mkdtempSync(join(tmpdir(), 'cpm-prompt-ops-'));
    promptsDir = join(workspaceDir, 'prompts');
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as unknown as Logger;
    configManager = {
      getResolvedPromptsFilePath: () => promptsDir,
    } as unknown as ConfigManager;
  });

  afterEach(() => {
    rmSync(workspaceDir, { recursive: true, force: true });
  });

  it('writes prompt files without transactional verification metadata', async () => {
    const operations = new FileOperations({ logger, configManager });
    const result = await operations.updatePromptImplementation({
      id: 'sample_prompt',
      name: 'Sample Prompt',
      category: 'new-category',
      description: 'Prompt description',
      userMessageTemplate: 'hello',
      arguments: [],
      tools: [],
    });

    expect(result.message).toContain('Created prompt: sample_prompt');
    expect(result.metadata).toBeUndefined();
    expect(existsSync(join(promptsDir, 'new-category', 'sample_prompt', 'prompt.yaml'))).toBe(true);
    expect(existsSync(join(promptsDir, 'new-category', 'sample_prompt', 'user-message.md'))).toBe(
      true
    );

    const yamlContent = readFileSync(
      join(promptsDir, 'new-category', 'sample_prompt', 'prompt.yaml'),
      'utf8'
    );
    expect(yamlContent).toContain('id: sample_prompt');
    expect(yamlContent).toContain('name: Sample Prompt');
  });
});
