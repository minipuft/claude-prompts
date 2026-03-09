# OpenTelemetry Telemetry & Logging Upgrade — Implementation Plan

**Status**: Ready for Implementation (pending clean baseline checks)  
**Created**: 2026-02-15  
**Last Updated**: 2026-02-24  
**Methodology**: `prompt_engine >>implementation_plan`

---

## Phase 1.0: Scope Alignment

**Work Type**: feature + refactor (observability foundation)  
**Confidence**: medium  
**Scope**: `engine/execution`, `infra/observability`, runtime wiring, config/schema, docs, tests  
**Risk Level**: medium-high (cross-cutting runtime behavior)

### Problem Statement
Current observability is primarily in-memory metrics (`MetricsCollector`) plus logs/notifications. We need production-grade tracing + policy-governed telemetry that preserves existing pipeline/stage semantics and transport behavior.

### Desired State
- OpenTelemetry traces for full `prompt_engine` lifecycle with stage-preserving spans.
- Business-context events for gate/shell/chain lifecycle without raw prompt/response payload leakage.
- Existing analytics resources (`resource://metrics/pipeline`) remain compatible during rollout.
- Sampling + attribute policies are explicit, test-covered, and operationally documented.

### Acceptance Criteria
1. Root + stage spans emitted for all executed pipeline stages (including early exits and errors).
2. Gate + shell verification lifecycle is visible as trace events with stable, non-sensitive attributes.
3. No high-cardinality IDs in metric labels; rich identifiers remain trace-only.
4. No raw command text, raw user response, or rendered prompt/model output in default telemetry attributes/events.
5. Runtime works across `stdio`, `sse`, and `streamable-http` modes.

---

## Phase 2.0: Existing Systems Audit

| System | File(s) | Current Capability | Gap for OTel | Reuse Decision |
| --- | --- | --- | --- | --- |
| Pipeline orchestrator | `server/src/engine/execution/pipeline/prompt-execution-pipeline.ts` | Stage order, timing/memory metrics, command metrics, early exit handling | No spans/trace context | Extend in place (canonical stage boundaries) |
| Pipeline dependency injection | `server/src/engine/execution/pipeline/stages/00-dependency-injection-stage.ts` | Injects metrics/hooks/notifications into context metadata | No telemetry runtime handle | Extend in place |
| Execution context + state | `server/src/engine/execution/context/execution-context.ts`, `server/src/engine/execution/context/internal-state.ts` | Rich request/session/gate/runtime state | No typed telemetry bridge surface | Reuse with minimal typed additions |
| Gate verdict lifecycle | `server/src/engine/gates/services/gate-verdict-processor.ts` | Emits gate hook + notification events (`passed/failed/retryExhausted/responseBlocked`) | Not connected to trace events | Reuse as canonical gate-event source |
| Shell verification lifecycle | `server/src/engine/execution/pipeline/stages/08b-shell-verification-stage.ts` | attempt/fail/pass/escalation flow | No trace events | Extend stage minimally |
| Hook event surface | `server/src/infra/hooks/hook-registry.ts` | Stage/gate/chain hook APIs and EventEmitter signals | Stage hook methods not invoked by pipeline; no OTel adapter | Reuse + wire pipeline calls + add telemetry hook adapter |
| Notification surface | `server/src/infra/observability/notifications/mcp-notification-emitter.ts` | MCP client notifications for gate/framework/chain | Not correlated with traces | Keep as client-facing path; don’t replace |
| Metrics collector | `server/src/infra/observability/metrics/analytics-service.ts` | In-memory analytics + summaries + stage/command history | Not OTel metrics/export | Keep as compatibility layer; bridge selectively |
| Observability resources | `server/src/modules/resources/handlers/observability-resources.ts` | `resource://session/*`, `resource://metrics/pipeline`, logs resources | No telemetry runtime health/config view | Extend minimally |
| Runtime bootstrap | `server/src/runtime/application.ts`, `server/src/runtime/module-initializer.ts` | Composes HookRegistry, notification emitter, metrics collector, tools | No telemetry startup/shutdown lifecycle | Extend with dedicated telemetry runtime service |
| Config/schema | `server/src/shared/types/core-config.ts`, `server/config.schema.json`, `server/src/cli-shared/config-input-validator.ts`, `server/src/infra/config/index.ts` | Resource observability toggles + other runtime config | No dedicated telemetry/tracing config section | Extend with separate `telemetry` config surface |
| Tooling/contracts | `server/tooling/contracts/*.json` | SSOT for tool params/descriptions | Plan must avoid ad-hoc runtime params | No contract changes required for initial telemetry rollout |

