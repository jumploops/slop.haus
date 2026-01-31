# Phase 3 - Integration + Guidelines

## Status
Partial

## Goal
Define usage patterns for cards/headers, reduced-motion handling, and performance constraints.

## Tasks
- Add reduced-motion handling:
  - When `prefers-reduced-motion` is true, disable falling drips and keep static goo. ✅
- Replace ProjectCard slop drip usage with `SlopGoo`. ✅
- Fix scroll lag by anchoring goo in document space when the target is not fixed. ✅
- Document recommended defaults (thickness, maxDrop, viscosity).
- Provide usage examples for cards and smaller UI elements.
- Note z-index conventions and when to render behind/above the target.
- Confirm whether a new CSS variable (e.g. `--slop-goo`) is needed for color.

## Files to Change (tentative)
- `apps/web/src/components/slop/SlopGoo.tsx` (reduced-motion hook)
- `apps/web/src/styles/theme.css` or `apps/web/src/app/globals.css` (if adding a new token)
- `design/` or `plan/` docs for usage examples (no new files if not needed)

## Code Snippets (draft)
```ts
const prefersReducedMotion = useReducedMotion();
const showDrips = !prefersReducedMotion && dripCount > 0;
```

## Verification Checklist
- Reduced-motion disables animation without layout jumps.
- Example usage works for rotated cards and flat elements.
- Defaults feel “sloppy” without overpowering the UI.
