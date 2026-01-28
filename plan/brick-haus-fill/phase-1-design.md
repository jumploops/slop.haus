# Phase 1: Design Tokens + CSS Variables

## Status
Completed

## Tasks
- Define brick pattern variables (brick color, mortar color, brick width/height, mortar gap) in `apps/web/src/app/globals.css`.
- Create a utility class in CSS (or Tailwind layer) that applies background-clip: text with the brick pattern.
- Ensure values are tuned for small display sizes (header + mobile nav).

## Files
- `apps/web/src/app/globals.css`

## Code Notes
- Prefer CSS variables for easy tweaking.
- Keep the pattern scale small enough to show 2–3 bricks across the word “haus”.

## Verification
- Pattern visible in a quick local render.
