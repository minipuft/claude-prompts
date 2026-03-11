# Demo Video Recording Plan

## Format Decision

**Multiple short clips** embedded as GIFs in the README, not one long video.
Each clip shows ONE feature clearly in 10-30s.

## Recording Setup

- **Tool**: ShareX (Windows) recording Claude Code in Windows Terminal
- **Font**: Fira Code (set in Windows Terminal profile)
- **Resolution**: 1424x1298 (native terminal size)
- **Model**: Use `haiku` for speed/cost where possible, `opus` only where output quality matters for the demo
- **Source format**: MP4 from ShareX
- **Target format**: GIF for README inline (convert with ffmpeg)
- **File size target**: <5MB per GIF (GitHub renders inline up to 10MB)

## Post-Processing (ffmpeg)

### Standard Pipeline (all clips)

Every GIF uses this base filter chain:
1. `crop=iw:ih-50:0:50` — remove Windows Terminal tab bar (50px)
2. `geq` blue-excess clamp — surgical fix for acrylic transparency bleed
3. Speed adjustment (`setpts`)
4. `fps=10`, `scale=580:-1:flags=lanczos` — consistent dimensions
5. `palettegen=max_colors=48:stats_mode=diff` + `paletteuse=dither=bayer:bayer_scale=5`

```bash
# The geq filter (reusable variable)
GEQ="geq=r='r(X,Y)':g='g(X,Y)':b='if(gt(b(X,Y),(r(X,Y)+g(X,Y))/2+12),(r(X,Y)+g(X,Y))/2+8,b(X,Y))'"

# Simple clip (single speed)
ffmpeg -i input.mp4 -filter_complex "
  [0:v]trim=start=S:end=E,setpts=(PTS-STARTPTS),
  crop=iw:ih-50:0:50,${GEQ},
  setpts=0.5*PTS,fps=10,scale=580:-1:flags=lanczos,split[s0][s1];
  [s0]palettegen=max_colors=48:stats_mode=diff[p];
  [s1][p]paletteuse=dither=bayer:bayer_scale=5
" -loop 0 output.gif

# Variable speed (split into segments, concat)
# See Clip 2 in plan for full example
```

### Why these settings
- **crop 50px**: Tab bar gradient poisons GIF palette
- **geq blue clamp**: Windows Terminal acrylic lets desktop bleed through. The `geq` filter checks each pixel: if blue exceeds avg(R,G) by >12, cap it at avg(R,G)+8. This preserves the natural dark blue-grey theme color (excess +6 to +10) while killing acrylic contamination (excess +15 to +65). No yellow tint because it doesn't boost red/green — unlike `colorchannelmixer` which redistributes.
- **10fps / 580px / 48 colors**: Sweet spot for <5MB with readable text
- **bayer_scale=5**: Aggressive dithering compresses well for terminal content

### Color correction history
1. `colorchannelmixer=bb=0.72:rb=0.04:gb=0.04` — killed blue but introduced yellow tint (redistributes blue into R/G)
2. `curves` on blue shadows — not aggressive enough, blue rectangle persisted
3. `geq` pixel-level clamp (current) — surgical, no tint shift, preserves theme color

---

## Recording Checklist (Before Each Clip)

- [ ] Fresh `claude` session (no prior context)
- [ ] Terminal font set to Fira Code
- [ ] Terminal sized consistently (same width across all clips)
- [ ] Plugin loaded (status bar shows MCP server)
- [ ] Start ShareX BEFORE typing
- [ ] Trim dead time from start/end after recording

---

## Clip List

### Clip 1: System Status — RECORDED + INTEGRATED
- **Source**: `WindowsTerminal_qWBilRChm0.mp4`
- **GIF**: `assets/demos/status-demo-3x.gif` (3x speed)
- **README placement**: `<details>` dropdown between Quick Start and What You Get
  ```html
  <details>
  <summary><strong>See it running</strong> — system status overview</summary>
  <img src="assets/demos/status-demo-3x.gif" ... />
  </details>
  ```

### Clip 2: Hero Demo — Chain + Gate + Delegation — RECORDED + INTEGRATED
- **Source**: `WindowsTerminal_DLI4sJn0tS.mp4` (4:12, 1370x1084)
- **Split into 2 GIFs** (source too long for single GIF):
  - **GIF A**: `assets/demos/hero-demo.gif` (4.3MB, ~21s playback)
    - 0:05-0:34 hooks + template @ 6x speed
    - 0:34-1:40 chain execution @ 12x speed
    - 1:40-2:13 gate fail→pass @ 3x speed (key feature, slower for readability)
  - **GIF B**: `assets/demos/hero-chain-demo.gif` (4.3MB, ~13s playback)
    - 2:13-3:50 phases 3-4 back-to-back @ 10x speed
    - 3:50-4:04 final render @ 4x speed
- **README placement**:
  - GIF A: Hero position right after tagline (the "aha" moment)
  - GIF B: `<details>` dropdown in "Compose Workflows" section
- **Notes**:
  - Recorded with haiku model (cheapest) to demonstrate gate improvement on less capable models
  - Gate catches missing field on first attempt, passes after self-correction
  - Phases 3-4 compound reasoning — each step builds on previous validated output
- **Rendering**: Variable speed via ffmpeg segment concat, 600px width, 7-8fps, 64-color palette with bayer dithering

