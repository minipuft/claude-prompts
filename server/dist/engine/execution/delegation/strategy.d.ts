import type { DelegationPayload } from './types.js';
import type { DelegationProfile } from '../../../shared/types/core-config.js';
import type { RequestClientProfile } from '../../../shared/types/request-identity.js';
/** Client-specific rendering strategy for delegation CTAs. */
export interface DelegationStrategy {
    readonly clientId: string;
    /** Map semantic capability hint to a client-specific model name. */
    resolveModel(payload: DelegationPayload): string | undefined;
    /** Format the tool invocation block (tool name + parameters). */
    formatToolCall(agentType: string, model: string | undefined): string;
    /** Format enforcement constraints shown after instructions. */
    formatConstraints(): string;
}
export type DelegationStrategyStatus = 'canonical' | 'experimental';
export declare function getHandoffFooterPrefix(delegationProfile?: DelegationProfile): string;
export declare function getHandoffFooterInstruction(delegationProfile?: DelegationProfile): string;
export declare function getHandoffProfileStatus(delegationProfile?: DelegationProfile): DelegationStrategyStatus;
/** @deprecated Prefer handoff terminology helpers. */
export declare function getDelegationFooterPrefix(delegationProfile?: DelegationProfile): string;
/** @deprecated Prefer handoff terminology helpers. */
export declare function getDelegationFooterInstruction(delegationProfile?: DelegationProfile): string;
/** @deprecated Prefer handoff terminology helpers. */
export declare function getDelegationProfileStatus(delegationProfile?: DelegationProfile): DelegationStrategyStatus;
/** Default strategy for Claude Code (Task tool, Claude model names). */
export declare class ClaudeCodeStrategy implements DelegationStrategy {
    private readonly pluginNamespace;
    readonly clientId = "claude-code";
    private static readonly CAPABILITY_MAP;
    /**
     * @param pluginNamespace Claude Code namespaces plugin agents as
     *   `{plugin}:{agent}`. Bare agent types (without `:`) are prefixed
     *   automatically so the rendered CTA matches the Task tool's registry.
     */
    constructor(pluginNamespace?: string);
    resolveModel(payload: DelegationPayload): string | undefined;
    /** Resolve bare agent type to namespaced form for Claude Code's Task tool. */
    private resolveAgentType;
    formatToolCall(agentType: string, model: string | undefined): string;
    formatConstraints(): string;
}
/** Strategy for Codex-compatible delegation instructions. */
export declare class CodexStrategy implements DelegationStrategy {
    readonly clientId = "codex";
    resolveModel(payload: DelegationPayload): string | undefined;
    formatToolCall(agentType: string, model: string | undefined): string;
    formatConstraints(): string;
}
/** Strategy for Gemini-compatible delegation instructions. */
export declare class GeminiStrategy implements DelegationStrategy {
    readonly clientId = "gemini";
    resolveModel(_payload: DelegationPayload): string | undefined;
    formatToolCall(agentType: string, model: string | undefined): string;
    formatConstraints(): string;
}
/** Strategy for OpenCode-compatible delegation instructions. */
export declare class OpenCodeStrategy implements DelegationStrategy {
    readonly clientId = "opencode";
    resolveModel(_payload: DelegationPayload): string | undefined;
    formatToolCall(agentType: string, model: string | undefined): string;
    formatConstraints(): string;
}
/** Strategy for Cursor-compatible delegation instructions. */
export declare class CursorStrategy implements DelegationStrategy {
    readonly clientId = "cursor";
    resolveModel(_payload: DelegationPayload): string | undefined;
    formatToolCall(agentType: string, model: string | undefined): string;
    formatConstraints(): string;
}
/** Neutral fallback for unknown client families. */
export declare class NeutralStrategy implements DelegationStrategy {
    readonly clientId = "unknown";
    resolveModel(_payload: DelegationPayload): string | undefined;
    formatToolCall(agentType: string, model: string | undefined): string;
    formatConstraints(): string;
}
/**
 * Select strategy from resolved client profile.
 *
 * Fallback defaults to Claude strategy for backward compatibility when no
 * profile is available.
 */
export declare function resolveDelegationStrategy(clientProfile?: RequestClientProfile): DelegationStrategy;
