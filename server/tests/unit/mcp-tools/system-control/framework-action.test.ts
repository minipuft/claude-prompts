import { describe, expect, jest, test } from '@jest/globals';

import { createConsolidatedSystemControl } from '../../../../src/mcp/tools/system-control/index.js';

import type { Logger } from '../../../../src/infra/logging/index.js';

const createLogger = (): Logger => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

describe('System Control framework action scope propagation', () => {
  test('delegates framework switch through framework manager', async () => {
    const frameworkManager = {
      switchFramework: jest.fn().mockResolvedValue({
        success: true,
        framework: {
          id: 'react',
          name: 'ReACT',
          description: 'Test',
          type: 'ReACT',
          executionGuidelines: ['g1'],
        },
      }),
      listFrameworks: jest.fn().mockReturnValue([]),
    };

    const systemControl = createConsolidatedSystemControl(
      createLogger(),
      { sendNotification: jest.fn() } as any,
      () => Promise.resolve()
    );
    systemControl.setFrameworkManager(frameworkManager as any);

    await systemControl.handleAction(
      { action: 'framework', operation: 'switch', framework: 'react' },
      { organizationId: 'org-a', workspaceId: 'workspace-a' }
    );

    expect(frameworkManager.switchFramework).toHaveBeenCalledWith(
      'react',
      expect.stringContaining('react')
    );
  });

  test('framework list reads state store without identity-scoped args', async () => {
    const frameworkStateStore = {
      getCurrentState: jest.fn().mockReturnValue({
        activeFramework: 'react',
      }),
      getAvailableFrameworks: jest.fn().mockReturnValue([
        {
          id: 'react',
          name: 'ReACT',
          type: 'ReACT',
          description: 'Test',
          priority: 1,
          enabled: true,
          applicableTypes: [],
          executionGuidelines: [],
        },
      ]),
    };

    const frameworkManager = {
      listFrameworks: jest.fn().mockReturnValue([]),
    };

    const systemControl = createConsolidatedSystemControl(
      createLogger(),
      { sendNotification: jest.fn() } as any,
      () => Promise.resolve()
    );
    systemControl.setFrameworkManager(frameworkManager as any);
    systemControl.setFrameworkStateStore(frameworkStateStore as any);

    await systemControl.handleAction(
      { action: 'framework', operation: 'list', show_details: true },
      { organizationId: 'org-a', workspaceId: 'workspace-a' }
    );

    expect(frameworkStateStore.getCurrentState).toHaveBeenCalledWith();
    expect(frameworkManager.listFrameworks).toHaveBeenCalledWith();
  });
});
