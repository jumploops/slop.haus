# Retro UI Mobile Responsiveness Review

**Status:** Draft
**Owner:** TBD
**Last updated:** 2026-01-20

## Overview

We have completed the retro reskin, but the UI is not yet mobile friendly. This document reviews the current implementation and outlines a responsive design plan that preserves the retro visual language while improving usability on small screens.

## Goals

- Make all primary pages and flows usable on small screens (320–428px widths).
- Preserve the retro aesthetic (beveled panels, chunky borders, bold typography).
- Avoid new dependencies and keep changes within `apps/web`.
- Keep layout and component patterns consistent with the existing Tailwind token system.

## Non-Goals

- Changing product behavior or information architecture.
- Replacing the retro style with a modern minimal design.
- Adding a new design system or component library.

## Current Implementation Review

Key files reviewed:

- Layout shell: `apps/web/src/app/layout.tsx`, `apps/web/src/components/layout/Header.tsx`, `apps/web/src/components/layout/MobileNav.tsx`
- Feed + cards: `apps/web/src/app/page.tsx`, `apps/web/src/components/project/ProjectCard.tsx`
- Project details: `apps/web/src/components/project/ProjectDetails.tsx`, `apps/web/src/components/project/ScoreWidget.tsx`, `apps/web/src/components/project/VoteButtons.tsx`, `apps/web/src/components/project/VibeMeter.tsx`
- Comments: `apps/web/src/components/comment/CommentThread.tsx`, `apps/web/src/components/comment/CommentItem.tsx`, `apps/web/src/components/comment/CommentForm.tsx`
- Submit/edit flows: `apps/web/src/components/submit/EditableProjectPreview.tsx`, `apps/web/src/components/project/EditableProject.tsx`, `apps/web/src/app/submit/page.tsx`
- Settings/admin layouts: `apps/web/src/app/settings/layout.tsx`, `apps/web/src/app/admin/layout.tsx`
- Footer + visitor counter: `apps/web/src/components/layout/VisitorCounter.tsx`

## Findings (Mobile Pain Points)

- **Project cards are rigid on small screens.** `ProjectCard` uses a fixed row layout with rank + thumbnail + scores + votes and no `flex-col` fallback. On narrow widths, content will compress or overflow.
- **Touch targets are small.** Many mobile-facing actions use `size="sm"` (VoteButtons, channel toggles, comment actions) with heights ~28px, below typical 40–44px guidelines.
- **Nested comments can overflow.** `CommentItem` uses `ml-6` for replies, which compounds quickly and can push content outside the viewport.
- **Score widget rows are inflexible.** `ScoreWidget` uses `justify-between` rows with multiple elements. On narrow widths, labels and buttons can collide.
- **Controls and filters are dense.** The feed controls (tabs + channel buttons + time window select) are in a single row and can become cramped.
- **Footer elements may stack poorly.** The visitor counter panel is a fixed-size block that could dominate the footer on small screens.

## Responsive Design Principles

- Mobile-first layout: base styles should work at 320–428px without horizontal scrolling.
- Prefer vertical stacking and clear hierarchy over dense rows.
- Maintain retro styling via borders, shadows, and typography, but allow more whitespace for tap targets.
- Use `flex-wrap`, `gap`, and `grid` adjustments to prevent overflow.
- Enforce readable text and minimum tap target sizes on touch devices.

## Proposed Changes (High Level)

### Global Layout

- Ensure the header and marquee remain visible and legible on small widths; allow tagline or nav items to wrap or hide as needed.
- Review `main` content padding to avoid squeezing content on 320px screens.
- Keep footer content stacked vertically with clear separation between the visitor counter and the footer microcopy.

### Feed + Project Card

- Convert `ProjectCard` to a stacked layout at base (thumbnail + title/metadata, scores below).
- Move score badges and vote buttons into a separate row for mobile.
- Allow score/vote clusters to wrap or switch to `size="md"` on mobile.

### Project Details + Score Widget

- Ensure the media, title, and action buttons stack cleanly.
- Allow `ScoreWidget` rows to wrap, or collapse into a single-column layout on mobile.
- Increase `VoteButtons` size on mobile (or add `min-h`/`min-w`).

### Comments

- Reduce nested reply indentation on small screens (e.g., `ml-3` on mobile, `ml-6` on larger).
- Add `break-words` or `overflow-wrap` to comment text and usernames.
- Ensure action buttons remain on a single line or stack under the comment body.

### Submit/Edit Flows

- Keep form sections stacked with clear headings.
- Ensure inline edit fields and URL inputs don’t overflow or get clipped.
- Validate that the preview layout mirrors the mobile version of project details.

### Settings/Admin

- Maintain the current `grid` with sidebar stacking at small sizes.
- Ensure nav buttons are full-width and easy to tap on mobile.

## Unknowns / Open Questions

- Should we globally increase touch target sizes for `size="sm"` on mobile, or selectively update only critical actions?
- Do we want a more compact footer on mobile (e.g., smaller counter or collapsible badges)?
- Any explicit breakpoints to align with? (Default Tailwind `sm`, `md`, `lg` vs. custom)

## Blockers

- None identified. All changes are within the existing Tailwind and token system.

## Verification Checklist

- Test at 320px, 375px, 390px, and 428px widths.
- No horizontal scrolling on key pages (feed, project detail, submit, edit, comments, settings).
- Buttons and controls meet minimum tap target sizes.
- Nested comments remain readable and contained.
- Retro styling remains intact after responsive adjustments.
