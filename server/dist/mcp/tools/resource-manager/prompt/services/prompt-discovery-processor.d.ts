import { ToolResponse } from '../../../../../shared/types/index.js';
import { PromptResourceContext } from '../core/context.js';
export declare class PromptDiscoveryProcessor {
    private readonly context;
    private readonly promptAnalyzer;
    private readonly gateAnalyzer;
    private readonly filterParser;
    private readonly promptMatcher;
    constructor(context: PromptResourceContext);
    listPrompts(args: any): Promise<ToolResponse>;
    analyzePromptType(args: any): Promise<ToolResponse>;
    inspectPrompt(args: any): Promise<ToolResponse>;
    analyzePromptGates(args: any): Promise<ToolResponse>;
    guidePromptActions(args: any): Promise<ToolResponse>;
    private rankActionsForGuide;
    private computeGuideScore;
    private formatActionSummary;
    private describeActionStatus;
    private getExecutionTypeIcon;
    private getConvertedPrompts;
}
