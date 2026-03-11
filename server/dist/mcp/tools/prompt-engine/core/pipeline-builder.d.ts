/**
 * Pipeline Builder — Factory for PromptExecutionPipeline.
 *
 * Extracted from PromptExecutor to isolate the 23+ service instantiations
 * and stage wiring that constitute pipeline construction. Every new pipeline
 * service adds wiring here, keeping PromptExecutor focused on execution.
 *
 * Architecture:
 *   PromptExecutor (orchestration)
 *     └── PipelineBuilder (factory)
 *           └── PromptExecutionPipeline (coordinator)
 *                 └── PipelineStage[] (stages 00-11)
 */
import { PromptExecutionPipeline } from '../../../../engine/execution/pipeline/index.js';
import type { PipelineDependencies } from './pipeline-dependencies.js';
/**
 * Factory that constructs and wires the PromptExecutionPipeline.
 *
 * Receives a typed PipelineDependencies bag and produces a fully-wired
 * pipeline with all 23+ stages and intermediate services.
 */
export declare class PipelineBuilder {
    private readonly deps;
    constructor(deps: PipelineDependencies);
    build(): PromptExecutionPipeline;
    private createGateService;
}
