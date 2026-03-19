/**
 * Methodology Schema (Zod)
 *
 * Defines the canonical schema for methodology YAML files.
 * Used by both:
 * - RuntimeMethodologyLoader (runtime validation)
 * - validate-methodologies.js (CI validation)
 *
 * This ensures SSOT - any schema change is enforced everywhere.
 */
import { z } from 'zod';
export declare const MethodologyGateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    methodologyArea: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    validationCriteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    criteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    severity: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    description?: string | undefined;
    severity?: "critical" | "high" | "medium" | "low" | undefined;
    methodologyArea?: string | undefined;
    priority?: "critical" | "high" | "medium" | "low" | undefined;
    validationCriteria?: string[] | undefined;
    criteria?: string[] | undefined;
}, {
    name: string;
    id: string;
    description?: string | undefined;
    severity?: "critical" | "high" | "medium" | "low" | undefined;
    methodologyArea?: string | undefined;
    priority?: "critical" | "high" | "medium" | "low" | undefined;
    validationCriteria?: string[] | undefined;
    criteria?: string[] | undefined;
}>;
export type MethodologyGate = z.infer<typeof MethodologyGateSchema>;
export declare const TemplateSuggestionSchema: z.ZodObject<{
    section: z.ZodEnum<["system", "user"]>;
    type: z.ZodEnum<["addition", "structure", "modification"]>;
    description: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    methodologyJustification: z.ZodOptional<z.ZodString>;
    impact: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
}, "strip", z.ZodTypeAny, {
    type: "structure" | "addition" | "modification";
    section: "user" | "system";
    content?: string | undefined;
    description?: string | undefined;
    methodologyJustification?: string | undefined;
    impact?: "high" | "medium" | "low" | undefined;
}, {
    type: "structure" | "addition" | "modification";
    section: "user" | "system";
    content?: string | undefined;
    description?: string | undefined;
    methodologyJustification?: string | undefined;
    impact?: "high" | "medium" | "low" | undefined;
}>;
export type TemplateSuggestion = z.infer<typeof TemplateSuggestionSchema>;
export declare const PhaseGuardSchema: z.ZodObject<{
    required: z.ZodOptional<z.ZodBoolean>;
    min_length: z.ZodOptional<z.ZodNumber>;
    max_length: z.ZodOptional<z.ZodNumber>;
    contains_any: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    contains_all: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    matches_pattern: z.ZodOptional<z.ZodString>;
    forbidden_terms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    required?: boolean | undefined;
    min_length?: number | undefined;
    max_length?: number | undefined;
    contains_any?: string[] | undefined;
    contains_all?: string[] | undefined;
    matches_pattern?: string | undefined;
    forbidden_terms?: string[] | undefined;
}, {
    required?: boolean | undefined;
    min_length?: number | undefined;
    max_length?: number | undefined;
    contains_any?: string[] | undefined;
    contains_all?: string[] | undefined;
    matches_pattern?: string | undefined;
    forbidden_terms?: string[] | undefined;
}>;
export type PhaseGuard = z.infer<typeof PhaseGuardSchema>;
export declare const ProcessingStepSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    methodologyBasis: z.ZodString;
    order: z.ZodNumber;
    required: z.ZodBoolean;
    section_header: z.ZodOptional<z.ZodString>;
    guards: z.ZodOptional<z.ZodObject<{
        required: z.ZodOptional<z.ZodBoolean>;
        min_length: z.ZodOptional<z.ZodNumber>;
        max_length: z.ZodOptional<z.ZodNumber>;
        contains_any: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        contains_all: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        matches_pattern: z.ZodOptional<z.ZodString>;
        forbidden_terms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        required?: boolean | undefined;
        min_length?: number | undefined;
        max_length?: number | undefined;
        contains_any?: string[] | undefined;
        contains_all?: string[] | undefined;
        matches_pattern?: string | undefined;
        forbidden_terms?: string[] | undefined;
    }, {
        required?: boolean | undefined;
        min_length?: number | undefined;
        max_length?: number | undefined;
        contains_any?: string[] | undefined;
        contains_all?: string[] | undefined;
        matches_pattern?: string | undefined;
        forbidden_terms?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    description: string;
    required: boolean;
    methodologyBasis: string;
    order: number;
    section_header?: string | undefined;
    guards?: {
        required?: boolean | undefined;
        min_length?: number | undefined;
        max_length?: number | undefined;
        contains_any?: string[] | undefined;
        contains_all?: string[] | undefined;
        matches_pattern?: string | undefined;
        forbidden_terms?: string[] | undefined;
    } | undefined;
}, {
    name: string;
    id: string;
    description: string;
    required: boolean;
    methodologyBasis: string;
    order: number;
    section_header?: string | undefined;
    guards?: {
        required?: boolean | undefined;
        min_length?: number | undefined;
        max_length?: number | undefined;
        contains_any?: string[] | undefined;
        contains_all?: string[] | undefined;
        matches_pattern?: string | undefined;
        forbidden_terms?: string[] | undefined;
    } | undefined;
}>;
export type ProcessingStepYaml = z.infer<typeof ProcessingStepSchema>;
export declare const ExecutionStepSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    action: z.ZodString;
    methodologyPhase: z.ZodString;
    dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    expected_output: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    action: string;
    methodologyPhase: string;
    dependencies: string[];
    expected_output: string;
}, {
    name: string;
    id: string;
    action: string;
    methodologyPhase: string;
    expected_output: string;
    dependencies?: string[] | undefined;
}>;
export type ExecutionStepYaml = z.infer<typeof ExecutionStepSchema>;
export declare const PhasesFileSchema: z.ZodObject<{
    processingSteps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        methodologyBasis: z.ZodString;
        order: z.ZodNumber;
        required: z.ZodBoolean;
        section_header: z.ZodOptional<z.ZodString>;
        guards: z.ZodOptional<z.ZodObject<{
            required: z.ZodOptional<z.ZodBoolean>;
            min_length: z.ZodOptional<z.ZodNumber>;
            max_length: z.ZodOptional<z.ZodNumber>;
            contains_any: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            contains_all: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            matches_pattern: z.ZodOptional<z.ZodString>;
            forbidden_terms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            required?: boolean | undefined;
            min_length?: number | undefined;
            max_length?: number | undefined;
            contains_any?: string[] | undefined;
            contains_all?: string[] | undefined;
            matches_pattern?: string | undefined;
            forbidden_terms?: string[] | undefined;
        }, {
            required?: boolean | undefined;
            min_length?: number | undefined;
            max_length?: number | undefined;
            contains_any?: string[] | undefined;
            contains_all?: string[] | undefined;
            matches_pattern?: string | undefined;
            forbidden_terms?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        description: string;
        required: boolean;
        methodologyBasis: string;
        order: number;
        section_header?: string | undefined;
        guards?: {
            required?: boolean | undefined;
            min_length?: number | undefined;
            max_length?: number | undefined;
            contains_any?: string[] | undefined;
            contains_all?: string[] | undefined;
            matches_pattern?: string | undefined;
            forbidden_terms?: string[] | undefined;
        } | undefined;
    }, {
        name: string;
        id: string;
        description: string;
        required: boolean;
        methodologyBasis: string;
        order: number;
        section_header?: string | undefined;
        guards?: {
            required?: boolean | undefined;
            min_length?: number | undefined;
            max_length?: number | undefined;
            contains_any?: string[] | undefined;
            contains_all?: string[] | undefined;
            matches_pattern?: string | undefined;
            forbidden_terms?: string[] | undefined;
        } | undefined;
    }>, "many">>;
    executionSteps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        action: z.ZodString;
        methodologyPhase: z.ZodString;
        dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        expected_output: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        action: string;
        methodologyPhase: string;
        dependencies: string[];
        expected_output: string;
    }, {
        name: string;
        id: string;
        action: string;
        methodologyPhase: string;
        expected_output: string;
        dependencies?: string[] | undefined;
    }>, "many">>;
    templateEnhancements: z.ZodOptional<z.ZodObject<{
        systemPromptAdditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        userPromptModifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        contextualHints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        systemPromptAdditions?: string[] | undefined;
        userPromptModifications?: string[] | undefined;
        contextualHints?: string[] | undefined;
    }, {
        systemPromptAdditions?: string[] | undefined;
        userPromptModifications?: string[] | undefined;
        contextualHints?: string[] | undefined;
    }>>;
    executionFlow: z.ZodOptional<z.ZodObject<{
        preProcessingSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        postProcessingSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        validationSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        preProcessingSteps?: string[] | undefined;
        postProcessingSteps?: string[] | undefined;
        validationSteps?: string[] | undefined;
    }, {
        preProcessingSteps?: string[] | undefined;
        postProcessingSteps?: string[] | undefined;
        validationSteps?: string[] | undefined;
    }>>;
    qualityIndicators: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    executionTypeEnhancements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    processingSteps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        methodologyBasis: z.ZodString;
        order: z.ZodNumber;
        required: z.ZodBoolean;
        section_header: z.ZodOptional<z.ZodString>;
        guards: z.ZodOptional<z.ZodObject<{
            required: z.ZodOptional<z.ZodBoolean>;
            min_length: z.ZodOptional<z.ZodNumber>;
            max_length: z.ZodOptional<z.ZodNumber>;
            contains_any: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            contains_all: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            matches_pattern: z.ZodOptional<z.ZodString>;
            forbidden_terms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            required?: boolean | undefined;
            min_length?: number | undefined;
            max_length?: number | undefined;
            contains_any?: string[] | undefined;
            contains_all?: string[] | undefined;
            matches_pattern?: string | undefined;
            forbidden_terms?: string[] | undefined;
        }, {
            required?: boolean | undefined;
            min_length?: number | undefined;
            max_length?: number | undefined;
            contains_any?: string[] | undefined;
            contains_all?: string[] | undefined;
            matches_pattern?: string | undefined;
            forbidden_terms?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        description: string;
        required: boolean;
        methodologyBasis: string;
        order: number;
        section_header?: string | undefined;
        guards?: {
            required?: boolean | undefined;
            min_length?: number | undefined;
            max_length?: number | undefined;
            contains_any?: string[] | undefined;
            contains_all?: string[] | undefined;
            matches_pattern?: string | undefined;
            forbidden_terms?: string[] | undefined;
        } | undefined;
    }, {
        name: string;
        id: string;
        description: string;
        required: boolean;
        methodologyBasis: string;
        order: number;
        section_header?: string | undefined;
        guards?: {
            required?: boolean | undefined;
            min_length?: number | undefined;
            max_length?: number | undefined;
            contains_any?: string[] | undefined;
            contains_all?: string[] | undefined;
            matches_pattern?: string | undefined;
            forbidden_terms?: string[] | undefined;
        } | undefined;
    }>, "many">>;
    executionSteps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        action: z.ZodString;
        methodologyPhase: z.ZodString;
        dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        expected_output: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        action: string;
        methodologyPhase: string;
        dependencies: string[];
        expected_output: string;
    }, {
        name: string;
        id: string;
        action: string;
        methodologyPhase: string;
        expected_output: string;
        dependencies?: string[] | undefined;
    }>, "many">>;
    templateEnhancements: z.ZodOptional<z.ZodObject<{
        systemPromptAdditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        userPromptModifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        contextualHints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        systemPromptAdditions?: string[] | undefined;
        userPromptModifications?: string[] | undefined;
        contextualHints?: string[] | undefined;
    }, {
        systemPromptAdditions?: string[] | undefined;
        userPromptModifications?: string[] | undefined;
        contextualHints?: string[] | undefined;
    }>>;
    executionFlow: z.ZodOptional<z.ZodObject<{
        preProcessingSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        postProcessingSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        validationSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        preProcessingSteps?: string[] | undefined;
        postProcessingSteps?: string[] | undefined;
        validationSteps?: string[] | undefined;
    }, {
        preProcessingSteps?: string[] | undefined;
        postProcessingSteps?: string[] | undefined;
        validationSteps?: string[] | undefined;
    }>>;
    qualityIndicators: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    executionTypeEnhancements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    processingSteps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        methodologyBasis: z.ZodString;
        order: z.ZodNumber;
        required: z.ZodBoolean;
        section_header: z.ZodOptional<z.ZodString>;
        guards: z.ZodOptional<z.ZodObject<{
            required: z.ZodOptional<z.ZodBoolean>;
            min_length: z.ZodOptional<z.ZodNumber>;
            max_length: z.ZodOptional<z.ZodNumber>;
            contains_any: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            contains_all: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            matches_pattern: z.ZodOptional<z.ZodString>;
            forbidden_terms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            required?: boolean | undefined;
            min_length?: number | undefined;
            max_length?: number | undefined;
            contains_any?: string[] | undefined;
            contains_all?: string[] | undefined;
            matches_pattern?: string | undefined;
            forbidden_terms?: string[] | undefined;
        }, {
            required?: boolean | undefined;
            min_length?: number | undefined;
            max_length?: number | undefined;
            contains_any?: string[] | undefined;
            contains_all?: string[] | undefined;
            matches_pattern?: string | undefined;
            forbidden_terms?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        description: string;
        required: boolean;
        methodologyBasis: string;
        order: number;
        section_header?: string | undefined;
        guards?: {
            required?: boolean | undefined;
            min_length?: number | undefined;
            max_length?: number | undefined;
            contains_any?: string[] | undefined;
            contains_all?: string[] | undefined;
            matches_pattern?: string | undefined;
            forbidden_terms?: string[] | undefined;
        } | undefined;
    }, {
        name: string;
        id: string;
        description: string;
        required: boolean;
        methodologyBasis: string;
        order: number;
        section_header?: string | undefined;
        guards?: {
            required?: boolean | undefined;
            min_length?: number | undefined;
            max_length?: number | undefined;
            contains_any?: string[] | undefined;
            contains_all?: string[] | undefined;
            matches_pattern?: string | undefined;
            forbidden_terms?: string[] | undefined;
        } | undefined;
    }>, "many">>;
    executionSteps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        action: z.ZodString;
        methodologyPhase: z.ZodString;
        dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        expected_output: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        action: string;
        methodologyPhase: string;
        dependencies: string[];
        expected_output: string;
    }, {
        name: string;
        id: string;
        action: string;
        methodologyPhase: string;
        expected_output: string;
        dependencies?: string[] | undefined;
    }>, "many">>;
    templateEnhancements: z.ZodOptional<z.ZodObject<{
        systemPromptAdditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        userPromptModifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        contextualHints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        systemPromptAdditions?: string[] | undefined;
        userPromptModifications?: string[] | undefined;
        contextualHints?: string[] | undefined;
    }, {
        systemPromptAdditions?: string[] | undefined;
        userPromptModifications?: string[] | undefined;
        contextualHints?: string[] | undefined;
    }>>;
    executionFlow: z.ZodOptional<z.ZodObject<{
        preProcessingSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        postProcessingSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        validationSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        preProcessingSteps?: string[] | undefined;
        postProcessingSteps?: string[] | undefined;
        validationSteps?: string[] | undefined;
    }, {
        preProcessingSteps?: string[] | undefined;
        postProcessingSteps?: string[] | undefined;
        validationSteps?: string[] | undefined;
    }>>;
    qualityIndicators: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    executionTypeEnhancements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">>;
