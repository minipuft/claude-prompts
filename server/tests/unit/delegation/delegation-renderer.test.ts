import { describe, expect, test } from '@jest/globals';

import { DelegationRenderer } from '../../../src/engine/execution/delegation/renderer.js';
import {
  ClaudeCodeStrategy,
  CodexStrategy,
  CursorStrategy,
  GeminiStrategy,
  NeutralStrategy,
  OpenCodeStrategy,
  getHandoffFooterInstruction,
  getHandoffFooterPrefix,
  getHandoffProfileStatus,
  resolveDelegationStrategy,
} from '../../../src/engine/execution/delegation/strategy.js';

import type {
  DelegationPayload,
  ExecutionEnvelope,
  RenderingHints,
} from '../../../src/engine/execution/delegation/types.js';
import type { DelegationStrategy } from '../../../src/engine/execution/delegation/strategy.js';

describe('DelegationRenderer', () => {
  const basePayload: DelegationPayload = {
    stepNumber: 2,
    totalSteps: 3,
    promptName: 'research',
    agentType: 'chain-executor',
    gateCount: 0,
    hasGates: false,
  };

  test('renders basic CTA with header and instructions (no envelope)', () => {
    const renderer = new DelegationRenderer();
    const result = renderer.render(basePayload);

    expect(result).toContain('HANDOFF: Execute Step 2 ("research")');
    expect(result).toContain('subagent_type: "claude-prompts:chain-executor"');
    expect(result).toContain('HANDOFF INSTRUCTIONS');
    expect(result).toContain('CONSTRAINT');
    expect(result).toContain('BLOCKED');
  });

  test('includes model from strategy in tool call', () => {
    const renderer = new DelegationRenderer();
    const payload: DelegationPayload = {
      ...basePayload,
      subagentModel: 'heavy',
    };
    const result = renderer.render(payload);

    expect(result).toContain('model: "opus"');
  });

  test('subagentModel fast renders model haiku in CTA', () => {
    const renderer = new DelegationRenderer();
    const payload: DelegationPayload = {
      ...basePayload,
      subagentModel: 'fast',
    };
    const result = renderer.render(payload);

    expect(result).toContain('model: "haiku"');
    expect(result).not.toContain('model: "sonnet"');
    expect(result).not.toContain('model: "opus"');
  });

  test('renders execution context envelope when provided', () => {
    const renderer = new DelegationRenderer();
    const envelope: ExecutionEnvelope = {
      chainHistory: '### Chain Context\n**Chain**: chain-abc',
      frameworkGuidance: '### Framework\n**CAGEERF**',
      gateInstructions: '### Quality Gates\nCode quality criteria',
    };
    const result = renderer.render(basePayload, envelope);

    expect(result).toContain('EXECUTION CONTEXT');
    expect(result).toContain('Chain Context');
    expect(result).toContain('CAGEERF');
    expect(result).toContain('Code quality criteria');
    // Delimiters present
    expect(result).toContain('\u2550'.repeat(65));
  });

  test('skips envelope section when all fields are empty', () => {
    const renderer = new DelegationRenderer();
    const emptyEnvelope: ExecutionEnvelope = {};
    const result = renderer.render(basePayload, emptyEnvelope);

    expect(result).not.toContain('EXECUTION CONTEXT');
  });

  test('includes soft gate hint when gateGuidanceEnabled but no gates', () => {
    const renderer = new DelegationRenderer();
    const hints: RenderingHints = {
      gateGuidanceEnabled: true,
      frameworkInjectionEnabled: false,
    };
    const result = renderer.render(basePayload, undefined, hints);

    expect(result).toContain('gate_verdict');
    expect(result).toContain('self-review');
  });

  test('renders enforcement messaging when gateGuidanceEnabled and hasGates', () => {
    const renderer = new DelegationRenderer();
    const payload: DelegationPayload = {
      ...basePayload,
      gateCount: 3,
      hasGates: true,
    };
    const hints: RenderingHints = {
      gateGuidanceEnabled: true,
      frameworkInjectionEnabled: false,
    };
    const result = renderer.render(payload, undefined, hints);

    expect(result).toContain('enforces gate criteria');
    expect(result).toContain('gate_verdict');
    expect(result).not.toContain('self-review');
  });

  test('shows continue hint for intermediate steps', () => {
    const renderer = new DelegationRenderer();
    const result = renderer.render(basePayload);

    expect(result).toContain('so Step 3 can begin');
  });

  test('shows completion hint for last delegation step', () => {
    const renderer = new DelegationRenderer();
    const payload: DelegationPayload = {
      ...basePayload,
      stepNumber: 3,
      totalSteps: 3,
    };
    const result = renderer.render(payload);

    expect(result).toContain('to complete the chain');
  });

  test('selects codex strategy from payload client profile', () => {
    const renderer = new DelegationRenderer();
    const result = renderer.render({
      ...basePayload,
      clientProfile: {
        clientFamily: 'codex',
        clientId: 'codex-cli',
        clientVersion: '1.0.0',
        delegationProfile: 'spawn_agent_v1',
      },
    });

    expect(result).toContain('Tool: spawn_agent');
    expect(result).not.toContain('Tool: Task');
  });

  test('selects neutral strategy from payload client profile', () => {
    const renderer = new DelegationRenderer();
    const result = renderer.render({
      ...basePayload,
      clientProfile: {
        clientFamily: 'unknown',
        clientId: 'mystery-client',
        clientVersion: 'unknown',
        delegationProfile: 'neutral_v1',
      },
    });

    expect(result).toContain('Handoff: Use your client');
    expect(result).not.toContain('Tool: Task');
  });
});

