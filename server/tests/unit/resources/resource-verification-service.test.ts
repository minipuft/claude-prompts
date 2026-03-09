import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ResourceVerificationService } from '../../../src/modules/resources/services/index.js';

describe('ResourceVerificationService', () => {
  const service = new ResourceVerificationService();
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cpm-rvs-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('validates style documents with normalized issue metadata', () => {
    const result = service.validateDocument('styles', 'analytical', '/tmp/style.yaml', {
      id: 'analytical',
      name: 'Analytical',
      description: 'Structured style',
      enabled: true,
    });

    expect(result.valid).toBe(true);
    expect(result.resourceType).toBe('styles');
    expect(result.resourceId).toBe('analytical');
  });

  it('returns yaml_load_failed when a file cannot be parsed', () => {
    const malformedPath = join(tempDir, 'broken.yaml');
    writeFileSync(malformedPath, 'id: [\n', 'utf8');

    const result = service.validateFile('prompts', 'broken', malformedPath);

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.code).toBe('yaml_load_failed');
  });

  it('validates tool sidecar definitions', () => {
    const result = service.validateDocument('tools', 'triage_tool', '/tmp/tool.yaml', {
      id: 'triage_tool',
      name: 'Triage Tool',
      runtime: 'python',
      timeout: 1000,
      enabled: true,
      execution: {
        trigger: 'schema_match',
        confirm: false,
        strict: false,
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((issue) => issue.path.includes('script'))).toBe(true);
  });
});
