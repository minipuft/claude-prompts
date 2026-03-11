#!/usr/bin/env tsx
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { validateConfigAgainstSchema } from '../src/infra/config/config-schema-validator.js';

async function main(): Promise<void> {
  const serverRoot = process.cwd();
  const configPath = path.resolve(serverRoot, 'config.json');
  const raw = await readFile(configPath, 'utf8');
  const config = JSON.parse(raw) as Record<string, unknown>;

  const result = await validateConfigAgainstSchema(config, configPath);
  if (!result.valid) {
    console.error('Config schema validation failed:');
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Config schema validation passed');
}

main().catch((error) => {
  console.error('Config schema validation error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
