import { afterAll, afterEach, beforeAll, describe, expect, test, jest } from '@jest/globals';

import { mkdtempSync, rmSync, mkdirSync } from 'fs';
import * as os from 'os';
import * as path from 'path';

import { ArgumentHistoryTracker } from '../../../src/modules/text-refs/argument-history-tracker.js';

import type { Logger } from '../../../src/infra/logging/index.js';

const createLogger = (): Logger =>
  ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }) as unknown as Logger;

describe('ArgumentHistoryTracker (persistence)', () => {
  let tmpRoot: string;

  beforeAll(() => {
    tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'arg-history-'));
    mkdirSync(path.join(tmpRoot, 'runtime-state'), { recursive: true });
  });

  afterAll(() => {
    try {
      rmSync(tmpRoot, { recursive: true, force: true });
    } catch {}
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('writes to and restores from SQLite argument_history table', async () => {
    const logger = createLogger();

    // First tracker: write one entry
    const trackerA = new ArgumentHistoryTracker(logger, 10, tmpRoot);
    await trackerA.initialize();

    await trackerA.trackExecution({
      promptId: 'chain-x',
      sessionId: 'sess-1',
      originalArgs: { q: 'hello' },
      stepNumber: 1,
      stepResult: 'R1',
    });

    await trackerA.shutdown();

    // Second tracker: should restore previous state from SQLite
    const trackerB = new ArgumentHistoryTracker(logger, 10, tmpRoot);
    await trackerB.initialize();

    const history = trackerB.getSessionHistory('sess-1');
    expect(history).toHaveLength(1);
    expect(history[0].originalArgs).toEqual({ q: 'hello' });
    expect(history[0].stepNumber).toBe(1);
    expect(history[0].stepResult).toBe('R1');

    await trackerB.shutdown();
  });
});