const basePayloadForStrategy: DelegationPayload = {
  stepNumber: 2,
  totalSteps: 3,
  promptName: 'research',
  agentType: 'chain-executor',
  gateCount: 0,
  hasGates: false,
};

describe('ClaudeCodeStrategy', () => {
  const strategy = new ClaudeCodeStrategy();

  test('resolves heavy to opus', () => {
    const payload: DelegationPayload = {
      stepNumber: 2,
      totalSteps: 3,
      promptName: 'test',
      agentType: 'chain-executor',
      subagentModel: 'heavy',
      gateCount: 0,
      hasGates: false,
    };
    expect(strategy.resolveModel(payload)).toBe('opus');
  });

  test('resolves standard to sonnet', () => {
    const payload: DelegationPayload = {
      stepNumber: 2,
      totalSteps: 3,
      promptName: 'test',
      agentType: 'chain-executor',
      subagentModel: 'standard',
      gateCount: 0,
      hasGates: false,
    };
    expect(strategy.resolveModel(payload)).toBe('sonnet');
  });

  test('resolves fast to haiku', () => {
    const payload: DelegationPayload = {
      stepNumber: 2,
      totalSteps: 3,
      promptName: 'test',
      agentType: 'chain-executor',
      subagentModel: 'fast',
      gateCount: 0,
      hasGates: false,
    };
    expect(strategy.resolveModel(payload)).toBe('haiku');
  });

  test('falls back to opus when gateCount >= 3', () => {
    const payload: DelegationPayload = {
      stepNumber: 2,
      totalSteps: 3,
      promptName: 'test',
      agentType: 'chain-executor',
      gateCount: 3,
      hasGates: true,
    };
    expect(strategy.resolveModel(payload)).toBe('opus');
  });

  test('defaults to sonnet without capability hint or high gate count', () => {
    const payload: DelegationPayload = {
      stepNumber: 2,
      totalSteps: 3,
      promptName: 'test',
      agentType: 'chain-executor',
      gateCount: 1,
      hasGates: true,
    };
    expect(strategy.resolveModel(payload)).toBe('sonnet');
  });

  test('formatToolCall namespaces bare agent type', () => {
    const result = strategy.formatToolCall('chain-executor', 'sonnet');
    expect(result).toContain('Tool: Task');
    expect(result).toContain('subagent_type: "claude-prompts:chain-executor"');
    expect(result).toContain('model: "sonnet"');
  });

  test('formatToolCall preserves already-namespaced agent type', () => {
    const result = strategy.formatToolCall('custom-plugin:my-agent', 'sonnet');
    expect(result).toContain('subagent_type: "custom-plugin:my-agent"');
  });

  test('formatToolCall omits model when undefined', () => {
    const result = strategy.formatToolCall('chain-executor', undefined);
    expect(result).toContain('subagent_type: "claude-prompts:chain-executor"');
    expect(result).not.toContain('model:');
  });

  test('accepts custom pluginNamespace', () => {
    const customStrategy = new ClaudeCodeStrategy('my-plugin');
    const result = customStrategy.formatToolCall('chain-executor', undefined);
    expect(result).toContain('subagent_type: "my-plugin:chain-executor"');
  });

  test('formatConstraints includes DO NOT and BLOCKED warnings', () => {
    const result = strategy.formatConstraints();
    expect(result).toContain('DO NOT');
    expect(result).toContain('BLOCKED');
  });

  test('accepts custom strategy via constructor', () => {
    const customStrategy: DelegationStrategy = {
      clientId: 'test-client',
      resolveModel: () => 'custom-model',
      formatToolCall: (agentType, model) => `custom: ${agentType} ${model}`,
      formatConstraints: () => 'custom constraints',
    };
    const renderer = new DelegationRenderer(customStrategy);
    const result = renderer.render(basePayloadForStrategy);

    expect(result).toContain('custom: chain-executor custom-model');
    expect(result).toContain('custom constraints');
  });
});