### Audit Findings (Out-of-Date Items in Previous Plan)
- Current architecture includes Stage 00 (normalization/dependency/lifecycle/identity) and additional branches (scripts, phase guards) that must be included in telemetry semantics.
- Transport parity now includes `streamable-http` in addition to `stdio` and `sse`.
- Test directory conventions are `server/tests/unit/execution/...` and `server/tests/integration/...` (not `unit/engine/...`).

---

## Phase 3.0: Reuse-First Design

### Compound Diagnosis
**Weakest point**: a stage-by-stage direct OTel implementation may bloat orchestration layers and duplicate existing event surfaces.

**Diagnosis**: implement a **central telemetry runtime + pipeline/hook adapters** pattern:
1. Pipeline orchestrator owns root/stage span lifecycle.
2. Domain services (gate verdict, shell verification) emit high-value events.
3. Hook registry becomes the reusable event fan-out point (including telemetry sink).
4. Existing `MetricsCollector` remains canonical for `resource://metrics/pipeline` during migration.

### Design Principles
- Stage-preserving spans; do not collapse into opaque “phase” spans.
- Trace richness + metric cardinality discipline.
- Typed policy layer for attribute allowlist/redaction.
- Extraction-first for oversized entrypoints; keep `application.ts` wiring-thin.
- No dual long-lived observability stacks: compatibility bridge is temporary and scoped.

---

## Phase 4.0: Implementation Plan

### Phase Legend
- **1.0** Baseline preflight
- **1.1** Config + dependency baseline
- **1.2** Telemetry runtime + policy layer
- **1.3** Runtime wiring + lifecycle
- **1.4** Pipeline + event instrumentation
- **1.5** Resource visibility + docs
- **1.6** Test coverage + rollout checks

### 1.0 Baseline Preflight

Before telemetry implementation begins, confirm current branch health from `server/`:
- `npm run typecheck`
- `npm run lint:ratchet`
- `npm run test:ci`

If `lint:ratchet` is already regressed, resolve or rebase before telemetry work so observability diffs remain attributable.

### 1.1 Config + Dependency Baseline

| File | Change Type | Est. Lines | Phase | Depends On | Justification |
| --- | --- | --- | --- | --- | --- |
| `server/package.json` | Extend | +20 | 1.1 | — | Add OTel SDK/exporter deps needed for traces/metrics runtime |
| `server/src/shared/types/core-config.ts` | Extend | +45 | 1.1 | — | Add dedicated `telemetry` config section (separate from `resources.observability`) |
| `server/config.schema.json` | Extend | +90 | 1.1 | — | Schema validation for telemetry mode/exporter/sampling/attribute policy |
| `server/src/cli-shared/config-input-validator.ts` | Extend | +55 | 1.1 | 1.1 | CLI set/get validation for telemetry keys |
| `server/src/infra/config/index.ts` | Extend | +70 | 1.1 | 1.1 | Defaults + normalization helpers for telemetry config |

### 1.2 Telemetry Runtime + Policy Layer

| File | Change Type | Est. Lines | Phase | Depends On | Justification |
| --- | --- | --- | --- | --- | --- |
| `server/src/infra/observability/telemetry/types.ts` | New | +120 | 1.2 | 1.1 | Typed telemetry contracts (runtime, recorder, event attrs) |
| `server/src/infra/observability/telemetry/attribute-policy.ts` | New | +220 | 1.2 | 1.1 | Allowlist/redaction + cardinality policy enforcement |
| `server/src/infra/observability/telemetry/metric-view-policy.ts` | New | +120 | 1.2 | 1.1 | Low-cardinality metric views/attribute filtering |
| `server/src/infra/observability/telemetry/runtime.ts` | New | +240 | 1.2 | 1.1 | NodeSDK startup/shutdown, exporter setup, graceful failure behavior |
| `server/src/infra/observability/telemetry/hook-observer.ts` | New | +160 | 1.2 | 1.2 | Bridges hook events (`gate/*`, `chain/*`, stage events) into trace events |
| `server/src/infra/observability/telemetry/index.ts` | New | +25 | 1.2 | 1.2 | Barrel exports |

### 1.3 Runtime Wiring + Lifecycle

