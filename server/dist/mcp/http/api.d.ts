/**
 * API Management Module
 * Handles Express app setup, middleware, and REST API endpoints
 */
import express from 'express';
import { PromptAssetManager } from '../../modules/prompts/index.js';
import { McpToolRouter } from '../tools/index.js';
import type { Category, PromptData } from '../../modules/prompts/types.js';
import type { ConfigManager, Logger } from '../../shared/types/index.js';
/**
 * API Manager class
 */
export declare class ApiRouter {
    private logger;
    private configManager;
    private promptManager;
    private mcpToolsManager;
    private promptsData;
    private categories;
    private convertedPrompts;
    constructor(logger: Logger, configManager: ConfigManager, promptManager?: PromptAssetManager, mcpToolsManager?: McpToolRouter);
    /**
     * Update data references
     */
    updateData(promptsData: PromptData[], categories: Category[], convertedPrompts: any[]): void;
    /**
     * Create and configure Express application
     */
    createApp(): express.Application;
    /**
     * Setup Express middleware
     */
    private setupMiddleware;
    /**
     * Setup API routes
     */
    private setupRoutes;
    /**
     * Setup basic routes (home, health)
     */
    private setupBasicRoutes;
    /**
     * Setup prompt and category routes
     */
    private setupPromptRoutes;
    /**
     * Setup tool API routes
     */
    private setupToolRoutes;
    /**
     * Handle create category API endpoint
     */
    private handleCreateCategory;
    /**
     * Handle update prompt API endpoint
     */
    private handleUpdatePrompt;
    /**
     * Handle delete prompt API endpoint
     */
    private handleDeletePrompt;
    /**
     * Handle reload prompts API endpoint
     */
    private handleReloadPrompts;
    /**
     * Helper method to reload prompt data
     */
    private reloadPromptData;
    private runResourceManagerAction;
    private extractToolResponseMessage;
}
/**
 * Create and configure an API manager
 */
export declare function createApiRouter(logger: Logger, configManager: ConfigManager, promptManager?: PromptAssetManager, mcpToolsManager?: McpToolRouter): ApiRouter;
