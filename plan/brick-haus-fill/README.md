# Brick Fill for "haus" Logo Text

## Overview
Add a CSS brick wall pattern fill to the "haus" portion of the site logo using background-clip: text, tuned so the brick pattern remains legible at the existing font sizes. This will apply to the header logo (desktop + mobile).

## Goals
- Implement a brick wall fill for the "haus" text using CSS-only gradients.
- Ensure brick size/mortar thickness scales appropriately for current logo sizes.
- Preserve legibility across light/dark themes and different DPRs.

## Non-Goals
- No SVG implementation (unless later requested).
- No global typography changes outside the logo.

## Open Questions
- Brick palette: red brick with offwhite mortar, with a slightly tarnished look. (Resolved)
- Theme handling: keep the same palette for light/dark unless contrast issues arise. (Resolved)
- Stroke/shadow: none for now; revisit if readability needs a boost. (Resolved)

## Phases
| Phase | Status | Summary |
|------|--------|---------|
| 1 | Completed | Design tokens + CSS variables for brick fill |
| 2 | Completed | Apply brick fill to logo component (desktop + mobile) |

## Dependencies
- Tailwind v4 token utilities in `apps/web/src/app/globals.css`.
- Logo markup in `apps/web/src/components/layout/Header.tsx` and `apps/web/src/components/layout/MobileNav.tsx`.

## Verification Checklist
- Header logo renders brick fill on "haus" in desktop and mobile nav.
- Brick pattern is visible (mortar lines readable) at current sizes.
- No layout shifts or overflow.
- Looks acceptable in light and dark modes.
