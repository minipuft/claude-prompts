import type { MethodologyValidator } from './methodology-validator.js';
import type { ToolResponse } from '../../../../shared/types/index.js';
import type { FrameworkResourceContext } from '../core/context.js';
import type { FrameworkManagerInput } from '../core/types.js';
export declare class FrameworkDiscoveryProcessor {
    private readonly ctx;
    private readonly validationService;
    constructor(ctx: FrameworkResourceContext, validationService: MethodologyValidator);
    handleList(args: FrameworkManagerInput): Promise<ToolResponse>;
    handleInspect(args: FrameworkManagerInput): Promise<ToolResponse>;
    private success;
    private error;
}
