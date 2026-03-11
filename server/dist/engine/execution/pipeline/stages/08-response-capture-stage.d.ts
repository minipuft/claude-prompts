import { BasePipelineStage } from '../stage.js';
import type { Logger } from '../../../../infra/logging/index.js';
import type { ChainSessionService } from '../../../../shared/types/index.js';
import type { GateVerdictProcessor } from '../../../gates/services/gate-verdict-processor.js';
import type { StepCaptureService } from '../../capture/step-capture-service.js';
import type { ExecutionContext } from '../../context/index.js';
/**
 * Pipeline Stage 8: Step Response Capture
 *
 * Thin orchestrator that delegates verdict processing and step capture to domain services.
 *
 * Dependencies: context.sessionContext
 * Output: Captured step results in TextReferenceStore
 * Can Early Exit: No
 */
export declare class StepResponseCaptureStage extends BasePipelineStage {
    private readonly verdictProcessor;
    private readonly stepCaptureService;
    private readonly chainSessionManager;
    readonly name = "StepResponseCapture";
    constructor(verdictProcessor: GateVerdictProcessor, stepCaptureService: StepCaptureService, chainSessionManager: ChainSessionService, logger: Logger);
    execute(context: ExecutionContext): Promise<void>;
    /**
     * Align pipeline session context with manager state.
     * Important for gate reviews where session state may have changed.
     */
    private alignSessionContext;
}
