import type { GateValidationResult as ServiceGateValidationResult } from './gate-service-interface.js';
import type { MetricsCollector } from '../../../shared/types/index.js';
import type { ExecutionContext } from '../../execution/context/index.js';
/**
 * Records gate usage metrics for the analytics system.
 */
export declare class GateMetricsRecorder {
    private readonly metricsProvider;
    private readonly gateServiceType?;
    constructor(metricsProvider: (() => MetricsCollector | undefined) | undefined, gateServiceType?: string | undefined);
    recordGateUsageMetrics(context: ExecutionContext, gateIds: string[], instructionLength?: number, validationResults?: ServiceGateValidationResult[]): void;
    private toMetricValidationResult;
}
