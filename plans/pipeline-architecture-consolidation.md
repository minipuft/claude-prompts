# Pipeline Architecture Consolidation Plan

**Status**: Planning
**Priority**: High
**Created**: 2026-01-26
**Last Updated**: 2026-01-26

---

## Executive Summary

Refactor the 22-stage execution pipeline into a 4-phase architecture with consolidated services. This improves LLM reasoning, reduces cognitive load, and aligns with modern patterns for AI-assisted development.

---

## 1. Goals

### Primary Goals

| Goal | Metric | Target |
|------|--------|--------|
| Reduce pipeline complexity | Stage count | 22 → 4 phases |
| Improve LLM comprehension | Context files needed | 22 → ~8 (4 phases + key services) |
| Maintain debugging clarity | Trace depth | Max 2 levels (phase → service) |
| Enforce size limits | Lines per orchestrator | ≤150 lines |
| Preserve functionality | Test pass rate | 100% (936 tests) |

### Secondary Goals

- Establish patterns for future pipeline extensions
- Create scaffolding templates for new services
- Document decision rationale for RLHF alignment
- Enable parallel execution within phases (future)

---

## 2. Current State Analysis

### Pipeline Structure (22 Stages)

```
execution/pipeline/stages/
├── 00-dependency-injection-stage.ts      (init)
├── 00-execution-lifecycle-stage.ts       (init)
├── 00-request-normalization-stage.ts     (init)
├── 01-parsing-stage.ts                   (parsing)
├── 02-inline-gate-stage.ts               (parsing)
├── 03-operator-validation-stage.ts       (parsing)
├── 04-planning-stage.ts                  (parsing)
├── 04b-script-execution-stage.ts         (parsing) ← sub-stage
├── 04c-script-auto-execute-stage.ts      (parsing) ← sub-stage
├── 05-gate-enhancement-stage.ts          (enhancement)
├── 06-framework-stage.ts                 (enhancement)
├── 06a-judge-selection-stage.ts          (enhancement) ← sub-stage
├── 06b-prompt-guidance-stage.ts          (enhancement) ← sub-stage
├── 07-session-stage.ts                   (enhancement)
├── 07b-injection-control-stage.ts        (enhancement) ← sub-stage
├── 08-response-capture-stage.ts          (execution)
├── 08b-shell-verification-stage.ts       (execution) ← sub-stage
├── 09-execution-stage.ts                 (execution)
├── 10-formatting-stage.ts                (execution)
├── 10-gate-review-stage.ts               (execution)
├── 11-call-to-action-stage.ts            (execution)
└── 12-post-formatting-cleanup-stage.ts   (execution)
```

### Sub-Stage Pattern Analysis

| Sub-Stage | Parent | Relationship | Consolidation Candidate |
|-----------|--------|--------------|------------------------|
| 04b, 04c | 04 | Sequential script processing | Yes - ScriptProcessingService |
| 06a, 06b | 06 | Framework resolution variants | Yes - FrameworkResolutionService |
| 07b | 07 | Injection after session | Maybe - closely coupled |
| 08b | 08 | Verification after capture | Yes - ResponseProcessingService |

### Size Analysis (Current)

```bash
# Run to get current sizes
wc -l server/src/execution/pipeline/stages/*.ts | sort -n
```

**Known oversized files**: To be measured in Phase 1.

---

## 3. Target Architecture

### Phase-Based Structure

```
execution/pipeline/
├── index.ts                              ← Barrel exports (completed)
├── pipeline.ts                           ← Main orchestrator
├── stage.ts                              ← Base stage interface
│
├── phases/
│   ├── 01-initialization/
│   │   ├── index.ts                      ← Phase barrel
│   │   ├── initialization-phase.ts       ← Phase orchestrator (≤150 lines)
│   │   └── services/
│   │       ├── dependency-injector.ts
│   │       ├── lifecycle-manager.ts
│   │       └── request-normalizer.ts
│   │
│   ├── 02-parsing/
│   │   ├── index.ts
│   │   ├── parsing-phase.ts              ← Phase orchestrator
│   │   └── services/
│   │       ├── command-parser.ts
│   │       ├── gate-extractor.ts
│   │       ├── operator-validator.ts
│   │       ├── execution-planner.ts
│   │       └── script-processor.ts       ← Consolidates 04b + 04c
│   │
│   ├── 03-enhancement/
│   │   ├── index.ts
│   │   ├── enhancement-phase.ts          ← Phase orchestrator
│   │   └── services/
│   │       ├── gate-enhancer.ts
│   │       ├── framework-resolver.ts     ← Consolidates 06 + 06a + 06b
│   │       ├── session-manager.ts
│   │       └── injection-controller.ts
│   │
│   └── 04-execution/
│       ├── index.ts
│       ├── execution-phase.ts            ← Phase orchestrator
│       └── services/
│           ├── response-processor.ts     ← Consolidates 08 + 08b
│           ├── step-executor.ts
│           ├── gate-reviewer.ts
│           └── output-formatter.ts       ← Consolidates 10 + 11 + 12
│
└── legacy/                               ← Deprecated stages (Phase 3)
    └── stages/                           ← Move here before deletion
```