### Clip 3: Resource Discovery — RECORDED + INTEGRATED
- **Source**: `WindowsTerminal_2JMxV8xaKk.mp4` (17.5s, 1370x1084)
- **GIF**: `assets/demos/resource-list-demo.gif` (444KB, ~7s playback)
- **Processing**: trim 3-17s, 2x speed, 12fps, crop 50px top, colorchannelmixer, 580px, 48 colors
- **README placement**: `<details>` dropdown in "What You Get" section
- **Shows**: Full prompt catalog — 90 prompts across 11 categories

### Clip 4: Chain Workflow — RECORDED + INTEGRATED
- **Source**: `WindowsTerminal_FigL75A7Ol.mp4` (2:36, 1368x1116)
- **GIF**: `assets/demos/chain-workflow-demo.gif` (2.7MB, ~12s playback)
- **Processing**: Two segments (50-70s @ 6x, 138-156s @ 2x), 10fps, geq blue fix, 580px, 48 colors
- **README placement**: Second `<details>` dropdown in "Compose Workflows" (after hero-chain-demo)
- **Shows**: `>>tech_evaluation_chain` with context7 research delegation, producing scored assessment table with security/performance/DX/integration/ecosystem ratings and sourced recommendations

### Clip 5: Verification Loop
- **Status**: NOT recorded
- **Prompt**: `>>test_default count:'5' :: verify:"echo 'test passed'" :fast`
- **Shows**: Shell verification — prompt runs, verify command executes, passes
- **Target duration**: 15-20s
- **README placement**: "Verification Loops" section

### Clip 6: Gate Validation Showcase
- **Status**: NOT recorded
- **Goal**: Dedicated demo of gates as the star feature — not buried inside a chain
- **Prompt options** (pick one that produces a visible FAIL → retry → PASS cycle):
  - `>>code_review target:'src/runtime/' :: 'must include severity ratings' :: 'cite specific line numbers'` — two inline gates, likely to fail on first attempt with haiku
  - `>>quick_analysis topic:'error handling patterns' :: 'include code examples for every recommendation'` — demanding gate that forces structured output
- **What to capture**:
  1. The gate criteria appearing in the prompt (shows what's being enforced)
  2. First attempt output (partial/missing something)
  3. `GATE_REVIEW: FAIL` verdict with the specific failure reason
  4. Retry with corrected output
  5. `GATE_REVIEW: PASS` verdict
- **Key visual moments**: The FAIL/PASS verdicts with colored indicators — this is the payoff
- **Target duration**: 20-30s source (use haiku for cheaper/faster, more likely to fail first attempt)
- **Speed**: 3x on generation, 2x on verdict moments (let viewer read FAIL/PASS)
- **README placement**: `<details>` dropdown in "What You Get" section under Validation Rules (Gates)
- **Tips**:
  - Use haiku — it's more likely to miss a gate criterion on first pass, making the demo more compelling
  - Two inline `::` gates are better than one — shows composability
  - The hero GIF already shows a gate in context of a chain; this clip isolates the gate mechanism itself

### Clip 7: Skills Export (CLI — no API cost) — RECORDED + INTEGRATED
- **Source**: `WindowsTerminal_xdywH7e01M.mp4` (25.8s, 1368x1116)
- **GIF**: `assets/demos/skills-export-demo.gif` (1.5MB, ~12s playback)
- **Processing**: trim 2-25.5s, 2x speed, 10fps, crop 50px top, colorchannelmixer, 580px, 48 colors
- **README placement**: `<details>` dropdown in "Run Anywhere" section
- **Shows**: `npm run skills:export -- --dry-run` compilation + `bat` preview of generated review skill with phases, gates, and arguments

---

## Priority Order

Record in this order (highest README impact first):

1. **Clip 2** (Hero) — the single most important visual
2. **Clip 4** (Chain) — the signature differentiator
3. **Clip 7** (Skills Export) — zero API cost, easy win
4. **Clip 5** (Verification) — shows ground-truth validation
5. **Clip 3** (Resource List) — shows breadth of templates
6. **Clip 6** (Judge) — nice to have, shows AI-driven selection

## README Placement Map

```
# Claude Prompts MCP Server
[logo + badges]
[tagline]

[HERO GIF A — Clip 2]             ← DONE: hero-demo.gif (gate validation)

## Quick Start
...
                                  ← DONE: Clip 1 in <details> dropdown
<details>See it running</details> ← status-demo-3x.gif (recorded, integrated)

## What You Get
[Clip 3 — resource list]         ← DONE: resource-list-demo.gif in <details>

## Compose Workflows
[HERO GIF B — Clip 2]            ← DONE: hero-chain-demo.gif (compound reasoning)
[Clip 4 — chain workflow]        ← DONE: chain-workflow-demo.gif in <details>

### Verification Loops
[Clip 5 — verify loop]           ← shows ground-truth validation

### Judge Mode
[Clip 6 — gate validation]       ← shows FAIL → retry → PASS cycle

## Run Anywhere
[Clip 7 — skills export]         ← DONE: skills-export-demo.gif in <details>
```

## Workflow

1. You record with ShareX (MP4)
2. Share the MP4 path
3. I speed up (3x default), trim where you say, convert to GIF
4. Store GIF in `assets/demos/`
5. Integrate into README

## Notes

- VHS tapes abandoned — unreliable with API calls, ShareX is faster
- `skills-export.tape` kept as a command reference only
- If any clip exceeds 5MB as GIF, reduce fps to 10 or scale down
- The `>>` syntax hook detection is visible in the recording — that's a feature, not a bug
- `code_review_test` chain created specifically for the hero demo
- `research_docs` prompt created for context7-based library research
