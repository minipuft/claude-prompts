/**
 * MCP Notification Emitter
 *
 * Emits MCP protocol notifications for gate failures, framework changes,
 * chain events, and response blocking. Enables clients to react to
 * server-side events without polling.
 *
 * Notification Types:
 * - notifications/gate/failed - Gate evaluation failed
 * - notifications/gate/response_blocked - Response blocked due to gate failure
 * - notifications/gate/retry_exhausted - All retry attempts exhausted
 * - notifications/framework/changed - Active framework/methodology changed
 * - notifications/chain/step_complete - Chain step completed
 * - notifications/chain/complete - Entire chain completed
 * - notifications/chain/failed - Chain failed with error
 */
import type { McpNotificationEmitterPort } from '../../../shared/types/index.js';
import type { Logger } from '../../logging/index.js';
/**
 * Minimal MCP server interface for sending notifications.
 * Matches the notification method signature from @modelcontextprotocol/sdk.
 */
export interface McpNotificationServer {
    notification(params: {
        method: string;
        params?: Record<string, unknown>;
    }): void;
}
/**
 * Gate failure notification payload.
 */
export interface GateFailedNotification {
    /** Gate ID that failed */
    gateId: string;
    /** Reason for failure */
    reason: string;
    /** Chain ID if this occurred during chain execution */
    chainId?: string;
    /** Step index where failure occurred */
    stepIndex?: number;
}
/**
 * Response blocked notification payload.
 */
export interface ResponseBlockedNotification {
    /** Gate IDs that triggered the block */
    gateIds: string[];
    /** Chain ID if this occurred during chain execution */
    chainId?: string;
}
/**
 * Retry exhausted notification payload.
 */
export interface RetryExhaustedNotification {
    /** Gate IDs that exhausted retries */
    gateIds: string[];
    /** Chain ID where this occurred */
    chainId: string;
    /** Maximum attempts that were allowed */
    maxAttempts: number;
}
/**
 * Framework changed notification payload.
 */
export interface FrameworkChangedNotification {
    /** Previous framework ID (if any) */
    from?: string;
    /** New framework ID */
    to: string;
    /** Reason for the change */
    reason: string;
}
/**
 * Chain step complete notification payload.
 */
export interface ChainStepCompleteNotification {
    /** Chain ID */
    chainId: string;
    /** Step index that completed (0-indexed) */
    stepIndex: number;
    /** Whether the step passed or failed */
    status: 'passed' | 'failed';
}
/**
 * Chain complete notification payload.
 */
export interface ChainCompleteNotification {
    /** Chain ID */
    chainId: string;
    /** Total steps executed */
    totalSteps: number;
    /** Overall chain status */
    status: 'completed' | 'failed';
}
/**
 * MCP Notification Emitter
 *
 * Sends MCP protocol notifications to connected clients.
 * Gracefully handles missing server or notification support.
 */
export declare class McpNotificationEmitter implements McpNotificationEmitterPort {
    private server?;
    private readonly logger;
    constructor(logger: Logger);
    /**
     * Set the MCP server instance for sending notifications.
     * Should be called during application startup.
     */
    setServer(server: McpNotificationServer): void;
    /**
     * Check if notifications can be sent.
     */
    canSend(): boolean;
    /**
     * Emit notification when a gate fails evaluation.
     */
    emitGateFailed(notification: GateFailedNotification): void;
    /**
     * Emit notification when response content is blocked due to gate failure.
     */
    emitResponseBlocked(notification: ResponseBlockedNotification): void;
    /**
     * Emit notification when all retry attempts for gates are exhausted.
     */
    emitRetryExhausted(notification: RetryExhaustedNotification): void;
    /**
     * Emit notification when the active framework changes.
     */
    emitFrameworkChanged(notification: FrameworkChangedNotification): void;
    /**
     * Emit notification when a chain step completes.
     */
    emitChainStepComplete(notification: ChainStepCompleteNotification): void;
    /**
     * Emit notification when an entire chain completes or fails.
     */
    emitChainComplete(notification: ChainCompleteNotification): void;
    /**
     * Send a notification via the MCP server.
     */
    private send;
}
