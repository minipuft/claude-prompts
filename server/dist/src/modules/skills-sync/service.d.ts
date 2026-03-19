import type { DatabasePort } from '../../shared/types/persistence.js';
export type ResourceType = 'prompt' | 'gate' | 'methodology' | 'style';
export interface SkillsSyncOptions {
    command: string;
    client?: string;
    scope?: 'user' | 'project';
    resourceType?: ResourceType;
    id?: string;
    prune?: boolean;
    dryRun?: boolean;
    output?: string;
    file?: string;
    category?: string;
    preview?: boolean;
    force?: boolean;
    json?: boolean;
    verbose?: boolean;
    dbManager?: DatabasePort;
}
export interface SkillsSyncOutput {
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
}
export declare class SkillsSyncCommandError extends Error {
    readonly exitCode: 1 | 2;
    constructor(message: string, exitCode?: 1 | 2);
}
/** Detect Nunjucks control flow syntax ({% if %}, {% for %}, etc.) in content. */
declare function hasNunjucksControlFlow(content: string): boolean;
interface ParsedArgument {
    index: number;
    name: string;
    required: boolean;
    description: string;
}
interface ParsedSkillMd {
    format: 'claude-code' | 'agent-skills';
    frontmatter: Record<string, unknown>;
    sections: Map<string, string>;
    name: string;
    description: string;
    systemMessage: string | null;
    userMessage: string | null;
    guidanceContent: string | null;
    arguments: ParsedArgument[];
    qualityGates: Array<{
        id: string;
        source: string;
    }>;
    chainResources: Array<{
        stepId: string;
        promptId: string;
    }>;
}
/**
 * Parses a SKILL.md file into structured sections.
 * Detects claude-code vs agent-skills format from frontmatter.
 */
declare function parseSkillMd(content: string): ParsedSkillMd;
export declare function parseSkillsSyncArgs(argv: string[]): SkillsSyncOptions;
export declare function printSkillsSyncHelp(): void;
export declare function runSkillsSyncCommand(opts: SkillsSyncOptions, output?: SkillsSyncOutput): Promise<void>;
export declare function runSkillsSyncFromArgv(argv: string[]): Promise<void>;
export declare function listSupportedSkillsSyncClients(): string[];
export declare function getSkillsSyncConfigPath(): string;
export { parseSkillMd, hasNunjucksControlFlow };
export type { ParsedSkillMd };
