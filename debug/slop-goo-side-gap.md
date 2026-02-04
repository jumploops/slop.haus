# Debug: Slop Goo Leaves Side Gaps

## Problem
In all list/grid variants, the goo does not reach the full left/right edges of the card. There is visible spacing on both sides, so the drip band looks inset rather than flush with the card’s width.

## Hypotheses
1) **Attach range is intentionally inset**
   - `attach={{ start: 0.08, end: 0.96 }}` trims ~8% off each side. This was chosen to avoid corners but now creates visible gaps.

2) **Grip offset + blur margin reduce visible span**
   - We offset the baseline inward by `grip = thickness * 0.35` and expand bounds by `margin = max(blur*3, thickness*2, 24)`. The clip may be correct, but the goo’s visible silhouette could still shrink from blur/threshold and look narrower.

3) **Edge selection is correct but bead spacing/placement leaves dead space at ends**
   - Bead placement uses `beadCount = floor(segLen / beadSpacing)` and samples `t` with jitter; the endpoints may not place visible blobs exactly at `t=0` or `t=1`, leaving end gaps.

4) **Baseline stroke is thinner than perceived card width**
   - The line stroke uses `strokeLinecap="round"` and the filter merges it with beads, but the ends still appear rounded and inset, especially with clipping.

5) **Card’s visual width differs from geometric width**
   - Borders, pseudo‑elements (tape/chrome), and transforms might visually extend beyond the measured quad, making the goo look short even if it matches the element’s true bounding box.

## Next Checks
- Temporarily set attach to `{ start: 0, end: 1 }` to confirm if gaps disappear.
- Force beads at `t=0` and `t=1` to see if end caps fix the gap.
- Compare baseline endpoints to actual card edges with a debug line or overlay.
