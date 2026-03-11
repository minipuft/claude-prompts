/**
 * Types of content that can be injected into prompts.
 * Each type is controlled separately for fine-grained customization.
 */
export type InjectionType = 'system-prompt' | 'gate-guidance' | 'style-guidance';
/**
 * Sources from which an injection decision can originate.
 * Listed in resolution priority order (highest to lowest).
 */
export type InjectionDecisionSource = 'modifier' | 'runtime-override' | 'step-config' | 'chain-config' | 'category-config' | 'global-config' | 'system-default';
/**
 * Clear, unambiguous injection decision.
 *
 * IMPORTANT: `inject: true` means INJECT, `inject: false` means SKIP.
 * No inversions, no confusion.
 */
export interface InjectionDecision {
    /** Whether to inject this content. true = inject, false = skip. */
    inject: boolean;
    /** Human-readable explanation of why this decision was made. */
    reason: string;
    /** The source that determined this decision. */
    source: InjectionDecisionSource;
    /** Timestamp when this decision was made. */
    decidedAt: number;
    /** Target execution contexts for this injection. Propagated from config. */
    target?: InjectionTarget;
}
/**
 * Frequency modes for injection.
 * Controls how often content is injected during chain execution.
 */
export type InjectionFrequencyMode = 'every' | 'first-only' | 'never';
/**
 * Execution context types for injection targeting.
 * Determines which execution paths receive injections.
 */
export type ExecutionContextType = 'step' | 'gate_review';
/**
 * Target modes for injection.
 * Controls WHERE content is injected during chain execution.
 *
 * - 'steps': Inject only on normal step execution (not gate reviews)
 * - 'gates': Inject only on gate review steps (not normal execution)
 * - 'both': Inject on both step execution and gate reviews (default)
 */
export type InjectionTarget = 'steps' | 'gates' | 'both';
/**
 * Frequency configuration for injection.
 */
export interface InjectionFrequency {
    /** The injection mode. */
    mode: InjectionFrequencyMode;
    /** For 'every' mode: inject every N steps. Default is 1 (every step). */
    interval?: number;
}
/**
 * Conditions that trigger injection rules.
 */
export type InjectionConditionWhen = {
    type: 'gate-status';
    gateId: string;
    status: 'pass' | 'fail' | 'pending';
} | {
    type: 'step-type';
    stepType: string;
} | {
    type: 'step-number';
    comparison: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
    value: number;
} | {
    type: 'previous-step-result';
    status: 'success' | 'failure' | 'skipped';
} | {
    type: 'chain-position';
    position: 'first' | 'last' | 'middle';
} | {
    type: 'always';
};
/**
 * A conditional injection rule.
 * When the condition matches, the `then` action is taken.
 */
export interface InjectionCondition {
    /** Unique identifier for this condition. */
    id: string;
    /** The condition to evaluate. */
    when: InjectionConditionWhen;
    /** Action to take when condition matches. */
    then: 'inject' | 'skip' | 'inherit';
    /** Optional reason override for decision explanation. */
    reason?: string;
}
/**
 * Configuration for a single injection type.
 */
export interface InjectionTypeConfig {
    /** Whether this injection type is enabled. */
    enabled: boolean;
    /** Frequency configuration for chain execution. */
    frequency?: InjectionFrequency;
    /** Target execution contexts for injection. Default: 'both'. */
    target?: InjectionTarget;
    /** Conditional rules evaluated in order. First match wins. */
    conditions?: InjectionCondition[];
}
/**
 * Input data for making an injection decision.
 * Decoupled from ExecutionContext for testability.
 */
export interface InjectionDecisionInput {
    /** The type of injection being decided. */
    injectionType: InjectionType;
    /** Current step number in chain (1-based). Undefined for single prompts. */
    currentStep?: number;
    /** Total steps in chain. Undefined for single prompts. */
    totalSteps?: number;
    /** Previous step result. Undefined for first step or single prompts. */
    previousStepResult?: 'success' | 'failure' | 'skipped';
    /** Step type identifier (e.g., 'analysis', 'generation'). */
    stepType?: string;
    /** Gate statuses for condition evaluation. */
    gateStatuses?: Map<string, 'pass' | 'fail' | 'pending'>;
    /** Modifiers from command parsing. */
    modifiers?: {
        clean?: boolean;
        lean?: boolean;
        judge?: boolean;
    };
    /** Session-level overrides from runtime. */
    sessionOverrides?: Partial<Record<InjectionType, boolean>>;
    /** Category ID for hierarchical lookup. */
    categoryId?: string;
    /** Chain ID for hierarchical lookup. */
    chainId?: string;
    /** Prompt ID for hierarchical lookup. */
    promptId?: string;
    /** Current execution context type for target filtering. */
    executionContext?: ExecutionContextType;
}
/**
 * Complete state for all injection types.
 * Stored in pipeline internal state.
 */
