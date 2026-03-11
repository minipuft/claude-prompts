import type { FormatterExecutionContext } from '../../../shared/types/chain-execution.js';
import type { SessionContext } from '../context/index.js';
/**
 * Chain execution formatting context.
 */
export interface ChainFormattingContext extends FormatterExecutionContext {
    readonly executionType: 'chain';
    readonly sessionContext: Required<SessionContext>;
}
/**
 * Single prompt execution formatting context.
 */
export interface SinglePromptFormattingContext extends FormatterExecutionContext {
    readonly executionType: 'single';
}
/**
 * Discriminated union for formatting contexts.
 */
export type VariantFormattingContext = ChainFormattingContext | SinglePromptFormattingContext;
/**
 * Type guard for chain formatting context.
 */
export declare function isChainFormattingContext(context: FormatterExecutionContext): context is ChainFormattingContext;
/**
 * Type guard for single prompt formatting context.
 */
export declare function isSinglePromptFormattingContext(context: FormatterExecutionContext): context is SinglePromptFormattingContext;
