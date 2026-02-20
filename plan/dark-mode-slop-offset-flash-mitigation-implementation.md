# Dark Mode Slop Offset Flash Mitigation - Implementation Plan

**Status:** In Progress (Phases 1-3 complete, Phase 4 in progress)  
**Date:** 2026-02-20  
**Design Input:** `design/dark-mode-slop-offset-flash-mitigation.md`  
**Debug Input:** `debug/dark-mode-feed-hover-background-shift.md`

## Objective
Eliminate dark-mode production hover/de-hover background flash while preserving intentional slop styling.

## Confirmed Facts
1. Flash appears only in dark mode.
2. Flash occurs on both hover enter and hover leave.
3. Flash reproduces in production builds, not dev.
4. `debugNoGooRender=1` did not remove flash.
5. `debugNoSlopOffsets=1` removed flash.

## Decision
Implement **Option B** from design:
- Keep outer card shell stable (no slop offset transform on the outer `<article>`).
- Move slop offset transforms to an inner visual wrapper.
- Keep fallback Option A available during implementation (dark-mode offset disable).

## Scope
- Feed `ProjectCard` variants (`grid`, `list-sm`, `list-lg`) in `apps/web`.
- Slop-mode visual behavior on hover and at rest.
- Related debug toggle cleanup after validation.

## Non-Goals
- Redesigning goo effect visuals.
- Broad theme-token changes.
- Admin/settings/submit restyling.

## Files Expected To Change
1. `apps/web/src/components/project/ProjectCard.tsx`
2. `apps/web/src/components/slop/SlopGoo.tsx` (debug cleanup only, if needed)
3. `apps/web/next.config.ts` (debug experiment toggle cleanup only, if needed)
4. `debug/dark-mode-feed-hover-background-shift.md` (results/status update)

## Phase Plan

## Phase 1 - Structural Refactor (Card Shell vs Visual Wrapper)
**Status:** Completed

Tasks:
1. Keep current outer `<article>` as interaction shell (hover/focus handlers, link hit-area, border behavior).
2. Introduce an inner wrapper for card visuals and apply `slopClass` there.
3. Ensure no functional regressions in clickable regions and pointer events.
4. Preserve existing variant-specific layout behavior.

Notes:
- Outer shell remains compositor-stable.
- Inner visual wrapper carries slop offset personality.

## Phase 2 - Goo/Alignment Decisions
**Status:** Completed

Tasks:
1. Keep `SlopGoo` target anchored to outer shell first (stability-first default).
2. Validate visual alignment of goo relative to transformed inner wrapper.
3. If needed, tune goo params or target strategy in a minimal way.

Decision rule:
- Prefer stability over perfect offset alignment unless misalignment is obvious.

## Phase 3 - Cleanup Debug Paths
**Status:** Completed

Tasks:
1. Remove temporary URL debug toggles that are no longer needed:
   - `debugNoGooFilter`
   - `debugNoCardHoverFx`
   - `debugNoCardPrefetch`
   - `debugNoCardBlendOverlay`
   - `debugNoGooRender`
   - `debugNoSlopOffsets`
2. Remove temporary Next config debug env toggles if no longer needed:
   - `SLOP_DEBUG_NO_LIGHTNINGCSS`
   - `SLOP_DEBUG_CSS_CHUNKING_STRICT`
   - `SLOP_DEBUG_DISABLE_OPTIMIZED_LOADING`
   - `SLOP_DEBUG_OPTIMIZE_CSS`
3. Keep only intentional production behavior code.

## Phase 4 - Validation + Signoff
**Status:** In Progress

Validation checklist:
1. Dark mode + slop mode ON + production build:
   - repeated hover enter/leave on multiple cards
   - no background flash
2. Light mode + slop mode ON:
   - slop visual quality still acceptable
3. Slop mode OFF:
   - unchanged behavior
4. All display variants:
   - `grid`, `list-sm`, `list-lg`
5. Build/type checks:
   - `pnpm -F @slop/web exec tsc --noEmit`
   - `pnpm -F @slop/web build`

## Implementation Notes (2026-02-20)
1. `ProjectCard` now uses a stable outer shell (`article`) and applies slop offsets on an inner visual wrapper for both grid/list variants.
2. `SlopGoo` remains anchored to the outer shell for stability.
3. Temporary investigation toggles were removed from:
   - `apps/web/src/components/project/ProjectCard.tsx`
   - `apps/web/src/components/slop/SlopGoo.tsx`
   - `apps/web/next.config.ts`
4. Local checks completed:
   - `pnpm -F @slop/web build` (pass)
   - `pnpm -F @slop/web exec tsc --noEmit` (pass, after build regenerated `.next/types`)

## Acceptance Criteria
1. Flash is not observable in dark mode production hover/de-hover.
2. Slop card style remains intentionally imperfect at rest.
3. No interaction regressions on card links/buttons.
4. Temporary debugging knobs are removed (or clearly gated if intentionally retained).

## Risks
1. Inner-wrapper transform may complicate layering and pointer-event behavior.
2. Goo might look slightly detached if anchored to outer shell.
3. Removing debug toggles too early can slow follow-up diagnosis.

## Rollback Strategy
If the refactor introduces regressions:
1. Enable fallback Option A quickly (disable slop offsets in dark mode only).
2. Revert to pre-refactor card structure.
3. Re-run the validation matrix before retrying.

## Open Questions
1. Should fallback Option A ship as a temporary runtime guard while B stabilizes?
2. Is minor goo alignment drift acceptable if flash is fully resolved?
