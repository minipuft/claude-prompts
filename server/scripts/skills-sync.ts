#!/usr/bin/env tsx
// Thin CLI wrapper — delegates to the canonical service module for full gate bundling support.
import { runSkillsSyncFromArgv } from '../src/modules/skills-sync/service.js';

runSkillsSyncFromArgv(process.argv).catch((err: Error) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
