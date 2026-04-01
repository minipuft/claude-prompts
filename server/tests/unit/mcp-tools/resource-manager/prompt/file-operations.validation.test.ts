import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { FileOperations } from '../../../../../src/mcp/tools/resource-manager/prompt/operations/file-operations.js';
import {
  normalizePromptId,
  validatePromptId,
} from '../../../../../src/mcp/tools/resource-manager/prompt/utils/validation.js';

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
      getResolvedPromptsDirectory: () => promptsDir,
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

describe('normalizePromptId', () => {
  it('converts hyphens to underscores', () => {
    expect(normalizePromptId('hot-reload-test')).toBe('hot_reload_test');
  });

  it('converts spaces to underscores', () => {
    expect(normalizePromptId('hot reload test')).toBe('hot_reload_test');
  });

  it('lowercases the ID', () => {
    expect(normalizePromptId('Hot-Reload-Test')).toBe('hot_reload_test');
  });

  it('collapses multiple consecutive delimiters', () => {
    expect(normalizePromptId('hot--reload__test')).toBe('hot_reload_test');
  });

  it('trims leading/trailing underscores', () => {
    expect(normalizePromptId('-hot-reload-')).toBe('hot_reload');
  });

  it('trims whitespace', () => {
    expect(normalizePromptId('  my_prompt  ')).toBe('my_prompt');
  });

  it('returns already-normalized IDs unchanged', () => {
    expect(normalizePromptId('code_review')).toBe('code_review');
  });

  it('treats my-prompt and my_prompt as equivalent', () => {
    expect(normalizePromptId('my-prompt')).toBe(normalizePromptId('my_prompt'));
  });
});

describe('validatePromptId', () => {
  it('accepts valid underscore IDs', () => {
    expect(() => validatePromptId('code_review')).not.toThrow();
  });

  it('accepts valid hyphen IDs', () => {
    expect(() => validatePromptId('code-review')).not.toThrow();
  });

  it('accepts alphanumeric IDs', () => {
    expect(() => validatePromptId('prompt1')).not.toThrow();
  });

  it('rejects IDs starting with a number', () => {
    expect(() => validatePromptId('1prompt')).toThrow(/must start with a letter/);
  });

  it('rejects IDs starting with underscore', () => {
    expect(() => validatePromptId('_private')).toThrow(/must start with a letter/);
  });

  it('rejects IDs with special characters', () => {
    expect(() => validatePromptId('my@prompt')).toThrow(/must start with a letter/);
  });

  it('rejects empty strings', () => {
    expect(() => validatePromptId('')).toThrow(/non-empty string/);
  });

  it('rejects IDs over 100 characters', () => {
    expect(() => validatePromptId('a'.repeat(101))).toThrow(/100 characters/);
  });
});
