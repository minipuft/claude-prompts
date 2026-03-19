/**
 * GateManagerProvider
 *
 * Bridges GateManager/registry-backed guides to the legacy gate loader contract.
 * Converts GateGuide definitions into the LightweightGateDefinition shape used
 * by existing pipeline stages without duplicating loading logic.
 *
 * Temporary gates can be merged via TemporaryGateRegistry when provided.
 */
import type { GateDefinitionProvider } from '../core/gate-loader.js';
import type { TemporaryGateRegistry } from '../core/temporary-gate-registry.js';
import type { IGateManager, GateActivationResult, LightweightGateDefinition } from '../types.js';
export declare class GateManagerProvider implements GateDefinitionProvider {
    private readonly gateManager;
    private readonly temporaryGateRegistry;
    constructor(gateManager: IGateManager, temporaryGateRegistry?: TemporaryGateRegistry);
    loadGate(gateId: string): Promise<LightweightGateDefinition | null>;
    loadGates(gateIds: string[]): Promise<LightweightGateDefinition[]>;
    getActiveGates(gateIds: string[], context: {
        promptCategory?: string;
        framework?: string;
        explicitRequest?: boolean;
    }): Promise<GateActivationResult>;
    listAvailableGates(): Promise<string[]>;
    listAvailableGateDefinitions(): Promise<LightweightGateDefinition[]>;
    clearCache(): void;
    /**
     * Determine if a gate should be active for the provided context.
     *
     * Delegates to the canonical isGateActiveForContext utility which handles:
     * - Framework gates (gate_type: 'framework'): AND logic for category+framework
     * - Regular gates: blocking logic where each rule blocks independently
     *
     * @see isGateActiveForContext for implementation details
     */
    isGateActive(gate: LightweightGateDefinition, context: {
        promptCategory?: string;
        framework?: string;
        explicitRequest?: boolean;
    }): boolean;
    getStatistics(): {
        cachedGates: number;
        totalLoads: number;
        lastAccess: Date | null;
    };
    isMethodologyGate(gateId: string): Promise<boolean>;
    isMethodologyGateCached(gateId: string): boolean;
    getMethodologyGateIds(): Promise<string[]>;
    private toLightweight;
    private normalizeRetryConfig;
}
