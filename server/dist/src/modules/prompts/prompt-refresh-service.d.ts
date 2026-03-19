import type { PromptAssetManager } from './index.js';
import type { Category, PromptData } from './types.js';
import type { ConvertedPrompt } from '../../engine/execution/types.js';
import type { ConfigManager } from '../../shared/types/index.js';
/**
 * Minimal interface for consumers that receive prompt data updates.
 * Decouples modules/ from mcp/ layer — McpToolsManager satisfies this structurally.
 */
interface PromptDataConsumer {
    updateData(promptsData: PromptData[], convertedPrompts: ConvertedPrompt[], categories: Category[]): void;
}
export interface PromptReloadResult {
    promptsData: PromptData[];
    categories: Category[];
    convertedPrompts: ConvertedPrompt[];
    promptsFilePath: string;
}
interface PromptReloadOptions {
    configManager: ConfigManager;
    promptManager: PromptAssetManager;
    mcpToolsManager?: PromptDataConsumer;
    promptsFileOverride?: string;
}
/**
 * Reload prompts from disk, synchronizing downstream managers (PromptAssetManager,
 * MCP tools, API caches) so every transport observes the same prompt metadata.
 */
export declare function reloadPromptData(options: PromptReloadOptions): Promise<PromptReloadResult>;
export {};
