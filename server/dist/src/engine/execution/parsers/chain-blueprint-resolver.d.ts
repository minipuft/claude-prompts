import type { Logger } from '../../../infra/logging/index.js';
import type { ChainSessionService } from '../../../shared/types/index.js';
import type { ExecutionContext } from '../context/index.js';
/**
 * Resolves stored chain blueprints for response-only mode.
 *
 * When a chain session resumes without a command (user_response only),
 * the blueprint is restored from the session store so downstream stages
 * see the same parsedCommand/executionPlan as the original invocation.
 *
 * Extracted from CommandParsingStage (pipeline stage 01).
 */
export declare class ChainBlueprintResolver {
    private readonly chainSessionManager;
    constructor(chainSessionManager: ChainSessionService, _logger: Logger);
    /**
     * Restore parsedCommand + executionPlan from a stored session blueprint.
     *
     * Looks up blueprint by sessionId first, then falls back to chain_id lookup.
     * Deep-clones all restored data to prevent cross-request mutation.
     */
    restoreFromBlueprint(context: ExecutionContext): void;
    private cloneParsedCommand;
    private cloneExecutionPlan;
    private cloneBlueprint;
}
