/**
 * Operator patterns generated from SSOT registry.
 * Use these patterns in symbolic-operator-parser.ts
 */
export declare const GENERATED_OPERATOR_PATTERNS: {
    /** Sequential execution of prompts - --> */
    readonly chain: {
        readonly pattern: RegExp;
        readonly symbol: "-->";
        readonly status: "implemented";
    };
    /** Delegated chain step (sub-agent execution) - ==> */
    readonly delegation: {
        readonly pattern: RegExp;
        readonly symbol: "==>";
        readonly status: "implemented";
    };
    /** Quality gate for validation - :: */
    readonly gate: {
        readonly pattern: RegExp;
        readonly symbol: "::";
        readonly status: "implemented";
    };
    /** Apply methodology framework - @ */
    readonly framework: {
        readonly pattern: RegExp;
        readonly symbol: "@";
        readonly status: "implemented";
    };
    /** Response formatting style - # */
    readonly style: {
        readonly pattern: RegExp;
        readonly symbol: "#";
        readonly status: "implemented";
    };
    /** Chain shorthand - repeat N times with SAME arguments - * N */
    readonly repetition: {
        readonly pattern: RegExp;
        readonly symbol: "* N";
        readonly status: "implemented";
    };
    /** Concurrent execution - + */
    readonly parallel: {
        readonly pattern: RegExp;
        readonly symbol: "+";
        readonly status: "reserved";
    };
    /** Conditional branching - ? */
    readonly conditional: {
        readonly pattern: RegExp;
        readonly symbol: "?";
        readonly status: "reserved";
    };
};
export type OperatorId = keyof typeof GENERATED_OPERATOR_PATTERNS;
export declare const IMPLEMENTED_OPERATORS: readonly ["chain", "delegation", "gate", "framework", "style", "repetition"];
