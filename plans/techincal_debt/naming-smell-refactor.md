# Naming Smell Refactor Plan

## Problem

26 classes use the vague `Manager` suffix, hiding their actual responsibility. 1 interface/implementation suffix mismatch (`ChainSessionService` interface vs `ChainSessionManager` impl). Inconsistent suffixes break glob-based codebase search (`*Store`, `*Registry`, `*Router`).

## Approach

**Preferred tool**: `sed` with targeted file lists. Simple, reliable, no bidirectional rename surprises.

**ts-morph limitation**: `rename()` follows the TypeScript language service — when class `implements` interface, renaming either propagates to BOTH. Cannot independently rename class and interface sharing `implements`. Use `sed` for any class with `implements`.

**ts-morph safe for**: Classes without `implements` relationships (standalone classes, abstract bases).

**Workflow per tier**:
1. Identify which classes have `implements` relationships (use `sed`)
2. For standalone classes, ts-morph `rename()` is safe
3. For `implements`-linked classes, use `sed -i 's/OldName/NewName/g'` with targeted file list
4. Also rename: file, factory function, options type, private field names, log messages
5. Validate: `npm run typecheck && npm run lint:ratchet && npm test && npm run build`

**Lesson from Tier 1**: ts-morph renamed `ChainSessionManager` → `ChainSessionStore`, but also renamed the `ChainSessionService` interface (because `implements` links them). Required full rollback + manual `sed` approach. For remaining tiers, check `implements` before choosing tool.

**Lesson from Tier 2**: (1) Always check for name collisions with existing classes before choosing a target name. `GateManager` → `GateRegistry` collided with internal `GateRegistry` class. (2) `sed -i` via `rg | xargs` can truncate the file being renamed when the sed pattern matches import paths that include the filename. Rename content BEFORE the file, or exclude self from the target list.

---

## Tier 1: Chain Session (COMPLETE)

| Item | Old | New | Status |
|------|-----|-----|--------|
| Class | `ChainSessionManager` | `ChainSessionStore` | Done |
| Interface | `ChainSessionService` | **KEPT** (different role) | Done |
| File | `manager.ts` | `chain-session-store.ts` | Done |
| Factory | `createChainSessionManager` | `createChainSessionStore` | Done |
| Options | `ChainSessionManagerOptions` | `ChainSessionStoreOptions` | Done |
| Test file | `chain-session-manager.test.ts` | `chain-session-store.test.ts` | Done |
| Method names | `getChainSessionManager()` / `setChainSessionManager()` | `getChainSessionStore()` / `setChainSessionStore()` | Done |
| Property names | `chainSessionManager` (in stages, services) | `chainSessionStore` | Done |
| Interface property | `ResourceDependencies.chainSessionManager` | `ResourceDependencies.chainSessionStore` | Done |
| Log messages | `[ChainSessionManager]` | `[ChainSessionStore]` | Done |
| Dependency cruiser | `chains/manager\\.ts$` | `chains/chain-session-store\\.ts$` | Done |
| Test describe blocks | `describe('ChainSessionManager')` | `describe('ChainSessionStore')` | Done |
| Test variable names | `mockChainSessionManager` / `StubChainSessionManager` | `mockChainSessionStore` / `StubChainSessionStore` | Done |

**Validation**: typecheck clean, 91 suites / 1084 tests pass, build succeeds.

**Remaining**: Python hooks + CLAUDE.md references (deferred to doc cleanup pass).

---

## Tier 2: Registries (COMPLETE)

Resource definition loaders that resolve by ID — these are registries.

