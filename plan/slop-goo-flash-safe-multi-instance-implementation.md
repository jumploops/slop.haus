# Slop Goo Flash-Safe Multi-Instance - Implementation Plan

**Status:** Completed  
**Date:** 2026-02-20  
**Design Input:** `design/slop-goo-flash-safe-multi-instance.md`  
**Debug Inputs:**  
`debug/dark-mode-hover-flash-post-refactor.md`  
`debug/dark-mode-feed-hover-background-shift.md`

## Objective
Preserve intro/ambient slop goo visuals while eliminating dark-mode hover/de-hover background flash on the feed.

## Confirmed Findings
1. Card-local mitigations did not remove the flash:
   - inner wrapper transform off
   - reduced hover churn
   - card goo disabled/kept mounted
2. Page-level intro toggles removed the flash:
   - `debugNoFeedIntroGoo=1`
   - `debugHideFeedIntro=1`
   - `debugHideFeedIntro=1&debugNoSlopFeedSpacing=1`
3. Working conclusion: persistent ambient intro goo layering is the dominant trigger branch.

## Decision
Implement ambient goo isolation and profile split:
1. Ambient/decorative goo uses **local inline rendering** (not `document.body` portal).
2. Ambient goo uses a lighter filter profile by default.
3. Interactive card goo keeps portal behavior unless a follow-up proves otherwise.
4. Avoid negative z-index for ambient goo; use local isolated stacking.
5. Keep a fallback path to pause ambient goo during card hover if needed.

## Scope
1. Feed intro goo instance.
2. Shared `SlopGoo` component API and rendering behavior.
3. Validation for dark/light mode and slop on/off.
4. Cleanup of temporary debug toggles after validation.

## Non-Goals
1. Full slop visual redesign.
2. Reworking all goo usages outside feed unless required.
3. Theme token re-architecture.

## Files Expected To Change
1. `apps/web/src/components/slop/SlopGoo.tsx`
2. `apps/web/src/app/page.tsx`
3. `apps/web/src/components/project/ProjectCard.tsx` (only if fallback arbitration is needed)
4. `debug/dark-mode-hover-flash-post-refactor.md` (result update)

## Phase Plan

## Phase 1 - SlopGoo Render-Mode API
**Status:** Completed

Tasks:
1. Add `renderMode?: "portal" | "inline"` to `SlopGoo` (default `"portal"`).
2. Keep existing portal behavior unchanged for current call sites.
3. Return inline SVG container when `renderMode="inline"` (no `createPortal`).
4. Ensure geometry and positioning logic work in both modes.

Implementation sketch:
```tsx
return renderMode === "inline" ? svg : createPortal(svg, document.body);
```

## Phase 2 - Feed Intro Ambient Migration
**Status:** Completed

Tasks:
1. Render feed intro goo with `renderMode="inline"`.
2. Replace ambient negative-z layering with local isolated stacking:
   - parent `relative isolate`
   - intro content layer explicit `z`
   - goo layer explicit lower `z` in same local context
3. Preserve current visual placement and slop style intent.

## Phase 3 - Ambient Filter Profile Split
**Status:** Completed

Tasks:
1. Introduce an ambient profile (lighter than interactive):
   - reduced/no displacement animation
   - smaller filter region cost
   - conservative blur/threshold defaults
2. Keep interactive profile unchanged unless validation requires tuning.
3. Ensure ambient profile remains visually acceptable in dark and light themes.

## Phase 4 - Optional Hover Arbitration Fallback
**Status:** Not Needed

Trigger condition:
1. Run only if flash remains after Phases 1-3.

Tasks:
1. Add a minimal runtime mechanism to pause/hide ambient goo while any project card is hovered.
2. Keep this as a narrowly scoped fallback, not default behavior unless needed.

## Phase 5 - Cleanup Debug Paths
**Status:** Completed

Tasks:
1. Remove temporary investigation flags once the final behavior is confirmed:
   - `debugNoInnerCardTransform`
   - `debugNoCardHoverChurn`
   - `debugNoGooRender`
   - `debugKeepGooMounted`
   - `debugNoFeedIntroGoo`
   - `debugHideFeedIntro`
   - `debugNoSlopFeedSpacing`
2. Keep only intentional production behavior code.
3. Update debug docs with final outcomes.

## Phase 6 - Validation + Signoff
**Status:** Completed

Validation checklist:
1. Dark mode + slop mode ON + intro visible:
   - repeated hover enter/leave on multiple cards
   - no background flash
2. Light mode + slop mode ON:
   - no visual regressions
3. Slop mode OFF:
   - unchanged behavior
4. Multiple goo instances (intro + card):
   - stable layering and no global tone flicker
5. Build/type checks:
   - `pnpm -F @slop/web exec tsc --noEmit`
   - `pnpm -F @slop/web build`

## Implementation Notes (2026-02-20)
1. `SlopGoo` now supports:
   - `renderMode?: "portal" | "inline"` (default portal)
   - `displacementScale?: number`
   - `animateNoise?: boolean`
2. Feed intro goo now uses:
   - `renderMode="inline"`
   - local isolated container layering (no negative z-index)
   - lighter ambient profile (`displacementScale={0}`, `animateNoise={false}`, lower goo intensity settings)
3. Interactive card goo remains on portal mode.
4. Local checks completed:
   - `pnpm -F @slop/web exec tsc --noEmit` (pass)
   - `pnpm -F @slop/web build` (pass)
5. Temporary debug toggles were removed after validation from:
   - `apps/web/src/components/project/ProjectCard.tsx`
   - `apps/web/src/app/page.tsx`
6. User validation confirmed baseline (`http://localhost:3000`, no flags) no longer flashes on hover/de-hover in dark mode with intro visible.

## Acceptance Criteria
1. Flash is not observable in dark-mode hover/de-hover with intro goo enabled.
2. Intro goo remains present and visually coherent.
3. No interaction regressions on project cards.
4. Temporary debug toggles are removed after signoff.

## Risks
1. Inline ambient goo may clip if container overflow changes.
2. Layering order issues (goo above content) if z-index contracts are unclear.
3. Too-aggressive ambient simplification may hurt visual quality.

## Rollback Strategy
1. Temporary safe fallback: disable intro goo in dark mode only.
2. Revert to previous stable behavior while keeping debug instrumentation for diagnosis.
3. Re-run validation matrix before re-introducing ambient goo changes.

## Open Questions
1. Should all future non-interactive goo default to `renderMode="inline"`?
2. Is static ambient goo acceptable if animation contributes to instability?
3. Should hover arbitration ship as a guarded fallback or remain debug-only?
