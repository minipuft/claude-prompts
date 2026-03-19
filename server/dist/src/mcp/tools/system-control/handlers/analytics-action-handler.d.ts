import { ActionHandler } from '../core/action-handler-base.js';
import type { ToolResponse } from '../../../../shared/types/index.js';
export declare class AnalyticsActionHandler extends ActionHandler {
    execute(args: any): Promise<ToolResponse>;
    private resetAnalyticsData;
    private resetMetrics;
    private getSwitchHistory;
    private getAnalytics;
}