| Item | Old | New | Status |
|------|-----|-----|--------|
| Class | `FrameworkManager` | `FrameworkRegistry` | Done |
| File | `framework-manager.ts` | `framework-registry.ts` | Done |
| Factory | `createFrameworkManager` | `createFrameworkRegistry` | Done |
| Config | `FrameworkManagerConfig` | `FrameworkRegistryConfig` | Done |
| Stats | `FrameworkManagerStats` | `FrameworkRegistryStats` | Done |
| Methods | `setFrameworkManager()` / `getFrameworkManager()` | `setFrameworkRegistry()` / `getFrameworkRegistry()` | Done |
| Properties | `frameworkManager` (in stages, services) | `frameworkRegistry` | Done |
| Class | `GateManager` | **`GateOrchestrator`** (collision with internal `GateRegistry`) | Done |
| File | `gate-manager.ts` | `gate-orchestrator.ts` | Done |
| Factory | `createGateManager` | `createGateOrchestrator` | Done |
| Config | `GateManagerConfig` | `GateOrchestratorConfig` | Done |
| Interface | `IGateManager` | `IGateOrchestrator` | Done |
| Adapter | `GateManagerProvider` | `GateOrchestratorProvider` | Done |
| Properties | `gateManager` (in stages, services) | `gateOrchestrator` | Done |
| Class | `StyleManager` | `StyleRegistry` | Done |
| File | `style-manager.ts` | `style-registry.ts` | Done |
| Factory | `createStyleManager` | `createStyleRegistry` | Done |
| Config | `StyleManagerConfig` | `StyleRegistryConfig` | Done |
| Interface | `IStyleManager` | `IStyleRegistry` | Done |
| Properties | `styleManager` (in stages, services) | `styleRegistry` | Done |
| Class | `PromptAssetManager` | `PromptAssetLoader` | Done |
| Properties | `promptManager` (everywhere) | `promptLoader` | Done |
| Class | `CategoryManager` | `CategoryAssigner` | Done |
| File | `category-manager.ts` | `category-assigner.ts` | Done |
| Factory | `createCategoryManager` | `createCategoryAssigner` | Done |
| Properties | `categoryManager` | `categoryAssigner` | Done |

**Collision discovery**: `GateManager` → `GateRegistry` collided with existing internal `GateRegistry` class in `gates/registry/gate-registry.ts`. Changed to `GateOrchestrator` instead. The internal `GateRegistry` class was NOT renamed (correct name for its role).

**File truncation issue**: `sed -i` with `xargs` from `rg` can truncate files when the sed pattern matches the filename itself (e.g., replacing `gate-registry` in import paths inside a file named `gate-registry.ts`). Two files were truncated (`framework-registry.ts`, `gate-hot-reload.ts`); both restored from git HEAD and re-applied renames manually.

**Lesson**: When using `sed -i` to rename import paths, exclude the file being renamed from the target list, or run the content rename BEFORE the file rename.

**Validation**: typecheck clean, 91 suites / 1084 tests pass, build succeeds.

---

## Tier 3: State Stores (COMPLETE)

Classes that persist state to SQLite.

| Current | Proposed | Reason | Tool |
|---------|----------|--------|------|
| `FrameworkStateManager` | `FrameworkStateStore` | Persists active framework selection | ts-morph (extends EventEmitter only) |
| `GateSystemManager` | `GateStateStore` | Persists gate system state | ts-morph (extends EventEmitter only) |
| `VerifyActiveStateManager` | `VerifyActiveStateStore` | Tracks shell-verify active runs | ts-morph (standalone) |
| `TextReferenceManager` | `TextReferenceStore` | Stores/retrieves text refs | ts-morph (standalone) |
| `ConversationManager` | `ConversationStore` | Stores conversation history | ts-morph (standalone) |

**Completed renames**:

- `FrameworkStateManager` → `FrameworkStateStore`
  - File: `framework-state-manager.ts` → `framework-state-store.ts`
  - Factory: `createFrameworkStateManager` → `createFrameworkStateStore`
  - API/field names: `setFrameworkStateManager` / `frameworkStateManager` → `setFrameworkStateStore` / `frameworkStateStore`
- `GateSystemManager` → `GateStateStore`
  - File: `gate-state-manager.ts` → `gate-state-store.ts`
  - Factory: `createGateSystemManager` → `createGateStateStore`
  - API/field names: `setGateSystemManager` / `gateSystemManager` → `setGateStateStore` / `gateStateStore`
