import { BasePipelineStage } from '../stage.js';
import type { Logger } from '../../../../infra/logging/index.js';
import type { ExecutionContext } from '../../context/index.js';
import type { ArgumentParser } from '../../parsers/argument-parser.js';
import type { ChainBlueprintResolver } from '../../parsers/chain-blueprint-resolver.js';
import type { UnifiedCommandParser } from '../../parsers/command-parser.js';
import type { SymbolicCommandBuilder } from '../../parsers/symbolic-command-builder.js';
import type { ConvertedPrompt } from '../../types.js';
/**
 * Provider function to get all converted prompts.
 * Ensures fresh data on each access (supports hot-reload).
 */
type PromptsProvider = () => ConvertedPrompt[];
/**
 * Canonical Pipeline Stage 1: Command Parsing
 *
 * Parses incoming commands using UnifiedCommandParser, resolves arguments,
 * and builds symbolic chains for operator-based workflows.
 *
 * Domain logic delegated to:
 * - SymbolicCommandBuilder: symbolic operator → ParsedCommand
 * - ChainBlueprintResolver: session blueprint restoration for response-only mode
 *
 * Dependencies: None (always runs first)
 * Output: context.parsedCommand, context.symbolicChain (if operators detected)
 * Can Early Exit: Yes (if parsing fails)
 */
export declare class CommandParsingStage extends BasePipelineStage {
    private readonly commandParser;
    private readonly argumentParser;
    private readonly promptsProvider;
    private readonly symbolicCommandBuilder;
    private readonly blueprintResolver?;
    readonly name = "CommandParsing";
    constructor(commandParser: UnifiedCommandParser, argumentParser: ArgumentParser, promptsProvider: PromptsProvider, logger: Logger, symbolicCommandBuilder: SymbolicCommandBuilder, blueprintResolver?: ChainBlueprintResolver | undefined);
    execute(context: ExecutionContext): Promise<void>;
    /**
     * Build ParsedCommand for non-symbolic (direct) commands.
     */
    private buildDirectCommand;
    /**
     * Merge requestOptions into promptArgs (options parameter from prompt_engine call).
     * Options values override empty/falsy placeholder values from prompt definitions
     * but inline args (truthy values) still take precedence.
     */
    private mergeRequestOptions;
    private findConvertedPrompt;
    private createArgumentContext;
}
export {};
