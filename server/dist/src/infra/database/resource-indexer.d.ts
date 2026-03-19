/**
 * Resource Indexer
 *
 * Synchronizes file-based resources (prompts, gates, methodologies, styles, tools)
 * to the SQLite resource_index table for queryable lookups.
 *
 * Architecture:
 * ```
 * YAML/MD Files                SQLite resource_index
 * ┌──────────────┐    sync    ┌───────────────────────┐
 * │ prompts/     │ ────────▶  │ id, type, name,       │
 * │ gates/       │            │ category, description,│
 * │ methodologies│            │ content_hash,         │
 * │ styles/      │            │ file_path,            │
 * │ tools (nested)│           │ metadata_json,        │
 * └──────────────┘            │ keywords, indexed_at  │
 *                             └───────────────────────┘
 * ```
 *
 * Key Features:
 * - Incremental sync via content hash comparison
 * - Detects additions, modifications, and removals
 * - Supports full and partial reindex
 * - Tenant-aware for multi-tenant deployments
 * - Tool indexing: discovers script tools nested in prompt directories
 */
/** Injected tool loader — avoids direct import from modules layer. */
export type ToolLoaderFn = (promptDir: string, promptId: string) => LoadedScriptTool[];
import type { LoadedScriptTool } from '../../shared/types/automation.js';
import type { DatabasePort, ToolIndexEntry } from '../../shared/types/persistence.js';
import type { Logger } from '../logging/index.js';
/**
 * Resource types supported by the indexer
 */
export type IndexedResourceType = 'prompt' | 'gate' | 'methodology' | 'style' | 'tool';
/**
 * Indexed resource entry from SQLite
 */
export interface IndexedResource {
    id: string;
    type: IndexedResourceType;
    name: string | null;
    category: string | null;
    description: string | null;
    content_hash: string | null;
    file_path: string | null;
    metadata_json: string | null;
    keywords: string | null;
    indexed_at: string;
}
export type { ToolIndexEntry } from '../../shared/types/persistence.js';
/**
 * Sync result statistics
 */
export interface SyncResult {
    added: number;
    modified: number;
    removed: number;
    unchanged: number;
    errors: number;
}
/**
 * Configuration for the resource indexer
 */
export interface ResourceIndexerConfig {
    /** Path to the resources directory */
    resourcesDir: string;
    /** Whether to track prompts */
    trackPrompts?: boolean;
    /** Whether to track gates */
    trackGates?: boolean;
    /** Whether to track methodologies */
    trackMethodologies?: boolean;
    /** Whether to track styles */
    trackStyles?: boolean;
    /** Whether to track script tools (nested in prompts) */
    trackTools?: boolean;
    /** Injected tool loader for discovering script tools in prompt directories */
    toolLoader?: ToolLoaderFn;
}
/**
 * ResourceIndexer class
 *
 * Synchronizes file-based resources to SQLite for queryable lookups.
 */
export declare class ResourceIndexer {
    private readonly db;
    private readonly logger;
    private readonly config;
    private readonly toolLoader?;
    constructor(db: DatabasePort, logger: Logger, config: ResourceIndexerConfig);
    /**
     * Perform a full sync of all resource types
     */
    syncAll(): Promise<SyncResult>;
    /**
     * Sync a specific resource type
     */
    syncResourceType(type: IndexedResourceType, subdir: string): Promise<SyncResult>;
    /**
     * Scan a directory for resources.
     * Handles both flat layouts (gates/{id}/gate.yaml) and nested
     * category layouts (prompts/{category}/{id}/prompt.yaml).
     */
    private scanResources;
    /**
     * Scan a category subdirectory for resources one level deeper.
     * Called when the flat scan doesn't find a YAML file (e.g., prompts/{category}/).
     */
    private scanCategoryDir;
    /**
     * Get the YAML file name for a resource type
     */
    private getYamlFileName;
    /**
     * Index a new resource
     */
    private indexResource;
    /**
     * Update an existing resource
     */
    private updateResource;
    /**
     * Remove a resource from the index
     */
    private removeResource;
    /**
     * Query resources by type
     */
    queryByType(type: IndexedResourceType): IndexedResource[];
    /**
     * Query resources by category
     */
    queryByCategory(type: IndexedResourceType, category: string): IndexedResource[];
    /**
     * Search resources with relevance-ranked results.
     *
     * Uses SQL LIKE for candidate retrieval then application-level scoring
     * with weighted field matching (name > keywords > description > id).
     */
    search(query: string, type?: IndexedResourceType): IndexedResource[];
    /**
     * Fetch broad candidate set via SQL LIKE matching.
     * Splits multi-token queries into per-token OR conditions
     * so each word is matched independently (scoring handles ranking).
     */
    private fetchCandidates;
    /**
     * Get a specific resource by ID and type
     */
    getResource(type: IndexedResourceType, id: string): IndexedResource | null;
    /**
     * Get index statistics
     */
    getStats(): Record<IndexedResourceType, number>;
    /**
     * Get valid style IDs from the index.
     * Replaces directory-scanning _meta.valid_styles from cache files.
     */
    getValidStyles(): string[];
    /**
     * Get valid framework/methodology IDs from the index.
     * Replaces directory-scanning _meta.valid_frameworks from cache files.
     */
    getValidFrameworks(): string[];
    /**
     * Sync script tools from prompt directories.
     *
     * Tools are nested inside prompts: prompts/{category}/{id}/tools/{toolId}/
     * Uses injected tool loader to discover and parse tool definitions.
     * Indexes each tool as type='tool' with composite id: `{promptId}/{toolId}`.
     */
    syncTools(): Promise<SyncResult>;
    private upsertToolEntry;
    /**
     * Query tools in the keyed Record format expected by skills-sync.
     * Returns Record<string, ToolIndexEntry> keyed by `{promptId}/{toolId}`.
     */
    queryTools(): Record<string, ToolIndexEntry>;
    /**
     * Clear all indexed resources (for testing or reset)
     */
    clear(): void;
}
/**
 * Factory function to create a ResourceIndexer instance
 */
export declare function createResourceIndexer(db: DatabasePort, logger: Logger, config: ResourceIndexerConfig): ResourceIndexer;
