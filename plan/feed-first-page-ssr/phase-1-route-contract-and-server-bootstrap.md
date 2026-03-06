# Phase 1: Route Contract + Server Bootstrap

## Status

**Status:** ✅ Implemented (2026-03-06)  
**Owner:** Web  
**Depends On:** None

## Goal

Establish a single canonical contract for feed route state and use it to server-render page 1 of the feed.

This phase should produce a thin server wrapper page for `/` that:

- parses `searchParams`
- normalizes `sort` and `window`
- fetches page 1 from the API using `NEXT_PUBLIC_API_URL`
- passes bootstrap data into a client feed shell

## Files To Change

- [/Users/adam/code/slop.haus/apps/web/src/app/page.tsx](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx)
- new: `/Users/adam/code/slop.haus/apps/web/src/lib/feed-query.ts`
- new: `/Users/adam/code/slop.haus/apps/web/src/lib/server/feed.ts`
- possible doc touch: [/Users/adam/code/slop.haus/.env.example](/Users/adam/code/slop.haus/.env.example)

## Tasks

1. Add shared feed query helpers in `apps/web/src/lib/feed-query.ts`:
   - `DEFAULT_FEED_SORT = "hot"`
   - `DEFAULT_FEED_WINDOW = "all"`
   - normalization helpers for raw `searchParams`
   - canonical URL/search-param builder that omits defaults
2. Add a server-only feed bootstrap helper in `apps/web/src/lib/server/feed.ts`:
   - builds the query string
   - fetches `/api/v1/projects`
   - uses `process.env.NEXT_PUBLIC_API_URL`
   - uses `cache: "no-store"`
   - throws on non-OK responses
3. Convert `apps/web/src/app/page.tsx` into an async server page:
   - read `searchParams`
   - normalize `sort` and `window`
   - fetch page 1 with `limit=20`
   - catch failures and set `initialFeed = null`
   - render the client shell with `initialFeed`, `initialSort`, and `initialWindow`
4. Key the client shell by normalized route state so feed-view transitions reset client pagination cleanly.

## Implementation Notes

- Keep parsing and URL generation in one helper module to avoid server/client drift.
- Use the existing `FeedResponse` type instead of inventing a duplicate server-side shape.
- Reusing `NEXT_PUBLIC_API_URL` is acceptable here because the deployed browser and SSR paths target the same API service.
- If Next does not clearly infer the page as dynamic from the `no-store` fetch, add route-level dynamic config only if needed.

## Conceptual Shape

```ts
const { sort, window } = parseFeedRoute(searchParams);

let initialFeed: FeedResponse | null = null;
try {
  initialFeed = await fetchFeedPageServer({ sort, window, page: 1, limit: 20 });
} catch {
  initialFeed = null;
}

return (
  <FeedPageClient
    key={`${sort}:${window}`}
    initialFeed={initialFeed}
    initialSort={sort}
    initialWindow={window}
  />
);
```

## Verification Checklist

- [ ] `/` server-renders without `"use client"` at the route level.
- [ ] `/?sort=new`, `/?sort=top&window=30d`, and `/?window=7d` resolve to the expected normalized values.
- [ ] Invalid params fall back to `hot` / `all`.
- [ ] When the API request fails, the page still renders and passes `initialFeed = null`.
- [ ] `NEXT_PUBLIC_API_URL` is the base used by the server helper, with localhost fallback in local dev.
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Risks / Watchpoints

1. Missing `NEXT_PUBLIC_API_URL` in the web runtime will force the localhost fallback; that is acceptable in local dev but should be explicit in deployed environments.
2. Inbound invalid query params can still leave a non-canonical URL in the address bar unless we explicitly redirect, which is out of scope for this phase.
3. Server bootstrap introduces a new dependency from web runtime to API runtime availability.

## Exit Criteria

- The root page is a server wrapper.
- Feed route parsing is centralized.
- The page can obtain normalized page-1 feed data on the server or gracefully fall back.
