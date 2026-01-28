# Marquee Construction Stripes (Option 3 – SVG Background Tile)

## Overview
Add three diagonal white "construction" stripes by applying an SVG background tile to the **marquee wrapper** (the animated element). This keeps stripes and text moving together.

## Implementation Spec

### Target Element
- `apps/web/src/app/layout.tsx`
  - The element with `animate-[marquee_20s_linear_infinite]` and `whitespace-nowrap` is the **marquee wrapper**.
  - Apply the SVG background tile to this element so stripes are part of the same moving layer.

### SVG Tile Strategy
- Use an SVG data URI with **three diagonal white bars** over transparent background.
- The tile should be wide enough to avoid visually obvious repetition across the marquee loop.
- The SVG should be defined in CSS (e.g., a `--marquee-stripes-svg` variable in `apps/web/src/app/globals.css`).
- Apply via `background-image: var(--marquee-stripes-svg);` and tune with `background-size`, `background-position`, and `background-repeat`.

### CSS Placement
- Add the tile in `apps/web/src/app/globals.css` under `:root` (and `.dark` if needed).
- Add a small utility class in `@layer utilities` (e.g., `.marquee-stripes`) to apply the background to the marquee wrapper.
- Keep all colors semantic: white bars via explicit white in the SVG (#ffffff) is acceptable since it’s a pattern; background remains the existing `bg-slop-orange`.

## Edge Cases / Things to Watch
- **Animation sync:** The background must be on the same element that is moving (`animate-[marquee_*]`) so stripes move with the text.
- **Repetition seams:** If the tile is too small, seams may be obvious. Increase tile width or adjust background-size.
- **Subpixel aliasing:** Thin diagonal lines can shimmer. Use slightly thicker stripes (e.g., 3–5px at 1x) or soften edges.
- **Line height / banner height:** The stripes should span the full banner height; ensure the SVG viewBox height matches the banner’s vertical space.
- **Dark mode:** If the banner color changes in dark mode later, the white stripes must still have contrast.
- **Performance:** Avoid huge SVG strings; keep the tile reasonable and rely on repetition.

## Verification Checklist
- Stripes span top-to-bottom of the banner and are angled.
- Exactly three stripes are visible per tile; overall pattern looks intentional.
- Stripes move with the text; no sliding mismatch.
- No visible seams or jitter on common DPI displays.
