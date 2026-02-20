# Debug: Dark Mode Hover Flash After Inner-Wrapper Refactor

**Status:** Draft  
**Date:** 2026-02-20

## New Observation

1. On `localhost:3000` with no query flags, the background still shifts briefly on hover enter and hover leave.
2. This persists after the "stable outer shell + transformed inner wrapper" refactor.
3. Previous assumption that this is production-only is no longer reliable.

## What Was Changed

Refactor implemented in `ProjectCard`:
1. Outer `article` kept stable for interaction/hover/focus handling.
2. Slop offsets moved to an inner visual wrapper.
3. Goo remained anchored to outer shell.

Expected outcome:
- Compositor stability from untransformed shell.

Observed outcome:
- Flash still present.

## Hypotheses: Why This Refactor Did Not Resolve It

## 1) The transformed surface is still the full card paint region (most likely)
- Even though the outer shell is stable, the inner wrapper still carries:
  - full card background (`bg-card`)
  - border
  - shadow transition
  - transform offsets
- If compositor/AA artifact is tied to transforming a large opaque card surface, wrapper split alone will not fix it.

## 2) Hover transition stack remains too expensive/jitter-prone
- `transition-all`, hover shadow, and rotation changes still happen during the same 200ms window.
- The transient can still look like a page/background flash even if the target element changed.

## 3) Goo mount/unmount lifecycle still causes global compositing noise
- Goo is still portaled to `document.body` and filter-heavy.
- If portal lifecycle or filter graph is causing frame instability, shell refactor would not address it.

## 4) Fractional slop offsets trigger subpixel AA shimmer in dark mode
- Current offsets include fractional degrees and ±1-2px translations.
- Dark backgrounds make AA changes more visible; this can read as "background shift."

## 5) Multiple visual amplifiers stack together
- Mix-blend thumbnail overlay, border + shadow transitions, and goo overlays may combine into the transient.
- Each factor alone may be minor; together they produce the visible flash.

## Ranked Approaches To Try Next

## A) Move slop personality off the full card surface (recommended)
1. Keep main card rectangle axis-aligned in dark mode.
2. Apply slop to decorative elements only (badge/sticker/corner accent/inner frame).
3. Preserve vibe without transforming the large opaque card plane.

Why likely:
- Directly targets the likely root: transformed full-surface paint in dark mode.

## B) Keep transforms but make them compositor-safer
1. Remove translation; keep tiny quantized rotation only.
2. Avoid fractional values.
3. Reduce or remove hover-time transform changes.

Why likely:
- Maintains some slop while reducing AA/compositor churn.

## C) Decouple goo lifecycle from hover
1. Keep goo mounted and toggle visibility/opacity instead of mount/unmount.
2. Optionally move goo into card-local stacking context (no body portal) for a test build.

Why likely:
- Eliminates lifecycle spikes if they are contributing to enter/leave transients.

## D) Reduce hover-time visual churn on dark slop cards
1. Replace `transition-all` with targeted transitions (`border-color`, maybe `transform`).
2. Remove or soften hover shadow in dark slop mode.

Why likely:
- Shrinks the 200-600ms transient window where artifacts are visible.

## E) Add containment/isolation guards
1. Test `isolation: isolate` and selective `contain: paint` on card layers.
2. Apply only where needed to avoid layout/paint regressions.

Why likely:
- Can limit compositor bleed between card and page layers.

## Suggested Next Debug Sequence (Low Cost, High Signal)

1. DevTools live test: force inner wrapper `transform: none` (confirm whether flash fully disappears).
2. DevTools live test: keep transform, disable shadow + `transition-all`.
3. Temporary local toggle: keep goo mounted (or disable goo entirely) to isolate lifecycle impact.
4. If (1) is decisive, proceed with Approach A or B for implementation.

## Experiment 1 Setup (Implemented)

To run item #1 without DevTools edits, `ProjectCard` now supports:

