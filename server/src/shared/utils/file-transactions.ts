// @lifecycle canonical - Safe file write and transactional multi-file operations.
import * as fs from 'node:fs/promises';

// Uses stderr to avoid corrupting STDIO protocol
const log = {
  info: (message: string, ...args: any[]) => {
    console.error(`[INFO] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
};

/**
 * Safely writes content to a file by first writing to a temp file, then renaming.
 * This ensures the file is either completely written or left unchanged.
 *
 * @param filePath Path to the file
 * @param content Content to write
 * @param encoding Optional encoding (defaults to 'utf8')
 */
export async function safeWriteFile(
  filePath: string,
  content: string,
  encoding: BufferEncoding = 'utf8'
): Promise<void> {
  const tempPath = `${filePath}.tmp`;

  try {
    // Write to temp file
    await fs.writeFile(tempPath, content, encoding);

    // Check if the original file exists
    try {
      await fs.access(filePath);
      // If it exists, make a backup
      const backupPath = `${filePath}.bak`;
      await fs.copyFile(filePath, backupPath);

      // Replace the original with the temp file
      await fs.rename(tempPath, filePath);

      // Remove the backup
      await fs.unlink(backupPath);
    } catch (error) {
      // File doesn't exist, just rename the temp file
      await fs.rename(tempPath, filePath);
    }
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch (cleanupError) {
      // Ignore errors during cleanup
    }
    throw error;
  }
}

/**
 * Perform a series of file operations as a transaction.
 * Automatically rolls back all changes if any operation fails.
 *
 * @param operations Array of async functions that perform file operations
 * @param rollbacks Array of async functions that undo the operations
 * @returns Result of the last operation if successful
 * @deprecated Use ResourceMutationTransaction from modules/resources/services for snapshot-based rollback.
 */
export async function performTransactionalFileOperations<T>(
  operations: Array<() => Promise<any>>,
  rollbacks: Array<() => Promise<any>>
): Promise<T> {
  // Validate inputs
  if (!operations || !Array.isArray(operations) || operations.length === 0) {
    throw new Error('No operations provided for transaction');
  }

  if (!rollbacks || !Array.isArray(rollbacks)) {
    log.warn(
      'No rollbacks provided for transaction - operations cannot be rolled back if they fail'
    );
    rollbacks = [];
  }

  // Ensure rollbacks array matches operations array length
  if (rollbacks.length < operations.length) {
    log.warn(
      `Rollbacks array (${rollbacks.length}) is shorter than operations array (${operations.length}) - some operations cannot be rolled back`
    );
    // Fill with dummy rollbacks
    for (let i = rollbacks.length; i < operations.length; i++) {
      rollbacks.push(async () => {
        log.warn(`No rollback defined for operation ${i}`);
      });
    }
  }

  let lastSuccessfulIndex = -1;
  let result: any;

  try {
    // Perform operations
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      if (typeof operation !== 'function') {
        throw new Error(`Operation at index ${i} is not a function`);
      }
      result = await operation();
      lastSuccessfulIndex = i;
    }
    return result as T;
  } catch (error) {
    log.error(`Transaction failed at operation ${lastSuccessfulIndex + 1}:`, error);

    // Perform rollbacks in reverse order
    for (let i = lastSuccessfulIndex; i >= 0; i--) {
      try {
        const rollback = rollbacks[i];
        if (typeof rollback === 'function') {
          await rollback();
        } else {
          log.warn(`Skipping invalid rollback at index ${i} (not a function)`);
        }
      } catch (rollbackError) {
        log.error(`Error during rollback operation ${i}:`, rollbackError);
        // Continue with other rollbacks even if one fails
      }
    }
    throw error;
  }
}
