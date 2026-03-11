import { BasePipelineStage } from '../stage.js';
import type { Logger } from '../../../../infra/logging/index.js';
import type { GatesConfig } from '../../../../shared/types/core-config.js';
import type { ChainSessionService } from '../../../../shared/types/index.js';
import type { GateDefinitionProvider } from '../../../gates/core/gate-loader.js';
import type { ExecutionContext } from '../../context/index.js';
import type { ChainOperatorExecutor } from '../../operators/chain-operator-executor.js';
type GatesConfigProvider = () => GatesConfig | undefined;
/**
 * Pipeline Stage: Gate Review Rendering
 *
 * Renders synthetic gate review steps when a session has a pending review.
 * When gates have `shell_verify` criteria, runs actual commands and enriches
 * the review feedback with real output (test failures, lint errors).
 */
export declare class GateReviewStage extends BasePipelineStage {
    private readonly chainOperatorExecutor;
    private readonly chainSessionManager;
    private readonly gateDefinitionProvider;
    private readonly gatesConfigProvider?;
    readonly name = "GateReview";
    constructor(chainOperatorExecutor: ChainOperatorExecutor, chainSessionManager: ChainSessionService, gateDefinitionProvider: GateDefinitionProvider | null, logger: Logger, gatesConfigProvider?: GatesConfigProvider | undefined);
    execute(context: ExecutionContext): Promise<void>;
}
export {};