- `?debugNoInnerCardTransform=1` (or `?debugNoInnerCardTransform=true`)

Behavior:
1. Forces `transform: none` on the inner card visual wrapper in both grid and list variants.
2. Leaves hover, goo, and other card behavior intact.

File:
- `apps/web/src/components/project/ProjectCard.tsx`

Quick compare:
1. Baseline: `http://localhost:3000`
2. Toggle: `http://localhost:3000?debugNoInnerCardTransform=1`

Result:
1. Flash still present (no meaningful improvement).
2. Hypothesis #1 (inner-wrapper transform alone) is downgraded.

## Experiment 2 Setup (Implemented)

To run item #2 without DevTools edits, `ProjectCard` now supports:

- `?debugNoCardHoverChurn=1` (or `?debugNoCardHoverChurn=true`)

Behavior:
1. Removes hover shadow (`hover:shadow-lg`) from card wrappers.
2. Replaces `transition-all` with `transition-colors`.
3. Keeps slop offsets and goo behavior unchanged.

File:
- `apps/web/src/components/project/ProjectCard.tsx`

Quick compare:
1. Baseline: `http://localhost:3000`
2. Toggle: `http://localhost:3000?debugNoCardHoverChurn=1`
3. Combined with experiment 1: `http://localhost:3000?debugNoInnerCardTransform=1&debugNoCardHoverChurn=1`

Result:
1. Flash still present in both tests.
2. Hover shadow + `transition-all` are unlikely to be the primary trigger.

## Experiment 3 Setup (Implemented)

To isolate goo mount/unmount lifecycle, `ProjectCard` now supports:

- `?debugNoGooRender=1` (disable goo entirely)
- `?debugKeepGooMounted=1` (keep goo mounted whenever slop mode is on; only toggle visibility on hover)

Behavior:
1. `debugNoGooRender=1`: goo does not render at all.
2. `debugKeepGooMounted=1`: goo stays mounted, uses visibility toggle on hover, avoiding mount/unmount churn.

Files:
1. `apps/web/src/components/project/ProjectCard.tsx`
2. `apps/web/src/components/slop/SlopGoo.tsx`

Quick compare:
1. Baseline: `http://localhost:3000`
2. No goo: `http://localhost:3000?debugNoGooRender=1`
3. Keep mounted: `http://localhost:3000?debugKeepGooMounted=1`
4. Keep mounted + no hover churn: `http://localhost:3000?debugKeepGooMounted=1&debugNoCardHoverChurn=1`

Result:
1. Flash still present in all three tests.
2. Card-local goo lifecycle is unlikely to be the primary trigger.

## Hypothesis Shift After Experiments 1-3

Card-local factors are now lower confidence:
1. Inner wrapper transform
2. Hover shadow/transition churn
3. Per-card goo mount/unmount

Higher-confidence remaining branch:
1. Page-level slop-mode effects outside `ProjectCard` (especially always-on feed intro goo/filter layer or slop-mode layout deltas).

## Experiment 4 Setup (Implemented)

To isolate page-level slop effects on the feed page:

- `?debugNoFeedIntroGoo=1` (disable intro goo only)
- `?debugHideFeedIntro=1` (hide intro block entirely)
- `?debugNoSlopFeedSpacing=1` (disable slop-only spacing deltas in feed grid/list container)

File:
- `apps/web/src/app/page.tsx`

Quick compare:
1. Baseline: `http://localhost:3000`
2. No intro goo: `http://localhost:3000?debugNoFeedIntroGoo=1`
3. Hide intro: `http://localhost:3000?debugHideFeedIntro=1`
4. No intro + no slop spacing: `http://localhost:3000?debugHideFeedIntro=1&debugNoSlopFeedSpacing=1`

## Decision Gate

Ship direction should prioritize:
1. No visible flash in dark mode hover/de-hover.
2. Preserve slop personality without transforming the full card surface.
3. Keep implementation maintainable (avoid fragile browser-specific hacks where possible).