### Interface Contracts

```typescript
// Phase orchestrator interface
interface PipelinePhase {
  readonly name: string;
  readonly order: number;
  execute(context: ExecutionContext): Promise<void>;
}

// Service interface (unchanged from current pattern)
interface PhaseService {
  process(context: ExecutionContext): Promise<void>;
}

// Phase orchestrator pattern
class ParsingPhase implements PipelinePhase {
  readonly name = 'Parsing';
  readonly order = 2;

  constructor(
    private commandParser: CommandParserService,
    private gateExtractor: GateExtractorService,
    private operatorValidator: OperatorValidatorService,
    private executionPlanner: ExecutionPlannerService,
    private scriptProcessor: ScriptProcessorService,  // Consolidated
  ) {}

  async execute(context: ExecutionContext): Promise<void> {
    await this.commandParser.process(context);
    await this.gateExtractor.process(context);
    await this.operatorValidator.process(context);
    await this.executionPlanner.process(context);

    if (context.plan.hasScripts) {
      await this.scriptProcessor.process(context);
    }
  }
}
```

---

## 4. Implementation Phases

### Phase 1: Analysis & Consolidation Candidates (Week 1)

**Goal**: Identify consolidation opportunities without breaking changes.

#### Tasks

- [ ] **1.1** Measure all stage file sizes
  ```bash
  wc -l server/src/execution/pipeline/stages/*.ts | sort -n > plans/pipeline-stage-sizes.txt
  ```

- [ ] **1.2** Document stage dependencies
  - Which stages share state?
  - Which stages must run sequentially?
  - Which could theoretically run in parallel?

- [ ] **1.3** Identify service extraction candidates
  - Stages >150 lines
  - Stages with multiple responsibilities
  - Stages with complex conditionals

- [ ] **1.4** Create consolidation mapping
  | Current Stages | Target Service | Rationale |
  |----------------|----------------|-----------|
  | 04b + 04c | ScriptProcessorService | Same domain, sequential |
  | 06 + 06a + 06b | FrameworkResolverService | All framework-related |
  | 08 + 08b | ResponseProcessorService | Response handling |
  | 10 + 11 + 12 | OutputFormatterService | All formatting |

- [ ] **1.5** Review with test coverage
  - Ensure all consolidation candidates have tests
  - Add missing tests before refactoring

#### Deliverables
- `plans/pipeline-stage-sizes.txt` - Size analysis
- `plans/pipeline-dependency-graph.md` - Stage dependencies
- Updated this plan with consolidation decisions

---

### Phase 2: Service Extraction (Weeks 2-3)

**Goal**: Extract services from existing stages without changing the stage count.

#### Tasks

- [ ] **2.1** Extract ScriptProcessorService from 04b + 04c
  - Create `execution/pipeline/services/script-processor.ts`
  - 04b becomes thin orchestrator calling service
  - 04c logic moves into service
  - Delete 04c stage

- [ ] **2.2** Extract FrameworkResolverService from 06/06a/06b
  - Create `execution/pipeline/services/framework-resolver.ts`
  - Consolidate judge selection + prompt guidance
  - 06 becomes orchestrator, 06a/06b deleted

- [ ] **2.3** Extract ResponseProcessorService from 08/08b
  - Create `execution/pipeline/services/response-processor.ts`
  - Consolidate response capture + shell verification
  - 08 becomes orchestrator, 08b deleted

- [ ] **2.4** Extract OutputFormatterService from 10/11/12
  - Create `execution/pipeline/services/output-formatter.ts`
  - Consolidate formatting + CTA + cleanup
  - 10 becomes orchestrator, 11/12 deleted

- [ ] **2.5** Update barrel exports
  - Remove deleted stages from `index.ts`
  - Add new services to exports

- [ ] **2.6** Update prompt-execution-service.ts
  - Update pipeline construction
  - Verify all tests pass

#### Validation Checkpoints

```bash
# After each consolidation
npm run typecheck
npm run test:ci
npm run build

# Verify no regressions
npm run test:integration
```

#### Deliverables
- 4 new service files
- 6 deleted stage files (04c, 06a, 06b, 08b, 11, 12)
- Updated barrel exports
- All tests passing

---

### Phase 3: Phase Orchestrators (Weeks 4-5)

**Goal**: Introduce phase-level orchestration layer.

#### Tasks

- [ ] **3.1** Create phase directory structure
  ```bash
  mkdir -p server/src/execution/pipeline/phases/{01-initialization,02-parsing,03-enhancement,04-execution}/services
  ```

- [ ] **3.2** Implement InitializationPhase
  - Move 00-* stages to `phases/01-initialization/services/`
  - Create `initialization-phase.ts` orchestrator
  - Create phase barrel export

- [ ] **3.3** Implement ParsingPhase
  - Move 01-04 stages to `phases/02-parsing/services/`
  - Create `parsing-phase.ts` orchestrator
  - Include ScriptProcessorService

- [ ] **3.4** Implement EnhancementPhase
  - Move 05-07 stages to `phases/03-enhancement/services/`
  - Create `enhancement-phase.ts` orchestrator
  - Include FrameworkResolverService

