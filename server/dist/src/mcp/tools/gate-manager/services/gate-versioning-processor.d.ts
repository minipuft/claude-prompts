import type { ToolResponse } from '../../../../shared/types/index.js';
import type { GateResourceContext } from '../core/context.js';
import type { GateManagerInput } from '../core/types.js';
export declare class GateVersioningProcessor {
    private readonly ctx;
    constructor(ctx: GateResourceContext);
    handleHistory(args: GateManagerInput): Promise<ToolResponse>;
    handleRollback(args: GateManagerInput): Promise<ToolResponse>;
    handleCompare(args: GateManagerInput): Promise<ToolResponse>;
    private success;
    private error;
}
