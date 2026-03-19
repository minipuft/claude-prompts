/**
 * Attribute Policy Enforcer
 *
 * Enforces acceptance criteria #3 (no high-cardinality IDs in metric labels)
 * and #4 (no raw payload data in default telemetry attributes/events).
 *
 * Architecture: OOP shell (class with DI) + FP internals (pure filter/map functions).
 */
import type { TelemetryAttributePolicy } from '../../../shared/types/index.js';
import type { Attributes } from '@opentelemetry/api';
/**
 * Enforces attribute policy rules for all telemetry emission.
 *
 * Rules:
 * 1. Excluded attributes are ALWAYS removed (raw payloads).
 * 2. Business-context attributes pass if policy.businessContext is true.
 * 3. Custom allowlist attributes pass regardless of business-context flag.
 * 4. `cpm.command.raw` passes ONLY if policy.rawCommands is explicitly true.
 * 5. `cpm.user_response.raw` passes ONLY if policy.rawResponses is explicitly true.
 * 6. Unknown `cpm.*` attributes are dropped by default.
 * 7. Non-`cpm.*` attributes (OTel semantic conventions) pass through.
 */
export declare class AttributePolicyEnforcer {
    private readonly policy;
    constructor(policy: TelemetryAttributePolicy);
    /**
     * Filter and sanitize attributes according to the active policy.
     * Returns a new object — does not mutate input.
     */
    sanitize(attrs: Record<string, unknown>): Attributes;
    /**
     * Check if a single attribute key would be allowed by the current policy.
     */
    isAllowed(key: string): boolean;
    /**
     * Evaluate a single attribute against policy rules.
     * Returns the safe value, or undefined if the attribute should be dropped.
     */
    private evaluateAttribute;
}
/**
 * Build a redacted copy of attributes for diagnostic/debug output.
 * Replaces sensitive values with [REDACTED] instead of dropping them.
 */
export declare function redactAttributes(attrs: Record<string, unknown>): Record<string, string>;