- [ ] **3.5** Implement ExecutionPhase
  - Move 08-10 stages to `phases/04-execution/services/`
  - Create `execution-phase.ts` orchestrator
  - Include ResponseProcessorService, OutputFormatterService

- [ ] **3.6** Update main pipeline
  - Modify `prompt-execution-pipeline.ts` to use phases
  - Maintain backward compatibility during transition

- [ ] **3.7** Move legacy stages
  - Create `legacy/stages/` directory
  - Move original stage files (don't delete yet)
  - Add deprecation notices

#### Deliverables
- 4 phase orchestrators
- 4 phase barrel exports
- Updated main pipeline
- Legacy stages preserved for rollback

---

### Phase 4: Cleanup & Documentation (Week 6)

**Goal**: Remove legacy code, update documentation, establish patterns.

#### Tasks

- [ ] **4.1** Delete legacy stages
  - Remove `legacy/stages/` directory
  - Remove from git history (optional squash)

- [ ] **4.2** Update documentation
  - `docs/architecture/overview.md` - New phase structure
  - `docs/architecture/pipeline-phases.md` - New detailed doc
  - `CLAUDE.md` - Update architecture section

- [ ] **4.3** Create scaffolding templates
  - Phase orchestrator template
  - Phase service template
  - Add to plop generators (if using)

- [ ] **4.4** Update test organization
  ```
  tests/unit/execution/pipeline/
  ├── phases/
  │   ├── initialization/
  │   ├── parsing/
  │   ├── enhancement/
  │   └── execution/
  └── services/
  ```

- [ ] **4.5** Performance validation
  - Benchmark before/after
  - Ensure no regression in execution time

- [ ] **4.6** Update CHANGELOG.md

#### Deliverables
- Clean codebase (no legacy)
- Updated documentation
- Scaffolding templates
- Performance report

---

## 5. Patterns & Rules

### Orchestrator Rules (MUST follow)

| Rule | Rationale |
|------|-----------|
| Orchestrators ≤150 lines | LLM context efficiency |
| No business logic in orchestrators | Single responsibility |
| Orchestrators call services only | Clear separation |
| One orchestrator per phase | Predictable structure |
| Explicit service injection | Testability |

### Service Rules (MUST follow)

| Rule | Rationale |
|------|-----------|
| Services ≤500 lines | Maintainability |
| Services are stateless | Predictability |
| Services have single domain | Cohesion |
| Services use constructor injection | Testability |
| Pure functions for logic | LLM comprehension |

### Naming Conventions

```typescript
// Phase orchestrators
{Phase}Phase                    // e.g., ParsingPhase

// Services
{Domain}{Action}Service         // e.g., ScriptProcessorService

// Files
{nn}-{phase}-phase.ts          // e.g., 02-parsing-phase.ts
{domain}-{action}.ts           // e.g., script-processor.ts
```

### LLM-Friendly Patterns

| Pattern | Why It Helps |
|---------|--------------|
| Linear phase execution | Easy to trace |
| Explicit conditionals | No hidden branching |
| Named intermediate steps | Clear state transitions |
| Typed context object | Self-documenting |
| Barrel exports | Predictable imports |

### Anti-Patterns (AVOID)

| Anti-Pattern | Why It Hurts |
|--------------|--------------|
| Nested conditionals >3 deep | Hard to trace |
| Implicit state mutations | Unpredictable |
| Circular dependencies | Confuses analysis |
| Magic strings | Type safety lost |
| Giant switch statements | Hard to extend |

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Test failures during refactor | Medium | High | Run tests after each change |
| Performance regression | Low | Medium | Benchmark before/after |
| Breaking changes to API | Low | High | Maintain interface contracts |
| Incomplete migration | Medium | Medium | Phase-based approach with checkpoints |
| Lost functionality | Low | High | Keep legacy code until validated |

---

## 7. Success Criteria

### Phase 1 Complete When:
- [ ] All stage sizes documented
- [ ] Dependency graph created
- [ ] Consolidation candidates identified
- [ ] Test coverage verified

### Phase 2 Complete When:
- [ ] 4 services extracted
- [ ] 6 stages consolidated (deleted)
- [ ] All 936 tests passing
- [ ] No TypeScript errors

### Phase 3 Complete When:
- [ ] 4 phase orchestrators created
- [ ] Main pipeline uses phases
- [ ] Legacy stages in `legacy/` directory
- [ ] All tests passing

### Phase 4 Complete When:
- [ ] Legacy code deleted
- [ ] Documentation updated
- [ ] Templates created
- [ ] Performance validated
- [ ] CHANGELOG updated

---

## 8. References

- [CLAUDE.md - Architecture Patterns](../CLAUDE.md#13-critical-architecture-patterns-remember-across-sessions)
- [orchestration-layers.md rule](../.claude/rules/orchestration-layers.md)
- [OOP Shell + FP Internals](~/.claude/rules/architecture.md)
- [Pipeline Stage Documentation](../docs/architecture/overview.md)

---

## 9. Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-26 | Initial plan created | Claude |
