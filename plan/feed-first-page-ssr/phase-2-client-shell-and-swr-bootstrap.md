# Phase 2: Client Shell + SWR Bootstrap

## Status

**Status:** Draft  
**Owner:** Web  
**Depends On:** Phase 1

## Goal

Move the existing interactive feed implementation into a dedicated client component and seed it from server-rendered page-1 data without regressing current UI behavior.

## Files To Change

- new: `/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx`
- [/Users/adam/code/slop.haus/apps/web/src/app/page.tsx](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/lib/api/projects.ts](/Users/adam/code/slop.haus/apps/web/src/lib/api/projects.ts)
- possible small touch: `/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx`

## Tasks

1. Extract the current feed page JSX and client hooks into `FeedPageClient.tsx`.
2. Define a narrow prop contract:
   - `initialFeed: FeedResponse | null`
   - `initialSort`
   - `initialWindow`
3. Seed `useSWRInfinite(...)` with the SSR page:
   - `fallbackData: initialFeed ? [initialFeed] : undefined`
   - `revalidateOnFocus: false`
   - `revalidateFirstPage: false`
4. Keep existing client-only concerns in this shell:
   - intro dismissal
   - display mode persistence
   - slop mode rendering
   - admin reset control
5. Keep existing load-more behavior client-side.
6. Ensure skeletons render only when there is no bootstrap data and the initial client request is still loading.

## Implementation Notes

- Treat `initialSort` and `initialWindow` as route-derived inputs, not new local source-of-truth state.
- Let the parent route key control remounting across feed views rather than trying to surgically reset `useSWRInfinite(...)` internals.
- Avoid mixing SSR bootstrap concerns into the intro/display/slop persistence logic.
- Remove now-unused root-page client code after extraction so there is only one feed implementation.

## Conceptual Shape

```ts
const getFeedKey: SWRInfiniteKeyLoader<FeedResponse, FeedKey | null> = (
  pageIndex,
  previousPageData
) => {
  if (previousPageData && pageIndex >= previousPageData.pagination.totalPages) {
    return null;
  }

  return ["feed", initialSort, initialWindow, pageIndex + 1];
};

const { data } = useSWRInfinite(
  getFeedKey,
  ([, sort, window, page]) => fetchFeed({ sort, window, page, limit: 20 }),
  {
    fallbackData: initialFeed ? [initialFeed] : undefined,
    revalidateOnFocus: false,
    revalidateFirstPage: false,
  }
);
```

## Verification Checklist

- [ ] Existing feed UI still renders correctly in `list-sm`, `list-lg`, and `grid`.
- [ ] Intro dismiss/reset behavior still works.
- [ ] Display mode still persists in `localStorage`.
- [ ] Slop mode still affects feed presentation.
- [ ] Initial SSR data is used directly when present.
- [ ] Skeletons show only when `initialFeed` is absent and the client fetch is pending.
- [ ] No immediate duplicate page-1 client fetch occurs after hydration.
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Risks / Watchpoints

1. If the client shell is not remounted per normalized route state, stale pages can bleed between feed views.
2. If `fallbackData` does not line up with the active SWR key, the first render can show mismatched data.
3. If the old `page.tsx` logic is only partially extracted, behavior can fork between server and client code paths.

## Exit Criteria

- The feed UI lives in one client shell component.
- SSR bootstrap data is the first page consumed by SWR.
- Existing client-only feed behavior remains intact.
