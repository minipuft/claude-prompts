# Remaining Package Wave · 2026-03-13

## Intent Declaration

**Work Type**: feature  
**Confidence**: high

**Scope**:

- Files: `server/package-lock.json`, this plan, and only follow-up code/config files if validation exposes a real integration issue
- Systems: server build/lint toolchain
- Risk: low to medium

**What is being replaced?**: No systems are being replaced. This wave only validates and integrates the two remaining dependency PR branches. The stale release PR (`#81`) is explicitly excluded.

**Problem Statement**: Two dependency PRs remain open after the previous update wave: `#89` (`eslint-plugin-sonarjs`) and `#88` (`esbuild`). We need to verify they are safe using the same validate-then-merge process, integrate them on an isolated branch, and only then merge the validated result back to `main`.

## Current Scope

- `#89` `eslint-plugin-sonarjs` → `3.0.7`
- `#88` `esbuild` → `0.27.4`
- Excluded: `#81` release PR

## Discovery Notes

- Both PRs currently touch only `server/package-lock.json`
- `eslint-plugin-sonarjs` is declared in `server/package.json`
- `esbuild` is declared in `server/package.json`
- Because both affect the same lockfile/workspace, the validation lane should use the full server checks

## Validation Lane

Run in `server/`:

- `export npm_config_cache=/tmp/npm-cache-remaining-package-wave`
- `npm ci --prefer-offline --no-audit`
- `npm run typecheck`
- `npm run build`
- `npm run test:ci`
- `npm run start:test`
- `npm run validate:arch`

## Phases

### Phase 1.0 · setup
- create isolated integration worktree/branch
- record exact remaining package PR scope

### Phase 2.0 · validate and merge `#89`
- merge the PR branch
- run the full server validation lane
- if green, keep it; if not, stop and assess required fixes

#### Status
- ✅ `#89` merged into the isolated integration branch
- ✅ full server validation lane passed:
  - `npm ci --prefer-offline --no-audit`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:ci`
  - `npm run start:test`
  - `npm run validate:arch`
- No follow-up code changes were required

### Phase 3.0 · validate and merge `#88`
- merge the PR branch on top of `#89`
- rerun the full server validation lane
- if green, keep it; if not, stop and assess required fixes

#### Status
- ✅ `#88` merged on top of the validated `#89` branch
- ✅ full server validation lane passed again:
  - `npm ci --prefer-offline --no-audit`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:ci`
  - `npm run start:test`
  - `npm run validate:arch`
- No follow-up code changes were required

### Phase 4.0 · closeout
- summarize whether both updates were safe
- merge validated integration branch back to `main`
- leave `#81` for separate refresh/regeneration

#### Status
- ✅ both remaining package PRs were safe to integrate based on full server validation
- ⏭ `#81` remains excluded as a stale release PR

## Success Criteria

- `#89` validated and integrated, or explicitly rejected with evidence
- `#88` validated and integrated, or explicitly rejected with evidence
- `main` receives only validated package changes
- `#81` is not merged as part of this package wave
