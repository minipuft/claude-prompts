# Client-Aware Delegation Strategy Hardening Plan

## Phase 1.0 Scope Alignment

- **Primary objective:** Harden delegation strategy behavior per supported client while keeping `--client` as the single UX selector.
- **Non-negotiable constraints:**
  - No new client-identification flags (`--client` remains the only public selector).
  - Preserve transport parity (`stdio` + `streamable-http`).
  - Preserve identity/continuity behavior; this work must not change scope derivation.
  - Unknown/unsupported client paths must remain safe via neutral fallback messaging.
- **Success signal:** Delegation CTA/footer and resolver behavior remain consistent and deterministic for:
  - `claude-code` (canonical),
  - `codex` (canonical with runtime-friendly fallback wording),
  - `gemini` and `opencode` (supported),
  - `cursor` (explicitly experimental/testing),
  - `unknown` (neutral fallback).

## Phase 1.1 Safety + Standards Verification Baseline

This plan is aligned to project standards before implementation:

- **Minimal diff / reuse-first:** extend existing resolver/strategy/formatter modules; avoid new layers.
- **Contract-first:** use existing `ClientFamily` + `DelegationProfile` unions as SSOT and keep schema + validator synchronized.
- **Migration discipline:** remove duplicated per-profile branching once registry-based mapping is canonical.
- **Conversational execution contract:** maintain delegation instructions as client guidance text; do not introduce fake guaranteed tool contracts for unverified runtimes.

## Phase 2.0 Existing Systems Audit

### Runtime + identity

- `server/src/runtime/options.ts` (`--client` preset normalization and launch defaults)
- `server/src/mcp/tools/request-identity-resolver.ts` (client/profile inference and precedence)
- `server/src/shared/types/core-config.ts` (union contracts)
- `server/config.schema.json` + `server/src/cli-shared/config-input-validator.ts` (config/runtime validation)

### Delegation rendering

- `server/src/engine/execution/delegation/strategy.ts` (strategy selection + rendering)
- `server/src/engine/execution/delegation/index.ts` (exports)
- `server/src/engine/execution/formatting/response-assembler.ts` (footer delegation line)

### Current coverage

- `server/tests/unit/runtime/options.identity.test.ts`
- `server/tests/unit/mcp-tools/request-identity-resolver.test.ts`
- `server/tests/unit/delegation/delegation-renderer.test.ts`
- `server/tests/unit/execution/formatting/response-assembler-delegation.test.ts`

### Documentation surface

- `README.md`
- `server/README.md`
- `docs/guides/identity-scope.md`
- `server/CHANGELOG.md`

## Phase 3.0 Reuse Opportunities

### 3.1 Consolidate strategy metadata in-place

- Reuse `strategy.ts` as canonical client strategy registry:
  - client status (`canonical` vs `experimental`),
  - delegation label text,
  - fallback guidance.
- Avoid new manager/service files; keep registry as typed constants + pure helpers.

### 3.2 Consolidate footer mapping to the same source

- Reuse the same registry-derived labels in `response-assembler.ts`.
- Remove duplicated nested profile conditionals once shared helper is in place.

### 3.3 Keep resolver deterministic, not heuristic-heavy

- Continue explicit mapping from `clientFamily`/`delegationProfile`.
- Keep heuristic use only as fallback input path, not as authoritative contract.

## Phase 4.0 Minimal Diff Plan

