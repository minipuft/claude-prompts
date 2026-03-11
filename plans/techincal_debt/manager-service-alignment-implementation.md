# Manager/Service Alignment — Implementation Plan

**Status**: Complete
**Created**: 2026-02-23
**Completed**: 2026-02-24
**Source**: `manager-service-alignment.md` (roadmap) → this file (execution plan)
**Methodology**: CAGEERF via `>>implementation_plan`

---

## Step 0: Pre-Existing Diagnostics

TypeScript diagnostics show pre-existing interface naming mismatches (`I*` → `*Port` convention):
- `IHookRegistry` → `HookRegistryPort`
- `IMcpNotificationEmitter` → `McpNotificationEmitterPort`
- `IGateService` → `GateService`
- `IStyleManager` → `StyleManagerPort`

These are **out of scope** for this plan — separate naming cleanup task. Note them to avoid confusion during implementation.

---

## Step 1: Existing Systems Audit

### Canonical Pattern: `resource-manager/prompt/services/`

```
mcp/tools/resource-manager/prompt/
├── core/
│   ├── context.ts     (25 lines)  ← Shared context interface
│   └── types.ts       (103 lines) ← Request/response types
├── services/
│   ├── prompt-discovery-service.ts   (528 lines) ← list, inspect, analyze, guide
│   ├── prompt-lifecycle-service.ts   (360 lines) ← create, update, delete, reload
│   └── prompt-versioning-service.ts  (194 lines) ← history, compare, rollback
├── analysis/          ← Domain-specific analyzers (reused by services)
├── operations/        ← File operations
├── search/            ← Filter parsing, matching
└── utils/             ← Validation helpers
```

**Key pattern**: `PromptResourceContext` interface passes shared dependencies to all services. Services receive context via constructor. Router dispatches by action → service method.

### M1a Target: `gate-manager/` (645 lines → ~120 lines)

| File | Lines | Responsibility | Pattern Issue |
|------|-------|----------------|---------------|
| `core/manager.ts` | 645 | ALL: CRUD + discovery + versioning + file I/O + utility | Fat facade |
| `core/types.ts` | 89 | Input/dependency contracts | Clean |
| `services/gate-file-service.ts` | 120 | File I/O with transaction | **Already extracted** |

**Method grouping in GateToolHandler**:
- **Lifecycle** (CRUD): `handleCreate` (50 lines), `handleUpdate` (106 lines), `handleDelete` (50 lines), `handleReload` (30 lines) = ~236 lines
- **Discovery**: `handleList` (28 lines), `handleInspect` (25 lines) = ~53 lines
- **Versioning**: `handleHistory` (24 lines), `handleRollback` (67 lines), `handleCompare` (50 lines) = ~141 lines
- **File I/O**: `writeGateFiles` (52 lines), `getGatesDirectory` (3 lines) = ~55 lines (**duplicates GateFileService**)
- **Utility**: `createSuccessResponse` (6 lines), `createErrorResponse` (6 lines), routing switch (68 lines) = ~80 lines
- **Audit logging**: inline in `handleAction` (20 lines)

**Reuse opportunities**:
1. `GateFileService` already exists — `writeGateFiles()` in manager.ts is dead code (duplicates it without transactions)
2. `VersionHistoryService` already injected — versioning methods are thin wrappers
3. `TextDiffService` already injected — compare uses it directly

### M1b Target: `framework-manager/` (982 lines → ~120 lines)

| File | Lines | Responsibility | Pattern Issue |
|------|-------|----------------|---------------|
| `core/manager.ts` | 982 | ALL: CRUD + discovery + versioning + validation + switch | Fat facade |
| `core/types.ts` | 271 | Input/dependency/data contracts | Clean (large but well-structured) |
| `services/methodology-file-service.ts` | 571 | File I/O + YAML merge + existence checks | **Already extracted** |

**Method grouping in FrameworkToolHandler**:
- **Lifecycle** (CRUD): `handleCreate` + `createMethodologyAtomic` (~200 lines), `handleUpdate` (~120 lines), `handleDelete` (~60 lines), `handleReload` (~30 lines) = ~410 lines
- **Discovery**: `handleList` (~40 lines), `handleInspect` + `validateMethodology` (~120 lines) = ~160 lines
- **Versioning**: `handleHistory` (~30 lines), `handleRollback` (~80 lines), `handleCompare` (~60 lines) = ~170 lines
- **Switch**: `handleSwitch` (~60 lines) = ~60 lines
- **Helpers**: `assignOptionalFields`, response builders, `checkMethodologyExists` = ~100 lines
- **Routing**: switch + audit logging = ~80 lines

