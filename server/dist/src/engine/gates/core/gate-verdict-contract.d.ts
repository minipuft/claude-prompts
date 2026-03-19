export type GateVerdictSource = 'gate_verdict' | 'user_response';
export interface ParsedGateVerdict {
    readonly verdict: 'PASS' | 'FAIL';
    readonly rationale: string;
    readonly raw: string;
    readonly source: GateVerdictSource;
    readonly detectedPattern?: string;
}
export declare const GATE_VERDICT_VALIDATION_MESSAGE = "Gate verdict must follow format: \"GATE_REVIEW: PASS/FAIL - reason\"";
export declare const GATE_VERDICT_THROW_MESSAGE = "Gate verdict must follow format: \"GATE_REVIEW: PASS/FAIL - reason\"";
export declare const GATE_VERDICT_REQUIRED_FORMAT = "GATE_REVIEW: PASS|FAIL - <rationale>";
export declare function buildGateVerdictExample(verdict: 'PASS' | 'FAIL', rationale?: string): string;
export declare function parseGateVerdict(raw: string | undefined, source: GateVerdictSource): ParsedGateVerdict | null;
export declare function isValidGateVerdict(gateVerdict: unknown): gateVerdict is string;
