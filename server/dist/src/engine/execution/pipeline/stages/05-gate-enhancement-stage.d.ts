import { BasePipelineStage } from '../stage.js';
import type { Logger } from '../../../../infra/logging/index.js';
import type { GateEnhancementService } from '../../../gates/services/gate-enhancement-service.js';
import type { TemporaryGateRegistrar } from '../../../gates/services/temporary-gate-registrar.js';
import type { GatesConfig } from '../../../gates/types.js';
import type { ExecutionContext } from '../../context/index.js';
type GatesConfigProvider = () => GatesConfig | undefined;
/**
 * Pipeline Stage 5: Gate Enhancement
 *
 * Thin orchestrator that delegates gate enrichment logic to domain services.
 *
 * Dependencies: context.executionPlan, context.convertedPrompt or context.parsedCommand.steps
 * Output: Enhanced prompts with gate instructions, context.activeGateIds
 * Can Early Exit: No
 */
export declare class GateEnhancementStage extends BasePipelineStage {
    private readonly enhancementService;
    private readonly registrar;
    private readonly gatesConfigProvider;
    readonly name = "GateEnhancement";
    constructor(enhancementService: GateEnhancementService, registrar: TemporaryGateRegistrar, gatesConfigProvider: GatesConfigProvider | undefined, logger: Logger);
    execute(context: ExecutionContext): Promise<void>;
}
export {};
