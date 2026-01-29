# Marquee Banner Jitter Investigation

**Status:** Draft  
**Date:** 2026-01-28

## Problem
The construction banner marquee occasionally stutters/jitters when the animation loops. This occurs in non‑HMR settings, suggesting a real runtime/rendering issue rather than dev tooling.

## Current Implementation
**Markup:** `apps/web/src/app/layout.tsx`
- Wrapper: `div.bg-construction-yellow.overflow-hidden.construction-banner-text`
- Marquee track: `div.animate-[marquee_20s_linear_infinite].flex.whitespace-nowrap`
- Items: 10 repeated `span.marquee-stripes` with `ml-4 mr-4 pl-24` and alternating text.

**CSS:** `apps/web/src/app/globals.css`
- `.marquee-stripes` uses a left‑anchored background graphic.
- `@keyframes marquee` translates the track from `0` to `-50%` and loops.

## Observations / Notes
- The track is a single flex row (not duplicated content). The loop assumes the content is effectively “tileable” at 50% shift.
- Spacing is driven by a mix of `ml-4`, `mr-4`, and `pl-24` per item.
- The text and stripe background are not fixed‑width elements; width depends on text length + font metrics.

## Top Hypotheses
1. **Non‑seamless track length**: The total width of the repeated spans is not exactly 2× the viewport width (or otherwise not aligned to the `-50%` loop), causing a jump when the animation resets.
2. **Variable item widths**: Alternating text lengths (“UNDER CONSTRUCTION” vs “PARDON OUR SLOP”) create uneven spacing. When the loop restarts at `-50%`, the next frame doesn’t match the start frame.
3. **Margins + padding create fractional pixel offsets**: `ml-4`, `mr-4`, and `pl-24` can lead to a track width that results in sub‑pixel rounding. The reset introduces a 1‑px snap.
4. **GPU layer/transform resampling**: The animated element is transformed continuously; without `will-change: transform` or a more stable sub‑pixel strategy, the compositor may snap on the loop boundary.
5. **Animation length vs content length mismatch**: The track is not built as a true “infinite” loop (e.g., two identical sets). The `-50%` assumption only works if the track is exactly two identical halves.

## Debug Ideas (No Code Changes Yet)
- Measure the rendered width of the marquee track vs viewport at runtime to see if 50% translation truly lines up.
- Temporarily set `outline: 1px solid red` on the marquee track to visually spot the jump.
- Confirm if jitter coincides exactly with animation loop boundary (every 20s).

## Candidate Fix Directions (To Consider After Confirmation)
- Duplicate the marquee content (two identical sequences) and animate from `0` to `-50%` only if the track is exactly 2× length.
- Normalize item widths (fixed width or consistent padding) to make the sequence tileable.
- Remove left/right margins in favor of `gap` on the flex container to reduce fractional offsets.
- Set explicit `will-change: transform` and `translate3d` to reduce compositor snapping.