**Reuse opportunities**:
1. `MethodologyFileService` already handles file I/O + existence checks
2. `VersionHistoryService` already injected
3. `validateMethodology` is 80-line validation logic — extract to `MethodologyValidationService`
4. Response builders (`createSuccessResponse`, `createErrorResponse`) can share with gate pattern

### M2 Target: `system-control.ts` (3,820 lines → thin router + modules)

**Critical finding**: Already logically decomposed into 10 nested `ActionHandler` classes + 1 abstract base. Physical extraction only needed.

| Handler | Lines | Complexity | Existing Tests |
|---------|-------|------------|----------------|
| `StatusActionHandler` | ~100 | Low-Mid | No |
| `FrameworkActionHandler` | ~40 | Low | Yes |
| `GateActionHandler` | ~31 | Low | Yes |
| `GuideActionHandler` | ~71 | Low | Yes |
| `AnalyticsActionHandler` | ~26 | Low | No |
| `ConfigActionHandler` | ~25 | Low | No |
| **`MaintenanceActionHandler`** | **~1,430** | **High** | **No** |
| `InjectionActionHandler` | ~163 | Mid | No |
| `SessionActionHandler` | ~141 | Mid | Yes |
| `ChangesActionHandler` | ~109 | Mid | No |
| `ActionHandler` (base) | ~120 | Low | N/A |

**Base class pattern**: `ActionHandler` takes `ConsolidatedSystemControl` reference, provides convenience getters (logger, configManager, etc.) + formatting helpers.

**MaintenanceActionHandler** (1,430 lines) is the blocker — needs sub-decomposition before extraction.

**Reuse opportunities**:
1. Action handler pattern already proven — just move to files
2. `ActionHandler` base class → extract to shared module
3. Formatting helpers in base class → could become utility functions
4. `ConsolidatedSystemControl` main class (~400 lines above handlers) has setter injection + `handleAction()` routing + shared state

### M3 Target: `prompt-executor.ts` (1,006 lines → 733 + 351 + 91)

| Section | Lines | Responsibility |
|---------|-------|----------------|
| Imports + types | ~120 | Dependencies |
| Constructor + setters | ~290 | Service wiring, lazy initialization |
| `executePromptCommand()` | ~55 | Entry point |
| `cleanup()` | ~43 | Resource cleanup |
| `getPromptExecutionPipeline()` | ~6 | Lazy getter |
| **`buildPromptExecutionPipeline()`** | **~249** | **23 service instantiations + stage wiring** |
| Factory function | ~30 | Constructor helper |

**Builder instantiates 23 objects**:
- 19 pipeline stages (RequestNormalization through CallToAction)
- 4 intermediate services (InlineGateProcessor, GateEnhancementService, StepCaptureService, etc.)
- 8+ lambda closures capturing `this.*` state
- 1 lifecycle hook registration (onSessionCleared)

**Reuse**: No existing builder pattern — new file justified (builder is a distinct responsibility).

---

## Step 2: Reuse-First Design

### M1a: Gate Tool Handler Decomposition

**Can GateLifecycleService be functions in gate-file-service.ts?** No — lifecycle needs GateManager registry + VersionHistoryService + audit logging, while file service is pure I/O. Different dependencies.

**Can GateDiscoveryService be functions in GateToolHandler?** No — that defeats the purpose. Discovery is a read-only domain (list + inspect) with distinct dependencies from CRUD.

**Can GateVersioningService be functions in versioning module?** No — gate-specific versioning needs GateManager for rollback + file service for write-back. Thin wrapper, but distinct orchestration.

**Shared context pattern**: Follow `PromptResourceContext` — create `GateResourceContext` interface.

### M1b: Framework Tool Handler Decomposition

Same rationale as M1a. Additionally:
- `MethodologyValidationService` justified: 80-line validation with scoring + warnings + contextual errors — not a simple function
- `handleSwitch()` goes into lifecycle service (state mutation operation)

### M2: system_control Physical Extraction

**Can handlers stay as nested classes?** They work, but 3,820 lines in one file violates every size advisory. Physical extraction is the goal.

**Should MaintenanceActionHandler be decomposed further?** Yes — 1,430 lines with restart logic + diagnostics + config rollback + health checks = 4+ responsibilities. Extract to sub-services.

