import { ChainManagementCommand } from './types.js';
import { LightweightGateSystem } from '../../../../engine/gates/core/index.js';
import { ToolResponse } from '../../../../shared/types/index.js';
import { ResponseFormatter } from '../processors/response-formatter.js';
import type { ConvertedPrompt } from '../../../../engine/execution/types.js';
import type { ChainSessionService, ChainSessionRouterPort, StateStoreOptions } from '../../../../shared/types/index.js';
/**
 * Detects whether an incoming command is a chain management operation.
 */
export declare function detectChainManagementCommand(command: string): ChainManagementCommand | null;
/**
 * Chain management handler that surfaces session-aware data.
 */
export declare class ChainSessionRouter implements ChainSessionRouterPort {
    private readonly sessionManager;
    private readonly responseFormatter;
    private readonly gateSystem;
    private promptLookup;
    constructor(initialPrompts: ConvertedPrompt[], sessionManager: ChainSessionService, responseFormatter: ResponseFormatter, gateSystem: LightweightGateSystem);
    updatePrompts(prompts: ConvertedPrompt[]): void;
    tryHandleCommand(command: string, scope?: StateStoreOptions): Promise<ToolResponse | null>;
    private handleValidate;
    private handleList;
    private handleGates;
    private findPrompt;
    private buildPromptGateSummary;
    private buildSessionGateSummary;
}
