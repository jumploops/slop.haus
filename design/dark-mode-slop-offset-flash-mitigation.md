# Dark Mode Slop Offset Flash Mitigation

**Status:** Draft  
**Date:** 2026-02-20

## Goal
Keep the intentional “sloppy” card feel while eliminating the brief background flash seen in dark mode during hover enter/leave in production builds.

## Confirmed Findings

1. The transient appears in dark mode only.
2. The transient occurs on both hover enter and hover leave, then settles.
3. It reproduces in production builds, not dev.
4. Disabling goo render does not remove it.
5. Disabling slop card offsets removes it.

Working conclusion: the core trigger is the slop offset transform treatment on the card container in dark mode (likely compositor/AA interaction), not goo/filter/prefetch/blend-specific logic.

## Design Constraints

1. Preserve “sloppy at rest” visual character.
2. Avoid dark-mode production flash/regression.
3. Keep implementation understandable and easy to tune.
4. Minimize layout risk and avoid new hover jank.

## Candidate Approaches

## Option A: Disable Offset Transforms In Dark Mode
- Keep current offsets in light mode.
- Remove `slopClass` rotate/translate in dark mode.

Pros:
- Lowest risk.
- Fastest path to stability.

Cons:
- Visual inconsistency between themes.
- Loses some slop personality in dark mode.

## Option B: Replace Outer Card Transform With Inner Visual Transform
- Keep outer `<article>` axis-aligned.
- Apply slop transform only to an inner visual wrapper (content/chrome), not the container that interacts with page background.

Pros:
- Preserves slop feel.
- Reduces page-level compositing side effects from transformed card shell.

Cons:
- Moderate refactor in card markup and layering.
- Needs careful z-index/pointer-events handling.

## Option C: Keep Offsets But Snap To Safer Values
- Reduce fractional rotations/translations.
- Use integer pixel offsets and smaller/quantized angles.

Pros:
- Minimal structural change.
- May reduce AA/compositing artifacts.

Cons:
- Not guaranteed to fix flash.
- Still relies on transformed outer shell.

## Option D: Keep Current Offsets + Force Stable Layering
- Add explicit compositing hints (`isolation`, `contain`, possibly `will-change`) on card surfaces.

Pros:
- Small CSS changes.
- Can improve compositor stability.

Cons:
- Browser-dependent results.
- Risk of increased memory/paint cost if overused.

## Option E: Keep Container Stable, Move “Slop” To Decorative Layers
- No transform on card shell.
- Use rotated badges/stickers/pseudo-elements/edge accents for crooked feel.

Pros:
- Strong visual control with less layout/compositor risk.
- Theme-consistent.

Cons:
- Larger design refactor.
- More bespoke decorative rules.

## Recommendation

1. Primary path: **Option B**.
2. Safety fallback: **Option A** (dark-mode-specific disable) behind a feature flag.
3. Optional polish: combine **B + small D** (`isolation`/`contain`) if needed after validation.

Rationale:
- B keeps the desired slop behavior while targeting the likely technical trigger (outer transformed shell affecting background compositing).
- A gives a safe rollback if B is not fully clean.

## Proposed Implementation Plan (No Code Yet)

1. Introduce a stable outer card shell without slop transform.
2. Add an inner wrapper that receives slop offset classes.
3. Keep hover handling/events on outer shell.
4. Ensure goo attachment targets the stable shell edge unless visual alignment requires otherwise.
5. Validate dark-mode production behavior.
6. If any residual flash remains, add conservative `isolation`/`contain` on the transformed inner wrapper.
7. If still unresolved, temporarily disable dark-mode offsets and iterate on decorative slop alternatives.

## Verification Checklist

1. Dark mode, production build, repeated hover enter/leave on multiple cards: no flash.
2. Light mode visual behavior remains acceptable.
3. Slop mode off remains unchanged.
4. Grid/list variants both validated.
5. No new layout shift or pointer-target regressions.

## Open Questions

1. Is slight light/dark style divergence acceptable if fallback A is needed?
2. Should the goo anchor to the outer shell (stability) or transformed inner wrapper (visual alignment)?
3. Do we want a permanent dark-mode-specific slop preset (smaller angles/offsets)?
