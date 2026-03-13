## Intent Declaration

**Work Type**: refactor  
**Confidence**: high

**Scope**:

- Files: `server/package.json`, `server/package-lock.json`, `server/eslint.config.js` if required, this plan file
- Systems: server tooling lane, Jest-based unit test lane, ESLint plugin integration
- Risk: medium

**What is being replaced?**: No dual-path system. This wave updates existing canonical tooling dependencies in place and retains the same test/lint/build entrypoints.

**Problem Statement**: Renovate has two deferred Wave B updates (`jest` and `eslint-plugin-sonarjs`) that require targeted validation because they directly affect the test runner and lint configuration. We need to absorb them only if the server lane stays green without widening scope into other major migrations.

## Live Targets — March 13, 2026

- `jest` → `30.3.0`
- `eslint-plugin-sonarjs` → latest `4.x` (`4.0.2` at execution time)

## Validation Lane

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

## Execution Plan

1. apply only the two Wave B updates in an isolated worktree
2. inspect whether `server/eslint.config.js` needs compatibility changes for `eslint-plugin-sonarjs@4`
3. run the full server validation lane
4. if green, commit and merge back to local `main`
5. if either update causes compatibility issues outside minimal repo-local fixes, stop and defer

## Completion Criteria

- [x] `jest` updated and validated
- [x] `eslint-plugin-sonarjs` updated and validated
- [x] no additional dependency wave scope added
- [x] plan updated with exact outcome

## Outcome Notes

- Applied updates:
  - `jest` → `30.3.0`
  - `eslint-plugin-sonarjs` → `4.0.2`
- No `server/eslint.config.js` compatibility changes were required.
- Full server lane passed:
  - `npm ci --prefer-offline --no-audit`
  - `npm run lint:ratchet`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:ci`
  - `npm run start:test`
  - `npm run validate:arch`
- Wave C and Wave D remain deferred.
