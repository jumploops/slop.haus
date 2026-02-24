# Phase 2: Submit Route Tabs + Shared Nav

## Status

**Status:** ✅ Completed (2026-02-24)  
**Owner:** Web  
**Depends On:** Phase 1

## Goal

Move submit experience to dedicated route tabs and add a shared mobile-friendly tab navigation.

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/src/app/submit/page.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/app/submit/url/page.tsx` (new)
- `/Users/adam/code/slop.haus/apps/web/src/app/submit/repo/page.tsx` (new)
- `/Users/adam/code/slop.haus/apps/web/src/components/submit/SubmitTabs.tsx` (new)

## Tasks

1. Make `/submit` a smart redirect page using user `hasGitHub`.
2. Move URL analyze flow into `/submit/url`.
3. Create `/submit/repo` flow for repo selection and analyze submission.
4. Add shared route-tab navigation for URL/Repo/Manual routes.

## Verification Checklist

- [x] `/submit` redirects to `/submit/repo` when `hasGitHub=true`.
- [x] `/submit` redirects to `/submit/url` when `hasGitHub=false`.
- [x] Tabs render on `/submit/url`, `/submit/repo`, `/submit/manual`.
- [x] URL and repo flows still reach analyze progress and draft review.
