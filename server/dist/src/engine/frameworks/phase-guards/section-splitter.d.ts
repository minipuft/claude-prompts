/**
 * Section Splitter
 *
 * Parses LLM output into sections by markdown section headers.
 * Used by the phase guard evaluator to isolate phase content.
 */
/**
 * A section extracted from output by its header
 */
export interface OutputSection {
    /** The section header that delimited this section (e.g., "## Context") */
    section_header: string;
    /** The content below the header, trimmed */
    content: string;
}
/**
 * Split output text into sections by markdown section headers.
 *
 * Sections are delimited by the header strings. Content between one header
 * and the next (or end of text) belongs to that section.
 *
 * @param output - Full LLM output text
 * @param sectionHeaders - Ordered list of header strings to search for (e.g., ["## Context", "## Analysis"])
 * @returns Map of section_header → content for each found header
 */
export declare function splitBySectionHeaders(output: string, sectionHeaders: string[]): Map<string, OutputSection>;
