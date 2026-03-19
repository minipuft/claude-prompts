/**
 * Gate Primitives
 *
 * Primitive type definitions extracted from gates/types.ts to break the
 * circular dependency: types.ts → types/index.ts → gate-guide-types.ts → types.ts.
 *
 * Both gates/types.ts and types/gate-guide-types.ts import from this leaf file
 * instead of from each other.
 *
 * IMPORTANT: This file must NOT import from ../types.ts or ./index.ts.
 */
/**
 * Gate enforcement mode determines behavior on validation failure.
 * - blocking: Execution pauses until gate criteria are met (default for critical)
 * - advisory: Logs warning but allows advancement (default for high/medium)
 * - informational: Logs only, no user impact (default for low)
 */
export type GateEnforcementMode = 'blocking' | 'advisory' | 'informational';
/**
 * Gate severity levels for prioritization
 */
export type GateSeverity = 'critical' | 'high' | 'medium' | 'low';
/**
 * Default mapping from severity to enforcement mode
 */
export declare const SEVERITY_TO_ENFORCEMENT: Record<GateSeverity, GateEnforcementMode>;
/**
 * Pass/fail criteria for validation (lightweight gate format)
 */
export interface GatePassCriteria {
    /** Type of check to perform */
    type: 'content_check' | 'llm_self_check' | 'pattern_check' | 'methodology_compliance' | 'shell_verify';
    min_length?: number;
    max_length?: number;
    required_patterns?: string[];
    forbidden_patterns?: string[];
    methodology?: string;
    min_compliance_score?: number;
    severity?: 'warn' | 'fail';
    quality_indicators?: Record<string, {
        keywords?: string[];
        patterns?: string[];
    }>;
    prompt_template?: string;
    pass_threshold?: number;
    regex_patterns?: string[];
    keyword_count?: {
        [keyword: string]: number;
    };
    /** Shell command to execute for verification (exit 0 = pass) */
    shell_command?: string;
    /** Timeout in milliseconds for shell command (default: 300000) */
    shell_timeout?: number;
    /** Working directory for shell command execution */
    shell_working_dir?: string;
    /** Additional environment variables for shell command */
    shell_env?: Record<string, string>;
    /** Maximum verification attempts before escalation (default: 5) */
    shell_max_attempts?: number;
    /** Preset for shell verification (:fast, :full, :extended) */
    shell_preset?: 'fast' | 'full' | 'extended';
}
