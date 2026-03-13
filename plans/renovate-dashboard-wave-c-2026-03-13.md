## Intent Declaration

**Work Type**: refactor  
**Confidence**: medium

**Scope**:

- Files: `remotion/package.json`, `remotion/package-lock.json`, remotion source files if compatibility fixes are required, this plan file
- Systems: remotion workspace, React/Three integration layer, Remotion three bindings
- Risk: high

**What is being replaced?**: Existing React 18 + react-three-fiber 8 + drei 9 + postprocessing 2 dependency stack in the remotion workspace. No dual-path is allowed; if Wave C lands, the old stack is fully replaced in the same workspace.

**Problem Statement**: Renovate rate-limited dashboard items describe a coordinated major migration across the remotion/react/three stack. These packages have interdependent peer requirements, so they should not be merged one-by-one. We need to validate whether the repo can absorb the full coordinated set with minimal repo-local fixes.

## Target coordinated set — March 13, 2026

- `react` → `19.2.4`
- `react-dom` → `19.2.4`
- `@types/react` → `19.x`
- `@types/react-dom` → `19.x`
- `three` → `0.183.2`
- `@types/three` → `0.183.0`
- `@react-three/fiber` → `9.5.0`
- `@react-three/drei` → `10.7.7`
- `@react-three/postprocessing` → `3.0.4`

## Verified compatibility notes

- `@react-three/fiber@9.5.0` peers on `react >=19 <19.3`, `react-dom >=19 <19.3`, `three >=0.156`
- `@react-three/drei@10.7.7` peers on `react ^19`, `react-dom ^19`, `three >=0.159`, `@react-three/fiber ^9`
- `@react-three/postprocessing@3.0.4` peers on `react ^19`, `three >=0.156`, `@react-three/fiber ^9`
- `@remotion/three@4.0.435` peers on `@react-three/fiber >=8`, `three >=0.137`, `react >=16.8`, `react-dom >=16.8`
- `remotion@4.0.435` peers on `react >=16.8`, `react-dom >=16.8`

## Validation lane

```bash
cd remotion
npm ci --prefer-offline --no-audit
npm run typecheck
```

If source compatibility changes are required, rerun:

```bash
cd remotion
npm ci --prefer-offline --no-audit
npm run typecheck
```

## Execution plan

1. update the coordinated dependency set together
2. run remotion typecheck
3. if type errors appear, make only minimal remotion-local compatibility fixes
4. if compatibility requires broader architectural changes or non-remotion scope, stop and defer

## Completion criteria

- [x] coordinated dependency set applied together
- [x] remotion typecheck passes
- [x] any code changes remain remotion-local and minimal
- [x] outcome documented with go/no-go recommendation

## Outcome Notes

- Applied coordinated updates:
  - `react` / `react-dom` → `19.2.4`
  - `@types/react` / `@types/react-dom` → `19.x`
  - `three` → `0.183.2`
  - `@types/three` → `0.183.x`
  - `@react-three/fiber` → `9.5.0`
  - `@react-three/drei` → `10.7.7`
  - `@react-three/postprocessing` → `3.0.4`
- Minimal remotion-local compatibility fix required:
  - `src/components/3d/effects/ParticleField.tsx`
  - migrated `bufferAttribute` props to `args={[typedArray, 3]}` for `@react-three/fiber@9`
- Validation passed:
  - `npm ci --prefer-offline --no-audit`
  - `npm run typecheck`
- Recommendation: **Go** for local integration. No broader repo changes were required beyond the remotion-local fix.
