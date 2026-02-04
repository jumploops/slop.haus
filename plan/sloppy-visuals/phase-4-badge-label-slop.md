# Phase 4 — Badge + Label Slop

**Status:** Complete  
**Goal:** Make small UI labels (badges, chips, score pills) feel hand‑placed and tactile without reducing readability.

## Targets
- “New” badge on project cards
- Slop score chips (card + score widget)
- Tool tags on project detail
- Small status labels (where applicable)

## Proposed Changes
1. **Sticky‑note treatment**: add subtle skew + corner fold via pseudo‑elements.
2. **Micro‑rotation per badge**: deterministic rotate based on label text or index (very small angles).
3. **Misregistered outline**: a soft double‑border or offset stroke to feel printed.

## Files to Change
- `apps/web/src/components/project/ProjectCard.tsx`
- `apps/web/src/components/project/ScoreWidget.tsx`
- `apps/web/src/components/project/ProjectDetails.tsx`
- `apps/web/src/app/globals.css` (utilities for sticky‑note + fold)

## Implementation Notes
- Keep text fully readable; avoid opacity under 80%.
- Use semantic tokens (`bg-secondary`, `bg-muted`, etc.).
- Utilities should be minimal and reusable.

## Sketch / Pseudocode
```tsx
<span className={cn("slop-sticky", "slop-tilt-1")}>new</span>
```

```css
.slop-sticky::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-bottom: 6px solid color-mix(in oklch, var(--border) 40%, transparent);
}
```

## Verification Checklist
- Badge text contrast passes in light/dark.
- No overlap or clipping on small screens.
- Consistent appearance across card variants.
