## Intent Declaration

**Work Type**: refactor  
**Confidence**: high

**Scope**:

- Files: `remotion/package-lock.json`, `server/package.json`, `server/package-lock.json`, `.github/workflows/docker-publish.yml`, `.github/workflows/extension-publish.yml`, this plan file
- Systems: Renovate dependency intake, remotion workspace, server tooling lane, GitHub Actions workflows
- Risk: medium

**What is being replaced?**: Nothing directly. This wave absorbs currently open Renovate PRs plus selected low-risk rate-limited updates into the canonical dependency-update workflow. Stale/open dashboard items remain in the dashboard until separately processed.

**Problem Statement**: Renovate currently has 2 open dependency PRs and multiple rate-limited updates. We need to batch the low-risk/actionable items into the same validate → integrate workflow used in prior package waves, while explicitly deferring coordinated-major migrations.

## Live Inventory Snapshot — March 13, 2026

### Open PRs

- `#94` `@react-three/fiber` → `8.18.0`
- `#95` `@react-three/postprocessing` → `2.19.1`
- `#81` `release 2.0.1` (`autorelease: pending`) — release PR, not part of this wave

### Dependency Dashboard issue

- `#16` `Dependency Dashboard`

### Rate-limited updates

#### Actionable now — Wave A

- `@types/node` → `25.5.0`
- `knip` → `5.86.0`
- `lint-staged` → `16.3.3`
- `sigstore/cosign-installer` → `4.1.0`
- `docker/setup-buildx-action` → `4`
- `docker/login-action` → `4`
- `docker/metadata-action` → `6`
- `docker/build-push-action` → `7`
- `peter-evans/create-pull-request` → `8`
- Open PR `#94`
- Open PR `#95`

#### Needs targeted validation — Wave B

- `eslint-plugin-sonarjs` → `4`
- `jest` → `30.3.0`

#### Coordinated major migration — Wave C

- `three` / `@types/three` → `0.183.0`
- `@react-three/drei` → `10`
- `@react-three/fiber` → `9`
- `@react-three/postprocessing` → `3`
- `react` / `react-dom` / `@types/react` / `@types/react-dom` → `19`

#### Separate major tooling lane — Wave D

- `eslint` monorepo → `10`

#### Explicitly blocked by repo policy

- `express` → `5`
- `zod` → `4`

## Validation Lanes

### Remotion lane

```bash
cd remotion
npm ci --prefer-offline --no-audit
npm run typecheck
```

### Server/tooling lane

```bash
cd server
npm ci --prefer-offline --no-audit
npm run lint:ratchet
npm run typecheck
npm run build
npm run test:ci
npm run start:test
npm run validate:arch
```

### Workflow review lane

- inspect workflow diffs
- ensure action major bumps are still semantically compatible with current usage

## Phase 1.0 — Batch decision

Implement **Wave A** only in this cycle:

1. integrate open remotion lockfile PRs `#94` + `#95`
2. manually absorb low-risk rate-limited server tooling updates
3. manually absorb low-risk workflow action bumps
4. validate each affected lane
5. merge validated result into `main`

## Phase 2.0 — Completion criteria

- [x] `#94` and `#95` integrated or explicitly rejected with evidence
- [x] low-risk tooling updates integrated with green server lane
- [x] workflow action majors updated with no repo-local compatibility issues found
- [ ] `main` remains reproducible after merge
- [x] this plan updated with outcome notes

## Phase 3.0 — Deferral rules

If any item requires coordinated library migration, stop and defer it to Wave B/C/D instead of widening Wave A.

## Outcome Notes

- Integrated open Renovate PRs:
  - `#94` `@react-three/fiber` → `8.18.0`
  - `#95` `@react-three/postprocessing` → `2.19.1`
- Manually absorbed rate-limited tooling updates:
  - `@types/node` → `25.5.0`
  - `knip` → `5.86.0`
  - `lint-staged` → `16.3.3`
- Manually absorbed rate-limited workflow action bumps:
  - `sigstore/cosign-installer` → `4.1.0`
  - `docker/setup-buildx-action` → `4`
  - `docker/login-action` → `4`
  - `docker/metadata-action` → `6`
  - `docker/build-push-action` → `7`
  - `peter-evans/create-pull-request` → `8`
- Validation results:
  - remotion lane passed: `npm ci --prefer-offline --no-audit`, `npm run typecheck`
  - server lane passed: `npm ci --prefer-offline --no-audit`, `npm run lint:ratchet`, `npm run typecheck`, `npm run build`, `npm run test:ci`, `npm run start:test`, `npm run validate:arch`
- Notes:
  - workflow action validation remains repo-local/static review only; no live GitHub workflow run was executed from this branch
  - Wave B/C/D remain deferred exactly as planned
