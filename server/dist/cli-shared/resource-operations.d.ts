/**
 * Structural mutation operations for existing resources.
 *
 * Separate from resource-scaffold.ts (which handles creation/deletion).
 * These functions modify existing resources: rename, move, toggle, link-gate.
 *
 * Comment-preservation strategy:
 *   - rename, move, toggle: regex replacement on raw file content (preserves all YAML comments)
 *   - linkGate: full parse→serialize (comments lost, but user is adding structural content)
 *
 * Pure functions using only node:fs and node:path + cli-shared YAML utils.
 */
import { type ResourceValidationResult, type ResourceValidationType } from './resource-validation.js';
export interface RenameResult {
    success: boolean;
    oldDir?: string;
    newDir?: string;
    error?: string;
}
export interface MoveResult {
    success: boolean;
    oldDir?: string;
    newDir?: string;
    oldCategory?: string;
    error?: string;
}
export interface ToggleResult {
    success: boolean;
    previousValue?: boolean;
    newValue?: boolean;
    error?: string;
}
export interface LinkGateResult {
    success: boolean;
    action?: 'added' | 'removed';
    include?: string[];
    error?: string;
}
export interface ResourceMutationResult {
    success: boolean;
    oldDir?: string;
    newDir?: string;
    error?: string;
}
export interface ValidatedMutationOptions<TMutation extends ResourceMutationResult> {
    resourceType: ResourceValidationType;
    resourceId: string;
    resourceDir: string;
    entryFile: string;
    mutate: () => TMutation;
    validate?: boolean;
    validator?: (resourceType: ResourceValidationType, resourceId: string, filePath: string) => ResourceValidationResult;
}
export interface ValidatedMutationResult<TMutation extends ResourceMutationResult> {
    success: boolean;
    operation: TMutation;
    validation?: ResourceValidationResult;
    rolledBack?: boolean;
    error?: string;
}
export declare function runValidatedMutation<TMutation extends ResourceMutationResult>(options: ValidatedMutationOptions<TMutation>): ValidatedMutationResult<TMutation>;
/**
 * Rename a resource: update `id:` field in YAML, rename directory, update history.
 * Uses string replacement to preserve YAML comments.
 */
export declare function renameResource(resourceDir: string, entryFile: string, oldId: string, newId: string): RenameResult;
/**
 * Move a prompt to a different category: update `category:` field, relocate directory.
 * Uses string replacement to preserve YAML comments.
 */
export declare function movePromptCategory(resourceDir: string, entryFile: string, promptId: string, newCategory: string, promptsBaseDir: string): MoveResult;
/**
 * Flip the `enabled:` field in a resource YAML (true↔false).
 * Uses string replacement to preserve YAML comments.
 */
export declare function toggleEnabled(resourceDir: string, entryFile: string): ToggleResult;
/**
 * Add or remove a gate from a prompt's gateConfiguration.include array.
 * Uses full parse→serialize (comments are lost, but structural edits justify reformatting).
 */
export declare function linkGate(resourceDir: string, entryFile: string, gateId: string, remove?: boolean): LinkGateResult;
