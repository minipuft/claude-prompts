import { BasePipelineStage } from '../stage.js';
import type { Logger } from '../../../../infra/logging/index.js';
import type { InlineGateProcessor } from '../../../gates/services/inline-gate-processor.js';
import type { ExecutionContext } from '../../context/index.js';
/**
 * Pipeline Stage 2: Inline Gate Extraction
 *
 * Thin orchestrator that delegates inline gate processing to the InlineGateProcessor.
 *
 * Dependencies: context.parsedCommand
 * Output: context.parsedCommand.inlineGateIds, registered temporary gates
 * Can Early Exit: No
 */
export declare class InlineGateExtractionStage extends BasePipelineStage {
    private readonly inlineGateProcessor;
    readonly name = "InlineGateExtraction";
    constructor(inlineGateProcessor: InlineGateProcessor, logger: Logger);
    execute(context: ExecutionContext): Promise<void>;
}
