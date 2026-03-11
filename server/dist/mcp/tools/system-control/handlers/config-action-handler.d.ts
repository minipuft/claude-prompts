import { ActionHandler } from '../core/action-handler-base.js';
import type { ToolResponse } from '../../../../shared/types/index.js';
export declare class ConfigActionHandler extends ActionHandler {
    execute(args: any): Promise<ToolResponse>;
    private restoreConfig;
    private manageConfig;
    private handleConfigList;
    private handleConfigGet;
    private handleConfigSet;
    private handleConfigValidate;
}
