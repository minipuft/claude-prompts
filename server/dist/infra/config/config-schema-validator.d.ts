export interface ConfigSchemaValidationResult {
    valid: boolean;
    errors: string[];
}
export declare function validateConfigAgainstSchema(config: Record<string, unknown>, configPath: string): Promise<ConfigSchemaValidationResult>;
