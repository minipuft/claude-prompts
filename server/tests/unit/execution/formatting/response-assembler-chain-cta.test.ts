import { describe, expect, test } from '@jest/globals';

import { ExecutionContext } from '../../../../src/engine/execution/context/execution-context.js';
import { ResponseAssembler } from '../../../../src/engine/execution/formatting/response-assembler.js';

import type { PendingGateReview } from '../../../../src/shared/types/chain-execution.js';
import type { ConvertedPrompt } from '../../../../src/engine/execution/types.js';

/**
 * Tests for chain-path CTA methods: buildGateReviewCTA, buildFinalStepMessage,
 * buildChainFooter (non-delegation), formatBlockedResponse, and advisory warnings.
 *
 * These exercise the chain formatting path (formatChainResponse + buildChainFooter)
 * and the blocked response path (formatBlockedResponse).
 */

const assembler = new ResponseAssembler();

const basePrompt: ConvertedPrompt = {
  id: 'demo-prompt',
  name: 'Demo Prompt',
  description: 'Demo',
  category: 'development',
  userMessageTemplate: 'Test {{text}}',
  arguments: [{ name: 'text', type: 'string', description: 'Input', required: true }],
};

function createChainContext(overrides: {
  currentStep: number;
  totalSteps: number;
  chainId?: string;
  promptId?: string;
  strategy?: 'single' | 'chain';
  pendingReview?: PendingGateReview;
  advisoryWarnings?: string[];
  blockedGateIds?: string[];
  responseBlocked?: boolean;
  gateInstructions?: string;
}): ExecutionContext {
  const context = new ExecutionContext({
    command: `>>${overrides.promptId ?? 'demo-prompt'}`,
  });

  context.executionResults = {
    content: 'Chain step output content',
    metadata: {},
    generatedAt: Date.now(),
  };

  context.executionPlan = {
    strategy: overrides.strategy ?? 'chain',
    gates: [],
    requiresFramework: false,
    requiresSession: true,
  };

  context.parsedCommand = {
    promptId: overrides.promptId ?? 'demo-prompt',
    rawArgs: '',
    format: 'symbolic' as const,
    confidence: 0.9,
    convertedPrompt: { ...basePrompt, id: overrides.promptId ?? 'demo-prompt' },
    promptArgs: { text: 'hello' },
    metadata: {
      originalCommand: `>>${overrides.promptId ?? 'demo-prompt'}`,
      parseStrategy: 'symbolic',
      detectedFormat: 'symbolic',
      warnings: [],
    },
  };

  context.sessionContext = {
    sessionId: `session-${Date.now()}`,
    chainId: overrides.chainId ?? 'chain-test#1',
    isChainExecution: true,
    currentStep: overrides.currentStep,
    totalSteps: overrides.totalSteps,
    ...(overrides.pendingReview != null ? { pendingReview: overrides.pendingReview } : {}),
  };

  if (overrides.advisoryWarnings != null) {
    context.state.gates.advisoryWarnings = overrides.advisoryWarnings;
  }

  if (overrides.blockedGateIds != null) {
    context.state.gates.blockedGateIds = overrides.blockedGateIds;
  }

  if (overrides.responseBlocked != null) {
    context.state.gates.responseBlocked = overrides.responseBlocked;
  }

  if (overrides.gateInstructions != null) {
    context.gateInstructions = overrides.gateInstructions;
  }

  return context;
}

function makePendingReview(overrides?: Partial<PendingGateReview>): PendingGateReview {
  return {
    combinedPrompt: 'Review the output',
    gateIds: ['intent-quality'],
    prompts: [
      {
        gateId: 'intent-quality',
        gateName: 'Intent Quality',
        criteriaSummary: 'Check intent',
      },
    ],
    createdAt: Date.now(),
    attemptCount: 0,
    maxAttempts: 3,
    ...overrides,
  };
}

