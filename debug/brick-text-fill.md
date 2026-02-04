# Debug: Brick Text Fill Feasibility + Options

## Problem
The current CSS-only brick fill doesn't read as a proper running-bond brick wall inside the small "haus" text. The bricks appear stacked and too coarse for the font size. We need a more convincing brick pattern (offset rows) at small sizes, or an alternative technique that yields a readable brick texture in text.

## Constraints
- "haus" is rendered at small sizes in header and mobile nav.
- Must work inside text (background-clip: text) without SVG/Canvas unless approved.
- Tailwind v4 utilities; prefer semantic tokens, no raw palette classes.

## Investigation Notes
- Running-bond brick patterns require **staggered rows**: every other row shifts by half a brick.
- CSS gradients can approximate this, but are **scale-sensitive**. At small font sizes, mortar lines become too thick or alias.
- Using a single background layer with a repeating pattern makes row offsets hard unless you adjust the pattern tile height to 2 rows and offset the vertical mortar layer by one row.
- Even with proper math, the pattern can look "grid-like" due to low pixel density at small sizes.

## CSS-Only Option (Background-Clip)
**Feasibility:** Possible, but finicky at small sizes. Needs very small bricks + subpixel mortar lines.

### Approach
- Use a 2-row tile for vertical mortar lines:
  - Even row lines aligned to x=0.
  - Odd row lines aligned to x=brick/2 and y=brick height.
- Use a horizontal mortar line every row.
- Use a subtle noise/tarnish overlay to reduce "flat grid" look.

### Potential Issues
- **Subpixel mortar** may blur inconsistently across browsers.
- Small text sizes reduce legibility of the pattern.
- Dark mode contrast needs testing.

## Alternative Options

### 1) SVG pattern fill (recommended for fidelity)
**Pros:** Crisp scaling, true running-bond pattern, easy control of brick/mortar ratio.
**Cons:** More markup and SVG usage, needs text-as-SVG or mask.

- Use an SVG <pattern> with running bond brick rectangles.
- Apply as `fill="url(#brick)"` and optionally `stroke` for readability.
- Can embed the SVG as a data URL background and still use background-clip: text.

### 2) Inline SVG mask on the text
**Pros:** Best control; can apply a mask to an SVG rectangle filled with brick pattern.
**Cons:** More complex markup and a11y considerations.

### 3) Background image (SVG data URI)
**Pros:** Simple usage with `background-clip: text` and no extra markup.
**Cons:** Harder to tweak without regenerating the SVG string.

### 4) Canvas-generated texture
**Pros:** Procedural control and scaling.
**Cons:** JS dependency, more complexity, potential hydration issues in Next.js.

## Recommendation
Given the small font size, **SVG pattern fill** (as background image or inline SVG) is the most reliable path to a convincing brick effect. If CSS-only is a hard requirement, we should accept a simpler texture (brick-like stripes) rather than perfect running bond.

## Next Steps / Questions
- Are we open to an SVG-based background image (data URI) applied via CSS?
- Is a subtle brick texture acceptable instead of a perfect running-bond pattern?
- Should we increase the "haus" size slightly to improve pattern readability?

## Hypotheses: White "Bricks" Showing Up
- The SVG includes a **tarnish gradient** with white highlights that can read as white bricks at small sizes (the `#fff` stops + overlay opacity).
- **Mortar color fills the full tile** background, and with tiny bricks, the mortar area dominates, making some bricks appear washed out.
- **Subpixel scaling** (background-size) causes the brick rectangles to blur or snap to pixel boundaries, producing alternating lighter rows.
- **Color management / antialiasing** on the clipped text could lighten some bricks, especially where glyph curves thin the pattern.
