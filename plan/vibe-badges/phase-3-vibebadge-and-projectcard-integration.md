# Phase 3: VibeBadge + ProjectCard Integration

## Status

**Status:** ✅ Completed  
**Owner:** Web  
**Depends On:** [Phase 1](./phase-1-shared-vibe-taxonomy-utility.md), [Phase 2](./phase-2-tooltip-infrastructure.md)

## Goal

Implement a tooltip-enabled `VibeBadge` component and integrate it into shared `ProjectCard` variants (`list-sm`, `list-lg`, `grid`) without regressing existing card interaction behavior.

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/src/components/project/VibeBadge.tsx` (new)
- `/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx`

## Tasks

1. Build `VibeBadge` component with props:
   - `percent: number`
   - `size?: "sm" | "md"`
   - `className?: string`
2. Use Phase 1 taxonomy utility for:
   - clamped percent display,
   - rounded bucket lookup,
   - label resolution.
3. Render compact icon + percent in badge body.
4. Add tooltip with:
   - taxonomy label,
   - percent detail,
   - short explanatory line.
5. Apply neutral semantic styling (no slop-mode sticky/tilt effects).
6. Integrate `VibeBadge` into `ProjectCard` in both render branches:
   - list branch (`list-sm`, `list-lg`)
   - grid branch
7. Ensure placement does not conflict with slop-score block, rank badge, featured badge, or title wrapping.
8. Ensure badge trigger participates safely in card interaction model:
   - no accidental card-navigation breakage,
   - no blocked hover/focus tooltip due to `pointer-events` containers.

## Implementation Notes

- Badge should be informational and visually secondary to title/slop score.
- If trigger is inside a `pointer-events-none` container, selectively opt-in `pointer-events-auto` on badge wrapper.
- Prefer data attributes already recognized by card interaction guard if additional safety is needed.

## Code Snippets (Conceptual)

```tsx
<VibeBadge percent={project.vibePercent} size={isGrid ? "md" : "sm"} />
```

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span className={cn("inline-flex ...", className)} data-card-interactive="true">
      ...
    </span>
  </TooltipTrigger>
  <TooltipContent side="top">...</TooltipContent>
</Tooltip>
```

## Verification Checklist

- [ ] Badge renders on all shared card variants.
- [ ] Tooltip works on hover and keyboard focus.
- [ ] Clicking regular card areas still navigates to project page.
- [ ] Like/favorite/link controls still work exactly as before.
- [ ] No layout overlap with rank/featured/slop-score badges in mobile and desktop.
- [ ] No badge rendered on My Projects cards.

## Exit Criteria

- Shared project cards display a stable, accessible, tooltip-enabled vibe badge using approved terminology and neutral styling.
