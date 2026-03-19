/**
 * Prompt Engine Input Schema
 *
 * Extracted from inline schema in index.ts. This is the SSOT for prompt_engine
 * parameter validation — replaces the generated mcp-schemas.ts.
 *
 * The schema structure is fixed; parameter `.describe()` text is injected via
 * a resolver callback so methodology overlays can customize what the LLM sees.
 */
import { z } from 'zod';
/** Quick inline gate: {name, description} */
export declare const customCheckSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
}, {
    name: string;
    description: string;
}>;
/** Full gate definition with optional fields */
export declare const temporaryGateObjectSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    template: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["validation", "guidance"]>>;
    scope: z.ZodOptional<z.ZodEnum<["execution", "session", "chain", "step"]>>;
    description: z.ZodOptional<z.ZodString>;
    guidance: z.ZodOptional<z.ZodString>;
    criteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    pass_criteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    severity: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    source: z.ZodOptional<z.ZodEnum<["manual", "automatic", "analysis"]>>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    target_step_number: z.ZodOptional<z.ZodNumber>;
    apply_to_steps: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    guidance?: string | undefined;
    template?: string | undefined;
    type?: "validation" | "guidance" | undefined;
    source?: "manual" | "automatic" | "analysis" | undefined;
    name?: string | undefined;
    id?: string | undefined;
    description?: string | undefined;
    scope?: "execution" | "session" | "chain" | "step" | undefined;
    pass_criteria?: string[] | undefined;
    context?: Record<string, any> | undefined;
    severity?: "critical" | "high" | "medium" | "low" | undefined;
    target_step_number?: number | undefined;
    apply_to_steps?: number[] | undefined;
    criteria?: string[] | undefined;
}, {
    guidance?: string | undefined;
    template?: string | undefined;
    type?: "validation" | "guidance" | undefined;
    source?: "manual" | "automatic" | "analysis" | undefined;
    name?: string | undefined;
    id?: string | undefined;
    description?: string | undefined;
    scope?: "execution" | "session" | "chain" | "step" | undefined;
    pass_criteria?: string[] | undefined;
    context?: Record<string, any> | undefined;
    severity?: "critical" | "high" | "medium" | "low" | undefined;
    target_step_number?: number | undefined;
    apply_to_steps?: number[] | undefined;
    criteria?: string[] | undefined;
}>, {
    guidance?: string | undefined;
    template?: string | undefined;
    type?: "validation" | "guidance" | undefined;
    source?: "manual" | "automatic" | "analysis" | undefined;
    name?: string | undefined;
    id?: string | undefined;
    description?: string | undefined;
    scope?: "execution" | "session" | "chain" | "step" | undefined;
    pass_criteria?: string[] | undefined;
    context?: Record<string, any> | undefined;
    severity?: "critical" | "high" | "medium" | "low" | undefined;
    target_step_number?: number | undefined;
    apply_to_steps?: number[] | undefined;
    criteria?: string[] | undefined;
}, {
    guidance?: string | undefined;
    template?: string | undefined;
    type?: "validation" | "guidance" | undefined;
    source?: "manual" | "automatic" | "analysis" | undefined;
    name?: string | undefined;
    id?: string | undefined;
    description?: string | undefined;
    scope?: "execution" | "session" | "chain" | "step" | undefined;
    pass_criteria?: string[] | undefined;
    context?: Record<string, any> | undefined;
    severity?: "critical" | "high" | "medium" | "low" | undefined;
    target_step_number?: number | undefined;
    apply_to_steps?: number[] | undefined;
    criteria?: string[] | undefined;
}>;
/** Union of all accepted gate formats */
export declare const gateSpecUnionSchema: z.ZodUnion<[z.ZodString, z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
}, {
    name: string;
    description: string;
}>, z.ZodEffects<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    template: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["validation", "guidance"]>>;
    scope: z.ZodOptional<z.ZodEnum<["execution", "session", "chain", "step"]>>;
    description: z.ZodOptional<z.ZodString>;
    guidance: z.ZodOptional<z.ZodString>;
    criteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    pass_criteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    severity: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    source: z.ZodOptional<z.ZodEnum<["manual", "automatic", "analysis"]>>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    target_step_number: z.ZodOptional<z.ZodNumber>;
    apply_to_steps: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    guidance?: string | undefined;
    template?: string | undefined;
    type?: "validation" | "guidance" | undefined;
    source?: "manual" | "automatic" | "analysis" | undefined;
    name?: string | undefined;
    id?: string | undefined;
    description?: string | undefined;
    scope?: "execution" | "session" | "chain" | "step" | undefined;
    pass_criteria?: string[] | undefined;
    context?: Record<string, any> | undefined;
    severity?: "critical" | "high" | "medium" | "low" | undefined;
    target_step_number?: number | undefined;
    apply_to_steps?: number[] | undefined;
    criteria?: string[] | undefined;
}, {
    guidance?: string | undefined;
    template?: string | undefined;
    type?: "validation" | "guidance" | undefined;
    source?: "manual" | "automatic" | "analysis" | undefined;
    name?: string | undefined;
    id?: string | undefined;
    description?: string | undefined;
    scope?: "execution" | "session" | "chain" | "step" | undefined;
    pass_criteria?: string[] | undefined;
    context?: Record<string, any> | undefined;
    severity?: "critical" | "high" | "medium" | "low" | undefined;
    target_step_number?: number | undefined;
    apply_to_steps?: number[] | undefined;
    criteria?: string[] | undefined;
}>, {
    guidance?: string | undefined;
    template?: string | undefined;
    type?: "validation" | "guidance" | undefined;
    source?: "manual" | "automatic" | "analysis" | undefined;
    name?: string | undefined;
    id?: string | undefined;
    description?: string | undefined;
    scope?: "execution" | "session" | "chain" | "step" | undefined;
    pass_criteria?: string[] | undefined;
    context?: Record<string, any> | undefined;
    severity?: "critical" | "high" | "medium" | "low" | undefined;
    target_step_number?: number | undefined;
    apply_to_steps?: number[] | undefined;
    criteria?: string[] | undefined;
}, {
    guidance?: string | undefined;
    template?: string | undefined;
    type?: "validation" | "guidance" | undefined;
    source?: "manual" | "automatic" | "analysis" | undefined;
    name?: string | undefined;
    id?: string | undefined;
    description?: string | undefined;
    scope?: "execution" | "session" | "chain" | "step" | undefined;
    pass_criteria?: string[] | undefined;
    context?: Record<string, any> | undefined;
    severity?: "critical" | "high" | "medium" | "low" | undefined;
    target_step_number?: number | undefined;
    apply_to_steps?: number[] | undefined;
    criteria?: string[] | undefined;
}>]>;
/**
 * Callback that resolves parameter descriptions at registration time.
 * Allows methodology overlays to inject context-specific guidance.
 */
