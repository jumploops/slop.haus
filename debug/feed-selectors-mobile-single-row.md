# Feed Selectors Wrap to Two Rows on Mobile

## Problem
On small screens, the feed selector controls split into two rows:
- sort tabs (`hot/new/top`)
- display toggles (list/grid)

## Investigation
1. Reviewed `/apps/web/src/app/page.tsx` controls container.
2. Found mobile classes using `flex-col` and full-width tab/select sizing (`w-full`), which force line breaks.

## Root Cause
Mobile layout explicitly stacks selector groups and expands the sort controls to full width.

## Fix
1. Keep the controls container in a single horizontal row at all breakpoints.
2. Remove mobile full-width sizing from tabs/select.
3. Use horizontal overflow on the controls row so narrow screens scroll horizontally instead of wrapping.
