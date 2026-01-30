# Phase 5 — Edge Treatments

**Status:** Won't Do  
**Goal:** Introduce subtle “imperfect” edges on key surfaces without harming layout or interaction.

## Targets
- Feed intro card
- Project cards (header edges)
- Section headers on project detail

## Proposed Changes (Not Implemented)
1. **Wobbly outline**: slight irregular border via SVG mask or clip‑path.
2. **Torn edge accents**: apply only to top edges of select sections (not all cards).
3. **Offset inner frame**: light inner stroke to add depth without noise.

## Files to Change
- `apps/web/src/app/page.tsx`
- `apps/web/src/components/project/ProjectCard.tsx`
- `apps/web/src/components/project/ProjectDetails.tsx`
- `apps/web/src/app/globals.css` (utilities for edge masks)

## Implementation Notes
- Prefer small edge effects over full masks to reduce complexity.
- Keep effects static (no animation).
- Guard behind Slop Mode.

## Verification Checklist (Not Run)
- No overflow issues or content clipping.
- Works in both list and grid card variants.
- Edge treatments don’t break focus rings.
