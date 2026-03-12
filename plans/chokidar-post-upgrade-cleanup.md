# Chokidar Post-Upgrade Cleanup Plan

_Created: 2026-03-12_  
_Worktree: `/home/minipuft/Applications/claude-prompts-mcp/worktrees/phase60-cleanup`_  
_Branch: `phase60-cleanup`_

## Intent Declaration

**Work Type**: refactor  
**Confidence**: medium

**Scope**:
- Files: `server/src/modules/hot-reload/file-observer.ts`, `server/tests/unit/hot-reload/file-observer.test.ts`, `server/.npmrc`, `server/src/shared/utils/jsonUtils.ts`, `server/package.json`, `server/package-lock.json`
- Systems: hot-reload watcher compatibility, watcher regression coverage, npm install behavior
- Risk: medium

**What is being replaced?**: Temporary install workaround in `server/.npmrc` if a cleaner dependency shape is viable; otherwise nothing is replaced and the workaround is retained intentionally.

**Problem Statement**: The `chokidar@5` upgrade is integrated and green, but the branch still carries three cleanup questions: whether the hot-reload fix is final, whether the new watcher test is sufficient, and whether `server/.npmrc` can be removed without widening scope.

## Implementation Status

| Phase | Status | Notes |
|---|---|---|
| `1.0` | completed | Plan file created and scope locked |
| `2.0` | completed | Audit confirmed `nunjucks` is still actively used and no newer release removes the peer constraint |
| `3.0` | completed | Reuse-first decision: keep the chokidar fix and watcher test; focus cleanup on intentional `.npmrc` retention |
| `4.0` | completed | `.npmrc` documented in place; `jsonUtils.ts` now explicitly documents that Nunjucks file watching is disabled |
| `5.0` | completed | Validation passed after documentation-only cleanup |
| `6.0` | completed | No additional abstraction or dependency migration introduced |

## Phase 1.0 Scope Alignment

**Primary objective**: Close out the post-`chokidar@5` cleanup by confirming the watcher fix, deciding the final shape of the watcher test, and removing `server/.npmrc` only if it can be done without destabilizing installs.

**Non-negotiable constraints**:
- Keep `bucket-a-integration`-equivalent behavior green.
- Prefer extending existing files over adding new abstractions.
- Do not touch the user’s `main` worktree edits.
- Treat `server/.npmrc` as temporary unless proven necessary.
- Preserve `npm ci`, `npm run typecheck`, `npm run test:ci`, `npm run build`, `npm run start:test`, and `npm run validate:arch`.

**Success signal**:
- `file-observer.ts` remains minimal and intentional,
- watcher coverage is accepted or minimally expanded,
- `server/.npmrc` is either removed safely or explicitly retained with documented rationale.

## Phase 2.0 Existing Systems Audit

| System | Relevance | Reuse decision |
|---|---|---|
| `server/src/modules/hot-reload/file-observer.ts` | Chokidar v5 compatibility lives here | Reuse directly |
| `server/tests/unit/hot-reload/file-observer.test.ts` | Direct watcher coverage | Reuse directly |
| `tests/unit/prompts/hot-reload-auxiliary.test.ts` | Adjacent hot-reload coverage | Reference only |
| `server/.npmrc` | Current peer-conflict workaround | Evaluate for removal |
| `server/src/shared/utils/jsonUtils.ts` | Current `nunjucks` consumer | Inspect before changing deps |
| `server/package.json` | Declares `chokidar` and `nunjucks` | Reuse directly |
| `server/package-lock.json` | Captures install state | Regenerate only if dependency shape changes |

**Audit findings**:
- `nunjucks` is still an active runtime dependency via `server/src/shared/utils/jsonUtils.ts`.
- `jsonUtils.ts` configures Nunjucks with `watch: false`, so this codepath does not rely on Nunjucks' own chokidar integration.
- The current published `nunjucks` line still stops at `3.2.4`, so there is no newer release to absorb the optional peer constraint cleanly.
- Removing `nunjucks` would widen scope into template rendering and reference-resolution behavior, which is larger than this cleanup.

