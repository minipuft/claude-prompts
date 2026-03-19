/**
 * Markdown Prompt Parser
 *
 * Extracts structured prompt data from markdown-format prompt files.
 * All functions are pure (no I/O, no state) — they operate on string content only.
 *
 * Extracted from PromptLoader.loadPromptFile() to reduce loader.ts file size.
 */
import { type LoadedPromptFile } from './yaml-prompt-loader.js';
export type { LoadedPromptFile };
type GateConfiguration = NonNullable<LoadedPromptFile['gateConfiguration']>;
type ChainStep = NonNullable<LoadedPromptFile['chainSteps']>[number];
/**
 * Extract system message and user message template sections from markdown content.
 */
export declare function extractMarkdownSections(content: string): {
    systemMessage?: string;
    userMessageTemplate: string;
    gateConfigMatch: RegExpMatchArray | null;
    chainMatch: RegExpMatchArray | null;
};
/**
 * Parse gate configuration from a regex match of a JSON code block.
 *
 * Handles both array format (["gate1", "gate2"]) and object format
 * ({ include: [...], exclude: [...], framework_gates: true, inline_gate_definitions: [...] }).
 *
 * Returns undefined if the match is null or parsing fails.
 */
export declare function parseGateConfiguration(gateConfigMatch: RegExpMatchArray | null): GateConfiguration | undefined;
/**
 * Strip the Gate Configuration section from user message template text.
 */
export declare function stripGateConfigSection(userMessageTemplate: string): string;
/**
 * Parse chain steps from the content of a ## Chain Steps markdown section.
 *
 * Each step has the format:
 * ```
 * 1. promptId: some_prompt
 *    stepName: Step Name
 *    inputMapping:
 *      key: value
 *    outputMapping:
 *      key: value
 * ```
 */
export declare function parseChainSteps(chainContent: string): ChainStep[];
/**
 * Parse complete markdown prompt file content into a LoadedPromptFile structure.
 *
 * Orchestrates section extraction, gate configuration parsing, chain step parsing,
 * and gate config stripping from user message template.
 *
 * @throws Error if content has no system message, user template, or chain steps
 */
export declare function parseMarkdownPromptContent(content: string, filePath: string): LoadedPromptFile;
