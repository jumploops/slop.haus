# Phase 4: Web Auth UX Alignment + Final Verification

**Status:** Completed (2026-02-23)  
**Owner:** Web + API  
**Depends On:** Phase 3

## Goal

Align frontend auth UX with anonymous-session semantics (anonymous users behave like guests for protected features for now), then validate end-to-end behavior.

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/src/components/auth/RequireAuth.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/auth/AuthButtons.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/layout/MobileNav.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/hooks/useFavorite.ts`
- `/Users/adam/code/slop.haus/apps/web/src/components/comment/CommentForm.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/comment/CommentItem.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/lib/api/auth.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/auth.ts` (if response typing needs explicit `isAnonymous`)

## Tasks

1. Update frontend auth checks from “has session user” to “has non-anonymous session user” where flows should stay gated.
2. Ensure login controls remain visible for anonymous visitors (desktop and mobile nav).
3. Keep protected pages (`/submit`, `/favorites`, `/my/projects`, `/settings`) behind non-anonymous auth behavior.
4. Ensure favorite/comment interactions show sign-in path rather than silently failing with 401 for anonymous visitors.
5. Add/update types to expose `isAnonymous` where needed for client logic.
6. Run full manual flow validation.

## Key Design Notes

- This phase is primarily UX/behavior consistency; backend guardrails are already in place from Phase 1.
- Keeping anonymous users guest-like avoids confusion while still allowing us to keep full anonymous auth/linking infrastructure in place.
- Broader anonymous actions (likes/comments) are intentionally deferred and tracked in `/Users/adam/code/slop.haus/TODO.md`.

## Code Snippets

```ts
// client helper concept
const isRegisteredUser = Boolean(session?.user && !session.user.isAnonymous);
```

```tsx
// RequireAuth concept
if (!isPending && (!session?.user || session.user.isAnonymous)) {
  openLoginModal();
}
```

## Verification Checklist

- [x] Anonymous visitors still see Sign In CTA in header/nav.
- [x] Anonymous visitors are prompted to sign in for favorites/comments/submit/settings.
- [x] Protected API endpoints return 401 for anonymous sessions.
- [x] Anonymous users can convert to real account via social sign-in without FK/delete errors.
- [x] Visitor counter still increments once on fresh browser and not on repeat loads.
- [x] `pnpm -F @slop/api exec tsc --noEmit`
- [x] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- Feature is behaviorally correct end-to-end.
- Anonymous visitor counting works without regressions to existing auth-gated product flows.
