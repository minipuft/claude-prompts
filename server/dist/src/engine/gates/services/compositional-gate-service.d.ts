import type { GateService, GateEnhancementResult, GateServiceConfig } from './gate-service-interface.js';
import type { Logger } from '../../../infra/logging/index.js';
import type { ConvertedPrompt } from '../../execution/types.js';
import type { GateContext } from '../core/gate-definitions.js';
import type { GateGuidanceRenderer } from '../guidance/GateGuidanceRenderer.js';
/**
 * Compositional Gate Service - Template rendering only (no server-side validation)
 *
 * Simplified to use GateGuidanceRenderer directly, removing the unnecessary
 * GateInstructionInjector abstraction layer.
 */
export declare class CompositionalGateService implements GateService {
    readonly serviceType: "compositional";
    private readonly logger;
    private readonly gateGuidanceRenderer;
    private config;
    constructor(logger: Logger, gateGuidanceRenderer: GateGuidanceRenderer, config?: Partial<GateServiceConfig>);
    enhancePrompt(prompt: ConvertedPrompt, gateIds: string[], context: GateContext): Promise<GateEnhancementResult>;
    supportsValidation(): boolean;
    updateConfig(config: Partial<GateServiceConfig>): void;
}
