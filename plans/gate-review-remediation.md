# Gate Review System: Post-Audit Remediation Plan

## Context

After completing the gate review CTA deduplication (terminology, triple rendering, counter fix), a systematic audit of the gate review process revealed five remaining issues. The triple rendering is resolved (proper two-layer hierarchy: guidance → verdict template), but the audit exposed a **critical gap in argument defaults** for symbolic chains, **dead code** from the deduplication, **remaining terminology inconsistencies** in internal APIs, **retry hint duplication** on phase guard reviews, and a **dead placeholder variable**.

All fixes extend or clean up existing patterns — no new abstractions.

---

## Issue 1: Missing Argument Defaults in Symbolic Chains (CRITICAL)

**Problem**: `>>test_default --> >>test_default` renders `Generate exactly  items.` — the `count` argument's `defaultValue: 42` is never applied. The LLM reviews against a broken template with invisible holes.

**Root cause**: `resolveArgumentPayload()` in `symbolic-command-builder.ts` returns `processedArgs: {}` when no user args are provided (line 280), bypassing `ArgumentParser.resolveContextualDefault()` entirely. Single-prompt execution (Stage 01 → ArgumentParser) is unaffected — defaults are applied correctly there.

### Fix 1a: Apply defaults in `resolveArgumentPayload()` (primary fix)

**File**: `server/src/engine/execution/parsers/symbolic-command-builder.ts`

Add a private method `collectArgumentDefaults(prompt)` that iterates `prompt.arguments[]` and returns a `Record<string, unknown>` of `{ name: defaultValue }` for every argument where `defaultValue !== undefined`.

Modify `resolveArgumentPayload()` lines 271-284:

```typescript
if (!sanitizedArgs?.trim()) {
  const defaults = this.collectArgumentDefaults(prompt);
  if (Object.keys(fallbackArgs ?? {}).length > 0) {
    return {
      processedArgs: { ...defaults, ...fallbackArgs },  // defaults under fallback
      resolvedPlaceholders: {},
      inlineCriteria: normalizedSeed,
    };
  }
  return {
    processedArgs: defaults,  // was: {} — now applies prompt defaults
    resolvedPlaceholders: {},
    inlineCriteria: normalizedSeed,
  };
}
```

Also apply defaults AFTER `parseArgumentsSafely()` (line 289-294) to fill in args the user didn't provide:

```typescript
const defaults = this.collectArgumentDefaults(prompt);
const processedArgs =
  parsed.processedArgs && Object.keys(parsed.processedArgs).length > 0
    ? { ...defaults, ...parsed.processedArgs }   // user args override defaults
    : fallbackArgs
      ? { ...defaults, ...fallbackArgs }
      : defaults;
```

### Fix 1b: Defense-in-depth in `normalizeStepArgs()` (secondary)

**File**: `server/src/engine/execution/operators/chain-operator-executor.ts`

Expand `normalizeStepArgs()` (line ~812) to accept optional `ConvertedPrompt` and apply defaults as fallback:

```typescript
private normalizeStepArgs(
  argsInput?: Record<string, unknown>,
  prompt?: ConvertedPrompt
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  if (prompt?.arguments) {
    for (const arg of prompt.arguments) {
      if (arg.defaultValue !== undefined) {
        defaults[arg.name] = arg.defaultValue;
      }
    }
  }
  if (!argsInput || typeof argsInput !== 'object') {
    return defaults;
  }
  return { ...defaults, ...argsInput };  // explicit args override defaults
}
```

Update both call sites (~line 138 renderGateReviewStep and ~line 338 renderNormalStep) to pass `convertedPrompt` (already in scope at both locations).

### Fix 1c: Warn on missing required arguments

In `normalizeStepArgs()`, after building the merged result, log a warning if any `required: true` argument has no value:

```typescript
if (prompt?.arguments) {
  for (const arg of prompt.arguments) {
    if (arg.required && (result[arg.name] === undefined || result[arg.name] === '')) {
      this.logger.warn(`[SymbolicChain] Required argument "${arg.name}" missing for prompt "${prompt.id}"`);
    }
  }
}
```

### Tests for Issue 1

- Unit test: `resolveArgumentPayload` returns defaults when no args provided
- Unit test: explicit args override defaults
- Unit test: `normalizeStepArgs` applies defaults from `convertedPrompt.arguments[]`
- Integration test: `>>test_default --> >>test_default` renders `Generate exactly 42 items.`

---

## Issue 2: Dead Code Removal — `buildManualReviewBody()`

**Problem**: `buildManualReviewBody()` at `chain-operator-executor.ts:791-810` is no longer called in any rendering path after the deduplication fix. It reads `pendingReview.combinedPrompt` and calls `composeReviewPrompt()` — both bypassed since we switched to `originalContent`.

**Risk**: None. Zero callers. `composeReviewPrompt()` in `review-utils.ts` is still used by the judge gate path (separate from this method).

### Fix

**File**: `server/src/engine/execution/operators/chain-operator-executor.ts`

- Delete `buildManualReviewBody()` method (lines 791-810)
- Remove `composeReviewPrompt` from imports if it was only used there (verify other usages first)

---

## Issue 3: Internal Terminology — `Criterion` → `Gate`