export type PhasesFileYaml = z.infer<typeof PhasesFileSchema>;
export declare const MethodologySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    methodology: z.ZodString;
    version: z.ZodString;
    enabled: z.ZodBoolean;
    description: z.ZodOptional<z.ZodString>;
    gates: z.ZodOptional<z.ZodObject<{
        include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        include?: string[] | undefined;
        exclude?: string[] | undefined;
    }, {
        include?: string[] | undefined;
        exclude?: string[] | undefined;
    }>>;
    methodologyGates: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        methodologyArea: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
        validationCriteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        criteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        severity: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        description?: string | undefined;
        severity?: "critical" | "high" | "medium" | "low" | undefined;
        methodologyArea?: string | undefined;
        priority?: "critical" | "high" | "medium" | "low" | undefined;
        validationCriteria?: string[] | undefined;
        criteria?: string[] | undefined;
    }, {
        name: string;
        id: string;
        description?: string | undefined;
        severity?: "critical" | "high" | "medium" | "low" | undefined;
        methodologyArea?: string | undefined;
        priority?: "critical" | "high" | "medium" | "low" | undefined;
        validationCriteria?: string[] | undefined;
        criteria?: string[] | undefined;
    }>, "many">>;
    phasesFile: z.ZodOptional<z.ZodString>;
    judgePromptFile: z.ZodOptional<z.ZodString>;
    systemPromptGuidance: z.ZodOptional<z.ZodString>;
    toolDescriptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateSuggestions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        section: z.ZodEnum<["system", "user"]>;
        type: z.ZodEnum<["addition", "structure", "modification"]>;
        description: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
        methodologyJustification: z.ZodOptional<z.ZodString>;
        impact: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
    }, "strip", z.ZodTypeAny, {
        type: "structure" | "addition" | "modification";
        section: "user" | "system";
        content?: string | undefined;
        description?: string | undefined;
        methodologyJustification?: string | undefined;
        impact?: "high" | "medium" | "low" | undefined;
    }, {
        type: "structure" | "addition" | "modification";
        section: "user" | "system";
        content?: string | undefined;
        description?: string | undefined;
        methodologyJustification?: string | undefined;
        impact?: "high" | "medium" | "low" | undefined;
    }>, "many">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    name: z.ZodString;
    methodology: z.ZodString;
    version: z.ZodString;
    enabled: z.ZodBoolean;
    description: z.ZodOptional<z.ZodString>;
    gates: z.ZodOptional<z.ZodObject<{
        include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        include?: string[] | undefined;
        exclude?: string[] | undefined;
    }, {
        include?: string[] | undefined;
        exclude?: string[] | undefined;
    }>>;
    methodologyGates: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        methodologyArea: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
        validationCriteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        criteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        severity: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        description?: string | undefined;
        severity?: "critical" | "high" | "medium" | "low" | undefined;
        methodologyArea?: string | undefined;
        priority?: "critical" | "high" | "medium" | "low" | undefined;
        validationCriteria?: string[] | undefined;
        criteria?: string[] | undefined;
    }, {
        name: string;
        id: string;
        description?: string | undefined;
        severity?: "critical" | "high" | "medium" | "low" | undefined;
        methodologyArea?: string | undefined;
        priority?: "critical" | "high" | "medium" | "low" | undefined;
        validationCriteria?: string[] | undefined;
        criteria?: string[] | undefined;
    }>, "many">>;
    phasesFile: z.ZodOptional<z.ZodString>;
    judgePromptFile: z.ZodOptional<z.ZodString>;
    systemPromptGuidance: z.ZodOptional<z.ZodString>;
    toolDescriptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateSuggestions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        section: z.ZodEnum<["system", "user"]>;
        type: z.ZodEnum<["addition", "structure", "modification"]>;
        description: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
        methodologyJustification: z.ZodOptional<z.ZodString>;
        impact: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
    }, "strip", z.ZodTypeAny, {
        type: "structure" | "addition" | "modification";
        section: "user" | "system";
        content?: string | undefined;
        description?: string | undefined;
        methodologyJustification?: string | undefined;
        impact?: "high" | "medium" | "low" | undefined;
    }, {
        type: "structure" | "addition" | "modification";
        section: "user" | "system";
        content?: string | undefined;
        description?: string | undefined;
        methodologyJustification?: string | undefined;
        impact?: "high" | "medium" | "low" | undefined;
    }>, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    name: z.ZodString;
    methodology: z.ZodString;
    version: z.ZodString;
    enabled: z.ZodBoolean;
    description: z.ZodOptional<z.ZodString>;
    gates: z.ZodOptional<z.ZodObject<{
        include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        include?: string[] | undefined;
        exclude?: string[] | undefined;
    }, {
        include?: string[] | undefined;
        exclude?: string[] | undefined;
    }>>;
    methodologyGates: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        methodologyArea: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
        validationCriteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        criteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        severity: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        description?: string | undefined;
        severity?: "critical" | "high" | "medium" | "low" | undefined;
        methodologyArea?: string | undefined;
        priority?: "critical" | "high" | "medium" | "low" | undefined;
        validationCriteria?: string[] | undefined;
        criteria?: string[] | undefined;
    }, {
        name: string;
        id: string;
        description?: string | undefined;
        severity?: "critical" | "high" | "medium" | "low" | undefined;
        methodologyArea?: string | undefined;
        priority?: "critical" | "high" | "medium" | "low" | undefined;
        validationCriteria?: string[] | undefined;
        criteria?: string[] | undefined;
    }>, "many">>;
    phasesFile: z.ZodOptional<z.ZodString>;
    judgePromptFile: z.ZodOptional<z.ZodString>;
    systemPromptGuidance: z.ZodOptional<z.ZodString>;
    toolDescriptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateSuggestions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        section: z.ZodEnum<["system", "user"]>;
        type: z.ZodEnum<["addition", "structure", "modification"]>;
        description: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
        methodologyJustification: z.ZodOptional<z.ZodString>;
        impact: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
    }, "strip", z.ZodTypeAny, {
        type: "structure" | "addition" | "modification";
        section: "user" | "system";
        content?: string | undefined;
        description?: string | undefined;
        methodologyJustification?: string | undefined;
        impact?: "high" | "medium" | "low" | undefined;
    }, {
        type: "structure" | "addition" | "modification";
        section: "user" | "system";
        content?: string | undefined;
        description?: string | undefined;
        methodologyJustification?: string | undefined;
        impact?: "high" | "medium" | "low" | undefined;
    }>, "many">>;
}, z.ZodTypeAny, "passthrough">>;
export type MethodologyYaml = z.infer<typeof MethodologySchema>;
export interface MethodologySchemaValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Validate a methodology definition against the schema
 *
 * @param data - Raw YAML data to validate
 * @param expectedId - Expected ID (should match directory name)
 * @returns Validation result with errors and warnings
 */
export declare function validateMethodologySchema(data: unknown, expectedId?: string): MethodologySchemaValidationResult;
/**
 * Validate a phases.yaml file against the schema.
 *
 * Checks structural validity and provides warnings for phase guard best practices
 * (e.g., marker without guards or vice versa).
 *
 * @param data - Raw YAML data from phases.yaml
 * @returns Validation result with errors and warnings
 */
export declare function validatePhasesSchema(data: unknown): MethodologySchemaValidationResult;