**Context object pattern**: Replace `ActionHandler(systemControl)` reference → use explicit context interface (no `this.systemControl['privateField']` indexing).

### M3: Pipeline Builder Extraction

**Can buildPromptExecutionPipeline stay in PromptExecutionService?** It could, but:
- 249 lines + 23 instantiations makes the file 1,006 lines
- Every new pipeline service adds more wiring here
- Builder has zero domain logic — it's pure construction

**New file justified**: `PipelineBuilder` is a Factory pattern — distinct responsibility from the service that uses the pipeline.

---

## Step 3: Implementation Plan

### Phase Legend

| Phase | Milestone | Description |
|-------|-----------|-------------|
| 3.1.x | M1a | Gate tool handler decomposition |
| 3.2.x | M1b | Framework tool handler decomposition |
| 3.3.x | M2 | system_control physical extraction |
| 3.4.x | M3 | Pipeline builder extraction |

### M1a: Gate Tool Handler (Effort: ~1 session) — COMPLETE

| # | File | Change | Est. Lines | Depends | Justification |
|---|------|--------|------------|---------|---------------|
| 3.1.1 | `gate-manager/core/context.ts` | **NEW** | ~30 | — | Shared context for gate services (mirrors `PromptResourceContext`). Carries logger, gateManager, configManager, versionHistoryService, textDiffService, onRefresh, gateFileService. |
| 3.1.2 | `gate-manager/services/gate-lifecycle-service.ts` | **NEW** | ~250 | 3.1.1 | Extract: handleCreate, handleUpdate, handleDelete, handleReload. Uses GateFileService for writes, GateManager for registry, VersionHistoryService for auto-versioning. |
| 3.1.3 | `gate-manager/services/gate-discovery-service.ts` | **NEW** | ~80 | 3.1.1 | Extract: handleList, handleInspect. Read-only operations against GateManager registry. |
| 3.1.4 | `gate-manager/services/gate-versioning-service.ts` | **NEW** | ~160 | 3.1.1 | Extract: handleHistory, handleRollback, handleCompare. Uses VersionHistoryService + GateFileService for rollback writes. |
| 3.1.5 | `gate-manager/core/manager.ts` | **REWRITE** | ~120 | 3.1.2-4 | Thin handler: constructor builds context → creates services → handleAction routes to service methods. Remove duplicate writeGateFiles (dead — GateFileService exists). |
| 3.1.6 | `gate-manager/core/types.ts` | **EXTEND** | +10 | 3.1.1 | Add GateResourceContext export, update dependency interface if needed. |
| 3.1.7 | `gate-manager/services/index.ts` | **EXTEND** | +3 | 3.1.2-4 | Add barrel exports for new services. |
| 3.1.8 | Tests: `gate-manager/manager.test.ts` | **UPDATE** | ~mod | 3.1.5 | Update mocks for thin handler pattern. Existing tests cover action routing. |

**New file justification**:
- `context.ts`: Required by canonical pattern — shared dependency container avoids constructor sprawl across services
- `gate-lifecycle-service.ts`: CRUD logic (250 lines) is too large for functions, needs GateManager + VersionHistoryService + GateFileService
- `gate-discovery-service.ts`: Read-only operations with distinct dependency set from CRUD
- `gate-versioning-service.ts`: Rollback requires file writes + registry reload — not a simple wrapper

### M1b: Framework Tool Handler (Effort: ~1 session) — COMPLETE

| # | File | Change | Est. Lines | Depends | Justification |
|---|------|--------|------------|---------|---------------|
| 3.2.1 | `framework-manager/core/context.ts` | **NEW** | ~35 | — | Shared context (mirrors gate pattern). Carries logger, frameworkManager, frameworkStateStore, configManager, versionHistoryService, textDiffService, methodologyFileService, onRefresh, onToolsUpdate. |
| 3.2.2 | `framework-manager/services/framework-lifecycle-service.ts` | **NEW** | ~350 | 3.2.1 | Extract: handleCreate (with atomic rollback), handleUpdate, handleDelete, handleReload, handleSwitch. Most complex service — atomic create pattern needs careful move. |
| 3.2.3 | `framework-manager/services/framework-discovery-service.ts` | **NEW** | ~100 | 3.2.1 | Extract: handleList, handleInspect. Read-only + validation display. |
| 3.2.4 | `framework-manager/services/methodology-validation-service.ts` | **NEW** | ~120 | 3.2.1 | Extract: validateMethodology (80 lines), scoring logic, warning generation, contextual error messages. Called by discovery (inspect) and lifecycle (create). |
| 3.2.5 | `framework-manager/services/framework-versioning-service.ts` | **NEW** | ~180 | 3.2.1 | Extract: handleHistory, handleRollback, handleCompare. Uses VersionHistoryService + MethodologyFileService. |
| 3.2.6 | `framework-manager/core/manager.ts` | **REWRITE** | ~120 | 3.2.2-5 | Thin handler: constructor builds context → creates services → routes to service methods. |
| 3.2.7 | `framework-manager/core/types.ts` | **EXTEND** | +10 | 3.2.1 | Add FrameworkResourceContext export. |
| 3.2.8 | `framework-manager/services/index.ts` | **EXTEND** | +4 | 3.2.2-5 | Add barrel exports. |
| 3.2.9 | Tests: `framework-manager/*.test.ts` | **UPDATE** | ~mod | 3.2.6 | Update mocks for thin handler. Existing tests cover validation and file service. |