describe('additional delegation strategies', () => {
  test('CodexStrategy formats spawn_agent call', () => {
    const strategy = new CodexStrategy();
    const result = strategy.formatToolCall('worker', 'codex-standard');
    expect(result).toContain('Tool: spawn_agent (preferred)');
    expect(result).toContain('agent_type: "worker"');
  });

  test('CodexStrategy includes fallback guidance when spawn_agent is unavailable', () => {
    const strategy = new CodexStrategy();
    const result = strategy.formatConstraints();
    expect(result).toContain('FALLBACK');
    expect(result).toContain('spawn_agent is unavailable');
  });

  test('NeutralStrategy omits fixed tool name and model', () => {
    const strategy = new NeutralStrategy();
    const result = strategy.formatToolCall('worker', undefined);
    expect(result).toContain('Handoff: Use your client');
    expect(result).toContain('agent_type: "worker"');
  });

  test('GeminiStrategy renders Gemini-specific delegation guidance', () => {
    const strategy = new GeminiStrategy();
    const result = strategy.formatToolCall('worker', undefined);
    expect(result).toContain("Gemini's sub-agent/handoff");
    expect(result).toContain('agent_type: "worker"');
  });

  test('OpenCodeStrategy renders OpenCode-specific delegation guidance', () => {
    const strategy = new OpenCodeStrategy();
    const result = strategy.formatToolCall('worker', undefined);
    expect(result).toContain("OpenCode's agent");
    expect(result).toContain('Handoff:');
    expect(result).toContain('agent_type: "worker"');
  });

  test('CursorStrategy renders Cursor-specific delegation guidance', () => {
    const strategy = new CursorStrategy();
    const result = strategy.formatToolCall('worker', undefined);
    expect(result).toContain("Cursor's agent");
    expect(result).toContain('Handoff (experimental/testing)');
    expect(result).toContain('experimental/testing');
    expect(result).toContain('agent_type: "worker"');
  });

  test('delegation profile metadata reports footer prefixes + experimental cursor status', () => {
    expect(getHandoffFooterPrefix('spawn_agent_v1')).toContain('Codex agent capability');
    expect(getHandoffFooterInstruction('spawn_agent_v1')).toContain('Codex agent capability');
    expect(getHandoffProfileStatus('spawn_agent_v1')).toBe('canonical');
    expect(getHandoffFooterPrefix('cursor_agent_v1')).toBe('Handoff via Cursor agent capability');
    expect(getHandoffFooterInstruction('cursor_agent_v1')).toContain('experimental/testing');
    expect(getHandoffProfileStatus('cursor_agent_v1')).toBe('experimental');
  });

  test('resolveDelegationStrategy routes by delegation profile', () => {
    expect(
      resolveDelegationStrategy({
        clientFamily: 'claude-code',
        clientId: 'claude-code',
        clientVersion: '1.0.0',
        delegationProfile: 'task_tool_v1',
      }).clientId
    ).toBe('claude-code');
    expect(
      resolveDelegationStrategy({
        clientFamily: 'codex',
        clientId: 'codex',
        clientVersion: '1.0.0',
        delegationProfile: 'spawn_agent_v1',
      }).clientId
    ).toBe('codex');
    expect(
      resolveDelegationStrategy({
        clientFamily: 'gemini',
        clientId: 'gemini',
        clientVersion: '1.0.0',
        delegationProfile: 'gemini_subagent_v1',
      }).clientId
    ).toBe('gemini');
    expect(
      resolveDelegationStrategy({
        clientFamily: 'opencode',
        clientId: 'opencode',
        clientVersion: '1.0.0',
        delegationProfile: 'opencode_agent_v1',
      }).clientId
    ).toBe('opencode');
    expect(
      resolveDelegationStrategy({
        clientFamily: 'cursor',
        clientId: 'cursor',
        clientVersion: '1.0.0',
        delegationProfile: 'cursor_agent_v1',
      }).clientId
    ).toBe('cursor');
    expect(
      resolveDelegationStrategy({
        clientFamily: 'unknown',
        clientId: 'unknown',
        clientVersion: 'unknown',
        delegationProfile: 'neutral_v1',
      }).clientId
    ).toBe('unknown');
  });
});
