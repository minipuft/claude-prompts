import { ActionHandler } from '../core/action-handler-base.js';
import type { ToolResponse } from '../../../../shared/types/index.js';
export declare class SessionActionHandler extends ActionHandler {
    execute(args: any): Promise<ToolResponse>;
    private listSessions;
    private clearSession;
    private inspectSession;
}