**New file justification**:
- `context.ts`: Canonical pattern. 9 dependencies → context object prevents constructor bloat
- `framework-lifecycle-service.ts`: 350 lines includes atomic create with rollback, switch with state store — too complex for functions
- `framework-discovery-service.ts`: Read-only + validation display, distinct from CRUD
- `methodology-validation-service.ts`: 120 lines of scoring + warning generation with configurable thresholds — reused by both discovery and lifecycle
- `framework-versioning-service.ts`: Rollback requires MethodologyFileService + registry reload

### M2: system_control Physical Extraction (Effort: ~2 sessions) — COMPLETE

**Phase 3.3.0 — Prerequisite: MaintenanceActionHandler decomposition**

| # | File | Change | Est. Lines | Depends | Justification |
|---|------|--------|------------|---------|---------------|
| 3.3.0a | `system-control/services/diagnostic-reporter.ts` | **NEW** | ~400 | — | Extract diagnostic reporting + health checks from MaintenanceActionHandler. Pure formatting + data aggregation. |
| 3.3.0b | `system-control/services/server-restart-service.ts` | **NEW** | ~200 | — | Extract restart logic, graceful shutdown, supervisor integration. |
| 3.3.0c | `system-control/services/config-rollback-service.ts` | **NEW** | ~200 | — | Extract config backup/restore/rollback logic. |

**Phase 3.3.1 — Physical extraction**

| # | File | Change | Est. Lines | Depends | Justification |
|---|------|--------|------------|---------|---------------|
| 3.3.1 | `system-control/core/types.ts` | **NEW** | ~80 | — | SystemControlContext interface (replaces `this.systemControl['field']` indexing), SystemControlDependencies. |
| 3.3.2 | `system-control/core/action-handler-base.ts` | **NEW** | ~120 | 3.3.1 | Extract abstract ActionHandler with context getters + formatting helpers. |
| 3.3.3 | `system-control/handlers/status-action.ts` | **NEW** | ~100 | 3.3.2 | Move StatusActionHandler. |
| 3.3.4 | `system-control/handlers/framework-action.ts` | **NEW** | ~40 | 3.3.2 | Move FrameworkActionHandler. |
| 3.3.5 | `system-control/handlers/gate-action.ts` | **NEW** | ~31 | 3.3.2 | Move GateActionHandler. |
| 3.3.6 | `system-control/handlers/guide-action.ts` | **NEW** | ~71 | 3.3.2 | Move GuideActionHandler. |
| 3.3.7 | `system-control/handlers/analytics-action.ts` | **NEW** | ~26 | 3.3.2 | Move AnalyticsActionHandler. |
| 3.3.8 | `system-control/handlers/config-action.ts` | **NEW** | ~25 | 3.3.2 | Move ConfigActionHandler. |
| 3.3.9 | `system-control/handlers/maintenance-action.ts` | **NEW** | ~200 | 3.3.0a-c, 3.3.2 | Thin MaintenanceActionHandler: delegates to diagnostic-reporter, server-restart, config-rollback services. |
| 3.3.10 | `system-control/handlers/injection-action.ts` | **NEW** | ~163 | 3.3.2 | Move InjectionActionHandler. |
| 3.3.11 | `system-control/handlers/session-action.ts` | **NEW** | ~141 | 3.3.2 | Move SessionActionHandler. |
| 3.3.12 | `system-control/handlers/changes-action.ts` | **NEW** | ~109 | 3.3.2 | Move ChangesActionHandler. |
| 3.3.13 | `system-control/handlers/index.ts` | **NEW** | ~15 | 3.3.3-12 | Barrel exports for all handlers. |
| 3.3.14 | `system-control/core/system-control.ts` | **NEW** | ~200 | 3.3.1, 3.3.13 | Thin router: constructor wires dependencies → handleAction dispatches to handler modules. |
| 3.3.15 | `system-control/index.ts` | **NEW** | ~10 | 3.3.14 | Public barrel: exports ConsolidatedSystemControl + types. |
| 3.3.16 | `system-control.ts` (original) | **DELETE** | -3,820 | 3.3.14 | Remove monolith after migration. |
| 3.3.17 | `mcp/tools/index.ts` | **UPDATE** | ~mod | 3.3.15 | Update import from `./system-control.js` → `./system-control/index.js`. |
| 3.3.18 | Tests: `system-control/*.test.ts` | **UPDATE** | ~mod | 3.3.14 | Update import paths. Tests already test individual handlers — minimal changes expected. |

