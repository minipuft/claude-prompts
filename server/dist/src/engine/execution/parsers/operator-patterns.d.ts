/**
 * Operator patterns loaded from tooling/contracts/registries/operators.json (SSOT).
 *
 * Replaces the previous codegen approach (generate-operators.ts) with runtime loading.
 * JSON is imported directly — esbuild inlines it into the bundle, no file I/O needed.
 */
interface OperatorEntry {
    pattern: RegExp;
    symbol: string;
    role: 'delimiter' | 'modifier' | 'prefix';
    status: 'implemented' | 'reserved' | 'deprecated';
}
type KnownOperators = {
    chain: OperatorEntry;
    delegation: OperatorEntry;
    gate: OperatorEntry;
    framework: OperatorEntry;
    style: OperatorEntry;
    repetition: OperatorEntry;
    parallel: OperatorEntry;
    conditional: OperatorEntry;
    [key: string]: OperatorEntry;
};
export declare const OPERATOR_PATTERNS: KnownOperators;
export type OperatorId = keyof typeof OPERATOR_PATTERNS;
export declare const IMPLEMENTED_OPERATORS: string[];
export {};
