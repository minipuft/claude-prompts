import { ActionHandler } from '../core/action-handler-base.js';
import type { ToolResponse } from '../../../../shared/types/index.js';
export declare class GuideActionHandler extends ActionHandler {
    execute(args: any): Promise<ToolResponse>;
    private describeStatus;
}
