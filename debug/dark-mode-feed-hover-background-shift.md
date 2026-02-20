# Debug: Dark Mode Feed Hover Background Shift During Goo Render

**Status:** Draft  
**Date:** 2026-02-20

## Problem
In dark mode on the home feed, hovering a project card causes a subtle background tone shift while goo is visible, then the background returns when hover/goo ends.

Constraints for this pass:
- Investigation only.
- No behavior code changes yet.
- Focus on hover events/classes and side effects correlated with goo.

## Current Implementation Review

### Feed page wiring
- Feed passes `sloppy={slopEnabled}` into each card at `apps/web/src/app/page.tsx:347`.
- Slop mode itself only reads/writes localStorage (`slop:mode`) and does not mutate root/body classes or styles (`apps/web/src/lib/slop-mode.tsx:19`, `apps/web/src/lib/slop-mode.tsx:31`).

### ProjectCard hover path
- Hover state is controlled by React state (`isHovered`) with `onMouseEnter`, `onMouseLeave`, `onFocusCapture`, `onBlurCapture` (`apps/web/src/components/project/ProjectCard.tsx:46`, `apps/web/src/components/project/ProjectCard.tsx:117`, `apps/web/src/components/project/ProjectCard.tsx:258`).
- Goo mount condition: `showGoo = sloppy && isHovered` (`apps/web/src/components/project/ProjectCard.tsx:84`).
- On hover, card classes also change via CSS pseudo classes:
  - `hover:border-primary hover:shadow-lg`
  - `transition-all duration-200`
  - hover rotation class (`hover:rotate-0.5` or `hover:-rotate-0.5`)
  - refs: `apps/web/src/components/project/ProjectCard.tsx:68`, `apps/web/src/components/project/ProjectCard.tsx:111`, `apps/web/src/components/project/ProjectCard.tsx:115`, `apps/web/src/components/project/ProjectCard.tsx:251`, `apps/web/src/components/project/ProjectCard.tsx:255`.

### Goo rendering path
- Goo is rendered through a portal directly into `document.body` (`apps/web/src/components/slop/SlopGoo.tsx:439`).
- Goo overlay is positioned absolutely/fixed with explicit `zIndex` (project cards use `zIndex={12}`) (`apps/web/src/components/project/ProjectCard.tsx:101`, `apps/web/src/components/slop/SlopGoo.tsx:332`).
- SVG filter chain includes:
  - `feGaussianBlur`
  - threshold-like `feColorMatrix`
  - animated `feTurbulence`
  - `feDisplacementMap`
  - refs: `apps/web/src/components/slop/SlopGoo.tsx:345`, `apps/web/src/components/slop/SlopGoo.tsx:346`, `apps/web/src/components/slop/SlopGoo.tsx:357`, `apps/web/src/components/slop/SlopGoo.tsx:362`.

### Global/background baseline
- Body background is token-driven and stable (`bg-background`) in base layer (`apps/web/src/app/globals.css:163`).
- No hover class on feed containers directly mutates page background.

## Hypotheses (Initial Ranking)

| Initial Rank | Hypothesis | Why It Fits |
|---|---|---|
| 1 | SVG filter compositing side effect on mount/unmount | Goo appears only on hover and is implemented as a filtered portal layer; this is the largest render pipeline change tied to the symptom. |
| 2 | Combined hover transforms + `shadow-lg` in slop mode alter perceived background | Hover state that enables goo also enables border/shadow/rotation transitions; slop mode adds baseline transforms that change how shadows/compositing read in dark mode. |
| 3 | Goo blur/threshold/displacement visually tints nearby dark background | Goo is drawn above cards with blur and bright slop color, so subtle surrounding tone shifts are plausible. |
| 4 | `mix-blend-multiply` thumbnail overlay interacts with new filtered layer | Card thumbnails use blend mode and can be sensitive to stacking/compositing order changes. |
| 5 | Hover state churn (enter/leave/focus) remounts goo rapidly | Remounting a filtered portal repeatedly can look like flicker in dark backgrounds. |

