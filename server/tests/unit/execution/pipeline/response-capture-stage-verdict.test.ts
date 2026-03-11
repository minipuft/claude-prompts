import { describe, expect, it } from '@jest/globals';

import { parseGateVerdict } from '../../../../src/engine/gates/core/gate-verdict-contract.js';

describe('Gate verdict contract parsing', () => {
  it('parses canonical GATE_REVIEW hyphen format', () => {
    const result = parseGateVerdict('GATE_REVIEW: PASS - All criteria met', 'gate_verdict');

    expect(result).toEqual({
      verdict: 'PASS',
      rationale: 'All criteria met',
      raw: 'GATE_REVIEW: PASS - All criteria met',
      source: 'gate_verdict',
      detectedPattern: 'primary',
    });
  });

  it('parses canonical GATE_REVIEW colon format', () => {
    const result = parseGateVerdict('GATE_REVIEW: FAIL: Missing docs', 'gate_verdict');

    expect(result?.verdict).toBe('FAIL');
    expect(result?.rationale).toBe('Missing docs');
    expect(result?.detectedPattern).toBe('high');
  });

  it('parses simplified GATE formats and minimal fallback', () => {
    const simple = parseGateVerdict('GATE PASS - Looks good', 'gate_verdict');
    const fallback = parseGateVerdict('FAIL - Needs improvement', 'gate_verdict');

    expect(simple?.detectedPattern).toBe('high');
    expect(fallback?.detectedPattern).toBe('fallback');
    expect(fallback?.verdict).toBe('FAIL');
  });

  it('is case-insensitive', () => {
    const result = parseGateVerdict('gate_review: pass - approved', 'gate_verdict');
    expect(result?.verdict).toBe('PASS');
    expect(result?.rationale).toBe('approved');
  });

  it('trims surrounding whitespace on raw content and rationale', () => {
    const result = parseGateVerdict('   GATE PASS -  rationale with spaces   ', 'gate_verdict');
    expect(result?.raw).toBe('GATE PASS -  rationale with spaces');
    expect(result?.rationale).toBe('rationale with spaces');
  });

  it('returns null for undefined, empty, and non-matching content', () => {
    expect(parseGateVerdict(undefined, 'gate_verdict')).toBeNull();
    expect(parseGateVerdict('', 'gate_verdict')).toBeNull();
    expect(parseGateVerdict('ordinary text', 'gate_verdict')).toBeNull();
  });

  it('requires a non-empty rationale', () => {
    expect(parseGateVerdict('GATE_REVIEW: PASS -', 'gate_verdict')).toBeNull();
    expect(parseGateVerdict('GATE PASS -   ', 'gate_verdict')).toBeNull();
  });
});
