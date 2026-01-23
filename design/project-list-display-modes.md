# Project List Display Modes

Status: draft
Owner: TBD

## Current implementation review
- Feed page: `apps/web/src/app/page.tsx`
  - Project list rendered as a vertical list of `ProjectCard` components.
  - Cards include a small left thumbnail (`h-16 w-24`) on desktop; hidden on mobile.
  - Sorting controls are on the left: `Tabs` for Hot/New/Top, and a window select for Top.

- Card component: `apps/web/src/components/project/ProjectCard.tsx`
  - List layout with left thumbnail, content center, and score block on right.
  - Designed as a horizontal card; doesn’t currently support grid layout or size variants.

## Goal
Add a display mode toggle at the top right of the feed (opposite the sort tabs). Modes:
1) **List – small screenshots** (current behavior)
2) **List – large screenshots** (bigger thumb, taller card)
3) **Grid** (screenshot on top, card content below; 3xN or 4xN depending on width)

## Design options (2–3)

### Option A: Button group toggle (icon + label)
- Add a segmented control next to sort tabs:
  - “List S”, “List L”, “Grid” (or icons with tooltips).
- Keeps controls compact and aligned with existing header styling.
- Pros: minimal UI, consistent with tabs style.
- Cons: might need clear labels to avoid ambiguity.

### Option B: Icon-only toggle with helper text
- Three icon buttons (list, list-large, grid) with a small caption below (“Display”).
- Pros: sleek, small footprint.
- Cons: less obvious on first use; needs tooltips or ARIA labels.

### Option C: Dropdown “Display” selector
- A small select control labeled “Display”, options: List (small), List (large), Grid.
- Pros: simplest to implement, compact.
- Cons: less discoverable and slower to switch than buttons.

## Implementation considerations
- `ProjectCard` likely needs a `variant` prop (`list-sm`, `list-lg`, `grid`).
- Grid mode may need a new card layout or conditional rendering for media placement.
- List-large might reuse the same card with larger thumbnail dimensions.
- Feed layout should switch between a vertical `space-y-3` list and a CSS grid.
- Consider storing the selected display mode in localStorage (optional).

## Open questions
- Should grid mode show fewer card details (e.g., only title + score) to keep cards compact?
- Do we want the toggle to persist across sessions (localStorage) or reset per visit?
- Should list-large be available on mobile or only on desktop?
