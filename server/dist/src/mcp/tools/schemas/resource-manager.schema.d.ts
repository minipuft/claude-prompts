/**
 * Resource Manager Input Schema
 *
 * Hand-written replacement for the generated resourceManagerSchema in mcp-schemas.ts.
 * Uses .passthrough() to allow methodology fields to flow through for advanced scenarios.
 */
import { z } from 'zod';
/**
 * Resource Manager input schema.
 *
 * Unlike prompt_engine/system_control, resource_manager descriptions come from
 * the contract JSON and are not rebuilt per-methodology at registration time.
 * The ToolDescriptionLoader handles methodology overlay for the tool-level description.
 */
export declare const resourceManagerInputSchema: z.ZodObject<{
    /** Type of resource to manage. Routes to appropriate handler. */
    resource_type: z.ZodEnum<["prompt", "gate", "methodology", "checkpoint"]>;
    /** Operation to perform. */
    action: z.ZodEnum<["create", "update", "delete", "reload", "list", "inspect", "analyze_type", "analyze_gates", "guide", "switch", "history", "rollback", "compare", "clear"]>;
    /** Resource identifier. Required for create, update, delete, inspect, reload, switch. */
    id: z.ZodOptional<z.ZodString>;
    /** Human-friendly name for the resource (create/update). */
    name: z.ZodOptional<z.ZodString>;
    /** Resource description explaining its purpose (create/update). */
    description: z.ZodOptional<z.ZodString>;
    /** Filter list to enabled resources only. Default: true. */
    enabled_only: z.ZodOptional<z.ZodBoolean>;
    /** Safety confirmation for delete operation. */
    confirm: z.ZodOptional<z.ZodBoolean>;
    /** Audit reason for reload/delete/switch operations. */
    reason: z.ZodOptional<z.ZodString>;
    /** [Prompt] Category tag for the prompt. */
    category: z.ZodOptional<z.ZodString>;
    /** [Prompt] Prompt body/template with Nunjucks placeholders. */
    user_message_template: z.ZodOptional<z.ZodString>;
    /** [Prompt] Optional system message for the prompt. */
    system_message: z.ZodOptional<z.ZodString>;
    /** [Prompt] Argument definitions for the prompt. */
    arguments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        description: string;
    }, {
        type: string;
        name: string;
        description: string;
    }>, "many">>;
    /** [Prompt] Chain steps definition for multi-step prompts. */
    chain_steps: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    /** [Prompt] Script tools to create with the prompt. */
    tools: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    /** [Prompt] Gate configuration: include, exclude, framework_gates. */
    gate_configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Prompt] Hint for execution type on creation. */
    execution_hint: z.ZodOptional<z.ZodEnum<["single", "chain"]>>;
    /** [Prompt] List filter query. */
    filter: z.ZodOptional<z.ZodString>;
    /** [Prompt] Output format for list/inspect. */
    format: z.ZodOptional<z.ZodEnum<["table", "json", "text"]>>;
    /** [Prompt] Detail level for list/inspect. */
    detail: z.ZodOptional<z.ZodEnum<["summary", "full"]>>;
    /** [Prompt] Search query for filtering (list action). */
    search_query: z.ZodOptional<z.ZodString>;
    /** [Gate] Gate type: validation (pass/fail) or guidance (advisory). */
    gate_type: z.ZodOptional<z.ZodEnum<["validation", "guidance"]>>;
    /** [Gate] Gate guidance content. */
    guidance: z.ZodOptional<z.ZodString>;
    /** [Gate] Structured pass criteria definitions. */
    pass_criteria: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    /** [Gate] Activation rules. */
    activation: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Gate] Retry configuration. */
    retry_config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Methodology] Methodology type identifier. */
    methodology: z.ZodOptional<z.ZodString>;
    /** [Methodology] System prompt guidance injected when active. */
    system_prompt_guidance: z.ZodOptional<z.ZodString>;
    /** [Methodology] Phase definitions. */
    phases: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    /** [Methodology] Gate configuration: include, exclude arrays. */
    gates: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Methodology] Tool description overlays when active. */
    tool_descriptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Methodology] Whether the methodology is enabled. */
    enabled: z.ZodOptional<z.ZodBoolean>;
    /** [Methodology] For switch: persist the change to config. */
    persist: z.ZodOptional<z.ZodBoolean>;
    /** [Versioning] Target version number for rollback action. */
    version: z.ZodOptional<z.ZodNumber>;
    /** [Versioning] Starting version number for compare action. */
    from_version: z.ZodOptional<z.ZodNumber>;
    /** [Versioning] Ending version number for compare action. */
    to_version: z.ZodOptional<z.ZodNumber>;
    /** [Versioning] Max versions to return in history. */
    limit: z.ZodOptional<z.ZodNumber>;
    /** [Versioning] Skip auto-versioning on update. */
    skip_version: z.ZodOptional<z.ZodBoolean>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    /** Type of resource to manage. Routes to appropriate handler. */
    resource_type: z.ZodEnum<["prompt", "gate", "methodology", "checkpoint"]>;
    /** Operation to perform. */
    action: z.ZodEnum<["create", "update", "delete", "reload", "list", "inspect", "analyze_type", "analyze_gates", "guide", "switch", "history", "rollback", "compare", "clear"]>;
    /** Resource identifier. Required for create, update, delete, inspect, reload, switch. */
    id: z.ZodOptional<z.ZodString>;
    /** Human-friendly name for the resource (create/update). */
    name: z.ZodOptional<z.ZodString>;
    /** Resource description explaining its purpose (create/update). */
    description: z.ZodOptional<z.ZodString>;
    /** Filter list to enabled resources only. Default: true. */
    enabled_only: z.ZodOptional<z.ZodBoolean>;
    /** Safety confirmation for delete operation. */
    confirm: z.ZodOptional<z.ZodBoolean>;
    /** Audit reason for reload/delete/switch operations. */
    reason: z.ZodOptional<z.ZodString>;
    /** [Prompt] Category tag for the prompt. */
    category: z.ZodOptional<z.ZodString>;
    /** [Prompt] Prompt body/template with Nunjucks placeholders. */
    user_message_template: z.ZodOptional<z.ZodString>;
    /** [Prompt] Optional system message for the prompt. */
    system_message: z.ZodOptional<z.ZodString>;
    /** [Prompt] Argument definitions for the prompt. */
    arguments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        description: string;
    }, {
        type: string;
        name: string;
        description: string;
    }>, "many">>;
    /** [Prompt] Chain steps definition for multi-step prompts. */
    chain_steps: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    /** [Prompt] Script tools to create with the prompt. */
    tools: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    /** [Prompt] Gate configuration: include, exclude, framework_gates. */
    gate_configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Prompt] Hint for execution type on creation. */
    execution_hint: z.ZodOptional<z.ZodEnum<["single", "chain"]>>;
    /** [Prompt] List filter query. */
    filter: z.ZodOptional<z.ZodString>;
    /** [Prompt] Output format for list/inspect. */
    format: z.ZodOptional<z.ZodEnum<["table", "json", "text"]>>;
    /** [Prompt] Detail level for list/inspect. */
    detail: z.ZodOptional<z.ZodEnum<["summary", "full"]>>;
    /** [Prompt] Search query for filtering (list action). */
    search_query: z.ZodOptional<z.ZodString>;
    /** [Gate] Gate type: validation (pass/fail) or guidance (advisory). */
    gate_type: z.ZodOptional<z.ZodEnum<["validation", "guidance"]>>;
    /** [Gate] Gate guidance content. */
    guidance: z.ZodOptional<z.ZodString>;
    /** [Gate] Structured pass criteria definitions. */
    pass_criteria: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    /** [Gate] Activation rules. */
    activation: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Gate] Retry configuration. */
    retry_config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Methodology] Methodology type identifier. */
    methodology: z.ZodOptional<z.ZodString>;
    /** [Methodology] System prompt guidance injected when active. */
    system_prompt_guidance: z.ZodOptional<z.ZodString>;
    /** [Methodology] Phase definitions. */
    phases: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    /** [Methodology] Gate configuration: include, exclude arrays. */
    gates: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Methodology] Tool description overlays when active. */
    tool_descriptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Methodology] Whether the methodology is enabled. */
    enabled: z.ZodOptional<z.ZodBoolean>;
    /** [Methodology] For switch: persist the change to config. */
    persist: z.ZodOptional<z.ZodBoolean>;
    /** [Versioning] Target version number for rollback action. */
    version: z.ZodOptional<z.ZodNumber>;
    /** [Versioning] Starting version number for compare action. */
    from_version: z.ZodOptional<z.ZodNumber>;
    /** [Versioning] Ending version number for compare action. */
    to_version: z.ZodOptional<z.ZodNumber>;
    /** [Versioning] Max versions to return in history. */
    limit: z.ZodOptional<z.ZodNumber>;
    /** [Versioning] Skip auto-versioning on update. */
    skip_version: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    /** Type of resource to manage. Routes to appropriate handler. */
    resource_type: z.ZodEnum<["prompt", "gate", "methodology", "checkpoint"]>;
    /** Operation to perform. */
    action: z.ZodEnum<["create", "update", "delete", "reload", "list", "inspect", "analyze_type", "analyze_gates", "guide", "switch", "history", "rollback", "compare", "clear"]>;
    /** Resource identifier. Required for create, update, delete, inspect, reload, switch. */
    id: z.ZodOptional<z.ZodString>;
    /** Human-friendly name for the resource (create/update). */
    name: z.ZodOptional<z.ZodString>;
    /** Resource description explaining its purpose (create/update). */
    description: z.ZodOptional<z.ZodString>;
    /** Filter list to enabled resources only. Default: true. */
    enabled_only: z.ZodOptional<z.ZodBoolean>;
    /** Safety confirmation for delete operation. */
    confirm: z.ZodOptional<z.ZodBoolean>;
    /** Audit reason for reload/delete/switch operations. */
    reason: z.ZodOptional<z.ZodString>;
    /** [Prompt] Category tag for the prompt. */
    category: z.ZodOptional<z.ZodString>;
    /** [Prompt] Prompt body/template with Nunjucks placeholders. */
    user_message_template: z.ZodOptional<z.ZodString>;
    /** [Prompt] Optional system message for the prompt. */
    system_message: z.ZodOptional<z.ZodString>;
    /** [Prompt] Argument definitions for the prompt. */
    arguments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        description: string;
    }, {
        type: string;
        name: string;
        description: string;
    }>, "many">>;
    /** [Prompt] Chain steps definition for multi-step prompts. */
    chain_steps: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    /** [Prompt] Script tools to create with the prompt. */
    tools: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    /** [Prompt] Gate configuration: include, exclude, framework_gates. */
    gate_configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Prompt] Hint for execution type on creation. */
    execution_hint: z.ZodOptional<z.ZodEnum<["single", "chain"]>>;
    /** [Prompt] List filter query. */
    filter: z.ZodOptional<z.ZodString>;
    /** [Prompt] Output format for list/inspect. */
    format: z.ZodOptional<z.ZodEnum<["table", "json", "text"]>>;
    /** [Prompt] Detail level for list/inspect. */
    detail: z.ZodOptional<z.ZodEnum<["summary", "full"]>>;
    /** [Prompt] Search query for filtering (list action). */
    search_query: z.ZodOptional<z.ZodString>;
    /** [Gate] Gate type: validation (pass/fail) or guidance (advisory). */
    gate_type: z.ZodOptional<z.ZodEnum<["validation", "guidance"]>>;
    /** [Gate] Gate guidance content. */
    guidance: z.ZodOptional<z.ZodString>;
    /** [Gate] Structured pass criteria definitions. */
    pass_criteria: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    /** [Gate] Activation rules. */
    activation: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Gate] Retry configuration. */
    retry_config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Methodology] Methodology type identifier. */
    methodology: z.ZodOptional<z.ZodString>;
    /** [Methodology] System prompt guidance injected when active. */
    system_prompt_guidance: z.ZodOptional<z.ZodString>;
    /** [Methodology] Phase definitions. */
    phases: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    /** [Methodology] Gate configuration: include, exclude arrays. */
    gates: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Methodology] Tool description overlays when active. */
    tool_descriptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** [Methodology] Whether the methodology is enabled. */
    enabled: z.ZodOptional<z.ZodBoolean>;
    /** [Methodology] For switch: persist the change to config. */
    persist: z.ZodOptional<z.ZodBoolean>;
    /** [Versioning] Target version number for rollback action. */
    version: z.ZodOptional<z.ZodNumber>;
    /** [Versioning] Starting version number for compare action. */
    from_version: z.ZodOptional<z.ZodNumber>;
    /** [Versioning] Ending version number for compare action. */
    to_version: z.ZodOptional<z.ZodNumber>;
    /** [Versioning] Max versions to return in history. */
    limit: z.ZodOptional<z.ZodNumber>;
    /** [Versioning] Skip auto-versioning on update. */
    skip_version: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">>;
/** Inferred input type */
export type ResourceManagerInput = z.infer<typeof resourceManagerInputSchema>;