## Re-review of Each Hypothesis

### 1) SVG filter compositing side effect on mount/unmount
Evidence after re-review:
- Strong correlation to goo visibility path (`showGoo`).
- No root token/class mutations found.
- Filtered portal is the most heavyweight differential between slop on/off.

Re-review result: **Remains most likely**.

### 2) Hover transforms + shadow interaction
Evidence after re-review:
- Hover changes `border`, `shadow`, and `transform` while goo appears.
- `transition-all` can make subtle color/edge changes more visible in dark mode.

Counterpoint:
- Similar hover shadow exists with slop mode off.

Re-review result: **Still plausible, but secondary to filter compositing**.

### 3) Goo itself tinting local background
Evidence after re-review:
- Goo layer uses bright color + blur and sits above page content.
- Could be perceived as "background shift" around the card zone.

Counterpoint:
- If users perceive a wider page-level shift, pure local tint is insufficient by itself.

Re-review result: **Plausible and likely contributes, but not sole explanation**.

### 4) `mix-blend-multiply` interaction
Evidence after re-review:
- Blend mode is present on card image overlays (`apps/web/src/components/project/ProjectCard.tsx:141`, `apps/web/src/components/project/ProjectCard.tsx:303`).
- Blend-mode behavior can change with compositing/layer boundaries.

Counterpoint:
- Same blend mode exists when slop mode is off.

Re-review result: **Lower likelihood; potential amplifier, not primary driver**.

### 5) Hover state churn/remount flicker
Evidence after re-review:
- Goo mount is tied to pointer/focus state.

Counterpoint:
- Goo wrapper is `pointer-events: none`, reducing accidental hover oscillation (`apps/web/src/components/slop/SlopGoo.tsx:331`).
- Symptom described as subtle tone shift, not classic rapid flicker.

Re-review result: **Lowest likelihood**.

## Final Ranked Hypotheses

| Final Rank | Hypothesis | Confidence |
|---|---|---|
| 1 | SVG filter/compositor side effect from hover-mounted portal goo | Medium-High |
| 2 | Hover shadow/transform transition interplay in slop mode | Medium |
| 3 | Local tinting from blurred goo layer over dark background | Medium |
| 4 | Blend-mode interaction (`mix-blend-multiply`) with compositing changes | Low-Medium |
| 5 | Hover remount churn/focus event oscillation | Low |

## Suggested No-Code Validation Order

1. In DevTools, temporarily disable the `<g filter="url(...)">` filter on hovered goo while keeping hover classes active.
2. Keep goo mounted but disable `hover:shadow-lg` on the card in DevTools to isolate shadow contribution.
3. Keep filter active but set goo group opacity lower in DevTools to test whether local tint perception dominates.
4. Temporarily disable thumbnail `mix-blend-multiply` in DevTools to check blend interaction.
5. Inspect layer/compositing view during hover to confirm whether portal-filter mount creates a new heavy compositor path.

## Update: Transient-Only + Production-Only Constraints (2026-02-20)

### New observed behavior
1. Background shift happens only at hover start (momentary), then returns to normal while still hovered.
2. The shift happens again on the next card hover entry.
3. Repro is production-only (not seen in local dev mode).
4. Still correlated with slop mode/goo visibility.

