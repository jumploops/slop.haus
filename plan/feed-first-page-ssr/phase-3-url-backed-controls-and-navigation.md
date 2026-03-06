# Phase 3: URL-Backed Controls + Navigation

## Status

**Status:** Draft  
**Owner:** Web  
**Depends On:** Phase 2

## Goal

Make feed controls URL-backed so non-default views are shareable, reload-stable, and SSR-consistent.

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/lib/feed-query.ts`
- possible small touch: `/Users/adam/code/slop.haus/apps/web/src/components/ui/Tabs.tsx`

## Tasks

1. Replace local-only `sort` and `timeWindow` state transitions with route transitions.
2. Use canonical URL helpers from `feed-query.ts` to build the next route.
3. On feed-control change:
   - update the URL with normalized params
   - reset pagination to page 1 via route remount
   - keep load-more pages out of the URL
4. Use `router.replace(...)` for filter changes.
5. Preserve clean URLs by omitting defaults from generated search params.
6. Keep the current control UI and copy unchanged unless a small affordance is required by the route-driven model.

## Implementation Notes

- Prefer route-derived `sort`/`window` values over duplicating them in React state.
- The server page should be the source of truth for the active feed view; the client shell should request navigation rather than locally mutating a separate copy.
- Validate the interaction between `router.replace(...)` and SWR remounting so there is no transient flash of the previous feed.
- For v1, avoid URL-modeling `page`; remounting back to page 1 is the intended behavior when filters change.

## Conceptual Shape

```ts
const router = useRouter();

function handleSortChange(nextSort: FeedSort) {
  router.replace(buildFeedUrl({ sort: nextSort, window: initialWindow }));
}

function handleWindowChange(nextWindow: FeedWindow) {
  router.replace(buildFeedUrl({ sort: initialSort, window: nextWindow }));
}
```

## Verification Checklist

- [ ] Changing sort updates the URL.
- [ ] Changing time window updates the URL.
- [ ] Default feed view resolves to `/` rather than verbose default params.
- [ ] Reloading `/?sort=top&window=30d` SSR-renders the same view.
- [ ] Browser back/forward restores the expected feed view.
- [ ] Filter changes reset pagination to page 1.
- [ ] Featured section behavior remains correct for `hot` only.
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Risks / Watchpoints

1. `router.replace(...)` history behavior is intentional, but it may surprise users expecting back-button steps per filter change.
2. Scroll behavior on filter change may feel off depending on Next navigation defaults.
3. If URL helpers include defaults inconsistently, links and SSR parsing will drift.

## Non-Blocking Questions To Verify In QA

1. Should filter changes preserve scroll position or jump to top?
2. Is `router.replace(...)` the right history behavior, or does product want `push(...)` despite noisier history?

These do not block the architecture, but they should be confirmed during implementation QA.

## Exit Criteria

- Feed controls are URL-backed.
- Reloads and shared links preserve the selected feed view.
- Pagination resets cleanly when filters change.