export interface InjectionState {
    /** Decision for system prompt injection. */
    systemPrompt?: InjectionDecision;
    /** Decision for gate guidance injection. */
    gateGuidance?: InjectionDecision;
    /** Decision for style guidance injection. */
    styleGuidance?: InjectionDecision;
    /** Current step number in chain execution. */
    currentStep?: number;
    /** Step number when system prompt was last injected. */
    lastSystemPromptStep?: number;
    /** Active session overrides. */
    sessionOverrides?: Partial<Record<InjectionType, boolean>>;
    /** Current execution context type (step or gate_review). */
    executionContext?: ExecutionContextType;
}
/**
 * Result of hierarchical config resolution.
 * Combines configs from all levels with source tracking.
 */
export interface ResolvedInjectionConfig {
    /** The effective configuration for this injection type. */
    config: InjectionTypeConfig;
    /** The source that provided this configuration. */
    source: InjectionDecisionSource;
    /** Chain of sources consulted during resolution. */
    resolutionPath: InjectionDecisionSource[];
}
/**
 * Default settings for all injection types.
 * Applied when no specific configuration exists.
 */
export interface InjectionDefaults {
    /** Whether system-prompt injection is enabled by default. */
    'system-prompt'?: boolean;
    /** Whether gate-guidance injection is enabled by default. */
    'gate-guidance'?: boolean;
    /** Whether style-guidance injection is enabled by default. */
    'style-guidance'?: boolean;
}
/**
 * Configuration for a specific injection type at any hierarchy level.
 */
export interface InjectionTypeRuleConfig {
    /** Whether this injection type is enabled at this level. */
    enabled?: boolean;
    /** Frequency configuration for chain execution. */
    frequency?: InjectionFrequency;
    /** Target execution contexts for injection. Default: 'both'. */
    target?: InjectionTarget;
    /** Conditional rules. First match wins. */
    conditions?: InjectionCondition[];
}
/**
 * Category-level injection configuration.
 */
export interface CategoryInjectionConfig {
    /** The category ID this configuration applies to. */
    categoryId: string;
    /** System prompt injection rules for this category. */
    'system-prompt'?: InjectionTypeRuleConfig;
    /** Gate guidance injection rules for this category. */
    'gate-guidance'?: InjectionTypeRuleConfig;
    /** Style guidance injection rules for this category. */
    'style-guidance'?: InjectionTypeRuleConfig;
}
/**
 * Chain-level injection configuration.
 * Uses pattern matching for flexible chain targeting.
 */
export interface ChainInjectionConfig {
    /** Glob pattern to match chain IDs (e.g., "research-*", "dev-workflow"). */
    chainPattern: string;
    /** System prompt injection rules for matching chains. */
    'system-prompt'?: InjectionTypeRuleConfig;
    /** Gate guidance injection rules for matching chains. */
    'gate-guidance'?: InjectionTypeRuleConfig;
    /** Style guidance injection rules for matching chains. */
    'style-guidance'?: InjectionTypeRuleConfig;
}
/**
 * Step-level injection configuration within a chain.
 * Can target specific steps by number or pattern.
 */
export interface StepInjectionConfig {
    /** Step number (1-based) or pattern ("first", "last", "odd", "even"). */
    stepTarget: number | 'first' | 'last' | 'odd' | 'even';
    /** System prompt injection rules for this step. */
    'system-prompt'?: InjectionTypeRuleConfig;
    /** Gate guidance injection rules for this step. */
    'gate-guidance'?: InjectionTypeRuleConfig;
    /** Style guidance injection rules for this step. */
    'style-guidance'?: InjectionTypeRuleConfig;
}
/**
 * Root injection configuration in config.json.
 * Supports hierarchical customization: Global -> Category -> Chain -> Step.
 */
