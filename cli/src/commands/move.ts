import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { movePromptCategory, runValidatedMutation } from '@cli-shared/index.js';
import { resolveWorkspace, resolveResourceDir, findResource } from '../lib/workspace.js';
import { output } from '../lib/output.js';
import { TYPE_MAP } from '../lib/types.js';
import { printValidationFailure } from '../lib/resource-validation.js';

interface MoveOptions {
  workspace?: string;
  json: boolean;
  type?: string;
  id?: string;
  category?: string;
  noValidate?: boolean;
}

export async function move(options: MoveOptions): Promise<number> {
  const type = options.type ? TYPE_MAP[options.type] : undefined;

  if (type !== 'prompts') {
    console.error(
      `Usage: cpm move prompt <id> --category <new-category>\n` +
        (options.type ? `Only prompts have categories. Use 'rename' for other types.` : 'Resource type is required.'),
    );
    return 1;
  }

  if (!options.id) {
    console.error('Usage: cpm move prompt <id> --category <new-category>\nPrompt ID is required.');
    return 1;
  }

  if (!options.category) {
    console.error('Usage: cpm move prompt <id> --category <new-category>\nTarget category is required (--category).');
    return 1;
  }

  const workspace = resolveWorkspace(options.workspace);
  const match = findResource(workspace, 'prompts', options.id);

  if (!match) {
    console.error(`Prompt '${options.id}' not found.`);
    return 1;
  }

  // Read current category for display
  const yamlPath = join(match.dir, 'prompt.yaml');
  const content = readFileSync(yamlPath, 'utf8');
  const catMatch = /^category:\s*(.+)$/m.exec(content);
  const oldCategory = catMatch?.[1]?.trim() ?? 'unknown';

  const promptsBaseDir = resolveResourceDir(workspace, 'prompts');
  const mutation = runValidatedMutation({
    resourceType: 'prompts',
    resourceId: options.id,
    resourceDir: match.dir,
    entryFile: 'prompt.yaml',
    validate: !options.noValidate,
    mutate: () =>
      movePromptCategory(match.dir, 'prompt.yaml', options.id!, options.category!, promptsBaseDir),
  });

  if (!mutation.success) {
    if (mutation.validation) {
      printValidationFailure(mutation.validation, {
        json: options.json,
        action: `move prompt '${options.id}'`,
        rolledBack: mutation.rolledBack,
      });
      return 1;
    }
    console.error(mutation.error ?? mutation.operation.error ?? 'Move failed.');
    return 1;
  }
  const result = mutation.operation;

  if (options.json) {
    output({ id: options.id, oldCategory, newCategory: options.category, oldDir: result.oldDir, newDir: result.newDir }, { json: true });
  } else {
    console.log(`Moved prompt '${options.id}': ${oldCategory} -> ${options.category}`);
    console.log(`Note: chain steps referencing '${oldCategory}/${options.id}' may need updating to '${options.category}/${options.id}'.`);
  }
  return 0;
}
