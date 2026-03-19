/**
 * Prompt Registry Module
 * Handles registering prompts with MCP server using proper MCP protocol and managing conversation history
 */
import { type ConfigManager, type Logger } from '../../shared/types/index.js';
import { ConversationStore } from '../text-refs/conversation.js';
import type { ConvertedPrompt } from '../../engine/execution/types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Prompt Registry class
 */
type PromptRegistryServer = Pick<McpServer, 'registerPrompt'> & {
    notification?: (notification: {
        method: string;
        params?: unknown;
    }) => void;
};
export declare class PromptRegistry {
    private logger;
    private mcpServer;
    private configManager;
    private conversationStore;
    private registeredPromptIds;
    private exportedPromptIds;
    /**
     * Direct template processing method (minimal implementation)
     * Replaces templateProcessor calls for basic template processing
     */
    private processTemplateDirect;
    constructor(logger: Logger, mcpServer: PromptRegistryServer, configManager: ConfigManager, conversationStore: ConversationStore);
    /**
     * Set prompt IDs that have been exported as client skills via skills-sync.
     * Exported prompts are auto-deregistered from MCP to avoid duplication.
     * Format: "category/id" (e.g., "development/review")
     */
    setExportedPromptIds(ids: Set<string>): void;
    /**
     * Register individual prompts using MCP SDK registerPrompt API
     * This implements the standard MCP prompts protocol using the high-level API
     */
    private registerIndividualPrompts;
    /**
     * Execute prompt logic (extracted from createPromptHandler for MCP protocol)
     */
    private executePromptLogic;
    /**
     * Register all prompts with the MCP server using proper MCP protocol
     */
    registerAllPrompts(prompts: ConvertedPrompt[]): Promise<number>;
    /**
     * Send list_changed notification to clients (for hot-reload)
     * This is the proper MCP way to notify clients about prompt updates
     */
    notifyPromptsListChanged(): Promise<void>;
    /**
     * Execute a prompt directly (for testing or internal use)
     */
    executePromptDirectly(promptId: string, args: Record<string, string>, prompts: ConvertedPrompt[]): Promise<string>;
    /**
     * Get registration statistics
     */
    getRegistrationStats(prompts: ConvertedPrompt[]): {
        totalPrompts: number;
        chainPrompts: number;
        regularPrompts: number;
        categoriesCount: number;
        averageArgumentsPerPrompt: number;
    };
}
export {};
