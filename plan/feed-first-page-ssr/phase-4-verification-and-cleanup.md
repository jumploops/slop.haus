# Phase 4: Verification + Cleanup

## Status

**Status:** Draft  
**Owner:** Web  
**Depends On:** Phase 3

## Goal

Verify that SSR feed bootstrap is actually happening, that the client does not immediately duplicate the request, and that failure/edge cases behave predictably.

## Files To Change

- possible doc touch: [/Users/adam/code/slop.haus/design/feed-first-page-ssr.md](/Users/adam/code/slop.haus/design/feed-first-page-ssr.md)
- possible doc touch: [/Users/adam/code/slop.haus/PR_SUMMARY.md](/Users/adam/code/slop.haus/PR_SUMMARY.md)
- any small cleanup in:
  - [/Users/adam/code/slop.haus/apps/web/src/app/page.tsx](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx)
  - `/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx`
  - `/Users/adam/code/slop.haus/apps/web/src/lib/feed-query.ts`
  - `/Users/adam/code/slop.haus/apps/web/src/lib/server/feed.ts`

## Tasks

1. Verify SSR content behavior:
   - hard refresh `/`
   - hard refresh a non-default view
   - confirm real project content is present before client hydration completes
2. Verify network behavior:
   - confirm no immediate duplicate client request for page 1 after hydration
   - confirm load-more still performs client requests for later pages
3. Verify failure behavior:
   - API unavailable during SSR bootstrap
   - invalid `sort` and `window` params
   - missing or misconfigured `API_URL`
4. Verify interactive behavior:
   - intro dismissal/reset
   - display mode persistence
   - slop mode
   - featured section on `hot` only
5. Run static checks and clean up any dead code left behind by the route split.

## Manual QA Matrix

- `/`
- `/?sort=new`
- `/?sort=top&window=30d`
- `/?window=7d`
- `/?sort=bad`
- `/?window=bad`
- SSR success path
- SSR bootstrap failure path
- client-only recovery path after SSR bootstrap failure

## Verification Checklist

- [ ] Initial HTML contains actual project content for the active feed view.
- [ ] Skeletons are not the only initial payload when SSR bootstrap succeeds.
- [ ] No hydration mismatch is introduced by the server/client split.
- [ ] No immediate duplicate page-1 request occurs after hydration.
- [ ] Page-2+ requests still happen through the client load-more path.
- [ ] Invalid query params normalize safely.
- [ ] Missing `API_URL` fails in a diagnosable way and does not white-screen the route.
- [ ] `pnpm -F @slop/web run lint`
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Risks / Watchpoints

1. It is easy to think SSR is working when the page is simply hydrating very quickly; verification should explicitly inspect HTML or disable JS.
2. Fallback-to-client-fetch can mask SSR failures if logs or error handling are too quiet.
3. Route remounting can leave behind dead helper code in the old root page if cleanup is not done deliberately.

## Exit Criteria

- SSR bootstrap is verified for default and non-default feed views.
- Client fallback behavior is verified.
- Static checks pass.
- The implementation matches the locked decisions in the design doc and plan README.
