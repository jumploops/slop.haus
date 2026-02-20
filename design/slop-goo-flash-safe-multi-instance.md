# Slop Goo Flash-Safe Multi-Instance Design

**Status:** Draft  
**Date:** 2026-02-20

## Goal
Keep intro/decorative slop goo effects while eliminating the dark-mode hover/de-hover background flash.

## New Confirmed Findings

1. Card-local mitigations did not remove the flash:
   - inner wrapper transform off
   - hover shadow/transition churn reduced
   - card goo disabled/kept mounted
2. Page-level toggles did remove the flash:
   - `debugNoFeedIntroGoo=1`
   - `debugHideFeedIntro=1`
   - `debugHideFeedIntro=1&debugNoSlopFeedSpacing=1`

Working inference: the persistent feed intro goo layer is the key trigger/amplifier, likely due to global filtered layering/compositing interaction with hovered card effects.

## Design Constraints

1. Keep intro slop goo in slop mode.
2. Support multiple goo instances without global visual side effects.
3. No dark-mode background flash on card hover/de-hover.
4. Keep implementation maintainable and explicit (avoid fragile browser hacks).

## Candidate Approaches

## Option A: Scope Ambient Goo To Local Layer (Recommended)
- Render intro/decorative goo in a local stacking context (inline), not as a body-level portal.
- Keep interactive card goo behavior separate.
- Avoid negative `z-index` for ambient goo; instead use local container ordering (`relative` + `isolate` + explicit child z).

Pros:
- Reduces global compositor interaction.
- Preserves intro goo visuals.
- Clear mental model: ambient goo is section-local, not page-global.

Cons:
- Requires `SlopGoo` render-mode support (portal vs inline).
- Requires auditing each ambient usage.

## Option B: Keep Portal But Split Dedicated Goo Layers
- Keep portal rendering, but mount ambient and interactive goo into separate fixed layer roots with explicit z-order and no negative z-index.

Pros:
- Smaller API shift than full inline mode.
- Centralized layering rules.

Cons:
- Still global layers; may not fully eliminate compositor side effects.

## Option C: Ambient Goo “Lite” Filter Profile
- For intro/decorative goo, reduce filter complexity:
  - disable displacement/turbulence animation
  - smaller filter region/padding
  - optional static blob mode

Pros:
- Lowers rendering pressure.
- Can be combined with A or B.

Cons:
- May not solve root cause alone.
- Slight visual downgrade.

## Option D: Interaction Arbitration Fallback
- Temporarily hide/pause ambient goo while interactive card hover goo is active.

Pros:
- High-probability safety fallback.
- Minimal rendering overlap.

Cons:
- Ambient goo continuity breaks during hover.

## Recommendation

1. Primary: **Option A + Option C**.
2. Safety fallback: **Option D** behind a temporary guard.

Rationale:
- Recent tests point to page-level ambient goo as the differentiator.
- Localizing ambient goo scope directly targets the likely root while preserving slop visuals.
- A lighter ambient profile reduces residual risk.

## Proposed Implementation Direction (No Code Yet)

1. Extend `SlopGoo` with render strategy:
   - `renderMode: "portal" | "inline"` (default portal for existing behavior).
2. For feed intro goo, use `renderMode="inline"` with a local isolated wrapper.
3. Replace negative-z ambient usage with explicit local stacking.
4. Add ambient preset for lighter filter complexity.
5. If any residual flash remains, gate `pauseAmbientDuringCardHover`.

## Verification Checklist

1. Dark mode, slop mode ON, intro visible:
   - repeated card hover/de-hover
   - no background flash
2. Light mode sanity:
   - no regressions in intro/card visuals
3. Multiple goo instances simultaneously (intro + card):
   - stable layering
   - no global tone flicker
4. Performance sanity:
   - no major frame spikes during hover

## Open Questions

1. Do we want ambient goo to remain animated, or is static goo acceptable?
2. Should all non-interactive goo migrate to inline/local rendering by default?
3. Is temporary ambient pause during card hover acceptable if needed for stability?
