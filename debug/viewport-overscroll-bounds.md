# Viewport Overscroll Past Top/Bottom Borders

## Problem
In Chrome, the page can be scrolled past its top and bottom bounds, which exposes motion beyond the intended border-constrained viewport.

## Investigation
1. Checked root layout and global styles.
2. Confirmed `apps/web/src/app/globals.css` only applies base color styles on `body`.
3. No root-level overscroll containment (`overscroll-behavior`) is defined on `html`/`body`.

## Root Cause
Browser default boundary overscroll behavior is active for the root scroller.

## Fix
1. Apply root overscroll containment on `html` and `body` for vertical scrolling.
2. Set `body` min-height fallback for responsive/mobile viewport units (`100vh` then `100dvh`) so viewport sizing remains stable across mobile browser UI changes.

## Expected Result
The page scrolls to exact top and bottom limits without boundary overscroll past the UI borders, including mobile Chrome behavior.
