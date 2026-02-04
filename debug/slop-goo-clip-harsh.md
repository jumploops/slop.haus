# Debug: Harsh Clip on Slop Goo Edge

## Problem
The goo is clipped sharply at the baseline, which reads as a hard cutoff rather than a viscous surface. We want the goo to appear to *collect* at the bottom edge and drip from there, without a hard clip line.

## Hypotheses / Options
1) **Baseline is too close to the edge, forcing a hard cut**
   - Because we clip exactly at the baseline line, any bead/blob that crosses upward gets sliced. If we move the baseline *downward* (outside the card) and allow the goo to collect slightly below the border, the cutoff will be less visible.

2) **Clip approach should be replaced with geometry that never crosses the edge**
   - Instead of clipping, generate blobs only on the "down" side: push all bead centers along the downward normal by at least `thickness * k`, and avoid any negative offset. This keeps the goo fully below the edge and removes the need for clipping.

3) **Add a "lip" band to hide the seam**
   - Draw a thin, flat band (or rectangle) aligned with the edge to act as the paint lip, and let the goo originate slightly below it. This makes the top appear flat without a harsh clip.

4) **Clip mask should be softened with blur or gradient**
   - Use a mask with a small vertical gradient (e.g., feathered alpha from 100% to 0% over 2–4px) so the top edge fades rather than cuts. This can be done via SVG mask or a secondary filter stage.

5) **Render goo behind the card and allow overflow**
   - Remove clipping entirely and rely on z-index + card background to occlude the upper overlap. This only works if the card background is fully opaque and no transparency reveals the overlap.

## Next Checks
- Test shifting baseline outward by 4–8px and removing the clip to see if the card hides the overlap.
- Try a "lip" stroke aligned to the edge to hide any seam.
- If clipping stays, prototype a gradient mask to soften the cutoff.
