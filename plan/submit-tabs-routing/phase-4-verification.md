# Phase 4: Verification + Cleanup

## Status

**Status:** ✅ Completed (2026-02-24)  
**Owner:** Web + API  
**Depends On:** Phases 1-3

## Goal

Validate route behavior, auth policy, and type safety after submit tab refactor.

## Files To Check

- `/Users/adam/code/slop.haus/apps/web/src/app/submit/page.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/app/submit/url/page.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/app/submit/repo/page.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/app/submit/manual/page.tsx`
- `/Users/adam/code/slop.haus/apps/api/src/routes/drafts.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/projects.ts`

## Tasks

1. Run web and api typechecks.
2. Validate URL/repo/manual tab navigation and defaults.
3. Validate non-GitHub submission and linked-GitHub repo flow.
4. Update phase statuses to complete.

## Verification Checklist

- [x] `pnpm -F @slop/web exec tsc --noEmit`
- [x] `pnpm -F @slop/api exec tsc --noEmit`
- [x] All phase docs marked complete with outcomes.
