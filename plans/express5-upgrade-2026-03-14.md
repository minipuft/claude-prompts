# Express 5 Upgrade · 2026-03-14

## Intent Declaration

**Work Type**: refactor
**Confidence**: medium

**Scope**:
- Files: `server/package.json`, `server/package-lock.json`, `server/src/mcp/http/api.ts`, `server/src/infra/http/transport/index.ts`
- Systems: server HTTP transport, MCP API router, Express runtime/types
- Risk: medium

**What is being replaced?**: `express@4.x` + `@types/express@4.x` -> `express@5.2.1` + `@types/express@5.0.6`

**Problem Statement**: Current server is pinned to Express 4. Desired state is Express 5 with minimal compatibility edits and full server-lane validation.

## Phase 1.0 Scope Alignment
- Objective: land the Express 5 upgrade on an isolated branch with only the minimal code changes required by the current codebase.
- Constraints: no changes on dirty `main`; preserve existing route behavior; validate against official Express docs and current server test/build lanes.
- Success signal: Express 5 install succeeds, server validation lane passes, and repo usage avoids documented removed Express 4 APIs.

## Phase 2.0 Existing Systems Audit
- Active Express surfaces are concentrated in:
  - `server/src/mcp/http/api.ts`
  - `server/src/infra/http/transport/index.ts`
  - `server/src/infra/http/index.ts`
- Existing validation lane:
  - `npm run lint:ratchet`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:ci`
  - `npm run start:test`
  - `npm run validate:arch`
- Prior exploratory validation showed only one initial TypeScript failure caused by widened Express 5 `params/query` typings.

## Phase 3.0 Reuse Opportunities
- Keep the existing HTTP entrypoints and handlers; only normalize request-derived values at the boundary.
- Reuse the current server validation lane unchanged.
- Reuse official Express migration guidance instead of inventing repo-specific migration rules.

## Phase 4.0 Minimal Diff Plan
| File | Change Type | Lines | Phase | Depends On | Justification |
| --- | --- | ---: | --- | --- | --- |
| `server/package.json` | Extend | small | 1.0 | — | Upgrade Express runtime + typings |
| `server/package-lock.json` | Regenerate | medium | 1.1 | 1.0 | Capture Express 5 dependency graph |
| `server/src/mcp/http/api.ts` | Extend | +4 | 1.2 | 1.0 | Normalize route params under Express 5 typings |
| `server/src/infra/http/transport/index.ts` | Extend | +2 | 1.3 | 1.0 | Normalize query param under Express 5 typings |
| `plans/express5-upgrade-2026-03-14.md` | Add | +1 file | 2.0 | — | Persist docs-backed validation evidence |

## Phase 5.0 Completion Criteria
| Criterion | Validation | Pass Condition |
| --- | --- | --- |
| Express 5 installed | `npm install` | lockfile regenerated successfully |
| Type compatibility preserved | `npm run typecheck` | Exit 0 |
| Server build passes | `npm run build` | Exit 0 |
| Unit tests pass | `npm run test:ci` | Exit 0 |
| Startup smoke passes | `npm run start:test` | Exit 0 |
| Architecture validation passes | `npm run validate:arch` | Exit 0 |
| Removed Express 4 APIs absent | `rg` over `server/src` | No matches for removed patterns |
| Documentation alignment recorded | plan review | Official Express 5 migration notes cited |

## Phase 6.0 Over-Engineering Check
- [x] No new abstraction layers
- [x] No new runtime modules
- [x] No route rewrites beyond request-value normalization
- [x] Validation reuses existing scripts

## Documentation-backed validation
Official Express migration guide says:
- Express 5 requires Node 18+ and recommends upgrading then running automated tests and fixing failures.
- Removed APIs include `req.param(name)`, `app.del()`, `res.json(obj, status)`, `res.send(status)`, and `res.redirect('back')`.
- `req.params` changed: wildcard params may be arrays and unmatched params may be omitted.
- `req.query` changed: it is now a getter and default parsing changed from `extended` to `simple`.

Source: https://expressjs.com/en/guide/migrating-5.html


## Execution Status
- 2026-03-14: implemented Express 5 package upgrade on branch `rr-express5`.
- 2026-03-14: full server lane passed: `lint:ratchet`, `typecheck`, `build`, `test:ci`, `start:test`, `validate:arch`.
- 2026-03-14: `rg` check found no usage of documented removed Express 4 APIs in `server/src`.
- 2026-03-14: conservative boundary normalization added for `req.params` / `req.query` values to align with Express 5 documented parameter/query behavior and current TypeScript typings.
