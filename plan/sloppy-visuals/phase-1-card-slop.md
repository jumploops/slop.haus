# Phase 1 — Card Slop

**Status:** Complete  
**Goal:** Make project cards feel hand-placed and imperfect without harming readability.

## Targets
- Project cards (grid + list variants)
- Card chrome (borders, shadows, badges, image frames)

## Proposed Changes
1. **Stable micro-rotation + offset** per card based on project ID or index (no per-render randomness).
2. **Misregistered shadows** using layered shadows to feel misprinted.
3. **Tape/staple corners** on card or thumbnail frame using pseudo-elements (subtle, theme-aware).
4. **Bent screenshot frame**: a slightly skewed inner frame or offset border around thumbnails.

## Files to Change
- `apps/web/src/components/project/ProjectCard.tsx`
- `apps/web/src/app/globals.css` (if adding reusable utilities; keep minimal)
- Optional: `apps/web/src/components/project/ProjectDetails.tsx` (only if card utilities shared and safe)

## Implementation Notes
- Use deterministic offsets: map hash → small `rotate` + `translate` values.
- Prefer Tailwind utilities + `cn()` to assemble class names.
- If reusable, add 1–2 utility classes in `@layer utilities` (keep names semantic).

## Sketch / Pseudocode
```tsx
const slopClass = getSlopClass(project.id); // e.g. "slop-1", "slop-2" etc.
return (
  <article className={cn("border-2 bg-card", slopClass, "shadow-[...]" )}>
    ...
  </article>
)
```

```css
/* Optional utilities (keep minimal) */
.slop-1 { transform: rotate(-0.6deg) translateY(1px); }
.slop-2 { transform: rotate(0.8deg) translateX(1px); }
```

## Verification Checklist
- Cards remain readable; no text overlap or clipped content.
- Tap targets remain aligned on mobile.
- No layout shift between SSR/CSR (stable class assignment).
- Hover effects still work; no jitter.