export interface InjectionConfig {
    /**
     * Default enabled states for each injection type.
     * Applied when no more specific configuration exists.
     */
    defaults?: InjectionDefaults;
    /**
     * Global configuration for system-prompt injection.
     * Applies to all prompts/chains unless overridden.
     */
    'system-prompt'?: InjectionTypeConfig;
    /**
     * Global configuration for gate-guidance injection.
     * Applies to all prompts/chains unless overridden.
     */
    'gate-guidance'?: InjectionTypeConfig;
    /**
     * Global configuration for style-guidance injection.
     * Applies to all prompts/chains unless overridden.
     */
    'style-guidance'?: InjectionTypeConfig;
    /**
     * Category-level overrides.
     * Higher priority than global, lower than chain.
     */
    categories?: CategoryInjectionConfig[];
    /**
     * Chain-level overrides.
     * Higher priority than category, lower than step.
     */
    chains?: ChainInjectionConfig[];
    /**
     * Step-level overrides within chains.
     * Highest priority (except runtime overrides and modifiers).
     */
    steps?: StepInjectionConfig[];
}
/**
 * Runtime override for injection settings.
 * Set via system_control injection:override action.
 */
export interface InjectionRuntimeOverride {
    /** The injection type being overridden. */
    type: InjectionType;
    /** Whether to force inject (true), force skip (false), or clear override (undefined). */
    enabled?: boolean;
    /** Target execution contexts for injection. Overrides config target when set. */
    target?: InjectionTarget;
    /** Scope of the override. */
    scope: 'session' | 'chain' | 'step';
    /** Identifier for scoped overrides (chain ID or step number). */
    scopeId?: string;
    /** When this override was set. */
    setAt: number;
    /** Optional expiration time. */
    expiresAt?: number;
}
/**
 * Active session state for injection overrides.
 * Persisted during runtime, cleared on session end.
 */
export interface InjectionSessionState {
    /** Active runtime overrides, keyed by injection type. */
    overrides: Map<InjectionType, InjectionRuntimeOverride>;
    /** Override history for debugging/analytics. */
    history: InjectionRuntimeOverride[];
}
/**
 * All available injection types.
 */
export declare const INJECTION_TYPES: readonly InjectionType[];
/**
 * Resolution priority order (highest to lowest).
 * Used for hierarchical configuration resolution.
 */
export declare const RESOLUTION_PRIORITY: readonly InjectionDecisionSource[];
/**
 * Default target for all injection types.
 * 'both' ensures injection on both step execution and gate reviews.
 */
export declare const DEFAULT_INJECTION_TARGET: InjectionTarget;
/**
 * Default frequency for system prompt injection.
 * Injects every 2 steps (step 1, 3, 5, etc.)
 */
export declare const DEFAULT_SYSTEM_PROMPT_FREQUENCY: InjectionFrequency;
/**
 * Default frequency for gate guidance injection.
 * Injects on every step.
 */
export declare const DEFAULT_GATE_GUIDANCE_FREQUENCY: InjectionFrequency;
/**
 * Default frequency for style guidance injection.
 * Injects on first step only.
 */
export declare const DEFAULT_STYLE_GUIDANCE_FREQUENCY: InjectionFrequency;
/**
 * Default configuration for system-prompt injection.
 */
export declare const DEFAULT_SYSTEM_PROMPT_CONFIG: InjectionTypeConfig;
/**
 * Default configuration for gate-guidance injection.
 */
export declare const DEFAULT_GATE_GUIDANCE_CONFIG: InjectionTypeConfig;
/**
 * Default configuration for style-guidance injection.
 */
export declare const DEFAULT_STYLE_GUIDANCE_CONFIG: InjectionTypeConfig;
/**
 * Complete default injection configuration.
 * Used when no config.json injection section exists.
 */
export declare const DEFAULT_INJECTION_CONFIG: InjectionConfig;
/**
 * Map of injection type to its default configuration.
 */
export declare const DEFAULT_CONFIG_BY_TYPE: Readonly<Record<InjectionType, InjectionTypeConfig>>;
/**
 * Modifier effects on injection.
 * Maps modifiers to which injection types they disable.
 */
export declare const MODIFIER_EFFECTS: Readonly<Record<string, readonly InjectionType[]>>;
/**
 * Modifiers that force injection regardless of config.
 * %judge triggers judge selection phase.
 */
export declare const FORCE_INJECT_MODIFIERS: readonly string[];
/**
 * Modifiers that disable injection.
 */
export declare const DISABLE_INJECT_MODIFIERS: readonly string[];
/**
 * Human-readable descriptions for injection types.
 */
export declare const INJECTION_TYPE_DESCRIPTIONS: Readonly<Record<InjectionType, string>>;
/**
 * Human-readable descriptions for decision sources.
 */
export declare const DECISION_SOURCE_DESCRIPTIONS: Readonly<Record<InjectionDecisionSource, string>>;
/**
 * Human-readable descriptions for injection targets.
 */
export declare const INJECTION_TARGET_DESCRIPTIONS: Readonly<Record<InjectionTarget, string>>;
