import type { ToolResponse } from '../../../../shared/types/index.js';
import type { GateResourceContext } from '../core/context.js';
import type { GateManagerInput } from '../core/types.js';
export declare class GateDiscoveryProcessor {
    private readonly ctx;
    constructor(ctx: GateResourceContext);
    handleList(args: GateManagerInput): Promise<ToolResponse>;
    handleInspect(args: GateManagerInput): Promise<ToolResponse>;
    private success;
    private error;
}
