# Phase 3: GitHub Link Return + UX Copy

## Status

**Status:** ✅ Completed (2026-02-24)  
**Owner:** Web  
**Depends On:** Phase 2

## Goal

Ensure repo tab handles unlinked users with link CTA and returns them to repo tab after OAuth linking.

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/src/app/submit/repo/page.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/auth/LoginModal.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/app/settings/connections/page.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/lib/errors.ts`

## Tasks

1. Add unlinked state callout in repo tab with same-email note.
2. Call `linkSocial` with callback URL targeting `/submit/repo`.
3. Update copy to remove “GitHub required to submit” messaging.
4. Keep messaging that GitHub link unlocks one-click repo selection.

## Verification Checklist

- [x] Unlinked users see link CTA in repo tab.
- [x] Linking redirects back to `/submit/repo`.
- [x] Repo list loads automatically after successful link.
- [x] Updated copy reflects new non-GitHub submission policy.