| File | Change Type | Est. Lines | Phase | Depends On | Justification |
| --- | --- | --- | --- | --- | --- |
| `server/src/runtime/telemetry-lifecycle.ts` | New | +110 | 1.3 | 1.2 | Extract telemetry startup/shutdown orchestration outside oversized `application.ts` |
| `server/src/runtime/module-initializer.ts` | Extend | +60 | 1.3 | 1.2 | Create telemetry runtime, connect hook observer |
| `server/src/runtime/application.ts` | Extend | +20 | 1.3 | 1.2 | Thin lifecycle wiring only (delegate heavy logic to `telemetry-lifecycle.ts`) |
| `server/src/shared/types/index.ts` | Extend | +25 | 1.3 | 1.2 | Add minimal telemetry port types for wiring boundaries |

### 1.4 Pipeline + Event Instrumentation

| File | Change Type | Est. Lines | Phase | Depends On | Justification |
| --- | --- | --- | --- | --- | --- |
| `server/src/engine/execution/pipeline/prompt-execution-pipeline.ts` | Extend | +220 | 1.4 | 1.3 | Root span + stage spans + error status + early exit semantics |
| `server/src/engine/execution/pipeline/stages/00-dependency-injection-stage.ts` | Extend | +25 | 1.4 | 1.3 | Attach telemetry recorder/runtime handles to pipeline dependencies |
| `server/src/infra/hooks/hook-registry.ts` | Extend | +35 | 1.4 | 1.2 | Optional telemetry-aware event payload normalization |
| `server/src/engine/gates/services/gate-verdict-processor.ts` | Extend | +45 | 1.4 | 1.4 | Enrich gate events with trace-safe metadata |
| `server/src/engine/execution/pipeline/stages/08b-shell-verification-stage.ts` | Extend | +55 | 1.4 | 1.4 | Emit shell verification attempt/pass/fail/escalation trace events |
| `server/src/engine/execution/pipeline/stages/01-parsing-stage.ts` | Extend | +30 | 1.4 | 1.4 | Add safe business attrs (`prompt.id`, operator types) via policy mapper |
| `server/src/engine/execution/pipeline/stages/04-planning-stage.ts` | Extend | +25 | 1.4 | 1.4 | Add safe planning attrs (strategy, gate counts, chain flags) |

### 1.5 Resource Visibility + Documentation

| File | Change Type | Est. Lines | Phase | Depends On | Justification |
| --- | --- | --- | --- | --- | --- |
| `server/src/modules/resources/handlers/observability-resources.ts` | Extend | +50 | 1.5 | 1.3 | Expose telemetry runtime health/config (no sensitive payload) |
| `docs/architecture/overview.md` | Extend | +60 | 1.5 | 1.4 | Update architecture map with telemetry runtime + stage count parity |
| `docs/guides/telemetry-observability.md` | New | +260 | 1.5 | 1.4 | Canonical operator guide: config, policy, troubleshooting |
| `docs/reference/otel-collector-tail-sampling.yaml` | New | +150 | 1.5 | 1.4 | Tail sampling policy artifact (error/latency/gate/shell priority) |

### 1.6 Tests + Rollout Validation

| File | Change Type | Est. Lines | Phase | Depends On | Justification |
| --- | --- | --- | --- | --- | --- |
| `server/tests/unit/infra/observability/telemetry/attribute-policy.test.ts` | New | +220 | 1.6 | 1.2 | Enforce no raw payload attrs + allowlist behavior |
| `server/tests/unit/infra/observability/telemetry/runtime.test.ts` | New | +220 | 1.6 | 1.2 | Runtime bootstrap/shutdown and exporter wiring |
| `server/tests/unit/execution/pipeline/pipeline-telemetry.test.ts` | New | +260 | 1.6 | 1.4 | Root/stage spans, early exit, error paths |
| `server/tests/unit/execution/pipeline/parsing-stage-telemetry.test.ts` | New | +140 | 1.6 | 1.4 | Prompt/operator safe attribute coverage |
| `server/tests/integration/observability/telemetry-smoke.test.ts` | New | +220 | 1.6 | 1.5 | End-to-end trace emission + resource visibility |

---

## Phase 5.0: Telemetry Semantics Contract

### Span Model
- Root span: `prompt_engine.request`
- Stage spans: `pipeline.stage.<StageName>` for every executed stage
- Trace status:
  - `OK` on normal completion/expected early response
  - `ERROR` on thrown exceptions or error response paths

