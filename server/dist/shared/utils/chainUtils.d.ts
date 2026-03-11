/**
 * Chain Utility Functions
 *
 * Provides helper functions for chain detection and validation.
 * MIGRATION: Simplified to support only markdown-embedded chains.
 * Modular chain functions are deprecated but maintained for compatibility.
 *
 *  of Chain System Migration (2025-01-30)
 */
export declare function normalizeChainId(chainId: string): string;
/**
 * ChainStep interface for utility functions
 */
export interface ChainStep {
    promptId: string;
    stepName: string;
    executionType?: 'single' | 'chain';
    inputMapping?: Record<string, string>;
    outputMapping?: Record<string, string>;
    dependencies?: string[];
}
/** Minimal interface for chain detection — avoids importing full ConvertedPrompt from engine/. */
interface ChainablePrompt {
    chainSteps?: ChainStep[];
}
/**
 * Determines if a prompt is a chain based on the presence of chain steps
 * Replaces the redundant isChain boolean property
 */
export declare function isChainPrompt(prompt: ChainablePrompt): boolean;
/**
 * Get the number of steps in a chain prompt
 */
export declare function getChainStepCount(prompt: ChainablePrompt): number;
/**
 * Validate that chain steps are properly formed
 */
export declare function validateChainSteps(steps: ChainStep[]): boolean;
/**
 * Check if a prompt has valid chain steps
 * Combines presence check with validation
 */
export declare function hasValidChainSteps(prompt: ChainablePrompt): boolean;
/**
 * Get chain information summary for a prompt
 */
export declare function getChainInfo(prompt: ChainablePrompt): {
    isChain: boolean;
    stepCount: number;
    isValid: boolean;
};
/**
 * Check if a prompt is a chain with valid steps (replaces legacy isMonolithicChain)
 */
export declare function isValidChain(prompt: ChainablePrompt): boolean;
export {};
