# Slop Drip Left-Edge Issue Investigation

**Status:** Draft  
**Date:** 2026-01-30

## Problem
Drip masks are still visibly starting at the left edge of each card, even after adding a random `mask-position` offset.

## Current Implementation

### Hook + Mask Generator
`apps/web/src/lib/slop-drip.ts`
- Mask shape is a full-width path with a baseline fill across the top of the mask.
- Mask is applied via CSS variables `--slop-mask` and `--slop-depth`.
- Random horizontal offset is applied via `--slop-mask-x` using a seeded PRNG.

### CSS
`apps/web/src/app/globals.css`
- `.slop-drip::after` uses `background: var(--slop-drip-fill, var(--slop-green))`.
- Mask size is `140% 100%` and mask position is `var(--slop-mask-x, 0%) 0%`.
- Mask repeats are disabled (`no-repeat`).

### Usage
`apps/web/src/components/project/ProjectCard.tsx`
- Each card sets a seed derived from `slopIndex`.
- `baseline: 0.12`, `maxExtra: 0.9`, `roughness: 0.08`, `dripCount` varies per card.
- `.slop-drip` class is added only when Slop Mode is on.

## Updated Findings (Drip Mask Debug)
- `::after` shows `mask-position` correctly (e.g., `-webkit-mask-position-x: 81%`), but the drip still appears left‑anchored.
- The drip silhouette appears **perfectly horizontal** even when the card is rotated, suggesting the pseudo‑element/mask is not inheriting the expected transform.
- This indicates the issue is **not** simply missing CSS variables; the mask is set but the geometry still starts at the left edge.
- Switching to a **segmented mask** (discrete drip islands) still did not eliminate the left‑anchored look.
- Random `mask-position` offsets did not produce visible positional variation.

## Top Hypotheses
1. **Baseline fill guarantees left edge paint**
   - The SVG path always draws a full-width top edge (baseline), so even with offset the silhouette still includes the left boundary.
2. **Mask offset is applied, but still covers full width**
   - With `mask-size: 140%`, the mask may still cover the left edge even after shifting, so the leftmost part remains painted.
3. **The mask is not actually shifting**
   - CSS custom property may not be applied as expected (e.g., defaulting to `0%`).
4. **Drip path is too continuous**
   - The mask path is a closed polygon; it does not have "gaps" (always full-width). Even with random drips, it remains connected at the top.
5. **Shadow makes left edge more obvious**
   - The drop-shadow under the drip may be emphasizing the left boundary.

## Debug Ideas (No Code Changes Yet)
- Inspect computed styles for `--slop-mask-x` and `mask-position` on a live card.
- Temporarily set `baseline: 0` to see if the left edge disappears.
- Temporarily remove `filter: drop-shadow(...)` to check if the shadow is the main culprit.
- Visualize the mask alone by setting a solid contrasting fill color (e.g., red).

## Inspection Steps (DevTools)
1. Open the feed page with Slop Mode ON.
2. Inspect a project card element with the `.slop-drip` class.
3. In the **Styles** panel, confirm the element has `--slop-mask` and `--slop-mask-x` set inline.
4. In **Computed**, verify `mask-position` (or `-webkit-mask-position`) reflects the variable value.
5. Temporarily override `--slop-mask-x` to `50%` and `90%` to see if the left edge changes.
6. Temporarily override `--slop-mask` with `none` to confirm the mask is the source of the shape.
7. Toggle the `filter: drop-shadow(...)` off to see if the edge prominence is shadow‑related.

## Candidate Fix Directions (After Confirmation)
- Use a **partial mask** that only paints *some* bottom segments rather than the full width.
- Reduce or remove the baseline fill so drips start only where bumps exist.
- Apply a **random `mask-position` + `mask-size`** that can leave gaps at the edges.
- Create multiple smaller masks and layer them instead of a single full-width mask.
- Consider abandoning masks for **absolute‑positioned drip blobs** under each card (no mask, true random placement).
