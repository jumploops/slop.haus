# Phase 3: SWR Reset + Interaction Preservation

## Status

**Status:** ✅ Implemented (2026-03-06)  
**Owner:** Web  
**Depends On:** Phase 2

## Goal

Make local filter changes reset feed data cleanly through SWR while preserving the rest of the feed UI state.

## Files To Change

- [/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx)
- possible small touch: [/Users/adam/code/slop.haus/apps/web/src/lib/api/projects.ts](/Users/adam/code/slop.haus/apps/web/src/lib/api/projects.ts)

## Tasks

1. Ensure `useSWRInfinite(...)` keys depend on local `sort` / `window` state.
2. Reset pagination to page 1 when local filters change.
3. Preserve initial `fallbackData` only for the bootstrap state, not for subsequent client-side filter states.
4. Avoid showing stale pages from the previous filter state during transitions.
5. Preserve client-only UI state where appropriate:
   - intro dismissal state
   - display mode
   - slop mode
6. Keep `Load More` behavior unchanged for the active local filter state.

## Implementation Notes

- Once the client shell owns filter state, SWR becomes the primary mechanism for changing feed data again.
- We need a deliberate reset path for `size` and any derived pagination metrics when filters change.
- The desired UX is “feed rows update”, not “entire page remounts”.
- If necessary, small localized loading states for feed rows are acceptable; whole-page reset is not.

## Conceptual Shape

```ts
const getFeedKey = (pageIndex, previousPageData) => {
  return ["feed", sort, timeWindow, pageIndex + 1];
};

useEffect(() => {
  setSize(1);
}, [sort, timeWindow, setSize]);
```

## Verification Checklist

- [ ] Switching between `hot`, `new`, and `top` updates feed rows without full-page reset.
- [ ] Pagination resets to page 1 when filters change.
- [ ] Old pages do not bleed into the new filter view.
- [ ] `Load More` still works after filter changes.
- [ ] Intro does not reappear just because filters changed.
- [ ] Display mode does not reset on filter changes.
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Risks / Watchpoints

1. Restoring `setSize(1)` behavior on filter changes can interact badly with SSR fallback data if keys are not aligned.
2. If SWR retains prior pages under overlapping keys, the feed can flash stale content.
3. The `top` window selector behavior needs to remain coherent when local state, URL state, and data state all update together.

## Exit Criteria

- SWR responds correctly to local filter changes.
- Feed content updates locally without full client remounts.
