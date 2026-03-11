/**
 * Server Management Module
 * Handles HTTP server lifecycle, process management, and orchestration
 */
import { Server } from 'http';
import { ConfigLoader } from '../config/index.js';
import { Logger } from '../logging/index.js';
import { TransportRouter, createTransportRouter, TransportType } from './transport/index.js';
import type { ApiRouterPort } from '../../shared/types/index.js';
export { TransportRouter, createTransportRouter, TransportType };
/**
 * Server Manager class
 */
export declare class ServerLifecycle {
    private logger;
    private configManager;
    private transportRouter;
    private apiRouter;
    private httpServer?;
    private port;
    constructor(logger: Logger, configManager: ConfigLoader, transportRouter: TransportRouter, apiRouter?: ApiRouterPort);
    /**
     * Start the server based on transport mode
     * Supports 'stdio', 'sse', 'streamable-http', or 'both' modes
     */
    startServer(): Promise<void>;
    /**
     * Start server with both STDIO and SSE transports
     */
    private startBothTransports;
    /**
     * Start server with STDIO transport
     */
    private startStdioServer;
    /**
     * Start server with SSE transport
     */
    private startSseServer;
    /**
     * Start server with Streamable HTTP transport (MCP standard since 2025-03-26)
     * This is the preferred HTTP transport, replacing deprecated SSE
     */
    private startStreamableHttpServer;
    /**
     * Setup HTTP server event handlers
     */
    private setupHttpServerEventHandlers;
    /**
     * Log system information
     */
    private logSystemInfo;
    /**
     * Graceful shutdown
     */
    shutdown(exitCode?: number): void;
    /**
     * Finalize shutdown process
     */
    private finalizeShutdown;
    /**
     * Restart the server
     */
    restart(reason?: string): Promise<void>;
    /**
     * Check if server is running
     */
    isRunning(): boolean;
    /**
     * Get server status information
     */
    getStatus(): {
        running: boolean;
        transport: string;
        port?: number;
        connections?: number;
        sessions?: number;
        uptime: number;
        transports?: {
            stdio: boolean;
            sse: boolean;
            streamableHttp: boolean;
        };
    };
    /**
     * Get the HTTP server instance (for SSE transport)
     */
    getHttpServer(): Server | undefined;
    /**
     * Get the port number
     */
    getPort(): number;
}
/**
 * Create and configure a server manager
 */
export declare function createServerLifecycle(logger: Logger, configManager: ConfigLoader, transportRouter: TransportRouter, apiRouter?: ApiRouterPort): ServerLifecycle;
/**
 * Server startup helper function
 */
export declare function startMcpServer(logger: Logger, configManager: ConfigLoader, transportRouter: TransportRouter, apiRouter?: ApiRouterPort): Promise<ServerLifecycle>;
