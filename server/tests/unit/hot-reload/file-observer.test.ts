import { appendFile, mkdtemp, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

import { createSimpleLogger } from '../../../src/infra/logging/index.js';
import {
  createFileObserver,
  type FileChangeEvent,
} from '../../../src/modules/hot-reload/file-observer.js';

function waitForFileEvent(
  observer: ReturnType<typeof createFileObserver>,
  expectedType: FileChangeEvent['type'],
  expectedFilename: string
): Promise<FileChangeEvent> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      observer.off('fileChange', handleEvent);
      reject(new Error(`Timed out waiting for ${expectedType}:${expectedFilename}`));
    }, 5000);

    const handleEvent = (event: FileChangeEvent) => {
      if (event.type !== expectedType || event.filename !== expectedFilename) {
        return;
      }

      clearTimeout(timeout);
      observer.off('fileChange', handleEvent);
      resolve(event);
    };

    observer.on('fileChange', handleEvent);
  });
}

describe('FileObserver', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'file-observer-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test('emits added, modified, and removed events for watched files', async () => {
    const observer = createFileObserver(createSimpleLogger('stdio'), {
      debounceMs: 25,
      retryDelayMs: 25,
      usePolling: true,
      pollingInterval: 25,
    });

    await observer.start();

    try {
      await observer.watchDirectory(tempDir);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const filePath = path.join(tempDir, 'prompt.md');

      const addedEvent = waitForFileEvent(observer, 'added', 'prompt.md');
      await writeFile(filePath, '# hello\n', 'utf8');
      await expect(addedEvent).resolves.toMatchObject({
        type: 'added',
        filename: 'prompt.md',
        isPromptFile: true,
      });

      const modifiedEvent = waitForFileEvent(observer, 'modified', 'prompt.md');
      await appendFile(filePath, 'updated\n', 'utf8');
      await expect(modifiedEvent).resolves.toMatchObject({
        type: 'modified',
        filename: 'prompt.md',
        isPromptFile: true,
      });

      const removedEvent = waitForFileEvent(observer, 'removed', 'prompt.md');
      await unlink(filePath);
      await expect(removedEvent).resolves.toMatchObject({
        type: 'removed',
        filename: 'prompt.md',
        isPromptFile: true,
      });
    } finally {
      await observer.stop();
    }
  });
});
