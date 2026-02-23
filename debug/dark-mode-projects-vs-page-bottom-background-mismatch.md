# Debug: Dark-Mode Projects View vs Page-Bottom Background Mismatch

**Status:** Draft  
**Date:** 2026-02-23

## Problem
In dark mode, there is a subtle background color mismatch between:
1. The area at the end of the projects/feed content.
2. The bottom of the page.

Additional observation:
- When hovering a `ProjectCard` (with slop goo visible), the area appears to shift closer to the expected color.

## Scope
Investigation only. No implementation changes.

## Findings

### 1) Base page background and footer background use different tokens
- Global base layer sets `body` to `bg-background` (`--background`).
  - `apps/web/src/app/globals.css:163`
- Layout sets footer to `bg-card` (`--card`).
  - `apps/web/src/app/layout.tsx:64`

In dark mode, these tokens are intentionally different:
- `--background: oklch(0.12 0.01 280)`
- `--card: oklch(0.2 0.015 280)`
- `apps/web/src/app/globals.css:59`
- `apps/web/src/app/globals.css:62`

This creates a visible seam when scrolling from feed content area into footer area.

### 2) Main content area is transparent, so it inherits body background
- `<main>` has spacing/min-height but no explicit background class.
  - `apps/web/src/app/layout.tsx:59`

So the feed container area below cards resolves to `body` (`bg-background`), while footer remains `bg-card`.

### 3) Project cards themselves use `bg-card`, not `bg-background`
- List/grid card shells use `bg-card`.
  - `apps/web/src/components/project/ProjectCard.tsx:150`
  - `apps/web/src/components/project/ProjectCard.tsx:298`

This makes cards visually closer to footer tone than to the base page tone in dark mode, increasing perceived mismatch in whitespace below the list.

### 4) Hover state can temporarily mask the seam
On hover, cards apply:
- `hover:shadow-lg`
- slight rotation/transform classes
- `apps/web/src/components/project/ProjectCard.tsx:71`
- `apps/web/src/components/project/ProjectCard.tsx:73`

Also, slop goo appears on hover:
- `showGoo = sloppy && isHovered`
- `apps/web/src/components/project/ProjectCard.tsx:88`

These hover-only overlays/effects can visually blend or obscure the transition area, making color mismatch look "correct" while hovered.

### 5) Historical note: secondary token path existed during investigation
- At investigation time, there was a second token path (`app.css` -> `styles/theme.css`) that was not imported by layout.
- This was not the direct seam cause, but it increased styling ambiguity.
- Cleanup follow-up removed:
  - `apps/web/src/app/app.css`
  - `apps/web/src/styles/theme.css`
  - `apps/web/src/styles/animations.css`

## Update: Main-Only Repro (2026-02-23)

New constraints from manual verification in Chrome Inspector:
1. The mismatch is visible entirely inside `<main>`, not at the footer boundary.
2. Footer being `bg-card` is intentional and not the root issue.
3. Setting an explicit background on `<main>` (for example `blue`) removes the mismatch.

Interpretation:
- This strongly suggests a transparency/compositing issue on `<main>` (transparent surface inheriting body paint) rather than a wrong token value.
- Hover effects (card shadow/goo) can still change perceived tone, but are likely amplifiers rather than root cause.

## Revised Cause Ranking
1. **Primary:** `<main>` is transparent and relies on inherited body paint; explicit painting on `<main>` removes the artifact.
2. **Secondary:** Card hover/compositing (`shadow-lg`, goo overlay) changes local contrast and can make the mismatch appear to "correct" during hover.
3. **Tertiary:** Token mismatch hypotheses are lower confidence after inspector confirmation.

## Verification Steps
1. Add `bg-background` directly on `<main>` and verify mismatch disappears while keeping footer `bg-card`.
2. With explicit main background in place, test hover on project cards to ensure no regression in slop goo visuals.
3. Optionally test `isolation: isolate` on `<main>` if any subtle compositing artifact remains.

## Conclusion
Current evidence indicates this issue is primarily about `<main>` transparency/compositing behavior. The safest fix direction is to explicitly paint `<main>` with `bg-background` so the main surface is deterministic regardless of inherited body paint/compositor behavior.
