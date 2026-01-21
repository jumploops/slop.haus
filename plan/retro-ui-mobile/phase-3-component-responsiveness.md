# Phase 3: Component Responsiveness

**Status:** Completed

## Objective

Improve component-level responsiveness and tap targets for mobile without losing the retro look.

## Tasks

- Increase tap target sizes for `VoteButtons`, small buttons, and dropdowns on mobile.
- Add wrapping or stacking behavior to dense UI groups (vote rows, action bars).
- Ensure text and labels wrap instead of overflow (`break-words` as needed).
- Adjust the visitor counter and footer spacing for small screens.

## Files to Change

- `apps/web/src/components/project/VoteButtons.tsx`
- `apps/web/src/components/project/ScoreWidget.tsx`
- `apps/web/src/components/project/ProjectCard.tsx`
- `apps/web/src/components/comment/CommentItem.tsx`
- `apps/web/src/components/comment/CommentForm.tsx`
- `apps/web/src/components/layout/VisitorCounter.tsx`
- `apps/web/src/app/layout.tsx`

## Verification Checklist

- Tap targets meet minimum size expectations (>= 40px) on mobile.
- Dense UI groups wrap or stack without overlap.
- Text does not overflow containers at 320px.

## Progress Notes

- Increased mobile tap targets for small buttons, tabs, and vote controls.
- Comment actions stack on mobile and text wraps safely.
- Time window select uses a taller touch target on mobile.
- Footer visitor counter switches to compact mode on small screens.