| File | Change Type | Lines (est.) | Phase | Depends On | Justification |
| --- | --- | ---: | ---: | --- | --- |
| `server/src/engine/execution/delegation/strategy.ts` | Extend | +80/-40 | 1.0 | — | Centralize per-client strategy metadata and status flags |
| `server/src/engine/execution/formatting/response-assembler.ts` | Extend | +20/-20 | 1.1 | 1.0 | Reuse shared strategy labels for footer consistency |
| `server/src/mcp/tools/request-identity-resolver.ts` | Extend | +20/-10 | 1.2 | 1.0 | Keep profile-family inference aligned with canonical profiles |
| `server/src/runtime/options.ts` | Extend | +15/-10 | 1.3 | 1.2 | Ensure `--client` aliases/presets remain deterministic |
| `server/tests/unit/delegation/delegation-renderer.test.ts` | Extend | +40 | 2.0 | 1.0 | Verify canonical vs experimental client messaging |
| `server/tests/unit/execution/formatting/response-assembler-delegation.test.ts` | Extend | +25 | 2.1 | 1.1 | Verify footer and CTA use unified labels |
| `server/tests/unit/mcp-tools/request-identity-resolver.test.ts` | Extend | +30 | 2.2 | 1.2 | Verify family/profile inference remains stable |
| `server/tests/unit/runtime/options.identity.test.ts` | Extend | +20 | 2.3 | 1.3 | Verify preset mappings stay correct |
| `README.md` | Extend | +15 | 3.0 | 1.0 | Document supported presets and expectations |
| `server/README.md` | Extend | +25 | 3.0 | 1.0 | Canonical preset/profile/status matrix |
| `docs/guides/identity-scope.md` | Extend | +25 | 3.1 | 1.2 | Document profile routing and experimental Cursor status |
| `server/CHANGELOG.md` | Extend | +10 | 3.2 | 1.0 | Record strategy hardening behavior changes |

## Phase 5.0 Completion Criteria

| Criterion | Validation | Pass Condition |
| --- | --- | --- |
| `--client` remains sole UX selector | CLI/help/readme review | No new public client flags introduced |
| Codex strategy refined safely | Unit tests + snapshot assertions | Codex path keeps agent-first copy with safe fallback messaging |
| Cursor marked experimental | Unit tests + docs review | CTA/footer/docs clearly label Cursor experimental/testing |
| Strategy consistency | Unit tests (renderer + response assembler) | Same profile resolves same copy across CTA + footer |
| Resolver consistency | Resolver unit tests | Family/profile mapping stable and deterministic |
| Type safety | `npm run typecheck` | Exit 0 |
| Lint ratchet | `npm run lint:ratchet` | No regressions |
| Regression safety | targeted unit tests listed above | Exit 0 |

Validation command sequence:

1. `npm test -- tests/unit/runtime/options.identity.test.ts tests/unit/mcp-tools/request-identity-resolver.test.ts tests/unit/delegation/delegation-renderer.test.ts tests/unit/execution/formatting/response-assembler-delegation.test.ts`
2. `npm run typecheck`
3. `npm run lint:ratchet`

## Phase 6.0 Over-Engineering Check

- [ ] No new manager/orchestrator classes added for client strategy routing.
- [ ] No new storage/state files introduced for delegation behavior.
- [ ] No workspace-path or install-path heuristics used for client detection.
- [ ] No protocol assumptions expressed as guaranteed tool names for unverified clients.
- [ ] Registry-driven strategy mapping is canonical; duplicate branch logic removed.

## New Code Justification

- **No new runtime files required.**
- Work is intentionally in-place in existing resolver/strategy/formatter/docs/test modules to minimize architectural churn.

## Execution Status (2026-02-27)

- [x] Strategy metadata centralized in `delegation/strategy.ts` with explicit status + footer mapping.
- [x] Footer rendering now reuses strategy metadata via shared helper (duplicate per-profile branch removed).
- [x] Codex strategy includes runtime fallback guidance when `spawn_agent` is unavailable.
- [x] Cursor strategy and footer now explicitly labeled experimental/testing.
- [x] Docs/changelog updated (`README.md`, `server/README.md`, `docs/guides/identity-scope.md`, `server/CHANGELOG.md`).
- [x] Validation completed:
  - `npm test -- tests/unit/runtime/options.identity.test.ts tests/unit/mcp-tools/request-identity-resolver.test.ts tests/unit/delegation/delegation-renderer.test.ts tests/unit/execution/formatting/response-assembler-delegation.test.ts`
  - `npm run typecheck`
  - `npm run lint:ratchet`
