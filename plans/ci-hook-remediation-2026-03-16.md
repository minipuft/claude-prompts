# CI + Hook Remediation Plan — 2026-03-16

## Intent Declaration

**Work Type**: refactor  
**Confidence**: high

**Scope**:

- Files: `.husky/pre-commit`, `.husky/pre-push`, `.github/workflows/ci.yml`, `.github/workflows/docker-publish.yml`
- Systems: local git hooks, CI validation workflow, Docker PR workflow
- Risk: medium

**What is being replaced?**: Narrow server-only enforcement and over-broad PR workflow triggers → repo-aware validation with better PR diagnostics

**Problem Statement**: Current hooks and workflows catch real issues, but their scope is misaligned with the repo. Hooks assume a server-only repo, CI hides downstream failures behind lint, and Docker runs on every PR. We need structural fixes that improve signal without weakening enforcement.

## Phase 1.0 Scope Alignment

**Primary objective**: Make local hooks and CI reflect the current multi-surface repo while reducing noisy PR failures and preserving required validation.

**Non-negotiable constraints**:

- Keep existing enforcement strength for typecheck/lint/tests/arch.
- Prefer extending current hooks/workflows over introducing new scripts.
- Avoid touching unrelated dirty files on the user's `main` worktree.
- Do not special-case Renovate/bot actors.

**Success signal**:

- Hooks validate repo-relevant changes instead of only `server/` changes.
- PR CI still reports build/test signal even when lint fails.
- Docker PR builds only run for Docker/runtime-relevant changes.
- No new helper files or abstractions are introduced.

## Phase 2.0 Existing Systems Audit

Relevant existing systems:

- `.husky/pre-commit` already regenerates contracts, blocks manual generated-file edits, and runs `lint:staged` + `lint:ratchet`.
- `.husky/pre-push` already runs typecheck, lint, tests, arch, and version validation.
- `server/package.json` already exposes `validate:python` for Ruff checks.
- `.github/workflows/ci.yml` already runs TypeScript validation plus Ruff + Pyrefly.
- `.github/workflows/docker-publish.yml` already separates PR builds from publish/sign behavior.

Current gaps documented by review:

- hooks start with `cd server`, so repo-root and `hooks/`-only changes bypass equivalent local checks.
- CI uses `needs: lint` on build/test/architecture, so lint failure hides downstream evidence.
- Docker PR workflow runs on all PRs instead of Docker-relevant diffs.
- Architecture push gating depends on `github.event.head_commit.modified`, which is brittle.

## Phase 3.0 Reuse Opportunities

- Extend existing hook scripts rather than adding new scripts.
- Reuse `server/package.json`'s `validate:python` instead of inventing a new local Python command.
- Extend `ci.yml` job conditions rather than splitting into multiple new workflows.
- Narrow `docker-publish.yml` triggers with `paths:` filters instead of adding bot-specific exceptions.

## Phase 4.0 Minimal Diff Plan

| File                                      | Change Type |   Lines | Phase | Depends On         | Justification                                                                      |
| ----------------------------------------- | ----------- | ------: | ----- | ------------------ | ---------------------------------------------------------------------------------- |
| `plans/ci-hook-remediation-2026-03-16.md` | Add         |    +120 | 1.0   | —                  | Persist plan + progress for strategic implementation                               |
| `.husky/pre-commit`                       | Extend      |  +25/-5 | 2.0   | 1.0                | Make staged-file handling repo-aware and run Python checks when `hooks/**` changes |
| `.husky/pre-push`                         | Extend      |  +20/-5 | 2.1   | 1.0                | Add repo-aware Python validation and explicit root-level staged formatting check   |
| `.github/workflows/ci.yml`                | Extend      | +25/-10 | 3.0   | 1.0                | Preserve build/test/architecture signal on PRs even when lint fails                |
| `.github/workflows/docker-publish.yml`    | Extend      |     +10 | 3.1   | 1.0                | Restrict PR Docker builds to Docker/server-relevant changes                        |
| `plans/ci-hook-remediation-2026-03-16.md` | Extend      |     +20 | 4.0   | 2.0, 2.1, 3.0, 3.1 | Record implementation results + validation                                         |

Execution notes:

- Phase 2.0 and 2.1 can be implemented together.
- Phase 3.0 and 3.1 are independent of hook changes and can be validated in the same branch.
- No new files beyond this plan are justified.

## Phase 5.0 Completion Criteria

| Criterion                      | Validation                            | Pass Condition                                                                                                   |
| ------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Hooks remain functional        | Review scripts + dry-run syntax check | No shell syntax regressions                                                                                      |
| Local Python parity restored   | Hook script inspection                | `validate:python` runs when `hooks/**` changes                                                                   |
| PR build/test signal preserved | Workflow review                       | `build`, `test`, and `architecture` no longer hard-skip solely due to `lint` on PRs                              |
| Docker noise reduced           | Workflow review                       | PR Docker workflow only triggers on relevant file changes                                                        |
| Existing checks preserved      | Targeted commands                     | `npm run lint:ratchet`, `npm run typecheck`, `npm run test:ci`, `npm run validate:arch` remain in local/CI flows |

## Phase 6.0 Over-Engineering Check

- [x] No new abstraction layers
- [x] No new helper scripts
- [x] No bot-specific exceptions
- [x] No weakening of core validation requirements

## Progress Notes

- 2026-03-16: Plan created from review findings; implementation pending.
- 2026-03-16: Implemented repo-aware hook execution in `.husky/pre-commit` and `.husky/pre-push` without adding new scripts.
- 2026-03-16: Updated `ci.yml` so PR build/test/architecture can still produce signal after a lint failure; push flow remains lint-gated.
- 2026-03-16: Added Docker relevance detection job in `docker-publish.yml` so the workflow still reports a stable check name while skipping irrelevant PRs inside the workflow.
- 2026-03-16: Validation completed via `sh -n` for hooks, `prettier --check` for workflow/plan files, and `git diff --check`.
- 2026-03-16: Removed duplicate `server/.lintstagedrc.json`; `server/package.json` is now the single lint-staged source of truth.
