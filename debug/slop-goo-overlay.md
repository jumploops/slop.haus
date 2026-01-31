# Debug: Slop Goo Appears On Top Instead of Dripping Below

## Problem
The new `SlopGoo` overlay renders across the target element (and above it), instead of only appearing below the element’s bottom edge. The goo should look like it is dripping off the element, visible only underneath the bottom border.

## Hypotheses
1) **Baseline/normal offset is pointing into the element**
   - We intentionally offset the baseline inward (`grip = thickness * 0.35`). That likely pushes the blob band upward so it overlaps the element instead of hanging below it.

2) **Normal selection for “down” is incorrect for some rotations**
   - We currently pick a perpendicular normal that forces positive Y in screen space. This might not be the outward/down direction for the selected edge, causing drips to project into the card area.

3) **Overlay bounds start too high (minY includes baseline + margin)**
   - The computed bounds use `minY = min(b0, b1) - margin`, which includes blur/thickness margin above the baseline. This can render the goo above the card even if the baseline is correct.

4) **Attach range spans the full edge, including corners that angle upward**
   - If the downmost edge is skewed, the segment near the higher corner may place blobs above the element’s border. Pooling/bias could also exaggerate overlap.

5) **Goo filter expansion + blur expands upward into the card**
   - The SVG filter region is oversized (`x/y = -50%`, `width/height = 200%`), and blur/threshold can visually expand upward, making it look like the goo sits on top.

## Notes / Next Checks
- Compare the baseline position against the element’s actual bottom edge in viewport.
- Try moving the baseline *down* (outward) by `thickness` instead of inward.
- Clamp the overlay’s top bound to the baseline (or slightly below) so nothing renders above the edge.
- Visual debug: draw the baseline line without filter to confirm alignment.
