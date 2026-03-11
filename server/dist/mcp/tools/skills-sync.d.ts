import { type ResourceType } from '../../modules/skills-sync/service.js';
import type { DatabasePort, Logger, ToolResponse } from '../../shared/types/index.js';
declare const SKILLS_SYNC_ACTIONS: readonly ["status", "export", "sync", "diff", "pull", "clone"];
type SkillsSyncAction = (typeof SKILLS_SYNC_ACTIONS)[number];
export interface SkillsSyncInput {
    action: SkillsSyncAction;
    client?: string;
    scope?: 'user' | 'project';
    resource_type?: ResourceType;
    id?: string;
    prune?: boolean;
    dry_run?: boolean;
    output?: string;
    file?: string;
    category?: string;
    preview?: boolean;
    force?: boolean;
}
export declare class ConsolidatedSkillsSync {
    private readonly logger;
    private readonly dbManager?;
    constructor(logger: Logger, dbManager?: DatabasePort | undefined);
    handleAction(args: SkillsSyncInput): Promise<ToolResponse>;
    private getStatus;
    private executeSkillsSyncAction;
}
export declare function createConsolidatedSkillsSync(logger: Logger, dbManager?: DatabasePort): ConsolidatedSkillsSync;
export {};
