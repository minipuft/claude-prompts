import type { ArgumentParser } from './argument-parser.js';
import type { Logger } from '../../../infra/logging/index.js';
import type { ShellVerifyGate } from '../../gates/shell/types.js';
import type { ParsedCommand } from '../context/index.js';
import type { ConvertedPrompt } from '../types.js';
import type { SymbolicCommandParseResult } from './types/operator-types.js';
/**
 * Named gate collected from gate operators (:: syntax).
 */
export interface CollectedNamedGate {
    gateId: string;
    criteria: string[];
    shellVerify?: ShellVerifyGate;
}
/**
 * Result of collecting gate criteria from symbolic operators.
 */
export interface CollectedGateCriteria {
    anonymousCriteria: string[];
    namedGates: CollectedNamedGate[];
}
/**
 * Prompt lookup function — provided by the stage from its promptsProvider.
 */
export type PromptLookup = (idOrName: string) => ConvertedPrompt | undefined;
/**
 * Builds structured ParsedCommand from symbolic operator parse results.
 *
 * Handles single-prompt and chain-based symbolic commands, resolving
 * arguments, collecting gate criteria, and linking converted prompts.
 *
 * Extracted from CommandParsingStage (pipeline stage 01).
 */
export declare class SymbolicCommandBuilder {
    private readonly argumentParser;
    private readonly logger;
    constructor(argumentParser: ArgumentParser, logger: Logger);
    /**
     * Build a ParsedCommand from a symbolic parse result.
     * Dispatches to single-prompt or chain builder based on operator presence.
     */
    buildSymbolicCommand(parseResult: SymbolicCommandParseResult, findPrompt: PromptLookup): Promise<ParsedCommand>;
    /**
     * Separates gate operators into named and anonymous criteria.
     * Named gates (with gateId) are returned separately for explicit ID registration.
     * Anonymous criteria are merged together for backward-compatible temp gate creation.
     * Shell verification gates (with shellVerify) are included for Ralph Wiggum loops.
     */
    collectGateCriteria(parseResult: SymbolicCommandParseResult): CollectedGateCriteria;
    private buildSingleSymbolicPrompt;
    private buildSymbolicChain;
    private hasChainOperator;
    private resolveArgumentPayload;
    private parseArgumentsSafely;
    /**
     * Collects default values from prompt argument definitions.
     * Returns a record of { argName: defaultValue } for every argument with a defined default.
     */
    private collectArgumentDefaults;
    private createArgumentContext;
    private getStepArgumentInput;
}
