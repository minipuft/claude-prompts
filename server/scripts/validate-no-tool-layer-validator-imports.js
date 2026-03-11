#!/usr/bin/env node

import { execSync } from 'node:child_process';

const IMPORT_PATTERN = [
  'cli-shared/resource-validation',
  'modules/prompts/prompt-schema',
  'engine/gates/core/gate-schema',
  'engine/frameworks/methodology/methodology-schema',
  'modules/formatting/core/style-schema',
  'modules/automation/core/script-schema',
].join('|');

const TARGET = 'src/mcp/tools';

function validateBoundary() {
  try {
    const output = execSync(
      `rg -n "^import\\\\s+.*from\\\\s+['\\\"][^'\\\"]*(${IMPORT_PATTERN})\\\\.js['\\\"];?" ${TARGET}`,
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    if (output.trim() !== '') {
      console.error('Validator boundary violation: direct validator imports found in tool layer.');
      console.error(output.trim());
      console.error(
        '\nUse ResourceVerificationService from modules/resources/services instead of direct schema imports.'
      );
      process.exit(1);
    }
  } catch (error) {
    if (error.status === 1) {
      console.log('Tool-layer validator boundary check passed.');
      process.exit(0);
    }

    const stderr = typeof error.stderr === 'string' ? error.stderr.trim() : '';
    console.error(stderr !== '' ? stderr : String(error));
    process.exit(1);
  }

  console.log('Tool-layer validator boundary check passed.');
}

validateBoundary();
