/**
 * Logging Module
 * Handles file logging and transport-aware console logging
 */
export type { Logger } from '../../shared/types/index.js';
import type { Logger } from '../../shared/types/index.js';
/**
 * Log entry for the in-memory ring buffer (exposed via MCP resources)
 */
export interface LogEntry {
    id: string;
    timestamp: number;
    level: 'error' | 'warn' | 'info' | 'debug';
    message: string;
    context?: Record<string, unknown>;
}
/**
 * Options for retrieving recent logs
 */
export interface GetRecentLogsOptions {
    level?: 'error' | 'warn' | 'info' | 'debug';
    limit?: number;
}
/**
 * Logging configuration options for EnhancedLogger
 */
export interface EnhancedLoggingConfig {
    logFile: string;
    transport: string;
    enableDebug?: boolean;
    configuredLevel?: string;
    /** Maximum entries to retain in ring buffer (default: 500) */
    maxBufferEntries?: number;
    /** Minimum level to buffer for resource access (default: 'info') */
    bufferLevel?: string;
}
/**
 * Enhanced logger implementation with file and console logging
 */
export declare class EnhancedLogger implements Logger {
    private logFile;
    private transport;
    private enableDebug;
    private isCI;
    private configuredLevel;
    private static readonly LOG_LEVEL_PRIORITY;
    private logBuffer;
    private readonly maxBufferSize;
    private nextEntryId;
    private bufferLevel;
    constructor(config: EnhancedLoggingConfig);
    /**
     * Parse string log level to LogLevel enum
     */
    private parseLogLevel;
    /**
     * Check if a log level should be output based on configuration
     */
    private shouldLog;
    /**
     * Initialize the log file with a clean start
     */
    initLogFile(): Promise<void>;
    /**
     * Write a message to the log file
     */
    private logToFile;
    /**
     * Log to console based on transport and environment
     */
    private logToConsole;
    /**
     * Info level logging
     */
    info(message: string, ...args: any[]): void;
    /**
     * Error level logging
     */
    error(message: string, ...args: any[]): void;
    /**
     * Warning level logging
     */
    warn(message: string, ...args: any[]): void;
    /**
     * Debug level logging
     */
    debug(message: string, ...args: any[]): void;
    /**
     * Update transport type (useful when transport is determined after logger creation)
     */
    setTransport(transport: string): void;
    /**
     * Enable or disable debug logging
     */
    setDebugEnabled(enabled: boolean): void;
    /**
     * Log startup information
     */
    logStartupInfo(transport: string, config: any): void;
    /**
     * Log memory usage information
     */
    logMemoryUsage(): void;
    /**
     * Add a log entry to the ring buffer
     */
    private addToBuffer;
    /**
     * Extract structured context from log arguments
     */
    private extractContext;
    /**
     * Get recent log entries from the ring buffer
     * @param options.level - Filter to this level and above (e.g., 'warn' returns warn + error)
     * @param options.limit - Maximum entries to return (default: 100)
     */
    getRecentLogs(options?: GetRecentLogsOptions): LogEntry[];
    /**
     * Get a specific log entry by ID
     */
    getLogEntry(id: string): LogEntry | undefined;
    /**
     * Get buffer statistics
     */
    getBufferStats(): {
        count: number;
        maxSize: number;
        oldestId: string | null;
    };
}
/**
 * Create a logger instance
 */
export declare function createLogger(config: EnhancedLoggingConfig): EnhancedLogger;
/**
 * Helper to build a logger configuration with sensible defaults.
 * Allows subsystems to opt into lightweight logging without duplicating paths.
 */
export declare function getDefaultLoggerConfig(overrides?: Partial<EnhancedLoggingConfig>): EnhancedLoggingConfig;
/**
 * Create a simple logger for areas that don't need the full enhanced logger
 * Now supports verbosity control via command-line flags
 */
export declare function createSimpleLogger(transport?: string): Logger;
/**
 * Setup console redirection for STDIO transport
 * This prevents log messages from interfering with JSON MCP messages
 */
export declare function setupConsoleRedirection(logger: Logger): void;
/**
 * Create a no-op logger for tests and cases where logging isn't needed.
 * All methods are empty functions that discard log messages.
 */
export declare function createNoopLogger(): Logger;
/**
 * Pre-instantiated no-op logger singleton for convenience.
 * Use this when you need a logger instance but don't want any output.
 */
export declare const noopLogger: Logger;
/**
 * Setup process event handlers for logging
 */
export declare function setupProcessEventHandlers(logger: Logger): void;