### Event Model
- Gate lifecycle: `gate.passed`, `gate.failed`, `gate.retry_exhausted`, `gate.response_blocked`
- Shell verify lifecycle: `shell_verify.attempt`, `shell_verify.passed`, `shell_verify.failed`, `shell_verify.escalated`
- Optional chain lifecycle (from hooks): `chain.step_complete`, `chain.complete`, `chain.failed`

### Business Context Attributes (trace attrs)
- `cpm.command.type`
- `cpm.execution.mode`
- `cpm.prompt.id`
- `cpm.operator.types`
- `cpm.chain.current_step`
- `cpm.chain.total_steps`
- `cpm.gates.applied_count`
- `cpm.gates.temporary_count`
- `cpm.framework.id`
- `cpm.framework.enabled`
- `cpm.scope.continuity_source`

### Explicitly Excluded (default telemetry)
- raw `command`
- raw `user_response`
- rendered prompt/template bodies
- raw model outputs
- free-form unbounded text fields

---

## Phase 6.0: Sampling + Metric Label Policy

### Tail Sampling Policy (Collector)
- Keep 100%: error traces.
- Keep 100%: gate-blocked/retry-exhausted traces.
- Keep 100%: shell verification failures/timeouts/escalations.
- Keep 100%: slow traces (`root > 5s` OR any stage span `> 1.5s`).
- Keep 25%: successful chain executions.
- Keep 5%: successful single executions.
- Optional rollout window: temporary 100% for first 10 minutes post-deploy.

### Metric Label Policy
Allowed labels:
- `stage_name`
- `stage_type`
- `status`
- `execution_mode`
- `is_chain`

Disallowed labels:
- `prompt_id`
- `chain_id`
- `continuity_scope_id`
- `operator_types`
- any user-supplied free-form text

---

## Phase 7.0: Completion Criteria

| # | Acceptance Criterion | Validation | Test/Command |
| --- | --- | --- | --- |
| 1 | Root + stage spans emitted | Unit + integration span assertions | `pipeline-telemetry.test.ts`, `telemetry-smoke.test.ts` |
| 2 | Gate/shell lifecycle visible in traces | Event assertions for pass/fail/escalation paths | gate/shell telemetry tests |
| 3 | No sensitive raw payload attrs | Attribute policy unit tests | `attribute-policy.test.ts` |
| 4 | Low-cardinality metric labels only | Metric view + policy tests | telemetry runtime/policy tests |
| 5 | Existing analytics resource remains compatible | Resource integration checks | `resource://metrics/pipeline` assertions |
| 6 | Type safety passes | Typecheck | `cd server && npm run typecheck` |
| 7 | Lint ratchet unchanged | Lint ratchet | `cd server && npm run lint:ratchet` |
| 8 | Unit/integration regression safety | Test suite | `cd server && npm run test:ci` |
| 9 | Transport parity | Runtime smoke checks | `cd server && npm run start:stdio`, `cd server && npm run start:sse`, `cd server && npm run start -- --transport=streamable-http` |
| 10 | Docs/code parity | Manual review checklist | architecture + telemetry guide + collector policy |

---

## Phase 8.0: Legacy Removal & Exit Criteria

No permanent dual-observability path is allowed.

Mandatory removal tasks before marking complete:
- Remove temporary telemetry debug exporters/flags used only during rollout.
- Remove any duplicate event emission path introduced only for migration.
- If compatibility shims are added around `MetricsCollector`, mark with explicit guard and remove within same milestone where OTel-backed path is validated.

Exit condition:
- Telemetry runtime is canonical for trace emission.
- `MetricsCollector` remains for resource summaries only (or is intentionally bridged with explicit ownership), with no duplicated business-event logic.

---

## Phase 9.0: New Code Justification

- `infra/observability/telemetry/*`: required to isolate OTel runtime + policy from orchestration layers.
- `docs/guides/telemetry-observability.md`: operational runbook needed for deploy/debug policy.
- `docs/reference/otel-collector-tail-sampling.yaml`: executable policy artifact for collector parity.
- New telemetry tests: prevent policy drift and sensitive-data regressions.

---

## Phase 10.0: Over-Engineering Check

- [x] No replacement of existing stage pipeline model.
- [x] No new storage backend introduced for telemetry state.
- [x] No broad always-on payload capture of prompt/response content.
- [x] No high-cardinality metric label expansion.
- [x] No transport-specific behavior fork.