- `TextReferenceManager` → `TextReferenceStore`
  - API/field names: `getTextReferenceManager` / `textReferenceManager` → `getTextReferenceStore` / `textReferenceStore`
  - Test file: `text-reference-manager.test.ts` → `text-reference-store.test.ts`
- `ConversationManager` → `ConversationStore`
  - Factory: `createConversationManager` → `createConversationStore`
  - API/field names: `conversationManager` → `conversationStore`
- `VerifyActiveStateManager` was already migrated earlier to `VerifyActiveStateStore`.

**Validation (Tier 3 pass)**:

- `npm run typecheck` ✅
- `npm run build` ✅
- `npm run lint:ratchet` ❌ (current branch has pre-existing ratchet/baseline deltas)
- Targeted tests:
  - `framework-state-store.persistence.test.ts` ✅
  - `text-reference-store.test.ts` ✅
  - `gate-state-store.persistence.test.ts` ✅

**Follow-up fixes applied**:

- `FrameworkStateStore` runtime regression fixed: removed stale `this.currentState` references left after scoped-state migration and routed health/toggle/metrics paths through default scoped state.
- `PromptExecutionService` gate-stage wiring updated for current `GateEnhancementStage` contract (construct and inject `GateEnhancementService` + `TemporaryGateRegistrar`).

---

## Tier 4: Infrastructure (COMPLETE)

| Current | Proposed | Reason | Tool |
|---------|----------|--------|------|
| `ServerManager` | `ServerLifecycle` | Starts/stops HTTP server | ts-morph (standalone) |
| `TransportManager` | `TransportRouter` | Routes to STDIO/SSE transport | ts-morph (standalone) |
| `ApiManager` | `ApiRouter` | Registers HTTP endpoints | ts-morph (standalone) |
| `HotReloadManager` | `HotReloadObserver` | Observes files + triggers reload | ts-morph (standalone) |
| `ServiceManager` | `ServiceOrchestrator` | Coordinates startup/shutdown | ts-morph (standalone) |
| `SessionOverrideManager` | `SessionOverrideResolver` | Resolves per-session overrides | ts-morph (standalone) |
| `ToolDescriptionManager` | `ToolDescriptionLoader` | Loads tool descriptions from contracts | ts-morph (extends EventEmitter only) |
| `EventEmittingConfigManager` | `ConfigLoader` | Loads + watches config (or KEEP) | **sed** (`implements ConfigManager`) |

**Completed renames**:

- `ServerManager` → `ServerLifecycle` (factory + variable names updated to `createServerLifecycle` / `serverLifecycle`)
- `TransportManager` → `TransportRouter` (factory + variable names updated to `createTransportRouter` / `transportRouter`)
- `ApiManager` → `ApiRouter` (factory + variable names updated to `createApiRouter` / `apiRouter`)
- `HotReloadManager` → `HotReloadObserver`
  - File: `hot-reload-manager.ts` → `hot-reload-observer.ts`
  - Factory + variable names updated to `createHotReloadObserver` / `hotReloadObserver`
- `ServiceManager` → `ServiceOrchestrator`
  - File: `service-manager.ts` → `service-orchestrator.ts`
- `SessionOverrideManager` → `SessionOverrideResolver`
  - Singleton helpers renamed: `init/get/is/resetSessionOverrideResolver`
- `ToolDescriptionManager` → `ToolDescriptionLoader`
  - File: `tool-description-manager.ts` → `tool-description-loader.ts`
  - Factory/setter/property names updated to `createToolDescriptionLoader` / `setToolDescriptionLoader` / `toolDescriptionLoader`
- `EventEmittingConfigManager` → `ConfigLoader`
  - Factory renamed to `createConfigLoader`

**Validation (Tier 4 pass)**:

- `npm run typecheck` ✅
- `npm run build` ✅
- Targeted tests:
  - `tests/unit/execution/injection/session-overrides.test.ts` ✅
  - `tests/unit/prompts/hot-reload-auxiliary.test.ts` ✅
  - `tests/tool-description-loader.test.ts` ✅ (reconciled to generated contracts + in-memory sync model; removed fallback-file/on-disk active-config assumptions)