**Problem**: Internal API names still use "criterion" while user-facing output now says "gate". Developer confusion about canonical naming.

### Fix

**File**: `server/src/engine/execution/pipeline/decisions/gates/gate-enforcement-types.ts`
- Rename `CriterionVerdict` interface → `GateVerdict`
- Update JSDoc: "Per-criterion verdict" → "Per-gate verdict"

**File**: `server/src/engine/execution/pipeline/decisions/gates/gate-enforcement-authority.ts`
- Rename `parseCriterionVerdicts()` → `parseGateVerdicts()`
- Update return type to `GateVerdict[]`
- Keep regex accepting both `CRITERION_VERDICTS` and `GATE_VERDICTS` formats (backward compat)

**File**: `server/src/engine/gates/core/review-utils.ts`
- Line 189 JSDoc: "criterion strings" → "gate criteria strings"

**Do NOT rename** (correct domain usage):
- `pass_criteria` in YAML gate definitions (gates HAVE criteria — domain-correct)
- `FrameworkSelectionCriteria` (framework selection, not gate-related)
- `criterion` loop variables in `skills-sync/service.ts` and `judge-prompt-builder.ts` (local var iterating criteria — domain-correct)
- `"criteria"` in `guide.ts` help text (describes inline gate syntax `:: "criteria"` — IS criteria)

### Files to update references

All importers of `CriterionVerdict` / `parseCriterionVerdicts` + their tests.

---

## Issue 4: Retry Hints Duplication on Phase Guard Reviews

**Problem**: When a phase guard review has `retryHints`, they appear twice:
1. `chain-operator-executor.ts` supplementalSections (line ~215): "**Improvements Needed:**\n- hint"
2. Stage 11 CTA guidanceBlock (line ~133): "**Structural issues** (fix first):\n- hint"

Only affects phase guard reviews. Standard gate reviews are unaffected (Stage 11 leaves `guidanceBlock` empty for those).

### Fix

**File**: `server/src/engine/execution/pipeline/stages/11-call-to-action-stage.ts`

Remove `retryHints` rendering from Stage 11 for phase guard branches (lines 133-146). Chain-operator-executor supplementalSections is SSOT for retry hints.

```typescript
// Pure phase guard — remove guidanceBlock
if (isPhaseGuardReview && !hasOtherGates) {
  header = `Structural Review Required`;
  gatesLine = `phase guards`;
  // retryHints already shown in supplementalSections — don't duplicate
}

// Mixed — remove guidanceBlock
} else if (isPhaseGuardReview && hasOtherGates) {
  header = `Structural + Gate Review Required`;
  gatesLine = '';
  // retryHints already shown in supplementalSections — don't duplicate
}
```

Update phase guard test assertions in `call-to-action-stage.test.ts`.

---

## Issue 5: Dead Placeholder — `gateWarning`

**Problem**: `gateWarning` in `chain-operator-executor.ts:125` is hardcoded to `''`, always filtered out by line 279's `.filter()`. Dead placeholder adding noise.

### Fix

**File**: `server/src/engine/execution/operators/chain-operator-executor.ts`

- Delete line 125 (`const gateWarning = '';`)
- Remove from `contentParts` array at line 275

---

## Execution Order

1. **Issue 1** (argument defaults) — biggest impact, standalone change
2. **Issue 2** (dead code removal) — cleanup in same file as Issue 1b
3. **Issue 5** (gateWarning) — trivial, same file as Issue 2
4. **Issue 4** (retry hints dedup) — isolated to Stage 11
5. **Issue 3** (terminology rename) — cross-cutting rename, do last to minimize churn

## Files Changed (Total)

| File | Issues |
|------|--------|
| `server/src/engine/execution/parsers/symbolic-command-builder.ts` | #1a |
| `server/src/engine/execution/operators/chain-operator-executor.ts` | #1b, #2, #5 |
| `server/src/engine/execution/pipeline/stages/11-call-to-action-stage.ts` | #4 |
| `server/src/engine/execution/pipeline/decisions/gates/gate-enforcement-types.ts` | #3 |
| `server/src/engine/execution/pipeline/decisions/gates/gate-enforcement-authority.ts` | #3 |
| `server/src/engine/gates/core/review-utils.ts` | #3 (JSDoc only) |
| Tests (multiple) | #1, #3, #4 |

## Verification

```bash
# After each issue
npm run typecheck && npm run lint:ratchet && npm test

# After all issues
npm run validate:all

# Live test after build
npm run build
# Then: >>test_default --> >>test_default
# Verify: "Generate exactly 42 items." (not "Generate exactly  items.")
# Verify: single attempt counter, no duplicate retry hints, GATE_VERDICTS terminology
```

## Status

- [ ] Issue 1a: Apply defaults in resolveArgumentPayload()
- [ ] Issue 1b: Defense-in-depth in normalizeStepArgs()
- [ ] Issue 1c: Warn on missing required arguments
- [ ] Issue 2: Delete buildManualReviewBody()
- [ ] Issue 5: Delete gateWarning placeholder
- [ ] Issue 4: Remove retry hints duplication in Stage 11
- [ ] Issue 3: Rename CriterionVerdict → GateVerdict
- [ ] Final validation + live test