### Additional code re-review for these constraints
- Hover entry flips `isHovered` immediately, which mounts `SlopGoo` (`apps/web/src/components/project/ProjectCard.tsx:84`, `apps/web/src/components/project/ProjectCard.tsx:117`, `apps/web/src/components/project/ProjectCard.tsx:257`).
- At the same hover moment, the card starts a 200ms all-properties transition including border/shadow/transform (`apps/web/src/components/project/ProjectCard.tsx:111`, `apps/web/src/components/project/ProjectCard.tsx:115`, `apps/web/src/components/project/ProjectCard.tsx:251`, `apps/web/src/components/project/ProjectCard.tsx:255`).
- `SlopGoo` mount is staged:
  - first render can return `null` until internal state initializes (`mounted`, `seed`, `geom`)
  - refs: `apps/web/src/components/slop/SlopGoo.tsx:85`, `apps/web/src/components/slop/SlopGoo.tsx:104`, `apps/web/src/components/slop/SlopGoo.tsx:108`, `apps/web/src/components/slop/SlopGoo.tsx:117`, `apps/web/src/components/slop/SlopGoo.tsx:296`.
- Cards use `next/link` without `prefetch={false}`; in Next production, hover prefetch is active while dev behavior differs (`apps/web/src/components/project/ProjectCard.tsx:126`, `apps/web/src/components/project/ProjectCard.tsx:266`).

## Revised Hypotheses (Initial)

| Initial Rank | Hypothesis | Why It Fits New Constraints |
|---|---|---|
| 1 | Hover-entry mount/compositor warm-up of filtered portal goo | Entry-only transient matches first-frame setup cost; repeats per hover because goo is mount/unmount scoped to `isHovered`. |
| 2 | Entry-time overlap of card `transition-all` (shadow/transform) with goo startup | Symptom is momentary and aligns with hover-start window; then stabilizes while hovered. |
| 3 | Production-only `next/link` hover prefetch adds entry hitch that amplifies visible paint/composite artifact | Prod-only condition maps well to prefetch behavior difference; hover is the trigger point. |
| 4 | Tailwind production CSS output/order changes hover interpolation of `shadow-lg`/transform vs dev | Prod-only could come from generated CSS ordering/minification differences, though less direct evidence. |
| 5 | Blend-mode overlay (`mix-blend-multiply`) amplifies only the entry frame | Can intensify perceived tone shift but does not explain prod-only behavior by itself. |

## Re-review of Revised Hypotheses

### 1) Hover-entry mount/compositor warm-up of filtered portal goo
Evidence after re-review:
- Strongly matches "only at hover start."
- `SlopGoo` is a filtered SVG portal to `document.body`, with non-trivial filter graph (`apps/web/src/components/slop/SlopGoo.tsx:337`).
- Mount occurs only when hover starts; unmount on leave.

Counterpoint:
- Does not alone explain why dev misses repro, but dev/prod runtime differences can mask timing-sensitive artifacts.

Re-review result: **Most likely**.

### 2) Entry-time overlap with card `transition-all`
Evidence after re-review:
- 200ms transition starts at same time goo mounts.
- Momentary visual delta then stable hover state is consistent with transition-window artifacts.

Counterpoint:
- Similar transition exists when slop mode is off, so this is likely an interaction factor, not the sole trigger.

Re-review result: **High plausibility as co-factor**.

### 3) Production-only Link prefetch hitch
Evidence after re-review:
- Hovering a card enters Next Link hover path in production.
- Prod-only symptom maps to this difference.

Counterpoint:
- Prefetch exists even when slop mode is off, so this is likely an amplifier that becomes visible only when goo/render cost is also present.

Re-review result: **Plausible production amplifier**.

### 4) Tailwind production CSS interpolation/order difference
Evidence after re-review:
- User-reported prod-only behavior keeps this on the list.

Counterpoint:
- No direct code evidence yet of conflicting utility order for this path.
- Would more likely produce consistent hover differences, not strictly entry-only transients.

Re-review result: **Lower confidence**.

### 5) Blend-mode amplifier
Evidence after re-review:
- `mix-blend-multiply` can increase sensitivity to compositing changes.

Counterpoint:
- Present in both dev/prod and slop on/off card markup.

Re-review result: **Lowest of revised set**.

## Revised Final Ranking

