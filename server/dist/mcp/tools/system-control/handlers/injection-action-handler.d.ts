import { ActionHandler } from '../core/action-handler-base.js';
import type { ToolResponse } from '../../../../shared/types/index.js';
export declare class InjectionActionHandler extends ActionHandler {
    execute(args: any): Promise<ToolResponse>;
    private getInjectionStatus;
    private setInjectionOverride;
    private resetInjectionOverrides;
}
