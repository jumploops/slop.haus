# Feed Selector Buttons Overflow on Mobile in Slop Mode

## Problem
On mobile, display-mode selector buttons can visually exceed their container when slop mode is enabled, because rotation offsets increase effective visual height.

## Investigation
1. Checked the feed controls row in `apps/web/src/app/page.tsx`.
2. Confirmed display-mode buttons are rotated in slop mode via slop transform classes.
3. The controls row had no extra bottom padding in slop mode on mobile.

## Fix
1. Add `cursor-pointer` to display-mode selector buttons for parity with sort tabs.
2. Add conditional bottom padding (`pb-2`) on mobile when slop mode is active (`sm:pb-0` on larger screens) to absorb rotated-button overflow.