describe('ResponseAssembler – chain-path CTA methods', () => {
  describe('buildGateReviewCTA', () => {
    test('renders gate review with attempt info', () => {
      const context = createChainContext({
        currentStep: 1,
        totalSteps: 3,
        pendingReview: makePendingReview({
          attemptCount: 1,
          maxAttempts: 3,
        }),
      });

      const result = assembler.formatChainResponse(context, { isChainFormatting: true } as any);

      expect(result).toContain('Gate Review Required');
      expect(result).toContain('(attempt 2/3)');
      expect(result).toContain('chain_id=');
      expect(result).toContain('gate_verdict');
    });

    test('renders without attempt info when maxAttempts is 1', () => {
      const context = createChainContext({
        currentStep: 1,
        totalSteps: 3,
        pendingReview: makePendingReview({
          attemptCount: 0,
          maxAttempts: 1,
        }),
      });

      const result = assembler.formatChainResponse(context, { isChainFormatting: true } as any);

      expect(result).toContain('Gate Review Required');
      expect(result).not.toContain('(attempt');
    });

    test('phase guard review shows structural header', () => {
      const context = createChainContext({
        currentStep: 1,
        totalSteps: 2,
        pendingReview: makePendingReview({
          gateIds: ['__phase_guard__'],
          prompts: [],
        }),
      });

      const result = assembler.formatChainResponse(context, { isChainFormatting: true } as any);

      expect(result).toContain('Structural Review Required');
    });

    test('mixed phase guard + regular gates shows combined header', () => {
      const context = createChainContext({
        currentStep: 1,
        totalSteps: 2,
        pendingReview: makePendingReview({
          gateIds: ['__phase_guard__', 'code-quality'],
          prompts: [
            { gateId: 'code-quality', gateName: 'Code Quality', criteriaSummary: 'Check code' },
          ],
        }),
      });

      const result = assembler.formatChainResponse(context, { isChainFormatting: true } as any);

      expect(result).toContain('Structural + Gate Review Required');
    });

    test('gate review suppresses final step message', () => {
      const context = createChainContext({
        currentStep: 3,
        totalSteps: 3,
        pendingReview: makePendingReview(),
      });

      const result = assembler.formatChainResponse(context, { isChainFormatting: true } as any);

      expect(result).toContain('Gate Review Required');
      expect(result).not.toContain('Chain execution complete');
    });
  });

  describe('buildFinalStepMessage + isFinalChainStep', () => {
    test('renders completion on final chain step', () => {
      const context = createChainContext({
        currentStep: 3,
        totalSteps: 3,
        strategy: 'chain',
      });

      const result = assembler.formatChainResponse(context, { isChainFormatting: true } as any);

      expect(result).toContain('Chain execution complete');
    });

    test('does not render completion when not final step', () => {
      const context = createChainContext({
        currentStep: 1,
        totalSteps: 3,
        strategy: 'chain',
      });

      const result = assembler.formatChainResponse(context, { isChainFormatting: true } as any);

      expect(result).not.toContain('Chain execution complete');
    });

    test('strategy single suppresses chain completion (Bug A guard)', () => {
      const context = createChainContext({
        currentStep: 1,
        totalSteps: 1,
        strategy: 'single',
      });

      const result = assembler.formatChainResponse(context, { isChainFormatting: true } as any);

      expect(result).not.toContain('Chain execution complete');
    });

    test('completion includes re-run CTA from buildUsageCTA', () => {
      const context = createChainContext({
        currentStep: 3,
        totalSteps: 3,
        strategy: 'chain',
      });

      const result = assembler.formatChainResponse(context, { isChainFormatting: true } as any);

      expect(result).toContain('Chain execution complete');
      expect(result).toContain('Re-run:');
    });
  });

  describe('buildChainFooter — non-delegation paths', () => {
    test('progress line mid-chain', () => {
      const context = createChainContext({
        currentStep: 2,
        totalSteps: 4,
      });

      const footer = assembler.buildChainFooter(context);

      expect(footer).toContain('Progress 2/4');
    });

    test('completion line on final step', () => {
      const context = createChainContext({
        currentStep: 3,
        totalSteps: 3,
      });

      const footer = assembler.buildChainFooter(context);

      expect(footer).toContain('Chain complete (3/3)');
    });

    test('gate review next line when pendingReview exists', () => {
      const context = createChainContext({
        currentStep: 1,
        totalSteps: 3,
        pendingReview: makePendingReview(),
      });

      const footer = assembler.buildChainFooter(context);

      expect(footer).toContain('gate_verdict');
      expect(footer).toContain('user_response');
    });

    test('user_response next line when no review (mid-chain)', () => {
      const context = createChainContext({
        currentStep: 1,
        totalSteps: 3,
      });

      const footer = assembler.buildChainFooter(context);

      expect(footer).toContain('user_response');
      expect(footer).not.toContain('gate_verdict');
    });
  });

  describe('formatBlockedResponse', () => {
    test('renders blocked response with gate IDs', () => {
      const context = createChainContext({
        currentStep: 1,
        totalSteps: 2,
        blockedGateIds: ['quality'],
        responseBlocked: true,
      });

      const result = assembler.formatBlockedResponse(context);

      expect(result).toContain('Response Blocked');
      expect(result).toContain('quality');
    });

    test('includes resume instructions with chainId', () => {
      const context = createChainContext({
        currentStep: 1,
        totalSteps: 2,
        chainId: 'chain-blocked#1',
        blockedGateIds: ['quality'],
        responseBlocked: true,
      });

      const result = assembler.formatBlockedResponse(context);

      expect(result).toContain('Resume:');
      expect(result).toContain('chain_id="chain-blocked#1"');
    });

    test('renders without resume when no chainId', () => {
      const context = new ExecutionContext({ command: '>>demo-prompt' });
      context.state.gates.blockedGateIds = ['quality'];
      // No sessionContext at all

      const result = assembler.formatBlockedResponse(context);

      expect(result).toContain('Response Blocked');
      expect(result).not.toContain('Resume:');
    });
  });

  describe('advisory warnings', () => {
    test('renders advisory warnings in single prompt', () => {
      const context = new ExecutionContext({ command: '>>demo-prompt' });
      context.executionResults = {
        content: 'Test output',
        metadata: {},
        generatedAt: Date.now(),
      };
      context.parsedCommand = {
        promptId: 'demo-prompt',
        rawArgs: '',
        format: 'symbolic' as const,
        confidence: 0.9,
        convertedPrompt: basePrompt,
        promptArgs: { text: 'hello' },
        metadata: {
          originalCommand: '>>demo-prompt',
          parseStrategy: 'symbolic',
          detectedFormat: 'symbolic',
          warnings: [],
        },
      };
      context.state.gates.advisoryWarnings = ['Low confidence detected'];

      const result = assembler.formatSinglePromptResponse(context, {} as any);

      expect(result).toContain('Advisory Gate Warnings');
      expect(result).toContain('Low confidence detected');
    });

    test('renders advisory warnings in chain response', () => {
      const context = createChainContext({
        currentStep: 1,
        totalSteps: 2,
        advisoryWarnings: ['Phase guard warning: check structure'],
      });

      const result = assembler.formatChainResponse(context, { isChainFormatting: true } as any);

      expect(result).toContain('Advisory Gate Warnings');
      expect(result).toContain('Phase guard warning: check structure');
    });
  });
});
