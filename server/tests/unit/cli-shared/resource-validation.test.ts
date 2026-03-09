import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  formatValidationIssues,
  validateResourceDocument,
  validateResourceFile,
} from '../../../src/cli-shared/resource-validation.js';

describe('resource-validation', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cpm-validation-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('validates a prompt document', () => {
    const result = validateResourceDocument('prompts', 'my_prompt', join(tempDir, 'prompt.yaml'), {
      id: 'my_prompt',
      name: 'My Prompt',
      category: 'general',
      description: 'desc',
      userMessageTemplateFile: 'user-message.md',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns yaml_load_failed for unreadable YAML', () => {
    const filePath = join(tempDir, 'broken.yaml');
    writeFileSync(filePath, 'id: [', 'utf8');

    const result = validateResourceFile('gates', 'my-gate', filePath);

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.code).toBe('yaml_load_failed');
  });

  it('formats issue output as path + message', () => {
    const result = validateResourceDocument('styles', 'style-one', join(tempDir, 'style.yaml'), {
      id: 'style-one',
    });

    expect(result.valid).toBe(false);
    const lines = formatValidationIssues(result.errors);
    expect(lines[0]).toContain(':');
  });
});
