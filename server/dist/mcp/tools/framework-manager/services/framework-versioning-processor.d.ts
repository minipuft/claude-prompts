import type { ToolResponse } from '../../../../shared/types/index.js';
import type { FrameworkResourceContext } from '../core/context.js';
import type { FrameworkManagerInput } from '../core/types.js';
export declare class FrameworkVersioningProcessor {
    private readonly ctx;
    constructor(ctx: FrameworkResourceContext);
    handleHistory(args: FrameworkManagerInput): Promise<ToolResponse>;
    handleRollback(args: FrameworkManagerInput): Promise<ToolResponse>;
    handleCompare(args: FrameworkManagerInput): Promise<ToolResponse>;
    private success;
    private error;
}
