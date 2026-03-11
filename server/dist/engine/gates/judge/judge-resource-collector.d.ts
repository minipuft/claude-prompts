import type { Logger } from '../../../infra/logging/index.js';
import type { StyleManagerPort } from '../../../shared/types/index.js';
import type { ConvertedPrompt } from '../../execution/types.js';
import type { GateDefinitionProvider } from '../../gates/core/gate-loader.js';
import type { LightweightGateDefinition } from '../../gates/types.js';
/**
 * Collected resources organized by category for the judge menu.
 */
export interface ResourceMenu {
    styles: ConvertedPrompt[];
    frameworks: ConvertedPrompt[];
    gates: LightweightGateDefinition[];
}
/**
 * Provider function to get all converted prompts.
 */
type PromptsProvider = () => ConvertedPrompt[];
/**
 * Provider for framework resources (derived from methodology definitions).
 */
type FrameworkResourceProvider = () => Promise<ConvertedPrompt[]> | ConvertedPrompt[];
/**
 * Collects all available resources from styles, frameworks, and gates
 * for the judge selection menu.
 *
 * Extracted from JudgeSelectionStage (pipeline stage 06a).
 */
export declare class JudgeResourceCollector {
    private readonly promptsProvider;
    private readonly gateLoader;
    private readonly logger;
    private readonly frameworksProvider?;
    private readonly styleManager?;
    constructor(promptsProvider: PromptsProvider | null, gateLoader: GateDefinitionProvider | null, logger: Logger, frameworksProvider?: (FrameworkResourceProvider | null) | undefined, styleManager?: (StyleManagerPort | null) | undefined);
    /**
     * Collect all available resources from styles, frameworks, and gates.
     */
    collectAllResources(): Promise<ResourceMenu>;
    private loadAllStyles;
    private isFrameworkPromptId;
    private collectFrameworkResources;
    private loadAllGates;
}
export {};
