# Phase 2: Layout + Structure

**Status:** Completed

## Objective

Fix layout-level responsiveness (page shells, grids, and major sections) to avoid horizontal scrolling and cramped UI on small screens.

## Tasks

- Make feed controls stack gracefully on mobile.
- Ensure project cards and detail headers switch to stacked layout at base.
- Update `ScoreWidget` and sidebar grids to collapse to single-column on small screens.
- Reduce nested comment indentation on small screens.
- Ensure settings/admin sidebars stack cleanly and nav items are full-width.

## Files to Change

- `apps/web/src/app/page.tsx`
- `apps/web/src/components/project/ProjectCard.tsx`
- `apps/web/src/components/project/ProjectDetails.tsx`
- `apps/web/src/components/project/ScoreWidget.tsx`
- `apps/web/src/components/comment/CommentItem.tsx`
- `apps/web/src/app/settings/layout.tsx`
- `apps/web/src/app/admin/layout.tsx`
- `apps/web/src/components/submit/EditableProjectPreview.tsx`
- `apps/web/src/components/project/EditableProject.tsx`

## Code Snippets

```tsx
// Example: mobile-first stack + md row
<div className="flex flex-col md:flex-row gap-4">
  ...
</div>
```

```tsx
// Example: reduce reply indentation on small screens
<div className="ml-3 md:ml-6 border-l-2 ...">
  ...
</div>
```

## Verification Checklist

- No horizontal scroll at 320–428px widths on core pages.
- Layouts stack vertically at base and expand at `md`.
- Primary actions remain visible and reachable without overlap.

## Progress Notes

- Feed controls stack on mobile with full-width tabs and filters.
- Project cards use stacked layout with responsive media sizing.
- Score widget rows wrap into vertical stacks on small screens.
- Comment reply indentation reduced on mobile.
- Settings/Admin nav pills wrap and stretch on small screens.
- Edit header switches to column layout on mobile.
