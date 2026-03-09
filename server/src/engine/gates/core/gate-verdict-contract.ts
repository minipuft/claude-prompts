// @lifecycle canonical - Shared gate verdict parsing and validation contract.
import {
  loadVerdictPatterns,
  isPatternRestrictedToSource,
  getVerdictValidationSettings,
} from '../config/index.js';

export type GateVerdictSource = 'gate_verdict';

export interface ParsedGateVerdict {
  readonly verdict: 'PASS' | 'FAIL';
  readonly rationale: string;
  readonly raw: string;
  readonly source: GateVerdictSource;
  readonly detectedPattern?: string;
}

export const GATE_VERDICT_VALIDATION_MESSAGE =
  'Gate verdict must follow format: "GATE_REVIEW: PASS/FAIL - reason"';

export const GATE_VERDICT_THROW_MESSAGE =
  'Gate verdict must follow format: "GATE_REVIEW: PASS/FAIL - reason"';

export const GATE_VERDICT_REQUIRED_FORMAT = 'GATE_REVIEW: PASS|FAIL - <rationale>';

// Canonical schema-level matcher for contracts and tool input validation.
export const GATE_VERDICT_SCHEMA_REGEX = /^GATE_REVIEW:\s*(?:PASS|FAIL)\s*-\s*.+$/i;

export function buildGateVerdictExample(
  verdict: 'PASS' | 'FAIL',
  rationale: string = '<rationale>'
): string {
  return `GATE_REVIEW: ${verdict} - ${rationale}`;
}

export function parseGateVerdict(
  raw: string | undefined,
  source: GateVerdictSource
): ParsedGateVerdict | null {
  const normalized = raw?.trim();
  if (!normalized) {
    return null;
  }

  // Validate only the first non-empty line (per-gate verdicts may follow)
  const firstLine =
    normalized
      .split('\n')
      .find((l) => l.trim().length > 0)
      ?.trim() ?? normalized;

  const patterns = loadVerdictPatterns();
  const validation = getVerdictValidationSettings();

  for (const pattern of patterns) {
    if (isPatternRestrictedToSource(pattern, source)) {
      continue;
    }

    const match = firstLine.match(pattern.regex);
    if (!match?.[1]) {
      continue;
    }

    const rationale = match[2]?.trim() ?? '';
    if (validation.requireRationale && rationale.length < validation.minRationaleLength) {
      continue;
    }

    return {
      verdict: match[1].toUpperCase() as 'PASS' | 'FAIL',
      rationale,
      raw: normalized,
      source,
      detectedPattern: pattern.priority,
    };
  }

  return null;
}

export function isValidGateVerdict(gateVerdict: unknown): gateVerdict is string {
  if (typeof gateVerdict !== 'string') {
    return false;
  }
  return parseGateVerdict(gateVerdict, 'gate_verdict') !== null;
}
