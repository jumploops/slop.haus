# SlopGoo Flat Edge Issue (Intro Header)

## Problem
When trying to make the goo edge “flat” for the intro header, we saw the flat edge appear on the left side instead of the top. We reverted the experimental polygon mask and are stepping back to analyze.

## Current Usage Context
### Base Component (`SlopGoo`)
- Uses a linear gradient mask aligned to the downmost edge’s normal.
- `edgeFeather` controls softness by shifting the gradient along the normal.
- Mask is applied to the entire SVG group; no dedicated hard clip for top edge.

### Project Cards
- `SlopGoo` is attached to the card’s downmost edge (via `getElementQuad` + `pickDownmostEdge`).
- Uses small rotation and a nonzero `edgeFeather` for a soft but “flat-ish” top.
- Positioned with `borderOffset`/`edgeOffset` and card rotation props.

### Intro Header ("Confess your slop")
- Same `SlopGoo`, different target element and layout.
- `edgeFeather=0` removes mask softness, but does not enforce a flat clip.
- The header rotation and a negative z-index add more stacking/clip complexity.

## Hypotheses (3–5)
1. **Edge normal is misinterpreted for rotated elements**
   - `pickDownmostEdge` might return the expected edge, but the normal vector used for the mask could align incorrectly when the element is rotated.
   - Fix: verify computed edge + normal for rotated intro header; add debug overlay or log edge vectors.

2. **Mask gradient uses the wrong sign for “inward” direction**
   - If the inward normal is flipped, the mask fades in the wrong direction, making the flat edge appear on the side.
   - Fix: validate `edge.nIn` orientation from `pickDownmostEdge` and compare across cards vs intro.

3. **`edgeFeather=0` is not a hard clip, it’s “fully opaque”**
   - With feather = 0, the mask doesn’t remove any top geometry; the goo stroke remains visible above the border.
   - Fix: implement an explicit hard clip for the top edge (mask polygon/clipPath aligned to edge normal).

4. **Intro header geometry uses absolute coordinates with scroll offsets**
   - For non-fixed elements, quad points are shifted by scroll offsets. If the portal’s coordinate space doesn’t match, the mask/edge can shift laterally.
   - Fix: verify `left/top` and portal positioning for the intro header; compare to cards.

5. **z-index and stacking context make the edge read “wrong”**
   - The goo is rendered in a portal; negative z-index combined with header transforms could visually place the goo edge against a different side.
   - Fix: test with zIndex 0/1 and a controlled stacking context before adjusting edge math.

## Next Steps
- Add temporary debug visualizations of the computed edge, normal, and mask gradient direction.
- Compare computed edge/normal for a project card vs the intro header to confirm orientation.
- If orientation is correct, implement a hard clip option that respects the edge normal.
