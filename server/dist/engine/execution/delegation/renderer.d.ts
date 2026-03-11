import type { DelegationStrategy } from './strategy.js';
import type { DelegationPayload, ExecutionEnvelope, RenderingHints } from './types.js';
/**
 * Renders delegation CTAs from semantic payload + client strategy.
 *
 * Used by:
 * - ChainOperatorExecutor (full CTA with envelope)
 * - ResponseAssembler (delegation section with envelope)
 */
export declare class DelegationRenderer {
    private readonly strategy;
    constructor(strategy?: DelegationStrategy | ((payload: DelegationPayload) => DelegationStrategy));
    /**
     * Full render: header + optional envelope + instructions + constraints.
     */
    render(payload: DelegationPayload, envelope?: ExecutionEnvelope, hints?: RenderingHints): string;
    private buildHeader;
    private buildEnvelope;
    private buildInstructions;
    private hasContent;
    private resolveStrategy;
}
