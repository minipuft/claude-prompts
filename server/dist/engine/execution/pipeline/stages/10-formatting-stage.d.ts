import { BasePipelineStage } from '../stage.js';
import type { Logger } from '../../../../infra/logging/index.js';
import type { ResponseFormatterPort } from '../../../../shared/types/index.js';
import type { ExecutionContext } from '../../context/index.js';
import type { ResponseAssembler } from '../../formatting/response-assembler.js';
/**
 * Pipeline Stage 10: Response Formatting
 *
 * Assembles final ToolResponse payloads with metadata, session information,
 * and progress tracking for different execution types (prompt/chain/template).
 *
 * Domain logic delegated to:
 * - ResponseAssembler: section assembly, footer building, gate validation info
 * - formatting-context.ts: type guards for discriminated union
 *
 * Dependencies: context.executionPlan, rendered content from Stage 9
 * Output: context.response (final ToolResponse)
 */
export declare class ResponseFormattingStage extends BasePipelineStage {
    private readonly responseFormatter;
    private readonly responseAssembler;
    readonly name = "ResponseFormatting";
    constructor(responseFormatter: ResponseFormatterPort, responseAssembler: ResponseAssembler, logger: Logger);
    execute(context: ExecutionContext): Promise<void>;
    /**
     * Build the FormatterExecutionContext from pipeline state.
     * This is orchestration-level context wiring, not domain logic.
     */
    private buildFormatterContext;
}