| Final Rank | Hypothesis | Confidence |
|---|---|---|
| 1 | Entry-time filtered portal mount/compositor warm-up in `SlopGoo` | Medium-High |
| 2 | Card `transition-all` (shadow/transform) overlap with goo startup on hover entry | Medium-High |
| 3 | Production Link prefetch hitch amplifying entry artifact | Medium |
| 4 | Tailwind production CSS hover interpolation/order artifact | Low-Medium |
| 5 | Blend-mode (`mix-blend-multiply`) amplifier | Low |

## Revised Validation Focus (No Code Changes Yet)

1. Production browser Performance profile around hover entry only; inspect first 300ms for raster/composite spikes.
2. Production Network panel: confirm whether card hover triggers Link prefetch requests at the same instant as visible shift.
3. DevTools live style edit in production session: temporarily remove `hover:shadow-lg` effect (set `box-shadow: none` on hovered card) and compare transient.
4. DevTools live edit: disable goo filter on hovered portal group and compare transient timing.
5. If needed, force reduced motion in OS/browser and compare; this changes goo animation pressure without code edits.

## Experiment A Setup (Implemented for Testing)

To test Toggle A without keeping a permanent behavior change, `SlopGoo` now supports a URL debug switch:

- `?debugNoGooFilter=1` (or `?debugNoGooFilter=true`) disables the SVG filter application for goo.
- When this flag is present:
  - the `<filter>` node is not rendered in defs
  - the goo `<g>` renders without `filter="url(...)"`

Implementation file:
- `apps/web/src/components/slop/SlopGoo.tsx`

Quick compare flow:
1. Open prod build normally (no query param) and reproduce hover transient.
2. Reload same page with `?debugNoGooFilter=1`.
3. Re-test the same card hover path and compare whether the momentary background shift disappears or materially changes.

## Experiment B Setup (Implemented for Testing)

To isolate card hover transition/shadow/rotation effects, `ProjectCard` now supports:

- `?debugNoCardHoverFx=1` (or `?debugNoCardHoverFx=true`)

When enabled:
- card hover rotation class is disabled
- `hover:shadow-lg` is removed
- card transition mode narrows from `transition-all` to `transition-colors`
- `hover:border-primary` remains

Implementation file:
- `apps/web/src/components/project/ProjectCard.tsx`

Compare flow:
1. Baseline (no debug params).
2. Option B only: `?debugNoCardHoverFx=1`.
3. Option A + B combined: `?debugNoGooFilter=1&debugNoCardHoverFx=1`.

Interpretation:
- If B removes transient: hover FX overlap is primary.
- If B does not remove transient but A+B does: interaction between goo pipeline and hover FX is likely.

## Experiment C Setup (Implemented for Testing)

To isolate Next.js card-link prefetch effects, `ProjectCard` now supports:

- `?debugNoCardPrefetch=1` (or `?debugNoCardPrefetch=true`)

When enabled:
- all `next/link` instances in `ProjectCard` are rendered with `prefetch={false}`
- this suppresses card link prefetch as a hover-entry confounder

Implementation file:
- `apps/web/src/components/project/ProjectCard.tsx`

Compare flow:
1. Baseline (no debug params).
2. C only: `?debugNoCardPrefetch=1`.
3. C + A: `?debugNoCardPrefetch=1&debugNoGooFilter=1`.
4. C + B: `?debugNoCardPrefetch=1&debugNoCardHoverFx=1`.

Interpretation:
- If C removes transient: link prefetch was primary.
- If C has no effect (and A/B also no effect): likely outside these three candidate groups (e.g., GPU/compositor behavior not directly from filter/shadow/prefetch toggles).

## Experiment D Setup (Implemented for Testing)

To isolate thumbnail blend-mode influence, `ProjectCard` now supports:

- `?debugNoCardBlendOverlay=1` (or `?debugNoCardBlendOverlay=true`)

When enabled:
- the thumbnail overlay element (`bg-foreground/5 mix-blend-multiply`) is not rendered in both grid and list card variants

