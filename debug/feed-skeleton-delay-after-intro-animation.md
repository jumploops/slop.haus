# Debug: Perceived Feed Slowdown After Intro Hydration Animation

## Status

- **Type:** Investigation + simplification proposal (no runtime code changes in this step)
- **Date:** 2026-03-03
- **Scope:** `apps/web/src/app/page.tsx`, `apps/web/src/lib/slop-mode.tsx`

## Problem Statement

After fixing hydration mismatch, the page no longer errors, but users perceive slower initial rendering. Specifically, skeleton cards remain visible longer than before.

## Current Implementation Review

### Feed intro path now includes deliberate delayed reveal mechanics

In `apps/web/src/app/page.tsx`:

- Intro state is tri-phased (`hidden` -> `collapsed` -> `expanded`)
- Mount effect does:
  - `queueMicrotask(...)`
  - `requestAnimationFrame(...)`
  - second `requestAnimationFrame(...)`
  - then 250ms CSS transition (`grid-template-rows` + `opacity`)

This was added to create a smooth intro expansion and avoid hydration mismatch.

### Feed data fetching still starts immediately

`useSWRInfinite(...)` is still instantiated on initial render. There is no explicit fetch delay introduced in the data request path.

Interpretation: perceived slowness is likely UI-phase churn/reflow/animation timing rather than network delay.

### Slop mode also rehydrates after mount

In `apps/web/src/lib/slop-mode.tsx`:

- provider defaults `enabled = true`
- then post-mount `queueMicrotask` updates from localStorage

This adds another global post-hydration state update and repaint potential.

## Findings / Hypotheses

1. **Primary contributor:** intro timing + animation sequence makes first stable layout appear later.
2. **Secondary contributor:** post-mount slop-mode reconciliation can trigger an extra repaint across header/feed surfaces.
3. **Not primary:** SWR fetch start itself does not appear intentionally delayed.

## Requested Simplification Target

From product direction:

- Remove timing/animation complexity.
- Skeleton loader can show immediately.
- Intro should appear as soon as the page runs (no animation required).

## Simplification Options

### Option A: Minimal feed simplification (recommended first)

- Replace `IntroPhase` with boolean `showIntro`.
- Keep hydration-safe default `showIntro = false`.
- On mount, read `slop:feedIntroDismissed` and set `showIntro` immediately (no rAF/transition classes).
- Remove animated wrapper classes around intro.
- Keep existing reset behavior, set `showIntro(true)` directly.

Pros:
- Matches requested behavior exactly.
- Minimal change set.
- Keeps hydration fix intact.

Cons:
- Still has one post-hydration state update (intro appearing), but no timing chain.

### Option B: Also simplify slop mode hydration path in same pass

- Remove timing-style microtask path from `SlopModeProvider` and use deterministic hydration-safe reconciliation with less churn.

Pros:
- Reduces extra global repaint risk.
- Better perceived first render consistency.

Cons:
- Needs careful implementation to keep lint clean (`react-hooks/set-state-in-effect`) and avoid reintroducing mismatch.

### Option C: Move localStorage-backed hydration to `useSyncExternalStore` abstraction (larger)

- Use a shared hydration-safe external-store pattern for intro visibility, display mode, and slop mode.

Pros:
- Clean long-term solution.
- Removes ad-hoc timing workarounds.

Cons:
- Bigger refactor than needed for immediate UX issue.

## Recommendation

Implement **Option A + targeted Option B**:

- Immediately remove intro timing/animation mechanics.
- Keep intro appearing as soon as hydration runs, without animation.
- Simplify/reduce slop-mode post-hydration churn if possible within same patch.

This best aligns with the current goal: restore snappy perceived loading while preserving hydration correctness.

## Risks / Watchouts

1. Reintroducing hydration mismatch if any client-only values are read during initial render.
2. Lint errors if direct `setState` in effects is reintroduced naïvely.
3. Small layout shift when intro appears post-hydration (expected and acceptable per direction).

## Verification Focus (after implementation)

1. Hard refresh `/` with `slop:feedIntroDismissed` unset and `true`.
2. Confirm no hydration warnings in console.
3. Confirm intro appears immediately after hydration, without animated expansion.
4. Confirm skeleton cards show immediately and perceived delay is reduced.
5. Confirm slop mode (`on`/`off`) does not cause obvious first-load jank.
