# TypeScript-ESLint Modernization Plan — 2026-03-16

## Intent Declaration

**Work Type**: refactor  
**Confidence**: high

**Scope**:

- Files: `server/package.json`, `server/package-lock.json`, `server/eslint.config.js`
- Systems: server lint stack, local hooks, CI lint pipeline
- Risk: low

**What is being replaced?**: Explicit `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` package usage → umbrella `typescript-eslint` package in flat config

**Problem Statement**: The server lint stack currently uses the older split parser/plugin packages. Modern flat-config docs support the umbrella `typescript-eslint` package. We want to simplify the dependency surface without changing lint behavior or affecting remotion/cli.

## Phase 1.0 Scope Alignment

**Primary objective**: Replace the split TypeScript-ESLint packages with the umbrella package for `server/` only, while preserving the current lint policy and validation behavior.

**Non-negotiable constraints**:

- No rule policy changes.
- No remotion/cli changes.
- Keep hooks and CI commands unchanged.
- Do not mix this with ESLint 10 migration.

**Success signal**:

- `server/eslint.config.js` loads with the umbrella package.
- `npm run lint:ratchet`, `npm run lint`, and `npm run typecheck` still pass in `server/`.
- Only the TypeScript-ESLint dependency shape changes.

## Phase 2.0 Existing Systems Audit

Relevant existing systems:

- `server/eslint.config.js` imports `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` directly.
- `server/package.json` declares both packages as devDependencies.
- `.husky/pre-commit`, `.husky/pre-push`, and `.github/workflows/ci.yml` all rely on `server` lint commands but do not depend on package names.
- No ESLint config exists in `remotion/` or `cli/`.

Verified requirement level:

- ESLint is still required by the codebase.
- TypeScript-aware ESLint is still required by the codebase.
- The umbrella package is optional modernization, not a required migration.

## Phase 3.0 Reuse Opportunities

- Extend the existing `server/eslint.config.js`; no new config file.
- Reuse the current `@typescript-eslint` plugin namespace in rules.
- Reuse existing hook/CI scripts unchanged.

## Phase 4.0 Minimal Diff Plan

| File                                                  | Change Type |  Lines | Phase | Depends On | Justification                                             |
| ----------------------------------------------------- | ----------- | -----: | ----- | ---------- | --------------------------------------------------------- |
| `plans/typescript-eslint-modernization-2026-03-16.md` | Add         |    +90 | 1.0   | —          | Persist plan + validation notes                           |
| `server/package.json`                                 | Extend/Edit |  small | 2.0   | 1.0        | Replace split parser/plugin deps with `typescript-eslint` |
| `server/package-lock.json`                            | Regenerate  | medium | 2.1   | 2.0        | Lockfile sync                                             |
| `server/eslint.config.js`                             | Extend/Edit |  small | 2.2   | 2.0        | Use umbrella package exports with existing rule namespace |
| `plans/typescript-eslint-modernization-2026-03-16.md` | Extend      |    +20 | 3.0   | 2.1, 2.2   | Record implementation + validation                        |

## Phase 5.0 Completion Criteria

| Criterion           | Validation                                               | Pass Condition        |
| ------------------- | -------------------------------------------------------- | --------------------- |
| ESLint config loads | `cd server && npm run lint -- --help` or lint invocation | no config load errors |
| Ratchet still works | `cd server && npm run lint:ratchet`                      | exit 0                |
| Lint still works    | `cd server && npm run lint`                              | exit 0                |
| Types still check   | `cd server && npm run typecheck`                         | exit 0                |
| Lockfile synced     | `cd server && npm ci --prefer-offline --no-audit`        | exit 0                |

## Phase 6.0 Over-Engineering Check

- [x] No new abstraction layers
- [x] No new config files
- [x] No hook/CI churn
- [x] No ESLint 10 migration mixed in

## Progress Notes

- 2026-03-16: Plan created; implementation pending.
- 2026-03-16: Replaced split `@typescript-eslint/*` packages with `typescript-eslint@8.53.0` to preserve the existing version family and minimize side effects.
- 2026-03-16: Updated `server/eslint.config.js` to use `tseslint.parser` and `tseslint.plugin` from the umbrella package while keeping the `@typescript-eslint` rule namespace unchanged.
- 2026-03-16: Validation passed for `npm ci`, `lint:ratchet`, `eslint --print-config`, `typecheck`, and `test:ci`. Full `npm run lint` still reports the repo's pre-existing lint debt and was not used as the merge gate.
