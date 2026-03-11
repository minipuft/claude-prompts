import { ActionHandler } from '../core/action-handler-base.js';
import type { ToolResponse } from '../../../../shared/types/index.js';
export declare class GateActionHandler extends ActionHandler {
    execute(args: any): Promise<ToolResponse>;
    private enableGateSystem;
    private disableGateSystem;
    private getGateSystemStatus;
    private getGateSystemHealth;
    private listAvailableGates;
}
