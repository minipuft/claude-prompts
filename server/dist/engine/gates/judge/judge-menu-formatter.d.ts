import type { ResourceMenu } from './judge-resource-collector.js';
import type { Logger } from '../../../infra/logging/index.js';
import type { ToolResponse } from '../../../shared/types/index.js';
import type { ExecutionContext } from '../../execution/context/index.js';
/** Narrow type for methodology judge prompt data — avoids frameworks/ import. */
export interface JudgePromptData {
    systemMessage?: string;
    userMessageTemplate?: string;
}
/** Provider that resolves a methodology's judge prompt by framework ID. */
export type MethodologyJudgePromptProvider = (frameworkId: string) => JudgePromptData | undefined;
/**
 * Context about operators already specified in the command.
 */
export interface OperatorContext {
    hasFrameworkOperator: boolean;
    frameworkId?: string;
    hasInlineGates: boolean;
    inlineGateIds: string[];
    hasStyleSelector: boolean;
    styleId?: string;
}
/**
 * Formats collected resources as structured menus and builds judge responses
 * for the two-phase client-driven selection flow.
 *
 * Extracted from JudgeSelectionStage (pipeline stage 06a).
 */
export declare class JudgeMenuFormatter {
    private readonly logger;
    private readonly judgePromptProvider?;
    constructor(logger: Logger, judgePromptProvider?: (MethodologyJudgePromptProvider | null) | undefined);
    /**
     * Build the complete judge response with resource menu and selection instructions.
     */
    buildJudgeResponse(resources: ResourceMenu, context: ExecutionContext): ToolResponse;
    /**
     * Extract operator context from the parsed command.
     */
    getOperatorContext(context: ExecutionContext): OperatorContext;
    /**
     * Format collected resources as a structured menu for Claude.
     */
    formatResourceMenuForClaude(resources: ResourceMenu, operatorContext: OperatorContext): string;
    private buildOperatorContextHeader;
    private getCleanCommandForDisplay;
    private getActiveMethodologyJudgePrompt;
}
