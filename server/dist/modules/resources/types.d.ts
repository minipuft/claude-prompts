/**
 * MCP Resources Types
 *
 * Type definitions for MCP resource handlers, URI patterns, and metadata.
 * Resources provide token-efficient read-only access to prompts, gates, and observability data.
 */
import type { Logger } from '../../shared/types/index.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Resource URI patterns for discovery and content retrieval.
 * Simple format: resource://type/[id][/subresource]
 */
export declare const RESOURCE_URI_PATTERNS: {
    readonly PROMPT_LIST: "resource://prompt/";
    readonly PROMPT_ITEM: "resource://prompt/{id}";
    readonly PROMPT_TEMPLATE: "resource://prompt/{id}/template";
    readonly GATE_LIST: "resource://gate/";
    readonly GATE_ITEM: "resource://gate/{id}";
    readonly GATE_GUIDANCE: "resource://gate/{id}/guidance";
    readonly METHODOLOGY_LIST: "resource://methodology/";
    readonly METHODOLOGY_ITEM: "resource://methodology/{id}";
    readonly METHODOLOGY_SYSTEM_PROMPT: "resource://methodology/{id}/system-prompt";
    readonly SESSION_LIST: "resource://session/";
    readonly SESSION_ITEM: "resource://session/{chainId}";
    readonly METRICS_PIPELINE: "resource://metrics/pipeline";
    readonly LOGS_LIST: "resource://logs/";
    readonly LOGS_BY_LEVEL: "resource://logs/{level}";
    readonly LOGS_ENTRY: "resource://logs/entry/{id}";
};
/**
 * Resource metadata for list responses (minimal, token-efficient)
 */
export interface ResourceListItem {
    uri: string;
    name: string;
    title?: string;
    description?: string;
    mimeType?: string;
}
/**
 * Prompt resource metadata for list responses
 */
export interface PromptResourceMetadata extends ResourceListItem {
    type: 'single' | 'chain';
    argumentCount: number;
    category?: string;
}
/**
 * Gate resource metadata for list responses
 */
export interface GateResourceMetadata extends ResourceListItem {
    type: 'validation' | 'guidance';
    enabled: boolean;
    severity?: 'critical' | 'high' | 'medium' | 'low';
}
/**
 * Methodology resource metadata for list responses
 */
export interface MethodologyResourceMetadata extends ResourceListItem {
    type: string;
    enabled: boolean;
    priority: number;
}
/**
 * Session resource metadata for list responses
 */
export interface SessionResourceMetadata extends ResourceListItem {
    chainId: string;
    currentStep: number;
    totalSteps: number;
    pendingReview: boolean;
    lastActivity: number;
}
/**
 * Dependencies required by resource handlers.
 * Passed by reference to ensure hot-reload compatibility.
 */
