/**
 * Analytics/metrics type definitions consumed by engine/, mcp/, and infra/ layers.
 * Canonical location for metric data shapes and the MetricsCollector interface.
 */
export interface ExecutionData {
    executionId: string;
    executionType: 'single' | 'chain';
    startTime: number;
    endTime: number;
    executionTime: number;
    success: boolean;
    frameworkUsed?: string;
    frameworkEnabled: boolean;
    stepsExecuted?: number;
    sessionId?: string;
    toolName: string;
    error?: string;
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
}
export interface GateValidationData {
    executionId: string;
    gateValidationEnabled: boolean;
    totalGates: number;
    passedGates: number;
    failedGates: number;
    validationTime: number;
    retryCount?: number;
    gateResults: Array<{
        gateId: string;
        gateName: string;
        passed: boolean;
        score?: number;
        evaluationTime?: number;
    }>;
}
export type GateValidationResult = 'passed' | 'failed' | 'skipped';
export interface GateUsageMetric {
    gateId: string;
    gateType: 'canonical' | 'temporary';
    sessionId?: string;
    instructionCount: number;
    instructionCharacters?: number;
    temporary: boolean;
    validationResult?: GateValidationResult;
    metadata?: Record<string, unknown>;
    timestamp?: number;
}
export interface FrameworkSwitchData {
    switchId: string;
    fromFramework: string;
    toFramework: string;
    switchTime: number;
    reason?: string;
    switchSuccess: boolean;
    switchDuration: number;
}
export interface ExecutionStats {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    executionsByMode: {
        single: number;
        chain: number;
    };
    executionsByTool: {
        prompt_engine: number;
        resource_manager: number;
        system_control: number;
    };
    lastUpdated: number;
}
export interface SystemMetrics {
    uptime: number;
    memoryUsage: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    performanceTrends: PerformanceTrend[];
}
export interface PerformanceTrend {
    timestamp: number;
    metric: 'execution_time' | 'memory_usage' | 'success_rate' | 'response_time';
    value: number;
    context?: string;
}
export interface FrameworkUsage {
    currentFramework: string;
    frameworkSwitches: number;
    frameworkUsageTime: Record<string, number>;
    frameworkSwitchHistory: Array<{
        timestamp: number;
        fromFramework: string;
        toFramework: string;
        reason?: string;
    }>;
    frameworkPerformance: Record<string, {
        averageExecutionTime: number;
        successRate: number;
        usageCount: number;
    }>;
}
export type AnalyticsEvent = {
    type: 'execution:start';
    data: Partial<ExecutionData>;
} | {
    type: 'execution:complete';
    data: ExecutionData;
} | {
    type: 'execution:error';
    data: ExecutionData;
} | {
    type: 'gate:validation';
    data: GateValidationData;
} | {
    type: 'framework:switch';
    data: FrameworkSwitchData;
} | {
    type: 'system:memory';
    data: {
        timestamp: number;
        usage: SystemMetrics['memoryUsage'];
    };
} | {
    type: 'system:performance';
    data: PerformanceTrend;
};
export interface AnalyticsQueryOptions {
    timeRange?: {
        start: number;
        end: number;
    };
    toolFilter?: string[];
    frameworkFilter?: string[];
    includePerformanceTrends?: boolean;
    includeTrendHistory?: boolean;
    maxResults?: number;
}
export interface AnalyticsSummary {
    executionStats: ExecutionStats;
    systemMetrics: SystemMetrics;
    frameworkUsage: FrameworkUsage;
    gateValidationStats: {
        totalValidations: number;
        validationSuccessRate: number;
        averageValidationTime: number;
        gateAdoptionRate: number;
    };
    recommendations: string[];
}
export type PipelineStageType = 'parsing' | 'inline_gate' | 'operator_validation' | 'planning' | 'gate_enhancement' | 'framework' | 'session' | 'response_capture' | 'execution' | 'post_processing' | 'other';
export type PipelineStageStatus = 'success' | 'error' | 'skipped';
export interface PipelineStageMetadata {
    heapUsed?: number;
    rss?: number;
    heapUsedDelta?: number;
    rssDelta?: number;
    responseReady?: boolean;
    [key: string]: unknown;
}
export interface PipelineStageMetric {
    stageId: string;
    stageName: string;
    stageType: PipelineStageType;
    toolName: string;
    sessionId?: string;
    startTime: number;
    endTime: number;
    durationMs: number;
    status: PipelineStageStatus;
    errorMessage?: string;
    metadata?: PipelineStageMetadata;
}
export type MetricStatus = 'success' | 'error';
export type CommandExecutionMode = 'single' | 'chain' | 'auto' | 'prompt' | 'template';
export interface CommandExecutionMetric {
    commandId: string;
    commandName: string;
    toolName: string;
    executionMode: CommandExecutionMode;
    sessionId?: string;
    startTime: number;
    endTime: number;
    durationMs: number;
    status: MetricStatus;
    appliedGates: string[];
    temporaryGatesApplied: number;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
}
export interface MetricsCollector {
    recordExecution(data: ExecutionData): void;
    recordExecutionError(data: ExecutionData): void;
    recordGateValidation(data: GateValidationData): void;
    recordGateUsage(metric: GateUsageMetric): void;
    recordFrameworkSwitch(data: FrameworkSwitchData): void;
    recordPipelineStage(metric: PipelineStageMetric): void;
    recordCommandExecutionMetric(metric: CommandExecutionMetric): void;
    trackExecution(data: {
        executionId: string;
        executionType: string;
        duration: number;
        frameworkUsed?: string;
        stepsExecuted?: number;
        success: boolean;
        sessionId?: string;
    }): void;
    trackError(data: {
        executionId: string;
        executionType: string;
        errorType: string;
        errorMessage: string;
        sessionId?: string;
    }): void;
    getExecutionStats(): ExecutionStats;
    getSystemMetrics(): SystemMetrics;
    getFrameworkUsage(): FrameworkUsage;
    getAnalyticsSummary(options?: AnalyticsQueryOptions): AnalyticsSummary;
    resetAnalytics(): void;
    shutdown(): void;
}
