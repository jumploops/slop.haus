# Dark Mode Modal Overlay Brightness

**Status:** Implemented (awaiting visual QA)
**Date:** 2026-02-08

## Problem

When opening the Sign In modal in dark mode, the page backdrop appears bright/washed out instead of dim.

## Current Implementation Review

### Modal architecture

- `LoginModal` renders the shared `Modal` component:
  - `apps/web/src/components/auth/LoginModal.tsx:26`
- `LoginModal` is mounted globally from providers:
  - `apps/web/src/app/providers.tsx:20`
- Shared modal base component:
  - `apps/web/src/components/ui/Modal.tsx`

### Modal styling details

- Before fix, shared modal backdrop class was:
  - `apps/web/src/components/ui/Modal.tsx:49`
  - `backdrop:bg-foreground/75`
- Dialog container/panel uses `bg-card` + `bg-background`:
  - `apps/web/src/components/ui/Modal.tsx:47`
  - `apps/web/src/components/ui/Modal.tsx:54`

### Theme token behavior in dark mode

- Dark mode sets `--foreground` to a light value:
  - `apps/web/src/app/globals.css:59`
  - `--foreground: oklch(0.95 0.005 90);`

## Modal + Overlay Inventory

### Uses shared `Modal` (affected)

- `apps/web/src/components/auth/LoginModal.tsx:26`
- `apps/web/src/components/project/DeleteProjectModal.tsx:22`
- `apps/web/src/components/project/UrlChangeModal.tsx:26`
- `apps/web/src/components/submit/DraftReview.tsx:265`

### Separate overlay pattern (same token risk)

- Before fix, mobile nav overlay used:
  - `apps/web/src/components/layout/MobileNav.tsx:66`
  - `bg-foreground/50`

This is not a modal, but it uses the same text token for dimming and can produce the same bright-overlay behavior in dark mode.

## Findings

1. Backdrops currently use the **foreground/text token** (`foreground`) instead of an overlay-specific token.
2. In dark theme, `foreground` is intentionally light for text contrast, so using it for overlays creates a bright backdrop.
3. The issue is systemic for all shared modal instances, not just Sign In.
4. Mobile nav overlay likely has the same visual issue for the same reason.

## Proposed Fix

### Recommended approach: add a dedicated overlay token

Use a semantic overlay token rather than reusing `foreground`.

1. Add `--overlay` in `apps/web/src/app/globals.css`
2. Set different values for light and dark:
   - Light: darker translucent overlay (example: `oklch(0 0 0 / 0.45)`)
   - Dark: stronger translucent overlay (example: `oklch(0 0 0 / 0.68)`)
3. Map it in `@theme inline` as `--color-overlay`
4. Replace:
   - `backdrop:bg-foreground/75` in `Modal.tsx`
   - `bg-foreground/50` in `MobileNav.tsx`
   with overlay-token-based classes (for example `backdrop:bg-overlay` and `bg-overlay`)

### Why this is preferred

- Keeps text/foreground semantics clean (text only).
- Makes overlay behavior predictable across components.
- Centralizes light/dark tuning in tokens instead of per-component hardcoded colors.

## Implementation Applied

- Added `--overlay` token in both light and dark theme blocks:
  - `apps/web/src/app/globals.css`
- Added Tailwind mapping:
  - `--color-overlay: var(--overlay)` in `@theme inline`
- Updated shared modal backdrop:
  - `apps/web/src/components/ui/Modal.tsx`
  - `backdrop:bg-foreground/75` -> `backdrop:bg-overlay`
- Updated mobile nav overlay:
  - `apps/web/src/components/layout/MobileNav.tsx`
  - `bg-foreground/50` -> `bg-overlay`
- Build validation:
  - `pnpm -F @slop/web build` completed successfully

## Implementation Checklist

- [x] Add `--overlay` token to `:root` and `.dark` in `apps/web/src/app/globals.css`
- [x] Add `--color-overlay` mapping in `@theme inline` in `apps/web/src/app/globals.css`
- [x] Update modal backdrop class in `apps/web/src/components/ui/Modal.tsx`
- [x] Update mobile nav overlay class in `apps/web/src/components/layout/MobileNav.tsx`
- [ ] Confirm all 4 modal usages look correct in dark mode
- [ ] Confirm mobile nav overlay looks correct in dark mode

## Verification Steps

1. Run `pnpm -F @slop/web build`
2. In dark mode, open:
   - Sign In modal
   - Delete Project modal
   - URL Changed modal
   - Discard Draft modal
3. Verify backdrop is dim (not bright/white) and panel content remains readable
4. Open mobile nav and verify overlay dimming is consistent with modal behavior
