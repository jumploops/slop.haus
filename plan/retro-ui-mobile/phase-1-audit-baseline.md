# Phase 1: Audit + Baseline

**Status:** Completed

## Objective

Establish the mobile baseline by identifying breakpoints, primary pages, and existing layout constraints before code changes.

## Tasks

- Review key pages at 320px/375px/390px/428px and record critical issues.
- Confirm target breakpoints (`sm`, `md`, `lg`) and any special cases.
- Identify any global CSS or layout constraints (header/footer, container widths).
- Capture the minimal set of components needing responsive overrides.

## Files to Review

- `apps/web/src/app/layout.tsx`
- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/components/layout/MobileNav.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/components/project/ProjectCard.tsx`
- `apps/web/src/components/project/ProjectDetails.tsx`
- `apps/web/src/components/project/ScoreWidget.tsx`
- `apps/web/src/components/comment/*`
- `apps/web/src/components/submit/*`
- `apps/web/src/components/project/EditableProject.tsx`
- `apps/web/src/app/settings/layout.tsx`
- `apps/web/src/app/admin/layout.tsx`

## Findings

- **Feed controls are dense**: `apps/web/src/app/page.tsx` keeps tabs + channel buttons + window select in one row; on 320px it will wrap but still feels cramped.
- **Project card layout is rigid**: `apps/web/src/components/project/ProjectCard.tsx` uses a fixed row layout with rank + thumbnail + scores + vote stack and no small-screen column fallback.
- **Tap targets are small**: `apps/web/src/components/project/VoteButtons.tsx` uses `size="sm"` with `w-7 h-7` in multiple contexts; below recommended mobile tap sizes.
- **Score widget rows can collide**: `apps/web/src/components/project/ScoreWidget.tsx` uses `justify-between` with three items per row; likely wraps poorly on narrow screens.
- **Nested comment indentation**: `apps/web/src/components/comment/CommentItem.tsx` uses `ml-6` for replies; deep threads can exceed width on mobile.
- **Footer stack is tall**: `apps/web/src/app/layout.tsx` includes a fixed-size visitor counter panel that may dominate vertical space on small screens.

## Decisions

- Use `sm` for re-expanding layouts and keep base styles mobile-first.
- Allow controls and action bars to wrap or stack on small screens.
- Increase tap target sizes (or switch to `size="md"`) on mobile where feasible.

## Verification Checklist

- Mobile issues are documented with exact page/component references.
- A scoped list of components to update is finalized.
