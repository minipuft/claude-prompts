#!/usr/bin/env node

import { execSync } from 'node:child_process';

const PATTERN = [
  "gateConfiguration:\\s*args\\['gate_configuration'\\]\\s*\\|\\|\\s*args\\.gates",
  'args\\.gates\\s*\\|\\|\\s*currentPrompt\\?\\.gateConfiguration',
].join('|');

const TARGET = 'src/mcp/tools/resource-manager/prompt/services/prompt-lifecycle-processor.ts';

function runCheck() {
  try {
    const output = execSync(`rg -n "${PATTERN}" ${TARGET}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (output.trim() !== '') {
      console.error('Legacy prompt gate alias usage found:');
      console.error(output.trim());
      process.exit(1);
    }

    console.log('No legacy prompt gate alias usage found.');
  } catch (error) {
    if (error.status === 1) {
      console.log('No legacy prompt gate alias usage found.');
      process.exit(0);
    }

    const stderr = typeof error.stderr === 'string' ? error.stderr.trim() : '';
    console.error(stderr !== '' ? stderr : String(error));
    process.exit(1);
  }
}

runCheck();