## Phase 3.0 Reuse Opportunities

- Keep the current `file-observer.ts` fix unless a concrete simplification appears.
- Keep the current watcher test unless a specific coverage gap is found.
- Focus cleanup effort on the `nunjucks`/`.npmrc` relationship instead of inventing new hot-reload abstractions.
- If `nunjucks` cannot be removed or upgraded cleanly, retain `.npmrc` and document why.

**Final reuse-first decision**:
- Keep `server/src/modules/hot-reload/file-observer.ts` unchanged.
- Keep `server/tests/unit/hot-reload/file-observer.test.ts` unchanged.
- Retain `server/.npmrc`, but document the exact reason in place.
- Add one clarifying comment in `server/src/shared/utils/jsonUtils.ts` to make the Nunjucks/non-watching relationship explicit.

## Phase 4.0 Minimal Diff Plan

| File | Change Type | Lines | Phase | Depends On | Justification |
|---|---|---:|---|---|---|
| `plans/chokidar-post-upgrade-cleanup.md` | Add / update | +120 | 1.0 | — | Persist plan and implementation status |
| `server/src/modules/hot-reload/file-observer.ts` | Review / maybe tiny extend | 0 to +10 | 2.0 | — | Confirm the current chokidar v5 fix is canonical |
| `server/tests/unit/hot-reload/file-observer.test.ts` | Review / maybe extend | 0 to +30 | 2.1 | 2.0 | Keep or minimally strengthen direct watcher coverage |
| `server/src/shared/utils/jsonUtils.ts` | Review / maybe refactor | 0 to +40 | 3.0 | — | If removing `nunjucks` is feasible, this is the likely touchpoint |
| `server/package.json` | Extend / simplify | small | 3.1 | 3.0 | Adjust dependency shape only if cleanup path is viable |
| `server/package-lock.json` | Regenerate | medium | 3.2 | 3.1 | Required if dependency graph changes |
| `server/.npmrc` | Delete or document | -1 or +2 | 4.0 | 3.2 | Remove workaround if installs succeed without it; otherwise retain with rationale |
| `plans/chokidar-post-upgrade-cleanup.md` | Update | small | 4.1 | 4.0 | Record outcome and residual follow-up |

**Implemented outcome**:
- `.npmrc` was **retained intentionally**, not removed.
- No further changes were needed in the chokidar fix or watcher test.
- Scope expansion into Nunjucks replacement was explicitly avoided.

## Phase 5.0 Completion Criteria

| Criterion | Validation | Pass Condition |
|---|---|---|
| Hot-reload fix is intentional | code review + `npm run typecheck` | no further churn needed in `file-observer.ts` |
| Watcher test is sufficient | targeted Jest run | add/change/remove coverage passes |
| `.npmrc` removed if possible | `npm ci --prefer-offline --no-audit` | install succeeds without workaround |
| If `.npmrc` remains, reason is explicit | plan review | documented as temporary upstream compatibility hold |
| Full server validation passes | `npm run typecheck && npm run test:ci && npm run build && npm run start:test && npm run validate:arch` | exit 0 / no regressions |

**Validation executed**:
- `cd server && npm_config_cache=/tmp/npm-cache-phase60-cleanup npm ci --prefer-offline --no-audit`
- `npm run typecheck`
- `NODE_OPTIONS="--experimental-vm-modules" npx jest --runInBand tests/unit/hot-reload/file-observer.test.ts`
- `npm run test:ci`
- `npm run build`
- `npm run start:test`
- `npm run validate:arch`

## New Code Justification

No new production file is justified.

The only new file in this cleanup is this plan file, to persist execution state separately from the dependency campaign tracker. Existing code files should be extended in place if any cleanup is needed.

## Phase 6.0 Over-Engineering Check

- [ ] No new abstraction layers without concrete immediate need
- [ ] No new storage files when existing ones suffice
- [ ] No new manager/service classes
- [ ] No future-proofing beyond the current cleanup scope
