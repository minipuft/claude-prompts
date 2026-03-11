import { ToolResponse } from '../../../../../shared/types/index.js';
import { PromptResourceContext } from '../core/context.js';
export declare class PromptVersioningProcessor {
    private readonly context;
    private readonly fileOperations;
    private readonly textDiffService;
    constructor(context: PromptResourceContext);
    handleHistory(args: any): Promise<ToolResponse>;
    handleRollback(args: any): Promise<ToolResponse>;
    handleCompare(args: any): Promise<ToolResponse>;
    private getConvertedPrompts;
}
