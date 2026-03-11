import { BasePipelineStage } from '../stage.js';
import type { Logger } from '../../../../infra/logging/index.js';
import type { ConfigManager } from '../../../../shared/types/index.js';
import type { JudgeMenuFormatter } from '../../../gates/judge/judge-menu-formatter.js';
import type { JudgeResourceCollector } from '../../../gates/judge/judge-resource-collector.js';
import type { ExecutionContext } from '../../context/index.js';
/**
 * Pipeline Stage 6a: Judge Selection (Two-Phase Client-Driven Flow)
 *
 * Judge Phase (triggered by `%judge`):
 * - Collects all available resources (styles, frameworks, gates)
 * - Returns a judge prompt with resource menu for Claude to analyze
 * - Pipeline terminates early with the judge response
 *
 * Execution Phase (follow-up call with operators):
 * - Client reruns prompt_engine with inline operators (@framework, ::gates, #style)
 * - Pipeline continues with normal execution using operator-derived selections
 *
 * Domain logic delegated to:
 * - JudgeResourceCollector: gathers styles, frameworks, gates
 * - JudgeMenuFormatter: builds response menu and operator context
 *
 * Dependencies: context.mcpRequest, context.executionPlan
 * Output: context.response (early return on judge phase)
 */
export declare class JudgeSelectionStage extends BasePipelineStage {
    private readonly resourceCollector;
    private readonly menuFormatter;
    private readonly configManager;
    readonly name = "JudgeSelection";
    constructor(resourceCollector: JudgeResourceCollector, menuFormatter: JudgeMenuFormatter, configManager: ConfigManager | null, logger: Logger);
    execute(context: ExecutionContext): Promise<void>;
    private applyInlineStyleSelection;
    private shouldTriggerJudgePhase;
}
