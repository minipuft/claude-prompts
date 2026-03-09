import { afterAll, beforeAll, describe, expect, test, jest } from '@jest/globals';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { ChainSessionManager } from '../../../src/modules/chains/manager.js';
import { ArgumentHistoryTracker } from '../../../src/modules/text-refs/argument-history-tracker.js';

import type { Logger } from '../../../src/infra/logging/index.js';

class StubTextReferenceStore {
  private store: Record<string, Record<number, { result: string; metadata: any }>> = {};
  storeChainStepResult = jest.fn((chainId: string, step: number, result: string, metadata: any) => {
    this.store[chainId] ||= {} as any;
    this.store[chainId][step] = { result, metadata };
  });
  buildChainVariables = jest.fn().mockImplementation((chainId: string) => {
    const steps = this.store[chainId] || {};
    const step_results: Record<string, string> = {};
    for (const [k, v] of Object.entries(steps)) {
      step_results[k] = v.result;
    }
    return { step_results };
  });
  clearChainStepResults = jest.fn();
  getChainStepMetadata = jest.fn().mockReturnValue({});
}

const createLogger = (): Logger =>
  ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }) as unknown as Logger;

describe('ChainSessionManager + ArgumentHistoryTracker (integration)', () => {
  let tmpRoot: string;

  beforeAll(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'chain-arg-int-'));
    fs.mkdirSync(path.join(tmpRoot, 'runtime-state'), { recursive: true });
  });

  afterAll(() => {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch {}
  });

  test('real step completion writes argument-history to SQLite and enriches chainContext', async () => {
    const logger = createLogger();
    const textReference = new StubTextReferenceStore();
    const tracker = new ArgumentHistoryTracker(logger, 10, tmpRoot);
    await tracker.initialize();

    const manager = new ChainSessionManager(
      logger,
      textReference as any,
      { serverRoot: tmpRoot, cleanupIntervalMs: 1000 },
      tracker
    );

    await manager.createSession('sess-1', 'chain-ctx', 2, { input: 'alpha' });

    // Simulate placeholder then real response for step 1
    await manager.updateSessionState('sess-1', 1, 'placeholder', { isPlaceholder: true });
    await manager.updateStepResult('sess-1', 1, 'REAL-OUTPUT-1');
    await manager.completeStep('sess-1', 1, { preservePlaceholder: false });
    await manager.advanceStep('sess-1', 1);

    const context = manager.getChainContext('sess-1');
    // Original args should be present via ArgumentHistoryTracker (merged at root)
    expect(context.input).toBe('alpha');
    // previous_step_results should include step 1
    expect(context.previous_step_results).toBeDefined();
    expect(context.previous_step_results['1']).toBe('REAL-OUTPUT-1');

    // Verify persistence: new tracker instance should see the data
    const tracker2 = new ArgumentHistoryTracker(logger, 10, tmpRoot);
    await tracker2.initialize();
    const history = tracker2.getSessionHistory('sess-1');
    expect(history.length).toBeGreaterThan(0);
    await tracker2.shutdown();

    await manager.cleanup();
  });
});
