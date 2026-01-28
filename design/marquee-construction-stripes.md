# Marquee Construction Stripes – Design Options

## Existing Implementation (Code Review)
- The banner lives in `apps/web/src/app/layout.tsx` as a top bar with `bg-slop-orange`.
- Inside it, a single inner wrapper uses `animate-[marquee_20s_linear_infinite]` and `flex whitespace-nowrap` to scroll repeated text.
- The marquee animation is defined in `apps/web/src/app/globals.css` (and also in `apps/web/src/styles/animations.css`).
- The text is repeated with `Array.from({ length: 10 })` and each item is a `span` containing `UNDER CONSTRUCTION * PARDON OUR SLOP *`.

## Goal
Add three angled white lines (construction‑sign style) that span from bottom to top of the orange banner and **move/animate together with the marquee text**.

## Options (2–5)

### 1) Background Gradient Stripes on the Marquee Wrapper (Single Element)
- Add a `background-image` with multiple `linear-gradient()` layers that draw three diagonal white bars, applied to the *same element* that is animated with the marquee.
- This guarantees the stripes and text move in sync because they share the same moving element.
- Pros: minimal markup changes, easy to tune bar angle/width.
- Cons: gradient math can be finicky; stripes repeat as part of the background tile.

### 2) Add Three Absolutely Positioned Stripe Spans Inside Each Marquee Item
- Wrap each marquee text item in a `relative` container and add three `span`s with `absolute` positioning, full banner height, and a rotated `bg-white` rectangle.
- The container itself participates in the marquee, so stripes move with text.
- Pros: straightforward control of stripe count/angle/spacing; easy to tweak widths.
- Cons: more DOM nodes (3 extra spans per repeated item).

### 3) SVG Background Tile Applied to the Marquee Wrapper
- Use an SVG data URI that draws three diagonal white bars across a transparent tile, then apply it as a background to the marquee wrapper.
- The wrapper animates, so the bars move with the text.
- Pros: crisp lines at all scales; easier precise control of angles and spacing.
- Cons: data URI maintenance; must ensure tile size aligns with text repetition.

### 4) Replace Each Marquee Item with a Small Inline SVG Group
- Each repeated item becomes an inline SVG containing the text plus three diagonal bars behind it; the marquee then scrolls these SVGs.
- Pros: best control; consistent rendering.
- Cons: heavier markup and potential font rendering differences inside SVG.

### 5) Dedicated Marquee “Track” Element
- Create a `div` track that contains the text plus a separate stripe layer (either pseudo‑element or gradient) inside the same track.
- The track is the animated element; stripes and text move together.
- Pros: clean separation of banner vs. track; easy to keep stripes synced.
- Cons: requires refactor of current markup.

## Recommendation (If Choosing Quickly)
Option 1 or 5 for simplest implementation with synchronized motion. Option 3 if we want perfectly uniform lines and easier control over exact angles.
