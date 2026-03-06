# Feed Hydration Fix Plan (Option 1 + Animated Intro)

Status: draft  
Owner: TBD  
Date: 2026-03-03

## Overview
Fix the `/` hydration mismatch by using deterministic SSR defaults (Option 1), then reconciling client-only preferences after hydration. While doing this, add a clear intro "enter" animation so the banner feels intentionally dismissible.

This is a targeted patch to unblock local-dev hydration errors without a full persistence architecture refactor.

## Goals
- Eliminate hydration mismatch on feed page (`/`).
- Keep intro dismiss behavior (`slop:feedIntroDismissed`) intact.
- Add first-load intro enter animation to reinforce that the banner is optional/dismissible.
- Preserve existing display mode behavior (`slop:feedDisplayMode`) and slop mode behavior (`slop:mode`) after hydration.

## Non-Goals
- No global rewrite to a shared persisted-state abstraction (that is Option 2 follow-up).
- No visual redesign of the intro content/copy.
- No backend changes.

## Current Root Cause Summary
The current implementation reads `window.localStorage`/`matchMedia` during initial state setup in render-time initializers:
- `apps/web/src/app/page.tsx` (`showIntro`, `displayMode`)
- `apps/web/src/lib/slop-mode.tsx` (`enabled`)

Server render and first client render can diverge, producing hydration mismatch.

## Proposed Implementation (Option 1)

### Phase 1: Hydration-Safe Initial Render Contract
- Make first render deterministic and SSR-safe:
  - `showIntro` defaults to `false` on both server and first client render.
  - `displayMode` defaults to stable SSR-safe value (`list-lg`) on first render.
  - `slopMode` defaults to stable SSR-safe value (`on`) on first render.
- Read `localStorage` only after hydration/mount.
- Reconcile states post-hydration to stored preferences.
- Include `SlopModeProvider` hydration hardening in this patch (not feed-only).
- Persisted `displayMode` may snap after hydration for v1 (accepted behavior).

Notes:
- We should avoid direct sync `setState` calls in effect bodies that trip current lint rules (`react-hooks/set-state-in-effect`).
- Reconciliation should use a lint-safe pattern consistent with current codebase constraints.

### Phase 2: Intro Enter Animation
- Introduce explicit intro visibility phases, e.g.:
  - `hidden` (not rendered / collapsed)
  - `entering`
  - `visible`
- After hydration, if intro is not dismissed, transition from `hidden` -> `entering` -> `visible`.
- Use a `0 -> auto` style expansion approach (or measured max-height fallback) so intro starts at `0` height and expands, moving feed content down.
- Animation duration: **250ms** for v1.
- Respect reduced-motion preferences (skip animated transition when reduced motion is enabled).
- Run this intro animation only on first page-load hydration path (not on every subsequent re-show action).

### Phase 3: Dismiss/Reset Behavior Preservation
- Dismiss (`X`) still sets `slop:feedIntroDismissed=true` and hides intro immediately.
- Existing reset control still clears the key and re-shows intro.
- Re-show path from admin reset does **not** run the first-load animation by default in this phase.

### Phase 4: Verification + Guardrails
- Verify no hydration mismatch warning on hard refresh with all key combinations:
  - `slop:feedIntroDismissed`: unset / `true`
  - `slop:feedDisplayMode`: unset / `list-sm` / `list-lg` / `grid`
  - `slop:mode`: `on` / `off`
- Verify mobile behavior where persisted `list-lg` normalizes to `list-sm`.
- Verify intro enter animation and dismiss/reset UX.

## Expected Files to Touch
- `apps/web/src/app/page.tsx`
- `apps/web/src/lib/slop-mode.tsx`
- Possibly `apps/web/src/app/globals.css` (if shared animation utility classes are needed)

## Potential Problems / Risks
1. Intentional layout movement:
- Expanding from `0` height intentionally pushes content down; ensure this feels smooth (not janky) at 250ms.

2. Strict Mode double-invocation side effects:
- Mount-phase logic can fire twice in dev; animation sequencing must be idempotent.

3. Lint rule friction (`react-hooks/set-state-in-effect`):
- Naive post-mount reconciliation patterns may re-introduce lint errors.

4. Preference reconciliation race:
- If user interaction occurs during initial reconciliation window, state ordering must not clobber user action.

5. Slop mode mismatch outside feed:
- `slop:mode` is used globally (header and other pages). This patch should harden provider behavior globally, but needs cross-page verification.

## Decisions (Resolved)
1. Intro enter animation runs only on first page-load hydration path.
2. Intro should animate from `0` height and expand, intentionally moving content below.
3. Include `SlopModeProvider` hydration hardening now.
4. Intro animation duration is `250ms` for v1.
5. `displayMode` snapping after hydration is acceptable for v1.
6. Cookie-backed `displayMode` persistence is a possible future enhancement, out of scope for this patch.

## Rollback Plan
If animation introduces regressions, keep hydration-safe defaults and disable animation classes/phase transitions while retaining deterministic SSR behavior.
