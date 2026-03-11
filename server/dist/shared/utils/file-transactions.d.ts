/**
 * Safely writes content to a file by first writing to a temp file, then renaming.
 * This ensures the file is either completely written or left unchanged.
 *
 * @param filePath Path to the file
 * @param content Content to write
 * @param encoding Optional encoding (defaults to 'utf8')
 */
export declare function safeWriteFile(filePath: string, content: string, encoding?: BufferEncoding): Promise<void>;
/**
 * Perform a series of file operations as a transaction.
 * Automatically rolls back all changes if any operation fails.
 *
 * @param operations Array of async functions that perform file operations
 * @param rollbacks Array of async functions that undo the operations
 * @returns Result of the last operation if successful
 */
export declare function performTransactionalFileOperations<T>(operations: Array<() => Promise<any>>, rollbacks: Array<() => Promise<any>>): Promise<T>;
