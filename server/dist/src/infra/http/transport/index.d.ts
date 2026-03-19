/**
 * Transport Management Module
 * Handles STDIO, SSE, and Streamable HTTP transport setup and lifecycle management
 */
import express from 'express';
import { ConfigLoader } from '../../config/index.js';
import { Logger } from '../../logging/index.js';
import type { TransportMode } from '../../../shared/types/index.js';
/**
 * Transport types supported by the server
 */
export declare enum TransportType {
    STDIO = "stdio",
    SSE = "sse",
    STREAMABLE_HTTP = "streamable-http",
    BOTH = "both"
}
/**
 * Transport Manager class
 */
export declare class TransportRouter {
    private logger;
    private configManager;
    private mcpServer;
    private transport;
    private sseTransports;
    private streamableHttpTransports;
    constructor(logger: Logger, configManager: ConfigLoader, mcpServer: any, transport: TransportMode);
    /**
     * Determine transport mode from command line arguments or configuration
     * Priority: CLI args > config.transport > default (stdio)
     */
    static determineTransport(args: string[], configManager: ConfigLoader): TransportMode;
    /**
     * Setup STDIO transport
     */
    setupStdioTransport(): Promise<void>;
    /**
     * Setup console redirection for STDIO transport
     */
    private setupStdioConsoleRedirection;
    /**
     * Setup STDIO event handlers
     */
    private setupStdioEventHandlers;
    /**
     * Setup SSE transport with Express integration
     */
    setupSseTransport(app: express.Application): void;
    /**
     * Setup Streamable HTTP transport with Express integration
     * This is the new MCP standard transport (replacing SSE)
     */
    setupStreamableHttpTransport(app: express.Application): void;
    /**
     * Get transport mode
     */
    getTransportType(): TransportMode;
    /**
     * Check if STDIO transport should be active
     * True for 'stdio' or 'both' modes
     */
    isStdio(): boolean;
    /**
     * Check if SSE transport should be active
     * True for 'sse' or 'both' modes
     * @deprecated SSE is deprecated, prefer streamable-http
     */
    isSse(): boolean;
    /**
     * Check if Streamable HTTP transport should be active
     */
    isStreamableHttp(): boolean;
    /**
     * Check if running in dual transport mode
     */
    isBoth(): boolean;
    /**
     * Get active SSE connections count
     */
    getActiveConnectionsCount(): number;
    /**
     * Get active Streamable HTTP sessions count
     */
    getActiveStreamableHttpSessionsCount(): number;
    /**
     * Close all active connections (SSE and Streamable HTTP)
     */
    closeAllConnections(): Promise<void>;
}
/**
 * Create and configure a transport manager
 */
export declare function createTransportRouter(logger: Logger, configManager: ConfigLoader, mcpServer: any, transport: TransportMode): TransportRouter;