Implementation file:
- `apps/web/src/components/project/ProjectCard.tsx`

Compare flow:
1. Baseline (no debug params).
2. D only: `?debugNoCardBlendOverlay=1`.
3. D + A: `?debugNoCardBlendOverlay=1&debugNoGooFilter=1`.
4. D + B + C: `?debugNoCardBlendOverlay=1&debugNoCardHoverFx=1&debugNoCardPrefetch=1`.

Interpretation:
- If D removes transient: blend/compositing interaction at thumbnail overlay is primary.
- If D has no effect and A/B/C also have no effect: investigate browser/compositor/layer-init behavior that is independent of these card-level toggles.

## Reset: Corrected Behavior + A-D Results (2026-02-20)

### Corrected observed behavior
1. Transient shift occurs on hover enter, then returns to normal while still hovered.
2. Transient shift also occurs on hover leave, then returns to normal after leave.
3. Each transient lasts roughly 200-600ms.
4. Repro is production-only.
5. Repro does not occur when slop mode is off.

### Outcome of implemented A-D toggles
- A (`debugNoGooFilter`): no visible change vs baseline.
- B (`debugNoCardHoverFx`): no visible change vs baseline.
- C (`debugNoCardPrefetch`): no visible change vs baseline.
- D (`debugNoCardBlendOverlay`): no visible change vs baseline.
- Combined A+B / other mixes tested so far: still baseline behavior.

Conclusion from A-D: the issue is likely not driven by the specific filter/shadow/prefetch/blend knobs we toggled.

## Revised Hypotheses After A-D

| Rank | Hypothesis | Confidence |
|---|---|---|
| 1 | Portal mount/unmount lifecycle cost itself (independent of goo filter details) causes compositor transition on enter/leave | Medium-High |
| 2 | SVG mask/defs/portal insertion into `document.body` triggers temporary layer reshuffle in optimized builds | Medium |
| 3 | Production-only optimization path (CSS/asset/chunk pipeline) changes paint/compositing timing around hover state updates | Medium |
| 4 | Browser GPU/compositor quirk triggered by this exact optimized DOM/CSS/SVG combination | Medium-Low |
| 5 | Tailwind utility compilation difference directly causes a color transition | Low |

## New Experiment Track (Step Back)

### 1) Lifecycle isolation first (highest signal)
1. Add a temporary `debugNoGooRender=1` to skip rendering `SlopGoo` entirely while keeping slop mode on.
2. If issue disappears, root cause remains in goo mount/portal lifecycle, not card hover chrome.
3. If issue persists, reassess non-goo slop-mode differences.

### 2) Tailwind/CSS pipeline parity experiments
Use env-gated Next config toggles for build-time A/B:
1. `experimental.useLightningcss = false` (switch away from Lightning CSS path).
2. `experimental.cssChunking = "strict"` (reduce CSS ordering heuristics).
3. `experimental.disableOptimizedLoading = true` (test loader/optimization timing sensitivity).
4. Keep baseline build in parallel for immediate side-by-side comparison.

Implemented as env flags in:
- `apps/web/next.config.ts`

Flags:
- `SLOP_DEBUG_NO_LIGHTNINGCSS=1`
- `SLOP_DEBUG_CSS_CHUNKING_STRICT=1`
- `SLOP_DEBUG_DISABLE_OPTIMIZED_LOADING=1`
- `SLOP_DEBUG_OPTIMIZE_CSS=1` (force on) / `SLOP_DEBUG_OPTIMIZE_CSS=0` (force off)

Example build commands:
- Baseline: `pnpm -F @slop/web build`
- No Lightning CSS: `SLOP_DEBUG_NO_LIGHTNINGCSS=1 pnpm -F @slop/web build`
- Strict CSS chunking: `SLOP_DEBUG_CSS_CHUNKING_STRICT=1 pnpm -F @slop/web build`

