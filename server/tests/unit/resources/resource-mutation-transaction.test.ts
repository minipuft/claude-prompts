import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  ResourceMutationTransaction,
  ResourceVerificationError,
  type ResourceVerificationResult,
} from '../../../src/modules/resources/services/index.js';

describe('ResourceMutationTransaction', () => {
  let tempDir: string;
  let transaction: ResourceMutationTransaction;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cpm-rmt-'));
    transaction = new ResourceMutationTransaction();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('rolls back newly created directories when post-mutation validation fails', async () => {
    const targetDir = join(tempDir, 'prompt-a');
    const promptYaml = join(targetDir, 'prompt.yaml');

    const invalidResult: ResourceVerificationResult = {
      valid: false,
      resourceType: 'prompts',
      resourceId: 'prompt-a',
      filePath: promptYaml,
      errors: [{ code: 'schema_validation_error', path: 'name', message: 'Required' }],
      warnings: [],
    };

    const result = await transaction.run({
      targets: [{ path: targetDir, kind: 'directory' }],
      mutate: async () => {
        mkdirSync(targetDir, { recursive: true });
        writeFileSync(promptYaml, 'id: prompt-a\nname:\n', 'utf8');
        return { written: true };
      },
      validate: () => invalidResult,
    });

    expect(result.success).toBe(false);
    expect(result.rolledBack).toBe(true);
    expect(existsSync(targetDir)).toBe(false);
  });

  it('rolls back existing files when mutate throws ResourceVerificationError', async () => {
    const stylePath = join(tempDir, 'style.yaml');
    writeFileSync(stylePath, 'id: analytical\nname: Analytical\ndescription: ok\n', 'utf8');

    const result = await transaction.run({
      targets: [{ path: stylePath, kind: 'file' }],
      mutate: async () => {
        writeFileSync(stylePath, 'id:\n', 'utf8');
        throw new ResourceVerificationError({
          resourceType: 'styles',
          resourceId: 'analytical',
          filePath: stylePath,
          errors: [{ code: 'schema_validation_error', path: 'id', message: 'Required' }],
          warnings: [],
          rolledBack: false,
        });
      },
    });

    expect(result.success).toBe(false);
    expect(result.rolledBack).toBe(true);
    expect(result.verificationFailure?.resourceType).toBe('styles');
    expect(readFileSync(stylePath, 'utf8')).toContain('id: analytical');
  });
});
