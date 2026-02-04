# Phase 6 — Button + Input Slop

**Status:** Won't Do  
**Goal:** Add subtle imperfection to core controls while keeping strong affordances.

## Targets
- Primary/secondary buttons
- Tab buttons (global component)
- Select + input borders (feed controls first)

## Proposed Changes (Not Implemented)
1. **Uneven edges**: slight skew/clip on buttons and toggles.
2. **Misregistered shadow**: double‑border or offset shadow on primary controls.
3. **Pressed state shift**: small translate to feel tactile (keep accessible).

## Files to Change
- `apps/web/src/components/ui/button-variants.ts`
- `apps/web/src/components/ui/Tabs.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/globals.css` (utilities if needed)

## Implementation Notes
- Ensure focus rings remain visible.
- Don’t reduce hit area.
- Apply Slop Mode gating.

## Verification Checklist (Not Run)
- Buttons remain readable and accessible.
- No layout shift when toggling active states.
- Mobile tap targets remain 44px+.
