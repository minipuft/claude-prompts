/**
 * Normalize >> prefixes in symbolic commands for consistent parsing.
 *
 * The >> prefix serves as a hint to LLMs that this is an MCP tool command,
 * but it should not interfere with symbolic operator detection.
 */
export declare function normalizeSymbolicPrefixes(command: string): {
    normalized: string;
    hadPrefixes: boolean;
    originalCommand: string;
};
/**
 * Remove style operators from a command segment to avoid polluting prompt args.
 * Handles new #styleid syntax (e.g., #analytical, #procedural)
 */
export declare function stripStyleOperators(input: string): string;
/**
 * Check if a position in a string is inside a quoted section.
 * Handles both single and double quotes, respects escape sequences.
 *
 * @param str - The string to check
 * @param position - The character position to check
 * @returns true if the position is inside quotes
 */
export declare function isPositionInsideQuotes(str: string, position: number): boolean;
/**
 * Result of finding a framework operator outside quotes.
 */
export interface FrameworkOperatorMatch {
    /** The framework ID (without @) */
    frameworkId: string;
    /** Position in the string where the match starts */
    position: number;
    /** The full matched string including @ and any leading whitespace */
    fullMatch: string;
}
/**
 * Find a framework operator (@word) outside of quoted strings.
 * Returns the first match found, or null if no framework operator exists outside quotes.
 *
 * Automatically skips @word patterns that look like file paths or references:
 * - Contains '/' (e.g., @docs/path, @src/file)
 * - Contains '.' (e.g., @file.md, @config.json)
 *
 * This makes detection robust regardless of whether content is quoted.
 *
 * @param str - The command string to search
 * @returns The match details, or null if not found outside quotes
 */
export declare function findFrameworkOperatorOutsideQuotes(str: string): FrameworkOperatorMatch | null;
/**
 * Strip framework operator from command, respecting quoted strings.
 * Only removes the first framework operator found outside quotes.
 *
 * @param str - The command string
 * @returns The string with framework operator removed (if found outside quotes)
 */
export declare function stripFrameworkOperatorOutsideQuotes(str: string): string;