export type DescriptionResolver = (paramName: string, fallback: string) => string;
/**
 * Build the prompt_engine input schema with methodology-aware descriptions.
 *
 * @param verdictValidator - `(v: string) => boolean` for gate_verdict format validation
 * @param verdictMessage - validation error message for gate_verdict
 * @param resolve - optional description resolver for methodology overlays
 */
export declare function buildPromptEngineSchema(verdictValidator: (v: string) => boolean, verdictMessage: string, resolve?: DescriptionResolver): z.ZodObject<{
    command: z.ZodOptional<z.ZodString>;
    force_restart: z.ZodOptional<z.ZodBoolean>;
    chain_id: z.ZodOptional<z.ZodString>;
    gate_verdict: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    gate_action: z.ZodOptional<z.ZodEnum<["retry", "skip", "abort"]>>;
    user_response: z.ZodOptional<z.ZodString>;
    gates: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
    }, {
        name: string;
        description: string;
    }>, z.ZodEffects<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        template: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["validation", "guidance"]>>;
        scope: z.ZodOptional<z.ZodEnum<["execution", "session", "chain", "step"]>>;
        description: z.ZodOptional<z.ZodString>;
        guidance: z.ZodOptional<z.ZodString>;
        criteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        pass_criteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        severity: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
        source: z.ZodOptional<z.ZodEnum<["manual", "automatic", "analysis"]>>;
        context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        target_step_number: z.ZodOptional<z.ZodNumber>;
        apply_to_steps: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        guidance?: string | undefined;
        template?: string | undefined;
        type?: "validation" | "guidance" | undefined;
        source?: "manual" | "automatic" | "analysis" | undefined;
        name?: string | undefined;
        id?: string | undefined;
        description?: string | undefined;
        scope?: "execution" | "session" | "chain" | "step" | undefined;
        pass_criteria?: string[] | undefined;
        context?: Record<string, any> | undefined;
        severity?: "critical" | "high" | "medium" | "low" | undefined;
        target_step_number?: number | undefined;
        apply_to_steps?: number[] | undefined;
        criteria?: string[] | undefined;
    }, {
        guidance?: string | undefined;
        template?: string | undefined;
        type?: "validation" | "guidance" | undefined;
        source?: "manual" | "automatic" | "analysis" | undefined;
        name?: string | undefined;
        id?: string | undefined;
        description?: string | undefined;
        scope?: "execution" | "session" | "chain" | "step" | undefined;
        pass_criteria?: string[] | undefined;
        context?: Record<string, any> | undefined;
        severity?: "critical" | "high" | "medium" | "low" | undefined;
        target_step_number?: number | undefined;
        apply_to_steps?: number[] | undefined;
        criteria?: string[] | undefined;
    }>, {
        guidance?: string | undefined;
        template?: string | undefined;
        type?: "validation" | "guidance" | undefined;
        source?: "manual" | "automatic" | "analysis" | undefined;
        name?: string | undefined;
        id?: string | undefined;
        description?: string | undefined;
        scope?: "execution" | "session" | "chain" | "step" | undefined;
        pass_criteria?: string[] | undefined;
        context?: Record<string, any> | undefined;
        severity?: "critical" | "high" | "medium" | "low" | undefined;
        target_step_number?: number | undefined;
        apply_to_steps?: number[] | undefined;
        criteria?: string[] | undefined;
    }, {
        guidance?: string | undefined;
        template?: string | undefined;
        type?: "validation" | "guidance" | undefined;
        source?: "manual" | "automatic" | "analysis" | undefined;
        name?: string | undefined;
        id?: string | undefined;
        description?: string | undefined;
        scope?: "execution" | "session" | "chain" | "step" | undefined;
        pass_criteria?: string[] | undefined;
        context?: Record<string, any> | undefined;
        severity?: "critical" | "high" | "medium" | "low" | undefined;
        target_step_number?: number | undefined;
        apply_to_steps?: number[] | undefined;
        criteria?: string[] | undefined;
    }>]>, "many">>;
    options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    gates?: (string | {
        name: string;
        description: string;
    } | {
        guidance?: string | undefined;
        template?: string | undefined;
        type?: "validation" | "guidance" | undefined;
        source?: "manual" | "automatic" | "analysis" | undefined;
        name?: string | undefined;
        id?: string | undefined;
        description?: string | undefined;
        scope?: "execution" | "session" | "chain" | "step" | undefined;
        pass_criteria?: string[] | undefined;
        context?: Record<string, any> | undefined;
        severity?: "critical" | "high" | "medium" | "low" | undefined;
        target_step_number?: number | undefined;
        apply_to_steps?: number[] | undefined;
        criteria?: string[] | undefined;
    })[] | undefined;
    options?: Record<string, any> | undefined;
    chain_id?: string | undefined;
    gate_verdict?: string | undefined;
    command?: string | undefined;
    user_response?: string | undefined;
    gate_action?: "retry" | "skip" | "abort" | undefined;
    force_restart?: boolean | undefined;
}, {
    gates?: (string | {
        name: string;
        description: string;
    } | {
        guidance?: string | undefined;
        template?: string | undefined;
        type?: "validation" | "guidance" | undefined;
        source?: "manual" | "automatic" | "analysis" | undefined;
        name?: string | undefined;
        id?: string | undefined;
        description?: string | undefined;
        scope?: "execution" | "session" | "chain" | "step" | undefined;
        pass_criteria?: string[] | undefined;
        context?: Record<string, any> | undefined;
        severity?: "critical" | "high" | "medium" | "low" | undefined;
        target_step_number?: number | undefined;
        apply_to_steps?: number[] | undefined;
        criteria?: string[] | undefined;
    })[] | undefined;
    options?: Record<string, any> | undefined;
    chain_id?: string | undefined;
    gate_verdict?: string | undefined;
    command?: string | undefined;
    user_response?: string | undefined;
    gate_action?: "retry" | "skip" | "abort" | undefined;
    force_restart?: boolean | undefined;
}>;
/** Inferred input type (uses default descriptions — shape is identical regardless of resolver) */
export type PromptEngineInput = z.infer<ReturnType<typeof buildPromptEngineSchema>>;
