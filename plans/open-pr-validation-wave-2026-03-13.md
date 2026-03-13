# Open PR Validation Wave · 2026-03-13

## Intent Declaration

**Work Type**: feature  
**Confidence**: high

**Scope**:

- Files: dependency lockfiles, workflow files, selected runtime/tooling files if follow-up fixes are required, and this plan
- Systems: remotion workspace, server workspace, root tooling/workflows, release PR assessment
- Risk: medium

**What is being replaced?**: Nothing new is being introduced; this wave validates and integrates the currently open dependency PR branches into a dedicated integration branch. Superseded duplicate or stale PRs should be closed rather than merged.

**Problem Statement**: The repo has a fresh set of open dependency/update PRs. We need the same validate-then-merge process used previously so low-risk updates land quickly, runtime-sensitive updates get focused verification, and the release PR is assessed separately.

## Current Open PR Inventory

- #87 `@types/react` → `18.3.28`
- #86 `@remotion/three` → `4.0.435`
- #85 `express-rate-limit` → `8.3.1` in `/server`
- #84 `@remotion/player` → `4.0.435`
- #83 `@remotion/google-fonts` → `4.0.435`
- #82 `commitlint` monorepo → `20.4.4`
- #81 `release 2.0.1`
- #68 `@remotion/cli` → `4.0.435`
- #65 `dependency-cruiser` → `17.3.9`

## Buckets

### Bucket A · targeted validation first
- #85 `express-rate-limit`
- #65 `dependency-cruiser`
- #82 `commitlint`

### Bucket B · remotion batch
- #68 `@remotion/cli`
- #83 `@remotion/google-fonts`
- #84 `@remotion/player`
- #86 `@remotion/three`
- #87 `@types/react`

### Bucket C · release handling
- #81 `release 2.0.1`

## Validation Commands

### Server / runtime-adjacent
- `cd server && export npm_config_cache=/tmp/npm-cache-open-pr-wave && npm ci --prefer-offline --no-audit`
- `npm run typecheck`
- `npm run build`
- `npm run test:ci`
- `npm run start:test`
- `npm run validate:arch`

### Root tooling
- `npm ci --prefer-offline --no-audit`
- `npm run lint:commit`

### Remotion workspace
- `cd remotion && export npm_config_cache=/tmp/npm-cache-open-pr-wave-remotion && npm ci --prefer-offline --no-audit`
- `npm run typecheck`

## Execution Phases

### Phase 1.0 · setup
- create integration worktree/branch
- record current PR inventory
- fetch remote PR branches needed for merge

### Phase 2.0 · Bucket A validation + merge
- validate #85 in isolation, then merge if green
- validate #65 in isolation, then merge if green
- validate #82 in isolation, then merge if green
- if any require repo changes, commit those fixes on the integration branch

#### Status
- ✅ `#85` merged and passed server validation lane
- ✅ `#65` merged and passed `validate:arch` + server validation lane
- ✅ `#82` merged and passed root `npm ci` + `npx --no -- commitlint --help`
- No follow-up code changes were required for Bucket A

### Phase 3.0 · Bucket B remotion batch
- validate remotion PRs individually enough to detect conflicts
- merge them into one remotion integration lane
- run remotion workspace validation after cumulative merge
- commit any required follow-up fixes on the integration branch

#### Status
- ✅ temporary validation lane `remotion-batch-validation` created from the integration branch
- ✅ merged `#68`, `#83`, `#84`, `#86`, `#87` into the validation lane
- ✅ `cd remotion && npm ci --prefer-offline --no-audit && npm run typecheck` passed
- ✅ validated remotion batch merged back into `open-pr-wave-2026-03-13`
- No follow-up code changes were required for Bucket B

### Phase 4.0 · Bucket C assessment
- inspect #81 release PR
- determine whether it should be merged after dependency updates or regenerated

#### Status
- ⚠️ `#81` is stale relative to the validated integration branch
- The release branch still carries older lockfile snapshots (for example older commitlint lockfile content) and does not reflect the newly integrated dependency wave
- Recommendation: do **not** merge `#81` as-is; regenerate or let release-please refresh after the dependency wave lands on `main`

### Phase 5.0 · closeout
- summarize integrated PRs
- list any PRs left open intentionally
- note any follow-up fixes or blockers

## Success Criteria

- non-release dependency PRs are either integrated or explicitly rejected with reasons
- runtime/tooling updates have workspace-relevant validation evidence
- remotion updates are not skipped; they are handled as a batch with cumulative validation
- release PR status is explained separately from dependency integration