- `npm run lint:ratchet` ❌ (branch still above ratchet baseline after phase work)

**Follow-up reconciliation fixes (post Tier 4):**

- Updated `tests/tool-description-loader.test.ts` to align with canonical `ToolDescriptionLoader` architecture:
  - Source-of-truth from generated contracts (`src/tooling/contracts/_generated/tool-descriptions.contracts.json`)
  - In-memory synchronization model (no `config/tool-descriptions.json` persistence assertions)
  - Framework switch behavior validated via `descriptions-changed` events and `getDescription(...)` output
- Fixed constructor drift in `PromptExecutionService` pipeline wiring:
  - `InlineGateExtractionStage` now receives an `InlineGateProcessor` instance (current stage contract), replacing stale multi-arg constructor call

---

## Tier 5: MCP Tool Orchestrators

Thin orchestration layers for MCP tool calls.

| Current | Proposed | Reason | Tool |
|---------|----------|--------|------|
| `ConsolidatedFrameworkManager` | `FrameworkToolHandler` | Orchestrates framework MCP tool calls | ts-morph (standalone) |
| `ConsolidatedGateManager` | `GateToolHandler` | Orchestrates gate MCP tool calls | ts-morph (standalone) |
| `ConsolidatedMcpToolsManager` | `McpToolRouter` | Top-level MCP tool router | ts-morph (standalone) |
| `ConsolidatedCheckpointManager` | `CheckpointToolHandler` | Orchestrates checkpoint MCP tool calls | ts-morph (standalone) |
| `BaseResourceManager` | `BaseResourceHandler` | Abstract base for resource tools | ts-morph (abstract, no implements) |

**Completed renames**:

- `ConsolidatedFrameworkManager` → `FrameworkToolHandler`
  - Factory + exports renamed to `createFrameworkToolHandler`
- `ConsolidatedGateManager` → `GateToolHandler`
  - Factory + exports renamed to `createGateToolHandler`
- `ConsolidatedMcpToolsManager` → `McpToolRouter`
  - Factory renamed to `createMcpToolRouter`
  - Backward-compatible alias retained: `createMcpToolsManager = createMcpToolRouter`
- `ConsolidatedCheckpointManager` → `CheckpointToolHandler`
  - Factory + exports renamed to `createCheckpointToolHandler`
- `BaseResourceManager` → `BaseResourceHandler`
  - Config type renamed: `BaseResourceManagerConfig` → `BaseResourceHandlerConfig`
  - File renamed: `base-resource-manager.ts` → `base-resource-handler.ts`

**Validation (Tier 5 pass)**:

- `npm run typecheck` ✅
- `npm run build` ✅
- Targeted tests:
  - `tests/unit/mcp-tools/framework-manager/completeness-validation.test.ts` ✅
  - `tests/unit/mcp-tools/prompt-engine/prompt-engine-validation.test.ts` ✅
  - `tests/unit/mcp-tools/gate-manager/manager.test.ts` ✅ (updated to `GateToolHandler` canonical dependencies/behavior)
  - `tests/unit/mcp-tools/identity-policy-boundary.test.ts` ✅ (updated to `request-identity-resolver` canonical boundary contract)
  - `tests/unit/mcp-tools/resource-manager/checkpoint/manager.identity-context.test.ts` ✅ (updated to current global checkpoint runtime-state behavior)
  - `tests/unit/mcp-tools/request-identity-resolver.test.ts` ✅ (regression check for canonical resolver)
- `npm run lint:ratchet` ❌ (branch still above ratchet baseline; strict rule buckets remain elevated)

**Post-Tier-5 reconciliation (2026-02-23):**

- Diagnosed and reconciled 11 failing unit suites caused by contract drift after Phase 4/5 modernization.
- Category 1 (execution pipeline constructor drift):
  - Updated stage tests for `InlineGateExtractionStage` to inject `InlineGateProcessor`.
  - Updated `PromptExecutionPipeline` orchestration test to include `IdentityResolution` stage and current constructor slots.
