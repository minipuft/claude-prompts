export interface ToolParameter {
    name: string;
    type: string;
    description: string;
    status: 'working' | 'needs-validation' | 'deprecated' | 'hidden' | 'experimental';
    required?: boolean;
    default?: unknown;
    compatibility: 'canonical' | 'deprecated' | 'legacy';
    examples?: string[];
    notes?: string[];
    enum?: string[];
    includeInDescription?: boolean;
}
export interface ToolCommand {
    id: string;
    summary: string;
    parameters?: string[];
    status: 'working' | 'needs-validation' | 'deprecated' | 'hidden' | 'experimental';
    notes?: string[];
}
export type skills_syncParamName = 'action' | 'client' | 'scope' | 'resource_type' | 'id' | 'prune' | 'dry_run' | 'output' | 'file' | 'category' | 'preview' | 'force';
export declare const skills_syncParameters: ToolParameter[];
export declare const skills_syncCommands: ToolCommand[];
export declare const skills_syncMetadata: {
    tool: string;
    version: number;
};
