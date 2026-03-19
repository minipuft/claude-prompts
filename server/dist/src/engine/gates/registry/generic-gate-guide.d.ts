/**
 * Generic Gate Guide
 *
 * Data-driven implementation of GateGuide that works with any gate definition.
 * All behavior is driven by the YAML definition, not hardcoded logic.
 *
 * This mirrors the GenericMethodologyGuide pattern from the framework system.
 *
 * @see GenericMethodologyGuide for the pattern this follows
 */
import type { GateGuide, GateDefinitionYaml, GateActivationRules, GateActivationContext, GateRetryConfig } from '../types/index.js';
import type { GatePassCriteria, GateSeverity, GateEnforcementMode } from '../types.js';
/**
 * Generic Gate Guide
 *
 * Implements GateGuide interface using data from YAML definitions.
 * All behavior is driven by the definition, making it easy to add
 * new gates without writing code.
 *
 * @example
 * ```typescript
 * const definition = loader.loadGate('code-quality');
 * const guide = new GenericGateGuide(definition);
 *
 * if (guide.isActive({ promptCategory: 'code' })) {
 *   console.log(guide.getGuidance());
 * }
 * ```
 */
export declare class GenericGateGuide implements GateGuide {
    readonly gateId: string;
    readonly name: string;
    readonly type: 'validation' | 'guidance';
    readonly severity: GateSeverity;
    readonly enforcementMode: GateEnforcementMode;
    readonly gateType: 'framework' | 'category' | 'custom';
    readonly description: string;
    private readonly definition;
    constructor(definition: GateDefinitionYaml);
    /**
     * Get the guidance text for this gate
     */
    getGuidance(): string;
    /**
     * Get the pass criteria for validation gates
     */
    getPassCriteria(): GatePassCriteria[];
    /**
     * Get the activation rules for this gate
     */
    getActivationRules(): GateActivationRules;
    /**
     * Get the retry configuration for this gate
     */
    getRetryConfig(): GateRetryConfig | undefined;
    /**
     * Check if this gate should be active for the given context.
     *
     * Delegates to the canonical isGateActiveForContext utility which handles:
     * - Framework gates (gate_type: 'framework'): AND logic for category+framework
     * - Regular gates: blocking logic where each rule blocks independently
     *
     * @see isGateActiveForContext for implementation details
     */
    isActive(context: GateActivationContext): boolean;
    /**
     * Get the underlying gate definition
     */
    getDefinition(): GateDefinitionYaml;
}
/**
 * Factory function to create a GenericGateGuide from a definition
 */
export declare function createGenericGateGuide(definition: GateDefinitionYaml): GenericGateGuide;
