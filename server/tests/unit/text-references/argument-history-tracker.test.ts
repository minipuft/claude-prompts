import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  jest,
} from '@jest/globals';

import * as fs from 'fs';
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

describe('ArgumentHistoryTracker', () => {
  let tracker: ArgumentHistoryTracker;
  let tmpRoot: string;

  beforeAll(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'arg-tracker-'));
    fs.mkdirSync(path.join(tmpRoot, 'runtime-state'), { recursive: true });
  });

  afterAll(() => {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch {}
  });

  beforeEach(() => {
    tracker = new ArgumentHistoryTracker(createLogger(), 10, tmpRoot);
  });

  afterEach(async () => {
    await tracker.clearAll();
  });

  test('tracks executions and retrieves chain history', async () => {
    const entryId = await tracker.trackExecution({
      promptId: 'demo',
      sessionId: 'session-1',
      originalArgs: { name: 'Ada' },
      stepNumber: 1,
      stepResult: 'Hello Ada',
    });

    expect(entryId).toMatch(/^entry_/);
    const history = tracker.getChainHistory('session-1');
    expect(history).toHaveLength(1);
    expect(history[0].originalArgs.name).toBe('Ada');
  });

  test('enforces max entries per chain with FIFO semantics', async () => {
    tracker = new ArgumentHistoryTracker(createLogger(), 2, tmpRoot);
    await tracker.trackExecution({
      promptId: 'demo',
      sessionId: 'chain-a',
      originalArgs: { index: 1 },
    });
    await tracker.trackExecution({
      promptId: 'demo',
      sessionId: 'chain-a',
      originalArgs: { index: 2 },
    });
    await tracker.trackExecution({
      promptId: 'demo',
      sessionId: 'chain-a',
      originalArgs: { index: 3 },
    });

    const history = tracker.getChainHistory('chain-a');
    expect(history).toHaveLength(2);
    expect(history[0].originalArgs.index).toBe(2);
    expect(history[1].originalArgs.index).toBe(3);
  });

  test('builds review context with step results', async () => {
    await tracker.trackExecution({
      promptId: 'chain',
      sessionId: 'chain-1',
      originalArgs: { doc: 'First pass' },
      stepNumber: 1,
      stepResult: 'Result step 1',
    });
    await tracker.trackExecution({
      promptId: 'chain',
      sessionId: 'chain-1',
      originalArgs: { doc: 'Second pass' },
      stepNumber: 2,
      stepResult: 'Result step 2',
    });

    const reviewContext = tracker.buildReviewContext('chain-1');
    expect(reviewContext.originalArgs.doc).toBe('Second pass');
    expect(reviewContext.previousResults[2]).toBe('Result step 2');
    expect(reviewContext.previousResults[1]).toBe('Result step 1');
  });
});
