import type { GateReferenceResolver } from './gate-reference-resolver.js';
import type { Logger } from '../../../infra/logging/index.js';
import type { ExecutionContext } from '../../execution/context/index.js';
import type { TemporaryGateInput } from '../../execution/types.js';
import type { TemporaryGateRegistry } from '../core/temporary-gate-registry.js';
/**
 * Result of temporary gate registration.
 */
export interface RegisteredGateResult {
    readonly temporaryGateIds: string[];
    readonly canonicalGateIds: string[];
}
/**
 * Normalized gate input structure for creating temporary gates.
 */
export interface NormalizedGateInput {
    name: string;
    type: 'validation' | 'guidance';
    scope: 'execution' | 'session' | 'chain' | 'step';
    criteria?: string[];
    guidance?: string;
    description?: string;
    pass_criteria?: string[];
    source: 'manual' | 'automatic' | 'analysis';
    context?: Record<string, unknown>;
    target_step_number?: number;
    apply_to_steps?: number[];
}
/**
 * Raw gate input (flexible structure for parsing).
 * Accepts any object with at least some gate-like properties.
 */
export type RawGateInput = string | TemporaryGateInput | {
    id?: string;
    name?: string;
    type?: string;
    scope?: string;
    criteria?: string[] | readonly string[];
    guidance?: string;
    description?: string;
    pass_criteria?: string[] | readonly string[];
    source?: string;
    context?: unknown;
};
/**
 * Registers temporary gates from raw specifications and resolves canonical references.
 *
 * Handles:
 * - Normalizing heterogeneous gate inputs (strings, objects, TemporaryGateInput)
 * - Resolving canonical gate IDs from references
 * - Deduplication within a single batch
 * - Creating temporary gate definitions in the registry
 */
export declare class TemporaryGateRegistrar {
    private readonly temporaryGateRegistry;
    private readonly gateReferenceResolver;
    private readonly logger;
    constructor(temporaryGateRegistry: TemporaryGateRegistry | undefined, gateReferenceResolver: GateReferenceResolver | undefined, logger: Logger);
    /**
     * Register temporary gates from the unified `gates` parameter on the execution context.
     * Returns IDs of created temporary gates and resolved canonical gates.
     */
    registerTemporaryGates(context: ExecutionContext): Promise<RegisteredGateResult>;
    /**
     * Normalize raw gate input to standard format.
     */
    normalizeGateInput(gate: RawGateInput, isChainExecution?: boolean, currentStep?: number): {
        normalized: NormalizedGateInput;
        isValid: boolean;
    };
    /**
     * Resolve effective guidance using fallback chain.
     * Priority: explicit guidance > criteria-derived > description.
     */
    resolveGateGuidance(gate: NormalizedGateInput, criteria: string[]): string;
    private trackTemporaryGateScope;
    private resolveCanonicalGateId;
    private extractGateReferenceCandidate;
    private gateInputContainsInlineContent;
}
