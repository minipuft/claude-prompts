/**
 * Resource directory scaffolding for CLI create/delete operations.
 *
 * Pure functions using only node:fs and node:path.
 * Follows workspace-init.ts pattern.
 */
import { type ResourceValidationResult } from './resource-validation.js';
type ResourceType = 'prompts' | 'gates' | 'methodologies' | 'styles';
export interface CreateResourceOptions {
    name?: string;
    description?: string;
    category?: string;
    validate?: boolean;
}
export interface CreateResourceResult {
    success: boolean;
    path?: string;
    error?: string;
    validation?: ResourceValidationResult;
    rolledBack?: boolean;
}
/**
 * Check if a resource already exists at the expected path.
 */
export declare function resourceExists(baseDir: string, type: ResourceType, id: string, category?: string): boolean;
/**
 * Create a resource directory with template YAML and companion file.
 */
export declare function createResourceDir(baseDir: string, type: ResourceType, id: string, opts?: CreateResourceOptions): CreateResourceResult;
/**
 * Delete a resource directory and its version history.
 */
export declare function deleteResourceDir(resourceDir: string): {
    success: boolean;
    error?: string;
};
export {};
