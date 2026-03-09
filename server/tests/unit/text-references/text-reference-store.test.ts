import { createLogger } from '../../../src/infra/logging/index.js';
import { TextReferenceStore } from '../../../src/modules/text-refs/index.js';

const logger = createLogger({
  logFile: '/tmp/text-reference-manager.log',
  transport: 'stdio',
  enableDebug: false,
  configuredLevel: 'error',
});

describe('TextReferenceStore.buildChainVariables', () => {
  test('exposes step results and chain metadata', () => {
    const manager = new TextReferenceStore(logger);
    manager.storeChainStepResult('chain-1', 0, 'draft summary');
    manager.storeChainStepResult('chain-1', 1, 'final answer');

    const variables = manager.buildChainVariables('chain-1');

    expect(variables.step1_result).toBe('draft summary');
    expect(variables.step2_result).toBe('final answer');
    expect(variables.previous_step_result).toBe('final answer');
    expect(variables.chain_id).toBe('chain-1');
    expect(variables.step_results).toEqual({ 0: 'draft summary', 1: 'final answer' });
  });
});