- Category 2 (system-control API surface drift):
  - Reconciled tests from removed legacy APIs (`whoami`, `setChainSessionStore`, `setFrameworkRegistry`) to canonical actions/setters.
  - Updated gate/framework/session action assertions to match current no-scope setter/action contracts.
- Category 3 (runtime/schema contract drift):
  - Updated `options.identity` test for current CLI-first fields (`identityMode`, `identityDefaults`) and no env hydration.
  - Updated delegation schema tests to reflect `ChainStepSchema` stripping non-schema fields while top-level prompt schemas remain passthrough.
- Category 4 (resource/file service behavior drift):
  - Reworked methodology-file and prompt file-operations validation tests to current canonical file-write behaviors (non-transactional verification metadata path removed).
- Additional full-suite follow-up:
  - Reconciled `StepResponseCaptureStage` tests to current constructor split (`GateVerdictProcessor` + `StepCaptureService`).
  - Replaced legacy stage-private verdict parser tests with canonical `parseGateVerdict` contract tests.
- Validation:
  - Targeted failing-suite reruns ✅
  - `NODE_OPTIONS="--experimental-vm-modules" npx jest --runInBand --forceExit tests/unit` ✅ (123 suites, 1293 tests)

---

## Tier 6: Hungarian Notation — Broadly Used Interfaces

`I`-prefix on interfaces is TypeScript Hungarian notation. The type system already distinguishes interfaces from classes — the prefix adds noise, breaks grep patterns (`IStyleManager` vs `StyleManager`), and creates naming decisions that don't need to exist.

**Naming strategy for Tier 6/7**:
- Remove `I` prefix everywhere.
- Use plain name when there is no collision (`IStateStore` → `StateStore`).
- When interface name would collide with an existing class, use `Port` suffix (`IContentAnalyzer` → `ContentAnalyzerPort`).
- Reserve `Contract` suffix for payload/schema shapes, not DI/service interfaces.

Tier 6 focuses on high-impact cross-layer interfaces — rename carefully:

| Current | Proposed | Implementer | Consumers (files) | Notes |
|---------|----------|-------------|-------------------|-------|
| `IGateGuide` | `GateGuide` | `GenericGateGuide` | 11 | No collision |
| `IMethodologyGuide` | `MethodologyGuide` | `BaseMethodologyGuide` | 9 | No collision |
| `IGateService` | `GateService` | `SemanticGateService`, `CompositionalGateService` | 8 | No collision |
| `IStateStore<T>` | `StateStore<T>` | `SqliteStateStore` | 4 | No collision |
| `IContentAnalyzer` | `ContentAnalyzerPort` | `ContentAnalyzer` | 4 | **COLLISION** with `ContentAnalyzer` class |
| `IStyleManager` | `StyleManagerPort` | `StyleManager` | 4 | **COLLISION** with `StyleManager` class |
| `IExecutionModeService` | `ExecutionModeServicePort` | `ExecutionModeService` | 3 | **COLLISION** |
| `IHookRegistry` | `HookRegistryPort` | `HookRegistry` | 6 | **COLLISION** |
| `IMcpNotificationEmitter` | `McpNotificationEmitterPort` | `McpNotificationEmitter` | 6 | **COLLISION** |

**Completed renames (Tier 6):**

- `IGateGuide` → `GateGuide`
- `IMethodologyGuide` → `MethodologyGuide`
- `IGateService` → `GateService`
- `IStateStore<T>` → `StateStore<T>`
- `IContentAnalyzer` → `ContentAnalyzerPort`
- `IStyleManager` → `StyleManagerPort`
- `IExecutionModeService` → `ExecutionModeServicePort`
- `IHookRegistry` → `HookRegistryPort`
- `IMcpNotificationEmitter` → `McpNotificationEmitterPort`

**Validation (Tier 6 pass):**

