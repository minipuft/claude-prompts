import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runValidatedMutation, toggleEnabled, readConfig, getConfigValue } from '@cli-shared/index.js';
import { resolveWorkspace, findResource, resolveResourceDir, discoverResourcePaths } from '../lib/workspace.js';
import { output } from '../lib/output.js';
import { TYPE_MAP, TYPE_CONFIG, singularName } from '../lib/types.js';
import { printValidationFailure } from '../lib/resource-validation.js';

interface ToggleOptions {
  workspace?: string;
  json: boolean;
  type?: string;
  id?: string;
  noValidate?: boolean;
}

export async function toggle(options: ToggleOptions): Promise<number> {
  const type = options.type ? TYPE_MAP[options.type] : undefined;

  if (!type || (type !== 'methodologies' && type !== 'styles')) {
    console.error(
      `Usage: cpm toggle <methodology|style> <id>\n` +
        (options.type
          ? `Only methodologies and styles have an 'enabled' field.`
          : 'Resource type is required.'),
    );
    return 1;
  }

  if (!options.id) {
    console.error('Usage: cpm toggle <methodology|style> <id>\nResource ID is required.');
    return 1;
  }

  const workspace = resolveWorkspace(options.workspace);
  const match = findResource(workspace, type, options.id);

  if (!match) {
    console.error(`${singularName(type)} '${options.id}' not found.`);
    return 1;
  }

  const config = TYPE_CONFIG[type];
  const mutation = runValidatedMutation({
    resourceType: type,
    resourceId: options.id,
    resourceDir: match.dir,
    entryFile: config.entryFile,
    validate: !options.noValidate,
    mutate: () => toggleEnabled(match.dir, config.entryFile),
  });

  if (!mutation.success) {
    if (mutation.validation) {
      printValidationFailure(mutation.validation, {
        json: options.json,
        action: `toggle ${singularName(type)} '${options.id}'`,
        rolledBack: mutation.rolledBack,
      });
      return 1;
    }
    console.error(mutation.error ?? mutation.operation.error ?? 'Toggle failed.');
    return 1;
  }
  const result = mutation.operation;

  if (options.json) {
    output({ id: options.id, type: singularName(type), previousValue: result.previousValue, newValue: result.newValue }, { json: true });
  } else {
    console.log(`Toggled ${singularName(type)} '${options.id}': enabled ${result.previousValue} -> ${result.newValue}`);
    // Advisory: if all resources of this type are now disabled, hint at config
    if (result.newValue === false && type === 'methodologies') {
      printAllDisabledAdvisory(workspace, type);
    }
  }
  return 0;
}

function printAllDisabledAdvisory(workspace: string, type: 'methodologies' | 'styles'): void {
  try {
    const baseDir = resolveResourceDir(workspace, type);
    const typeConfig = TYPE_CONFIG[type];
    const resources = discoverResourcePaths(baseDir, typeConfig.entryFile, typeConfig.nested);

    let anyEnabled = false;

    for (const { dir } of resources) {
      const content = readFileSync(join(dir, typeConfig.entryFile), 'utf8');
      if (/enabled:\s*true/i.test(content)) {
        anyEnabled = true;
        break;
      }
    }

    if (!anyEnabled && resources.length > 0) {
      const configKeyMap: Record<string, string> = { methodologies: 'methodologies.mode' };
      const configKey = configKeyMap[type];
      if (!configKey) return;

      const configResult = readConfig(workspace);
      if (configResult.success && configResult.config) {
        const mode = getConfigValue(configResult.config, configKey);
        if (mode === 'on') {
          console.log(`\nTip: All ${type} are now disabled. To turn off the subsystem:`);
          console.log(`  cpm config set ${configKey} off`);
        }
      }
    }
  } catch {
    // Silently ignore advisory errors
  }
}
