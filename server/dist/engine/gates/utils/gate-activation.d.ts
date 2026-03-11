/**
 * Gate Activation Utility
 *
 * Provides the canonical implementation of gate activation logic.
 * All activation checks should delegate to this utility to ensure
 * consistent behavior across the codebase.
 *
 * Key behavior:
 * - Framework gates (gate_type: 'framework') use AND logic: require BOTH
 *   category AND framework to match when both are defined
 * - Regular gates use blocking logic: each rule blocks independently if not satisfied
 */
import type { GateActivationRules, GateActivationContext } from '../types/index.js';
/**
 * Check if a gate should be active for the given context.
 *
 * This is the canonical implementation of gate activation logic.
 * Use this function instead of implementing activation checks inline.
 *
 * @param activation - The gate's activation rules (or undefined for always-active)
 * @param context - The context to check against
 * @param gateType - Optional gate type for special handling ('framework' gates use AND logic)
 * @returns true if the gate should be active
 *
 * @example
 * ```typescript
 * // For regular gates
 * const active = isGateActiveForContext(gate.activation, { promptCategory: 'code' });
 *
 * // For framework gates (require BOTH category AND framework)
 * const active = isGateActiveForContext(gate.activation, context, 'framework');
 * ```
 */
export declare function isGateActiveForContext(activation: GateActivationRules | undefined, context: GateActivationContext, gateType?: 'framework' | 'category' | 'custom'): boolean;
