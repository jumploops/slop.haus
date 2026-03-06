# Phase 1: State Ownership + Bootstrap Refactor

## Status

**Status:** ✅ Implemented (2026-03-06)  
**Owner:** Web  
**Depends On:** None

## Goal

Keep the server route responsible for first-load bootstrap only, then hand off live filter ownership to the client shell.

## Files To Change

- [/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/lib/feed-query.ts](/Users/adam/code/slop.haus/apps/web/src/lib/feed-query.ts)

## Tasks

1. Keep server parsing of incoming `searchParams` so SSR deep links still work.
2. Continue fetching page 1 on the server for the initial route state.
3. Pass bootstrap values into the client shell as initial values, not permanent route-owned source of truth:
   - `initialFeed`
   - `initialSort`
   - `initialWindow`
4. In `FeedPageClient`, restore local `sort` / `window` state initialized from those props.
5. Stop relying on route-driven remounts for ordinary filter changes.
6. Make the client shell responsible for reacting to filter changes without App Router navigation.

## Implementation Notes

- The server page should continue to parse route params for first render and deep links.
- The client shell should treat `initialSort` / `initialWindow` as bootstrap inputs only.
- Avoid a split-brain model by continuing to use shared normalization helpers from `feed-query.ts`.
- Keep intro/display/slop local behavior untouched in this phase.

## Conceptual Shape

```ts
export default async function FeedPage({ searchParams }: FeedPageProps) {
  const routeState = parseFeedRoute(await searchParams);
  const initialFeed = await fetchFeedPageServer(...);

  return (
    <FeedPageClient
      initialFeed={initialFeed}
      initialSort={routeState.sort}
      initialWindow={routeState.window}
    />
  );
}
```

```ts
const [sort, setSort] = useState(initialSort);
const [timeWindow, setTimeWindow] = useState(initialWindow);
```

## Verification Checklist

- [ ] `/` still SSRs with default feed state.
- [ ] `/?sort=new` and `/?sort=top&window=30d` still SSR correctly on hard refresh.
- [ ] Filter changes no longer depend on App Router route remounts.
- [ ] Intro and display-mode behavior still work after removing the client shell key.
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Risks / Watchpoints

1. Removing the client shell key can expose stale state if SWR and local filter state are not reset deliberately.
2. If `initialSort` / `initialWindow` are treated as controlled props instead of bootstrap props, the architecture will remain route-driven by accident.

## Exit Criteria

- Server route bootstraps first render only.
- Client shell owns live filter state after hydration.
