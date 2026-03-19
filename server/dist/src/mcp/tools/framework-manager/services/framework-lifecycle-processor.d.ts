import type { MethodologyValidator } from './methodology-validator.js';
import type { ToolResponse } from '../../../../shared/types/index.js';
import type { FrameworkResourceContext } from '../core/context.js';
import type { FrameworkManagerInput } from '../core/types.js';
export declare class FrameworkLifecycleProcessor {
    private readonly ctx;
    private readonly validationService;
    constructor(ctx: FrameworkResourceContext, validationService: MethodologyValidator);
    handleCreate(args: FrameworkManagerInput): Promise<ToolResponse>;
    handleUpdate(args: FrameworkManagerInput): Promise<ToolResponse>;
    handleDelete(args: FrameworkManagerInput): Promise<ToolResponse>;
    handleReload(args: FrameworkManagerInput): Promise<ToolResponse>;
    handleSwitch(args: FrameworkManagerInput): Promise<ToolResponse>;
    /**
     * Comprehensive existence check across all methodology state sources.
     */
    private checkMethodologyExists;
    /**
     * Atomic methodology creation with rollback on failure.
     */
    private createMethodologyAtomic;
    /**
     * Copy defined optional fields from input to methodology data.
     */
    private assignOptionalFields;
    private success;
    private error;
}