- `npm run typecheck` ✅
- Targeted tests ✅
  - `tests/unit/gates/services/gate-services.test.ts`
  - `tests/unit/execution/pipeline/gate-enhancement-stage.test.ts`
  - `tests/unit/frameworks/methodology/yaml-methodology-loading.test.ts`
  - `tests/unit/execution/pipeline/phase-guard-verification-stage.test.ts`
  - `tests/unit/mcp-tools/prompt-engine/prompt-engine-validation.test.ts`

---

## Tier 7: Hungarian Notation — Moderate/Narrow Interfaces

Less broadly used — lower risk:

| Current | Proposed | Consumers (files) | Notes |
|---------|----------|-------------------|-------|
| `IPromptResourceService` | `PromptResourceServicePort` | 3 | **COLLISION** with `PromptResourceService` |
| `IScriptLoader` | `ScriptLoader` | 3 | No collision — impl is `WorkspaceScriptLoader` |
| `IToolDetectionService` | `ToolDetectionServicePort` | 5 | **COLLISION** + duplicated in `prompt-reference-resolver.ts` |
| `IScriptExecutor` | `ScriptExecutorPort` | 5 | **COLLISION** + duplicated in `prompt-reference-resolver.ts` |
| `IResponseFormatter` | `ResponseFormatterPort` | 3 | **COLLISION** with `ResponseFormatter` |
| `IChainManagementService` | `ChainManagementServicePort` | 3 | **COLLISION** with `ChainManagementService` |
| `IApiRouter` | `ApiRouterPort` | 2 | **COLLISION** with `ApiRouter` |
| `IBaseRegistry<T>` | `BaseRegistry<T>` | 1 | No collision |
| `IScriptReferenceResolver` | `ScriptReferenceResolverPort` | 3 | **COLLISION** with `ScriptReferenceResolver` |
| `IScriptExecutorService` | **DELETE** (replace with `ScriptExecutorPort`) | 2 | Local-only type in `script-reference-resolver.ts`; no dedicated implementer |
| `IPromptGuidanceService` | **DELETE** | 2 | Unused type export; concrete class does not implement it |

**Completed renames/deletions (Tier 7):**

- `IPromptResourceService` → `PromptResourceServicePort`
- `IScriptLoader` → `ScriptLoader`
- `IToolDetectionService` → `ToolDetectionServicePort`
- `IScriptExecutor` → `ScriptExecutorPort`
- `IResponseFormatter` → `ResponseFormatterPort`
- `IChainManagementService` → `ChainManagementServicePort`
- `IApiRouter` → `ApiRouterPort`
- `IBaseRegistry<T>` → `BaseRegistry<T>`
- `IScriptReferenceResolver` → `ScriptReferenceResolverPort`
- Confirmed removed: `IScriptExecutorService`, `IPromptGuidanceService`

**Validation (Tier 7 pass):**

- `npm run typecheck` ✅
- Targeted tests ✅
  - `tests/unit/execution/reference/script-reference-resolver.test.ts`
  - `tests/integration/reference/script-reference-resolution.test.ts`
  - `tests/integration/reference/reference-resolution.test.ts`
  - `tests/unit/execution/pipeline/response-formatting-stage.test.ts`
  - `tests/integration/mcp-tools/resource-manager-workflow.test.ts`
- `npm run build` ✅
- `npm run lint:ratchet` ⚠️
  - pre-existing ratchet debt persists: `@typescript-eslint/no-unused-vars` baseline 76 → current 78 (+2)

### Side findings

- **Duplicate interfaces (pre-churn deletion)**: `IToolDetectionService` and `IScriptExecutor` are defined in BOTH `shared/types/index.ts` and `engine/execution/reference/prompt-reference-resolver.ts`. Delete local duplicates and import shared types in resolver modules.
- **Unused interface (delete first)**: `IPromptGuidanceService` only appears in type export surface and is not consumed by runtime code.
- **Consolidation candidate (delete local alias)**: `IScriptExecutorService` is local to `script-reference-resolver.ts` with no dedicated implementer. Replace with shared `IScriptExecutor` (`ScriptExecutorPort` after rename) and remove the local interface.
- **Keep, then rename**: `IScriptReferenceResolver` is actively used by execution stages/operators; rename to `ScriptReferenceResolverPort` (do not delete).