Reference option availability (local Next 15 typings):
- `apps/web/node_modules/next/dist/server/config-shared.d.ts:421`
- `apps/web/node_modules/next/dist/server/config-shared.d.ts:428`
- `apps/web/node_modules/next/dist/server/config-shared.d.ts:438`
- `apps/web/node_modules/next/dist/server/config-shared.d.ts:627`

### 3) “Tailwind dev mode in production” feasibility note
- Running `NODE_ENV=development next build` is non-standard and unstable in this app right now (observed warning + prerender failure during local attempt).
- More practical alternative: run a preview environment with `next dev` against production-like data to compare visual behavior, but do not treat that as deployable production runtime.

## Suggested Next Order

1. Implement `debugNoGooRender=1` (single high-signal toggle).
2. If still unresolved, add env-gated `next.config.ts` build toggles for `useLightningcss` and `cssChunking`.
3. Compare baseline production build vs one CSS-pipeline variant at a time.

## Build Variant Smoke Check (Local)

Ran local builds to verify the new config toggles are usable:

1. Baseline build: success.
2. `SLOP_DEBUG_NO_LIGHTNINGCSS=1`: success.
3. `SLOP_DEBUG_CSS_CHUNKING_STRICT=1`: success.
4. `SLOP_DEBUG_DISABLE_OPTIMIZED_LOADING=1`: success.
5. `SLOP_DEBUG_OPTIMIZE_CSS=1`: build path reached, but local sandbox failed on `next/font` Google fetch (`fonts.googleapis.com`) before completion; cannot conclude behavior impact from this environment.

Additional exploration:
- `NODE_ENV=development next build` was attempted as a "dev-mode production" probe; Next warns this is non-standard and the run was not reliable for this app, so this is not a recommended path for diagnosing the issue.

## Experiment E Setup (Implemented for Testing)

To isolate goo lifecycle effects from all other slop-mode visuals, `ProjectCard` now supports:

- `?debugNoGooRender=1` (or `?debugNoGooRender=true`)

When enabled:
- `SlopGoo` is never rendered/mounted for hovered cards
- slop mode remains enabled for the rest of the card styling

Implementation file:
- `apps/web/src/components/project/ProjectCard.tsx`

Compare flow:
1. Baseline (no params).
2. E only: `?debugNoGooRender=1`.
3. E + previous toggles (if needed): `?debugNoGooRender=1&debugNoCardHoverFx=1&debugNoCardPrefetch=1&debugNoCardBlendOverlay=1`.

Interpretation:
- If E removes the enter/leave transient: root cause is in goo mount/unmount lifecycle (portal/SVG/compositor path).
- If E still shows the transient: root cause is likely outside goo render path (broader slop-mode or page-level production pipeline behavior).

### Result (2026-02-20)
- With `debugNoGooRender=1`, goo no longer appears, but background transients still occur.
- Additional confirmed constraint: issue reproduces only in dark mode (never in light mode).

Implication:
- Root trigger is not goo rendering itself.
- Focus shifts to dark-mode + slop-mode card styling/compositing interactions.

## Experiment F Setup (Implemented for Testing)

To isolate slop-mode baseline card transforms, `ProjectCard` now supports:

- `?debugNoSlopOffsets=1` (or `?debugNoSlopOffsets=true`)

When enabled:
- slop card offset transform class (`rotate/translate` from `SLOP_CARD_OFFSETS`) is disabled
- slop mode remains on

Implementation file:
- `apps/web/src/components/project/ProjectCard.tsx`

Compare flow:
1. Baseline dark mode (no params).
2. F only: `?debugNoSlopOffsets=1`.
3. F + E: `?debugNoSlopOffsets=1&debugNoGooRender=1`.

Interpretation:
- If F removes/reduces transient: baseline slop transforms are likely interacting with dark-mode compositing.
- If F has no effect: continue investigating dark-theme token/AA/compositor transitions not tied to card offsets.
