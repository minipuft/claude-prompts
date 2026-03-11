import { afterAll, beforeAll, describe, expect, test, jest } from '@jest/globals';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { createFrameworkStateStore } from '../../../src/engine/frameworks/framework-state-store.js';

import type { Logger } from '../../../src/infra/logging/index.js';

const createLogger = (): Logger =>
  ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }) as unknown as Logger;

describe('FrameworkStateStore (persistence)', () => {
  let tmpRoot: string;

  beforeAll(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fw-state-'));
    fs.mkdirSync(path.join(tmpRoot, 'runtime-state'), { recursive: true });
  });

  afterAll(() => {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch {}
  });

  test('writes and restores framework state across instances via SQLite', async () => {
    const logger = createLogger();
    const mgrA = await createFrameworkStateStore(logger, tmpRoot);

    await mgrA.enableFrameworkSystem('unit-enable');
    await mgrA.switchFramework({ targetFramework: 'react', reason: 'unit-switch' });

    const stateA = mgrA.getCurrentState();
    expect(stateA.frameworkSystemEnabled).toBe(true);
    expect(stateA.activeFramework.toLowerCase()).toBe('react');

    await mgrA.shutdown();

    // New instance should restore the same state from SQLite
    const mgrB = await createFrameworkStateStore(logger, tmpRoot);
    const stateB = mgrB.getCurrentState();
    expect(stateB.frameworkSystemEnabled).toBe(true);
    expect(stateB.activeFramework.toLowerCase()).toBe('react');

    await mgrB.shutdown();
  });
});