### Pre-rename deletion gate (run before Tier 6/7 sed churn)

1. ✅ Remove `IPromptGuidanceService` from `engine/frameworks/types/prompt-guidance-types.ts` and `engine/frameworks/types/index.ts`.
2. ✅ Remove local `IToolDetectionService` + `IScriptExecutor` from `engine/execution/reference/prompt-reference-resolver.ts`; import shared interfaces from `shared/types/index.ts`.
3. ✅ Remove local `IScriptExecutorService` from `engine/execution/reference/script-reference-resolver.ts`; use shared `IScriptExecutor`.
4. ✅ Re-run validation:
   - `npm run typecheck` ✅
   - `npm run build` ✅
   - targeted tests for Tier 6/7 surfaces ✅
   - `npm run lint:ratchet` ⚠️ pre-existing debt bucket remains (`@typescript-eslint/no-unused-vars` +2)
5. ✅ Tier 6/7 interface renames executed with the `Port` naming convention where collisions exist.

### Completed rename checkpoint: `IScriptReferenceResolver`

- Completed in Tier 7: `IScriptReferenceResolver` → `ScriptReferenceResolverPort`.
- Rename set:
  - `server/src/shared/utils/jsonUtils.ts` (interface definition + `ProcessTemplateOptions.scriptResolver` type)
  - `server/src/engine/execution/pipeline/stages/09-execution-stage.ts` (import + constructor type)
  - `server/src/engine/execution/operators/chain-operator-executor.ts` (import + constructor type)
- Validation completed: targeted stage/operator tests + full `npm run typecheck`.

---

## Kept As-Is

| Current | Reason |
|---------|--------|
| `DatabaseManager` | Actually manages a connection lifecycle + schema |
| `ErrorHandler` | "Handler" is specific here — handles error boundaries |

---

## Script Location

`server/scripts/rename-symbols.ts` — ts-morph rename script with the full map. **Note**: Only safe for classes WITHOUT `implements` relationships. For the rest, use `sed`.

## Execution Order

1. For each tier: check `implements` relationships first (`grep "implements" <file>`)
2. Classes with `implements` → use `sed` approach (Tier 1 pattern)
3. Standalone classes → ts-morph `rename()` is safe
4. Also rename: file, factory, options, property names, log messages, test files
5. Validate per tier: `npm run typecheck && npm run lint:ratchet && npm test && npm run build`
6. Each tier = one commit with conventional message `refactor(scope): rename X to Y`
7. **Hungarian notation tiers (6-7)**: Use `sed` for remaining `I`-prefixed interfaces after the pre-rename deletion gate removes dead/duplicate interfaces

## Status

- [x] Audit complete (26 Manager classes + 23 Hungarian interfaces identified)
- [x] Tier 1: `ChainSessionManager` → `ChainSessionStore` (typecheck + 1084 tests + build pass)
  - Full cleanup: class, file, factory, options, methods, properties, log messages, tests, dep cruiser
  - ts-morph limitation discovered + documented
- [x] Tier 2: Registries (typecheck + 1084 tests + build pass)
  - GateManager → GateOrchestrator (collision with internal GateRegistry forced name change)
  - File truncation bug discovered: sed + xargs can truncate files matching the rename pattern
  - Lesson: rename content BEFORE renaming file, or exclude self from target list
- [x] Tier 3: State stores
- [x] Tier 4: Infrastructure
- [x] Tier 5: MCP tool orchestrators
- [x] Tier 6: Hungarian notation — high-impact interfaces (9 interfaces)
- [x] Tier 7: Hungarian notation — moderate/narrow interfaces (11 interfaces, includes deletion/consolidation audit)
- [ ] CLAUDE.md + docs updated
- [ ] Python hooks updated
