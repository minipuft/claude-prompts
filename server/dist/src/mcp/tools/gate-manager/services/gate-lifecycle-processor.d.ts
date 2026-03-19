import type { ToolResponse } from '../../../../shared/types/index.js';
import type { GateResourceContext } from '../core/context.js';
import type { GateManagerInput } from '../core/types.js';
export declare class GateLifecycleProcessor {
    private readonly ctx;
    constructor(ctx: GateResourceContext);
    handleCreate(args: GateManagerInput): Promise<ToolResponse>;
    handleUpdate(args: GateManagerInput): Promise<ToolResponse>;
    handleDelete(args: GateManagerInput): Promise<ToolResponse>;
    handleReload(args: GateManagerInput): Promise<ToolResponse>;
    private trackChange;
    private success;
    private error;
}
