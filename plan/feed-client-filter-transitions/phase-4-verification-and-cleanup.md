# Phase 4: Verification + Cleanup

## Status

**Status:** ✅ Completed (2026-03-06)  
**Owner:** Web  
**Depends On:** Phase 3

## Goal

Verify that SSR still works on first load while interactive filter changes stay fully client-side and local-feeling.

## Files To Change

- possible doc touch: [/Users/adam/code/slop.haus/debug/feed-filter-route-navigation-rerender.md](/Users/adam/code/slop.haus/debug/feed-filter-route-navigation-rerender.md)
- possible doc touch: [/Users/adam/code/slop.haus/PR_SUMMARY.md](/Users/adam/code/slop.haus/PR_SUMMARY.md)
- any small cleanup in:
  - [/Users/adam/code/slop.haus/apps/web/src/app/page.tsx](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx)
  - [/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx)
  - [/Users/adam/code/slop.haus/apps/web/src/lib/feed-query.ts](/Users/adam/code/slop.haus/apps/web/src/lib/feed-query.ts)

## Tasks

1. Verify SSR bootstrap still works:
   - hard refresh `/`
   - hard refresh `/?sort=new`
   - hard refresh `/?sort=top&window=30d`
2. Verify client transition behavior:
   - click between `Hot`, `New`, `Top`
   - change time windows
   - confirm no server request is triggered for those interactions
3. Verify local UI preservation:
   - display mode stays selected
   - intro visibility does not reset
   - slop mode styling remains stable
4. Verify pagination behavior:
   - load page 2+
   - switch filters
   - confirm pagination resets cleanly
5. Verify URL behavior:
   - address bar updates correctly
   - default route remains canonical
   - back/forward behavior is explicitly understood and documented
6. Run static checks and remove any now-dead route-remount code.

## Manual QA Matrix

- Hard refresh `/`
- Hard refresh `/?sort=new`
- Hard refresh `/?sort=top&window=30d`
- Click `Hot -> New -> Top -> Hot`
- Change `window` on top
- Load more, then switch sort
- Reload after client-side filter change
- Back/forward after one or more filter changes

## Verification Checklist

- [x] First load still SSRs correct cards for default and deep-link views.
- [x] Filter changes no longer trigger server route rerenders.
- [x] Filter changes no longer feel like a full page reset.
- [x] URL stays in sync with local filter state.
- [x] Pagination resets correctly on filter change.
- [x] No hydration mismatch is introduced.
- [x] `pnpm -F @slop/web run lint`
- [x] `pnpm -F @slop/web exec tsc --noEmit`

## Risks / Watchpoints

1. It is easy to avoid server rerenders but accidentally break deep-link bootstrap behavior.
2. Browser history behavior can feel wrong if we do not deliberately choose between `replaceState` and `pushState`.
3. If we preserve too much client state blindly, some views may display stale feed data during transitions.

## Exit Criteria

- SSR is preserved for first load.
- Interactive filter changes are client-side.
- URL sync works as intended.
- Static checks pass.
