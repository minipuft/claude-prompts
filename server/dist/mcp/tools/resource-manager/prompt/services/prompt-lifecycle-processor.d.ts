import { ToolResponse } from '../../../../../shared/types/index.js';
import { PromptResourceContext } from '../core/context.js';
export declare class PromptLifecycleProcessor {
    private readonly context;
    private readonly promptAnalyzer;
    private readonly comparisonEngine;
    private readonly textDiffService;
    private readonly fileOperations;
    constructor(context: PromptResourceContext);
    createPrompt(args: any): Promise<ToolResponse>;
    updatePrompt(args: any): Promise<ToolResponse>;
    deletePrompt(args: any): Promise<ToolResponse>;
    private handleSystemRefresh;
    private findPromptDependencies;
    private getConvertedPrompts;
    private getPromptsData;
}
