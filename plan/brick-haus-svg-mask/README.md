# Inline SVG Mask for "haus" Brick Fill

## Overview
Replace the CSS background-clip brick fill with an inline SVG mask/pattern for the "haus" logo text so the brick pattern renders with proper running-bond layout at small sizes.

## Goals
- Render "haus" as an inline SVG with a brick pattern masked by text.
- Keep sizing consistent with current header + mobile typography.
- Maintain accessible text labeling for screen readers.

## Non-Goals
- Global typography changes.
- Reworking the rest of the header layout.

## Open Questions
- Should the brick palette remain constant across light/dark modes, or be adjusted per theme?
- Do we need a subtle stroke/shadow for contrast against the background?
- What exact width should the SVG use to best match current text spacing?

## Phases
| Phase | Status | Summary |
|------|--------|---------|
| 1 | Completed | Define inline SVG pattern + mask |
| 2 | Completed | Apply SVG in Header and MobileNav |

## Verification Checklist
- Brick fill renders correctly on desktop header and mobile nav.
- Pattern is running-bond (offset rows).
- No layout shift or broken alignment.
