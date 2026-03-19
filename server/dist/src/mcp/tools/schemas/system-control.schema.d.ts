/**
 * System Control Input Schema
 *
 * Extracted from inline schema in index.ts. This is the SSOT for system_control
 * parameter validation — replaces the generated mcp-schemas.ts.
 */
import { z } from 'zod';
import type { DescriptionResolver } from './prompt-engine.schema.js';
/**
 * Build the system_control input schema with methodology-aware descriptions.
 */
export declare function buildSystemControlSchema(resolve?: DescriptionResolver): z.ZodObject<{
    action: z.ZodString;
    operation: z.ZodOptional<z.ZodString>;
    session_id: z.ZodOptional<z.ZodString>;
    framework: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
    persist: z.ZodOptional<z.ZodBoolean>;
    show_details: z.ZodOptional<z.ZodBoolean>;
    include_history: z.ZodOptional<z.ZodBoolean>;
    include_metrics: z.ZodOptional<z.ZodBoolean>;
    topic: z.ZodOptional<z.ZodString>;
    search_query: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: string;
    framework?: string | undefined;
    reason?: string | undefined;
    search_query?: string | undefined;
    topic?: string | undefined;
    operation?: string | undefined;
    persist?: boolean | undefined;
    session_id?: string | undefined;
    show_details?: boolean | undefined;
    include_history?: boolean | undefined;
    include_metrics?: boolean | undefined;
}, {
    action: string;
    framework?: string | undefined;
    reason?: string | undefined;
    search_query?: string | undefined;
    topic?: string | undefined;
    operation?: string | undefined;
    persist?: boolean | undefined;
    session_id?: string | undefined;
    show_details?: boolean | undefined;
    include_history?: boolean | undefined;
    include_metrics?: boolean | undefined;
}>;
/** Inferred input type */
export type SystemControlInput = z.infer<ReturnType<typeof buildSystemControlSchema>>;