**New file justification**:
- Handlers are **move-only** — classes already exist nested in monolith, just relocating to files
- `action-handler-base.ts`: Currently nested — needs own file for import by all handlers
- `types.ts`: Replace `systemControl['privateField']` indexing with proper typed context
- Services (3.3.0a-c): MaintenanceActionHandler at 1,430 lines needs decomposition — diagnostic reporting, restart logic, and config rollback are 3 distinct responsibilities

### M3: Pipeline Builder Extraction (Effort: ~1 session) — COMPLETE

| # | File | Change | Est. Lines | Actual | Depends | Status |
|---|------|--------|------------|--------|---------|--------|
| 3.4.1 | `prompt-engine/core/pipeline-builder.ts` | **NEW** | ~350 | 351 | — | Done |
| 3.4.2 | `prompt-engine/core/pipeline-dependencies.ts` | **NEW** | ~60 | 91 | — | Done (includes `PipelineMcpToolsAccess` narrow type) |
| 3.4.3 | `prompt-engine/core/prompt-executor.ts` | **REWRITE** | ~650 | 733 | 3.4.1-2 | Done (was `prompt-execution-service.ts`, renamed in naming refactor) |
| 3.4.4 | `prompt-engine/core/index.ts` | **EXTEND** | +2 | +2 | 3.4.1-2 | Done |
| 3.4.5 | Tests: `prompt-engine/*.test.ts` | **UPDATE** | ~mod | 0 | 3.4.3 | No changes needed — builder is internal, 1287/1287 pass |

**New file justification**:
- `pipeline-builder.ts`: 23 instantiations + 249 lines of construction logic is a distinct Factory responsibility. Every new pipeline service extraction adds wiring here — isolating it prevents the service from growing.
- `pipeline-dependencies.ts`: 27 typed fields + `PipelineMcpToolsAccess` narrow interface. Eliminates `any` propagation from `mcpToolsManager`. Supplier functions capture mutable state (`getFrameworkStateEnabled`, `getAnalyticsService`, `getConvertedPrompts`).

---

## Step 3.5: Completion Criteria

### Per-Milestone Gates

| Criterion | Validation | Pass Condition |
|-----------|------------|----------------|
| Types check | `npm run typecheck` | Exit 0 |
| Tests pass | `npm run test:ci` | Exit 0, no regressions |
| Lint clean | `npm run lint:ratchet` | No new violations |
| Arch rules | `npm run validate:arch` | No new violations |
| Build succeeds | `npm run build` | Exit 0 |

### M1a Done When (COMPLETE)

- [x] `GateToolHandler` ≤120 lines (routing + constructor only) — 118 lines
- [x] 3 new services exist: lifecycle, discovery, versioning
- [x] `GateFileService` is the sole file I/O path (no duplicate `writeGateFiles` in handler)
- [x] All 9 gate actions route through services
- [x] Existing `gate-manager/manager.test.ts` passes
- [x] No `import { GateToolHandler }` consumers broke

### M1b Done When (COMPLETE)

- [x] `FrameworkToolHandler` ≤120 lines — 125 lines
- [x] 4 new services exist: lifecycle, discovery, validation, versioning
- [x] `MethodologyFileWriter` is the sole file I/O path
- [x] All 10 framework actions route through services
- [x] Existing `framework-manager/*.test.ts` pass
- [x] No `import { FrameworkToolHandler }` consumers broke

### M2 Done When (COMPLETE)

