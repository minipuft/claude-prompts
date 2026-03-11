import { ActionHandler } from '../core/action-handler-base.js';
import type { ToolResponse } from '../../../../shared/types/index.js';
export declare class StatusActionHandler extends ActionHandler {
    execute(args: any): Promise<ToolResponse>;
    private getSystemStatus;
    private getSystemHealthStatus;
    private getSystemDiagnostics;
    private getFrameworkStatus;
}
