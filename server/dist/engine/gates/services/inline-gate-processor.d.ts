import type { GateReferenceResolver } from './gate-reference-resolver.js';
import type { Logger } from '../../../infra/logging/index.js';
import type { ExecutionContext, ParsedCommand } from '../../execution/context/index.js';
import type { ChainStepPrompt } from '../../execution/operators/types.js';
import type { TemporaryGateRegistry } from '../core/temporary-gate-registry.js';
/**
 * Result of processing all inline gates for a request.
 */
export interface InlineGateProcessingResult {
    /** IDs of newly created temporary gates */
    readonly createdIds: string[];
    /** IDs of existing registered gates that were referenced */
    readonly registeredIds: string[];
    /** Count of named inline gates processed */
    readonly namedCount: number;
}
/**
 * Type guard for validating gate criteria.
 */
export declare function isValidGateCriteria(criteria: unknown): criteria is readonly string[];
/**
 * Type guard for validating step has inline gate criteria.
 */
export declare function hasInlineGateCriteria(step: ChainStepPrompt): step is ChainStepPrompt & {
    inlineGateCriteria: readonly string[];
};
/**
 * Processes inline gate criteria from symbolic command syntax.
 *
 * Creates temporary gates for anonymous criteria (`:: "criteria"`),
 * registers named gates (`:: security:"criteria"`),
 * and sets up shell verification for `:: verify:"command"` syntax.
 *
 * Extracted from InlineGateExtractionStage (pipeline stage 02).
 */
export declare class InlineGateProcessor {
    private readonly temporaryGateRegistry;
    private readonly gateReferenceResolver;
    private readonly logger;
    constructor(temporaryGateRegistry: TemporaryGateRegistry, gateReferenceResolver: GateReferenceResolver, logger: Logger);
    /**
     * Process all inline gate criteria from a parsed command.
     *
     * Handles named inline gates, anonymous criteria on the main command,
     * and per-step criteria on chain steps. Updates `parsedCommand.inlineGateIds`
     * and step-level `inlineGateIds` as a side effect.
     */
    processInlineGates(context: ExecutionContext, parsedCommand: ParsedCommand): Promise<InlineGateProcessingResult>;
    private applyGateCriteria;
    private applyGateResult;
    private appendGateId;
    /**
     * Creates an inline gate with auto-generated ID for anonymous criteria.
     */
    private createInlineGate;
    /**
     * Creates a named inline gate with explicit ID from symbolic syntax.
     */
    private createNamedInlineGate;
    private partitionGateCriteria;
    private lookupTemporaryGateId;
    private applyResolution;
    private getScopeId;
    private trackTemporaryGateScope;
    /**
     * Sets up shell verification state for Ralph Wiggum loops.
     * Supports presets (:fast, :full, :extended) that expand to max/timeout values.
     */
    private setupShellVerification;
}
