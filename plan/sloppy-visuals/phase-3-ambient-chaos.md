# Phase 3 — Ambient Chaos

**Status:** Draft  
**Goal:** Add subtle background texture and layout irregularity to make the feed feel lived-in.

## Targets
- Feed container + page background
- Feed grid rhythm (list and grid)

## Proposed Changes
1. **Paper/noise texture layer** behind the feed (low opacity, theme-aware).
2. **Broken grid rhythm**: every Nth card is slightly wider/taller or offset (stable + predictable).
3. **Ink doodles**: small, low-opacity SVG doodles near section edges.

## Files to Change
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/globals.css` (if texture/doodle utilities are shared)

## Implementation Notes
- Keep texture subtle; avoid reducing text contrast.
- Broken grid should not change card order or overflow container.
- Use deterministic logic for “special” cards (e.g., based on index).

## Sketch / Pseudocode
```tsx
{data.projects.map((project, index) => (
  <ProjectCard
    key={project.id}
    project={project}
    rank={index + 1}
    variant={displayMode}
    className={index % 6 === 0 ? "translate-x-1" : undefined}
  />
))}
```

```css
/* Optional utility example */
.feed-noise::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,...");
  opacity: 0.06;
  pointer-events: none;
}
```

## Verification Checklist
- Texture does not reduce legibility.
- Broken grid does not cause overflow on mobile.
- Decorative doodles do not block interactions.