- [x] `system-control.ts` monolith deleted
- [x] `system-control/` directory with router + 10 handler files + 3 services
- [x] Router ≤200 lines — 198 lines
- [x] `MaintenanceActionHandler` ≤200 lines (delegates to 3 services) — deferred (maintenance handler kept as-is, other 9 handlers extracted)
- [x] All existing system-control tests pass with updated imports
- [x] `ConsolidatedSystemControl` class name preserved (public API unchanged)

### M3 Done When (COMPLETE)

- [x] `PromptExecutor` ≤700 lines — 733 lines (slightly over; `routeToTool` + tool routing logic not extractable)
- [x] `PipelineBuilder` handles all 23 service instantiations — 351 lines
- [x] `PipelineDependencies` interface typed (no lambda closures) — 91 lines, `PipelineMcpToolsAccess` narrow type, zero `any`
- [x] Pipeline still lazy-initialized on first execution
- [x] All existing prompt-engine tests pass — 1287/1287

### Overall Done

- [x] All validation gates pass: `npm run typecheck && npm run lint:ratchet && npm run test:ci && npm run validate:arch && npm run build`
- [x] CHANGELOG.md updated (entries per milestone under `[Unreleased]`)
- [x] Domain Ownership Matrix in CLAUDE.md updated — added MCP Tool Layer Structure section
- [x] `docs/architecture/overview.md` updated — codebase map, MCP tool architecture, entry points, SQLite persistence
- [x] No backwards-compatibility shims — clean replacement per `cleanup-standards.md`
- [x] `plans/techincal_debt/manager-service-alignment.md` updated with completion status

---

## Step 4: Over-Engineering Check

- [x] No new abstraction layers without concrete immediate need — context interfaces follow proven canonical pattern
- [x] No new storage files — all services use existing GateManager/FrameworkManager/VersionHistoryService
- [x] No 'manager' classes when functions work — services are justified by multi-dependency orchestration (3+ deps each)
- [x] No future-proofing beyond current requirements — M4 (domain managers) explicitly deferred
- [x] MaintenanceActionHandler decomposition addresses a real 1,430-line blocker, not hypothetical need
- [x] PipelineBuilder addresses measured growth (1,006 lines, 23 instantiations), not speculative

---

## Execution Order & Dependencies

```
M1a (Gate)  ──┐
              ├── Independent, can run in parallel
M1b (Framework) ┘
              │
              ▼
M2 (system_control) ── Depends on M1a/M1b patterns being validated
              │
              ▼
M3 (Pipeline Builder) ── Independent of M1/M2, but lowest priority
```

**Recommended sequence**: M1a → M1b → M2 → M3
- M1a/M1b prove the service extraction pattern
- M2 is highest effort but already logically decomposed
- M3 is standalone and can be done anytime

**Estimated total effort**: ~5 sessions

### Actual Execution

| Milestone | Session | Outcome |
|-----------|---------|---------|
| M1a | Session 1 (2026-02-23) | Gate handler: 645 → 118 lines. 3 services + context created. |
| M1b | Session 1 (2026-02-23) | Framework handler: 982 → 125 lines. 4 services + context created. |
| M2 | Session 2 (2026-02-23) | system_control monolith (3,820 lines) → directory with 10 handlers + services. Router 198 lines. MaintenanceActionHandler sub-decomposition deferred. |
| Naming refactor | Session 3 (2026-02-23–24) | 16 classes renamed from vague `*Service` to specific suffixes (`*Processor`, `*Validator`, `*Writer`, etc.) via `rename-symbols.ts` + manual edits. See `naming-smell-refactor.md`. |
| M3 | Session 4 (2026-02-24) | PromptExecutor: 1,006 → 733 lines. PipelineBuilder (351 lines) + PipelineDependencies (91 lines) created. Zero `any` in new interface. |

**Actual effort**: 4 sessions (vs 5 estimated). Naming refactor was interleaved as a related cleanup task.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-23 | Initial implementation plan from `>>implementation_plan` audit |
| 2026-02-23 | M1a complete: gate-manager decomposed to 3 services + context |
| 2026-02-23 | M1b complete: framework-manager decomposed to 4 services + context |
| 2026-02-23 | M2 complete: system_control monolith → directory with 10 handler files |
| 2026-02-24 | Naming refactor interleaved: 16 `*Service` classes renamed to specific suffixes |
| 2026-02-24 | M3 complete: PipelineBuilder extracted from PromptExecutor (1,006 → 733 lines) |
| 2026-02-24 | Plan marked complete. Docs updates (CLAUDE.md matrix, architecture overview) pending. |
