/**
 * Before/after analysis comparison engine
 */
import { PromptClassification } from '../core/types.js';
import type { Logger } from '../../../../../shared/types/index.js';
/**
 * Comparison result interface
 */
export interface ComparisonResult {
    hasChanges: boolean;
    summary: string;
    changes: ComparisonChange[];
    recommendations: string[];
}
/**
 * Individual comparison change
 */
export interface ComparisonChange {
    type: 'execution_type' | 'framework_requirement' | 'gates' | 'confidence' | 'complexity';
    before: unknown;
    after: unknown;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
}
/**
 * Analysis comparison engine for tracking prompt evolution
 */
export declare class ComparisonEngine {
    private logger;
    constructor(logger: Logger);
    /**
     * Compare two prompt analyses and generate change summary
     */
    compareAnalyses(before: PromptClassification, after: PromptClassification, promptId: string): ComparisonResult;
    /**
     * Compare gate suggestions
     */
    private compareGates;
    /**
     * Assess the impact of execution type changes
     */
    private assessExecutionTypeChange;
    /**
     * Generate summary of changes
     */
    private generateSummary;
    /**
     * Generate recommendations based on changes
     */
    private generateRecommendations;
    /**
     * Generate change summary for display
     */
    generateDisplaySummary(result: ComparisonResult): string | null;
    /**
     * Track analysis evolution over time
     */
    trackEvolution(promptId: string, classification: PromptClassification): void;
    /**
     * Assess overall improvement direction
     */
    assessImprovement(changes: ComparisonChange[]): 'improved' | 'degraded' | 'neutral';
}
