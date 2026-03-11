/**
 * Workspace initialization — extracted from server/src/index.ts.
 *
 * Pure function using only node:fs and node:path.
 * No runtime, config, or logging dependencies.
 */
export type StarterPrompt = {
    id: string;
    category: string;
    description: string;
    userMessageTemplate: string;
    arguments: Array<{
        name: string;
        type: 'string';
        description: string;
    }>;
};
export type WorkspaceInitResult = {
    success: boolean;
    message: string;
};
export declare const STARTER_PROMPTS: StarterPrompt[];
export declare function formatStarterPromptYaml(prompt: StarterPrompt): string;
/**
 * Initialize a new workspace with starter prompts.
 */
export declare function initWorkspace(targetPath: string): WorkspaceInitResult;
