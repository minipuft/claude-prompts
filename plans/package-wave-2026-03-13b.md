# Package Wave · 2026-03-13b

## Intent Declaration

**Work Type**: feature  
**Confidence**: high

**Scope**:

- Files: dependency lockfiles and plan file; only minimal code changes if validation exposes a real compatibility issue
- Systems: server runtime/tooling and remotion workspace
- Risk: medium

**What is being replaced?**: No systems are being replaced. This wave validates and integrates the four currently open dependency PRs while leaving the release PR (`#81`) for later refresh/review.

**Problem Statement**: After the prior dependency wave landed, a fresh set of package PRs opened. We need to systematically validate and integrate them in risk order instead of merging them blindly or conflating them with the stale release PR.

## Scope

- `#92` `@modelcontextprotocol/sdk` → `1.27.1`
- `#91` `eslint` monorepo → `9.39.4`
- `#90` `remotion` → `4.0.435`
- `#93` `@react-three/drei` → `9.122.0`
- Excluded: `#81` release PR

## Planned Buckets

### Bucket A · runtime / tooling
- `#92` MCP SDK
- `#91` eslint monorepo

### Bucket B · remotion / three
- `#90` remotion
- `#93` @react-three/drei

## Validation Lanes

### Server lane
- `cd server`
- `export npm_config_cache=/tmp/npm-cache-package-wave-2026-03-13b`
- `npm ci --prefer-offline --no-audit`
- `npm run typecheck`
- `npm run build`
- `npm run test:ci`
- `npm run start:test`
- `npm run validate:arch`

### Remotion lane
- `cd remotion`
- `export npm_config_cache=/tmp/npm-cache-package-wave-2026-03-13b-remotion`
- `npm ci --prefer-offline --no-audit`
- `npm run typecheck`

## Phases

### Phase 1.0 · inspect scope
- confirm which files each PR touches
- adjust validation order if needed

### Phase 2.0 · Bucket A validate + merge
- merge `#92`
- run full server lane
- merge `#91`
- rerun full server lane

#### Status
- ✅ `#92` merged and passed the full server validation lane
- ✅ `#91` merged on top of `#92` and passed the full server validation lane
- No follow-up code changes were required for Bucket A

### Phase 3.0 · Bucket B validate + merge
- merge remotion PRs on a validated base
- run cumulative remotion validation

#### Status
- ✅ created a separate validated remotion lane from the Bucket A integration branch
- ✅ merged `#90` and `#93` into that remotion lane
- ⚠️ encountered a real lockfile merge conflict in `remotion/package-lock.json`
- ✅ resolved the conflict by regenerating the lockfile to the combined desired versions:
  - `remotion@4.0.435`
  - `@react-three/drei@9.122.0`
- ✅ cumulative remotion validation passed:
  - `npm ci --prefer-offline --no-audit`
  - `npm run typecheck`
- ✅ merged the validated remotion lane back into the main integration branch

### Phase 4.0 · closeout
- merge validated branch back to `main`
- summarize remaining open PR state

#### Status
- ⏳ validated integration branch ready to merge back to `main`
- `#81` remains intentionally excluded as the release PR
