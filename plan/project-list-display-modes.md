# Project List Display Modes - Implementation Spec

Status: draft
Owner: TBD

## Overview
Add a display mode toggle (icon buttons) on the feed page to switch between:
- List (small screenshots) — default
- List (large screenshots) — desktop only
- Grid (screenshot top ~60% of card, full details below)

Persist selection in localStorage so it sticks across sessions.

## Requirements
- Toggle appears top-right of the feed header, opposite the Hot/New/Top tabs.
- Icon-only buttons with ARIA labels for accessibility.
- Modes:
  - **List small** (current default): small left thumbnail
  - **List large**: larger left thumbnail, taller card; only on desktop
  - **Grid**: card with screenshot on top (~60% height), details below
- Grid mode must include full project details (not a condensed layout).
- Selected mode persists via localStorage.
- Default to List small if no stored preference.

## Current implementation
- Feed page: `apps/web/src/app/page.tsx`
  - Layout: list of `ProjectCard` with `space-y-3`.
  - No display toggles or mode state.
- Card: `apps/web/src/components/project/ProjectCard.tsx`
  - Designed as a horizontal list item with left thumbnail (hidden on mobile).

## Proposed implementation

### State + persistence
- Add `displayMode` state in `FeedPage` with values: `list-sm | list-lg | grid`.
- On mount, read `localStorage` key (e.g., `slop:feedDisplayMode`).
- On change, update state + localStorage.
- If stored value is `list-lg` but viewport is mobile, fallback to `list-sm`.

### Toggle UI
- Add a small icon button group on the right of the header row:
  - Icons: list (small), list (large), grid (use lucide icons if available).
  - Provide `aria-label` and `title` for each.
- Hide the “list large” button on mobile using `hidden sm:inline-flex`.

### Layout switching
- List modes: keep existing vertical list container.
- Grid mode: switch to `grid` layout with `gap-4`, e.g. `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.

### Card variants
- Update `ProjectCard` to accept a `variant` prop:
  - `list-sm` (current)
  - `list-lg` (larger thumbnail, taller row)
  - `grid` (screenshot on top, details below)
- For grid:
  - Image becomes top section (approx 60% height via fixed aspect ratio or `h-[180px]` etc).
  - Details section includes full info (title, tagline, slop score, review count, author, time, visit link).

### TODO
- Add an experiment TODO to test random default display mode distribution.

## Files to change
- `apps/web/src/app/page.tsx`
- `apps/web/src/components/project/ProjectCard.tsx`
- `TODO.md`

## QA checklist
- Toggle appears on feed header right.
- Selected mode persists after refresh.
- List large button hidden on mobile.
- Grid mode renders full details + top image.
- Fallback to list small on mobile when `list-lg` stored.
