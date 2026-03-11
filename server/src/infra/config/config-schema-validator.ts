// @lifecycle canonical - Shared JSON schema validator for server config.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ErrorObject, ValidateFunction } from 'ajv';

type JsonSchema = Record<string, unknown>;

export interface ConfigSchemaValidationResult {
  valid: boolean;
  errors: string[];
}

interface CachedValidator {
  validator: ValidateFunction;
  schemaMtimeMs: number;
}

const validatorCache = new Map<string, CachedValidator>();

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) {
    return [];
  }

  return errors.map((error) => {
    const dataPath = error.instancePath || '(root)';
    const message = error.message || 'Validation failed';
    return `${dataPath}: ${message}`;
  });
}

async function getCompiledValidator(schemaPath: string): Promise<ValidateFunction> {
  const stat = await import('node:fs/promises').then((fs) => fs.stat(schemaPath));
  const cached = validatorCache.get(schemaPath);
  if (cached?.schemaMtimeMs === stat.mtimeMs) {
    return cached.validator;
  }

  const schemaContent = await readFile(schemaPath, 'utf8');
  const schema = JSON.parse(schemaContent) as JsonSchema;

  const AjvModule = await import('ajv');
  const AjvCtor = (AjvModule as unknown as { default: new (...args: any[]) => any }).default;
  const ajv = new AjvCtor({
    allErrors: true,
    strict: false,
  });
  const validator = ajv.compile(schema);

  validatorCache.set(schemaPath, {
    validator,
    schemaMtimeMs: stat.mtimeMs,
  });

  return validator;
}

function resolveSchemaPath(config: Record<string, unknown>, configPath: string): string {
  const schemaRef =
    typeof config['$schema'] === 'string' ? config['$schema'] : './config.schema.json';
  if (path.isAbsolute(schemaRef)) {
    return schemaRef;
  }
  return path.resolve(path.dirname(configPath), schemaRef);
}

export async function validateConfigAgainstSchema(
  config: Record<string, unknown>,
  configPath: string
): Promise<ConfigSchemaValidationResult> {
  try {
    const schemaPath = resolveSchemaPath(config, configPath);
    const validator = await getCompiledValidator(schemaPath);
    const valid = validator(config);

    if (!valid) {
      return {
        valid: false,
        errors: formatAjvErrors(validator.errors),
      };
    }

    return {
      valid: true,
      errors: [],
    };
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}
