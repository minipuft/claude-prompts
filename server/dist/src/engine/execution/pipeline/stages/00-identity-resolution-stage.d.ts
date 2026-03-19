import { BasePipelineStage } from '../stage.js';
import type { Logger } from '../../../../infra/logging/index.js';
import type { RequestIdentityResolverOptions } from '../../../../shared/utils/request-identity-resolver.js';
import type { ExecutionContext } from '../../context/index.js';
/**
 * Pipeline Stage: Identity Resolution
 *
 * Reads the MCP SDK `extra` payload from the request and resolves
 * workspace/organization identity. Populates `context.state.identity`
 * with the resolved scope for downstream state store isolation.
 *
 * Runs between ExecutionLifecycleStage (00.3) and CommandParsingStage (01).
 */
export declare class IdentityResolutionStage extends BasePipelineStage {
    private readonly identityOptionsProvider;
    readonly name = "IdentityResolution";
    constructor(identityOptionsProvider: () => RequestIdentityResolverOptions | null, logger: Logger);
    execute(context: ExecutionContext): Promise<void>;
}