export interface ResourceDependencies {
    logger: Logger;
    promptManager?: {
        getConvertedPrompts(): Array<{
            id: string;
            name: string;
            description: string;
            category: string;
            systemMessage?: string;
            userMessageTemplate: string;
            arguments: Array<{
                name: string;
                type?: string;
                description?: string;
                required?: boolean;
            }>;
            chainSteps?: Array<{
                promptId: string;
                stepName: string;
            }>;
        }>;
    };
    gateManager?: {
        list(enabledOnly?: boolean): Array<{
            gateId: string;
            name: string;
            description: string;
            type: 'validation' | 'guidance';
            severity: 'critical' | 'high' | 'medium' | 'low';
            getGuidance(): string;
        }>;
        get(id: string): {
            gateId: string;
            name: string;
            description: string;
            type: 'validation' | 'guidance';
            severity: 'critical' | 'high' | 'medium' | 'low';
            getGuidance(): string;
        } | undefined;
    };
    frameworkManager?: {
        listFrameworks(enabledOnly?: boolean): Array<{
            id: string;
            name: string;
            description: string;
            type: string;
            systemPromptTemplate: string;
            executionGuidelines: string[];
            priority: number;
            enabled: boolean;
        }>;
        getFramework(id: string): {
            id: string;
            name: string;
            description: string;
            type: string;
            systemPromptTemplate: string;
            executionGuidelines: string[];
            priority: number;
            enabled: boolean;
        } | undefined;
    };
    chainSessionManager?: {
        listActiveSessions(limit?: number): Array<{
            sessionId: string;
            chainId: string;
            currentStep: number;
            totalSteps: number;
            pendingReview: boolean;
            lastActivity: number;
            startTime: number;
            promptName?: string;
            promptId?: string;
        }>;
        getSession(sessionId: string): {
            sessionId: string;
            chainId: string;
            state: {
                currentStep: number;
                totalSteps: number;
                stepStates?: Map<number, unknown>;
            };
            startTime: number;
            lastActivity: number;
            originalArgs: Record<string, unknown>;
            pendingGateReview?: unknown;
        } | undefined;
        /** Lookup by user-facing chainId (e.g., chain-quick_decision#1) */
        getSessionByChainIdentifier(chainId: string): {
            sessionId: string;
            chainId: string;
            state: {
                currentStep: number;
                totalSteps: number;
                stepStates?: Map<number, unknown>;
            };
            startTime: number;
            lastActivity: number;
            originalArgs: Record<string, unknown>;
            pendingGateReview?: unknown;
        } | undefined;
        getSessionStats(): {
            totalSessions: number;
            totalChains: number;
            averageStepsPerChain: number;
            oldestSessionAge: number;
        };
    };
    metricsCollector?: {
        getAnalyticsSummary(): {
            executionStats: {
                totalExecutions: number;
                successfulExecutions: number;
                failedExecutions: number;
                averageExecutionTime: number;
            };
            systemMetrics: {
                uptime: number;
                memoryUsage: {
                    heapUsed: number;
                    heapTotal: number;
                };
                averageResponseTime: number;
                requestsPerMinute: number;
                errorRate: number;
                performanceTrends: unknown[];
            };
            frameworkUsage: {
                currentFramework: string;
                frameworkSwitches: number;
            };
            gateValidationStats: {
                totalValidations: number;
                validationSuccessRate: number;
                averageValidationTime: number;
                gateAdoptionRate: number;
            };
            recommendations: string[];
        };
    };
    /** Log manager for MCP resources access to recent logs */
    logManager?: {
        getRecentLogs(options?: {
            level?: LogEntryResource['level'];
            limit?: number;
        }): LogEntryResource[];
        getLogEntry(id: string): LogEntryResource | undefined;
        getBufferStats(): {
            count: number;
            maxSize: number;
            oldestId: string | null;
        };
    };
    /** Resources configuration for granular enable/disable control */
    resourcesConfig?: {
        prompts?: {
            enabled?: boolean;
        };
        gates?: {
            enabled?: boolean;
        };
        methodologies?: {
            enabled?: boolean;
        };
        observability?: {
            enabled?: boolean;
            sessions?: boolean;
            metrics?: boolean;
        };
        logs?: {
            enabled?: boolean;
        };
    };
}
/**
 * Log entry structure for MCP resources
 */
export interface LogEntryResource {
    id: string;
    timestamp: number;
    level: 'error' | 'warn' | 'info' | 'debug';
    message: string;
    context?: Record<string, unknown>;
}
/**
 * Resource registration context passed to handler registration functions
 */
export interface ResourceRegistrationContext {
    server: McpServer;
    dependencies: ResourceDependencies;
}
/**
 * Result type for resource content
 */
export interface ResourceContent {
    uri: string;
    mimeType: string;
    text: string;
}
/**
 * Standard resource read result
 */
export interface ResourceReadResult {
    contents: ResourceContent[];
}
/**
 * Error thrown when a resource is not found
 */
export declare class ResourceNotFoundError extends Error {
    readonly resourceType: string;
    readonly resourceId: string;
    constructor(resourceType: string, resourceId: string);
}
