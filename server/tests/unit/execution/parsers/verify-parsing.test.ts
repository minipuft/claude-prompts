import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import { createSymbolicCommandParser } from '../../../../src/engine/execution/parsers/symbolic-operator-parser.js';
import { UnifiedCommandParser } from '../../../../src/engine/execution/parsers/command-parser.js';

import type { Logger } from '../../../../src/infra/logging/index.js';
import type { GateOperator } from '../../../../src/engine/execution/parsers/types/operator-types.js';
import type { ConvertedPrompt } from '../../../../src/shared/types/index.js';

const mockLogger: Logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

const basePrompts: ConvertedPrompt[] = [
  {
    id: 'p',
    name: 'Test Prompt',
    description: 'Test prompt',
    category: 'test',
    arguments: [{ name: 'arg', description: 'test arg', required: false }],
    userMessageTemplate: '{{arg}}',
  },
] as ConvertedPrompt[];

describe(':: verify: parsing', () => {
  let symbolicParser: ReturnType<typeof createSymbolicCommandParser>;
  let commandParser: UnifiedCommandParser;

  beforeEach(() => {
    jest.clearAllMocks();
    symbolicParser = createSymbolicCommandParser(mockLogger);
    commandParser = new UnifiedCommandParser(mockLogger);
  });

  describe('operator detection (symbolicParser.detectOperators)', () => {
    test('basic verify detects shellVerify with command', () => {
      const result = symbolicParser.detectOperators('>>p :: verify:"echo ok"');

      expect(result.hasOperators).toBe(true);
      expect(result.operatorTypes).toContain('gate');

      const gateOp = result.operators.find((op) => op.type === 'gate') as GateOperator;
      expect(gateOp).toBeDefined();
      expect(gateOp.shellVerify).toBeDefined();
      expect(gateOp.shellVerify!.command).toBe('echo ok');
      expect(gateOp.shellVerify!.preset).toBeUndefined();
    });

    test(':fast preset is detected', () => {
      const result = symbolicParser.detectOperators('>>p :: verify:"cmd" :fast');

      const gateOp = result.operators.find((op) => op.type === 'gate') as GateOperator;
      expect(gateOp.shellVerify).toBeDefined();
      expect(gateOp.shellVerify!.command).toBe('cmd');
      expect(gateOp.shellVerify!.preset).toBe('fast');
    });

    test(':full preset is detected', () => {
      const result = symbolicParser.detectOperators('>>p :: verify:"cmd" :full');

      const gateOp = result.operators.find((op) => op.type === 'gate') as GateOperator;
      expect(gateOp.shellVerify!.preset).toBe('full');
    });

    test(':extended preset is detected', () => {
      const result = symbolicParser.detectOperators('>>p :: verify:"cmd" :extended');

      const gateOp = result.operators.find((op) => op.type === 'gate') as GateOperator;
      expect(gateOp.shellVerify!.preset).toBe('extended');
    });

    test('loop:true is detected', () => {
      const result = symbolicParser.detectOperators('>>p :: verify:"cmd" loop:true');

      const gateOp = result.operators.find((op) => op.type === 'gate') as GateOperator;
      expect(gateOp.shellVerify!.command).toBe('cmd');
      expect(gateOp.shellVerify!.loop).toBe(true);
    });

    test('max:N override is detected', () => {
      const result = symbolicParser.detectOperators('>>p :: verify:"cmd" :fast max:3');

      const gateOp = result.operators.find((op) => op.type === 'gate') as GateOperator;
      expect(gateOp.shellVerify!.preset).toBe('fast');
      expect(gateOp.shellVerify!.maxIterations).toBe(3);
    });

    test('timeout:N override is detected (converted to ms)', () => {
      const result = symbolicParser.detectOperators('>>p :: verify:"cmd" timeout:60');

      const gateOp = result.operators.find((op) => op.type === 'gate') as GateOperator;
      expect(gateOp.shellVerify!.timeout).toBe(60000);
    });

    test('combined options: preset + loop + max', () => {
      const result = symbolicParser.detectOperators(
        '>>p :: verify:"npm test" :full loop:true max:10'
      );

      const gateOp = result.operators.find((op) => op.type === 'gate') as GateOperator;
      expect(gateOp.shellVerify!.command).toBe('npm test');
      expect(gateOp.shellVerify!.preset).toBe('full');
      expect(gateOp.shellVerify!.loop).toBe(true);
      expect(gateOp.shellVerify!.maxIterations).toBe(10);
    });
  });

  describe('command stripping (commandParser.parseCommand)', () => {
    test('verify syntax is stripped from baseArgs', async () => {
      const result = await commandParser.parseCommand('>>p :: verify:"echo ok" :fast', basePrompts);

      // The rawArgs should not contain :: verify: or :fast
      expect(result.rawArgs).not.toContain('verify');
      expect(result.rawArgs).not.toContain(':fast');
      expect(result.rawArgs.trim()).toBe('');
    });

    test('user args are preserved, verify options stripped', async () => {
      const result = await commandParser.parseCommand(
        '>>p arg:val :: verify:"cmd" :fast',
        basePrompts
      );

      expect(result.rawArgs).toContain('arg:val');
      expect(result.rawArgs).not.toContain(':fast');
      expect(result.rawArgs).not.toContain('verify');
    });

    test('loop:true stripped from baseArgs', async () => {
      const result = await commandParser.parseCommand(
        '>>p :: verify:"cmd" :fast loop:true',
        basePrompts
      );

      expect(result.rawArgs).not.toContain('loop');
      expect(result.rawArgs).not.toContain(':fast');
      expect(result.rawArgs.trim()).toBe('');
    });

    test('max:N and timeout:N stripped from rawArgs', async () => {
      const result = await commandParser.parseCommand(
        '>>p :: verify:"cmd" max:5 timeout:120',
        basePrompts
      );

      expect(result.rawArgs).not.toContain('max:');
      expect(result.rawArgs).not.toContain('timeout:');
      expect(result.rawArgs.trim()).toBe('');
    });
  });
});
