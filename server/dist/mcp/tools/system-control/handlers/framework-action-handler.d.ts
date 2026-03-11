import { ActionHandler } from '../core/action-handler-base.js';
import type { ToolResponse } from '../../../../shared/types/index.js';
export declare class FrameworkActionHandler extends ActionHandler {
    execute(args: any): Promise<ToolResponse>;
    private switchFramework;
    private listFrameworks;
    private inspectMethodology;
    private listMethodologiesAction;
    private enableFrameworkSystem;
    private disableFrameworkSystem;
}
