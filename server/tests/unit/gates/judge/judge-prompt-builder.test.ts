import {
  resolveJudgeConfig,
  buildJudgeEnvelope,
  renderJudgePrompt,
  isJudgeMode,
} from '../../../../src/engine/gates/judge/judge-prompt-builder.js';
import { GATE_VERDICT_REQUIRED_FORMAT } from '../../../../src/engine/gates/core/gate-verdict-contract.js';

import type {
  JudgeEvaluationConfig,
  JudgeEvaluationDefaults,
  JudgeEnvelope,
} from '../../../../src/engine/gates/judge/types.js';

describe('resolveJudgeConfig', () => {
  it('returns self mode with defaults when no config provided', () => {
    const result = resolveJudgeConfig();
    expect(result.mode).toBe('self');
    expect(result.model).toBeUndefined();
    expect(result.strict).toBe(false); // strict defaults to (mode === 'judge')
  });

  it('uses gate-level config over global defaults', () => {
    const gateConfig: Partial<JudgeEvaluationConfig> = {
      mode: 'judge',
      model: 'haiku',
      strict: false,
    };
    const globalDefaults: Partial<JudgeEvaluationDefaults> = {
      defaultMode: 'self',
      defaultModel: 'sonnet',
      strict: true,
    };

    const result = resolveJudgeConfig(gateConfig, globalDefaults);
    expect(result.mode).toBe('judge');
    expect(result.model).toBe('haiku');
    expect(result.strict).toBe(false);
  });

  it('falls back to global defaults when gate config is partial', () => {
    const gateConfig: Partial<JudgeEvaluationConfig> = { mode: 'judge' };
    const globalDefaults: Partial<JudgeEvaluationDefaults> = {
      defaultModel: 'haiku',
      strict: false,
    };

    const result = resolveJudgeConfig(gateConfig, globalDefaults);
    expect(result.mode).toBe('judge');
    expect(result.model).toBe('haiku');
    expect(result.strict).toBe(false);
  });

  it('defaults strict to true when mode is judge and no explicit setting', () => {
    const result = resolveJudgeConfig({ mode: 'judge' });
    expect(result.strict).toBe(true);
  });

  it('defaults strict to false when mode is self and no explicit setting', () => {
    const result = resolveJudgeConfig({ mode: 'self' });
    expect(result.strict).toBe(false);
  });

  it('uses global defaultMode when gate config has no mode', () => {
    const result = resolveJudgeConfig({}, { defaultMode: 'judge' });
    expect(result.mode).toBe('judge');
  });
});

describe('buildJudgeEnvelope', () => {
  it('builds envelope with all fields', () => {
    const envelope = buildJudgeEnvelope(
      'The quick brown fox',
      'Code Quality',
      'code-quality',
      ['Check for proper error handling', 'Validate input types'],
      true
    );

    expect(envelope.output).toBe('The quick brown fox');
    expect(envelope.gateName).toBe('Code Quality');
    expect(envelope.gateId).toBe('code-quality');
    expect(envelope.criteria).toEqual(['Check for proper error handling', 'Validate input types']);
    expect(envelope.strict).toBe(true);
    expect(envelope.verdictFormat).toBe(GATE_VERDICT_REQUIRED_FORMAT);
  });

  it('defaults strict to true', () => {
    const envelope = buildJudgeEnvelope('output', 'Gate', 'gate-id', ['criteria']);
    expect(envelope.strict).toBe(true);
  });

  it('respects explicit strict=false', () => {
    const envelope = buildJudgeEnvelope('output', 'Gate', 'gate-id', ['criteria'], false);
    expect(envelope.strict).toBe(false);
  });
});

describe('renderJudgePrompt', () => {
  const baseEnvelope: JudgeEnvelope = {
    output: 'function add(a, b) { return a + b; }',
    criteria: ['Includes error handling', 'Has type annotations'],
    gateName: 'Code Quality',
    gateId: 'code-quality',
    strict: true,
    verdictFormat: GATE_VERDICT_REQUIRED_FORMAT,
  };

  it('renders header with independent reviewer framing', () => {
    const prompt = renderJudgePrompt(baseEnvelope);
    expect(prompt).toContain('## Judge Evaluation — Independent Quality Audit');
    expect(prompt).toContain('independent quality reviewer');
    expect(prompt).toContain('You did NOT produce this output');
  });

  it('includes the output in a code block', () => {
    const prompt = renderJudgePrompt(baseEnvelope);
    expect(prompt).toContain('### Output Under Review');
    expect(prompt).toContain('```');
    expect(prompt).toContain('function add(a, b) { return a + b; }');
  });

  it('lists all criteria', () => {
    const prompt = renderJudgePrompt(baseEnvelope);
    expect(prompt).toContain('### Evaluation Criteria (Code Quality)');
    expect(prompt).toContain('- Includes error handling');
    expect(prompt).toContain('- Has type annotations');
  });

  it('uses strict protocol when strict=true', () => {
    const prompt = renderJudgePrompt(baseEnvelope);
    expect(prompt).toContain('### Evaluation Protocol');
    expect(prompt).toContain('**FAILS**');
    expect(prompt).toContain('Only PASS if you cannot find genuine failures');
  });

  it('uses balanced protocol when strict=false', () => {
    const envelope: JudgeEnvelope = { ...baseEnvelope, strict: false };
    const prompt = renderJudgePrompt(envelope);
    expect(prompt).toContain('### Evaluation Protocol');
    expect(prompt).not.toContain('**FAILS**');
    expect(prompt).toContain('substantially meets all criteria');
  });

  it('includes verdict format', () => {
    const prompt = renderJudgePrompt(baseEnvelope);
    expect(prompt).toContain(GATE_VERDICT_REQUIRED_FORMAT);
  });

  it('does not include chain history, framework context, or reasoning', () => {
    const prompt = renderJudgePrompt(baseEnvelope);
    // Judge prompt should be clean — no execution context leaks
    expect(prompt).not.toContain('Chain History');
    expect(prompt).not.toContain('Framework');
    expect(prompt).not.toContain('CAGEERF');
    expect(prompt).not.toContain('EXECUTION CONTEXT');
  });
});

describe('isJudgeMode', () => {
  it('returns true for judge mode', () => {
    expect(isJudgeMode({ mode: 'judge', model: undefined, strict: true })).toBe(true);
  });

  it('returns false for self mode', () => {
    expect(isJudgeMode({ mode: 'self', model: undefined, strict: false })).toBe(false);
  });
});
