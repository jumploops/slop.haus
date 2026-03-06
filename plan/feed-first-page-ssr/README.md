# Feed First-Page SSR Implementation Plan

## Overview

Implement the approved SSR bootstrap design from [design/feed-first-page-ssr.md](/Users/adam/code/slop.haus/design/feed-first-page-ssr.md) so the first page of the feed is rendered in the initial HTML payload instead of appearing only after client-side SWR fetches complete.

The implementation should keep the current interactive feed behavior intact while moving the initial page-1 data fetch to the server:

- first-page projects render in SSR HTML
- sort and time window become URL-backed
- pagination remains client-side
- intro dismissal, display mode, and slop mode remain client-only
- failed SSR bootstrap degrades gracefully to the current client-fetch path

Interactive filter transitions were later refined in the follow-up plan at [plan/feed-client-filter-transitions/README.md](/Users/adam/code/slop.haus/plan/feed-client-filter-transitions/README.md), so this document tracks the SSR bootstrap foundation rather than the final transition model.

## Status: Complete

**Last Updated:** 2026-03-06  
**Owner:** Web

## Locked Decisions

1. Use SSR for feed page 1.
2. Use `cache: "no-store"` for the server feed fetch.
3. Do not immediately background-revalidate page 1 on hydration.
4. Make `sort` and `window` URL-backed in v1.
5. Use `process.env.NEXT_PUBLIC_API_URL` for the server-side feed fetch helper.
6. Keep load-more pagination client-only in v1.
7. Keep intro dismissal, display mode, and slop mode client-only.
8. Gracefully fall back to client fetch if server bootstrap fails.
9. Omit default query params from canonical feed URLs when possible.
10. Keep feed URLs synchronized in v1; the shipped implementation uses client-side history updates for live filter changes.

## Phase Summary

| Phase | Name | Status | Description |
| --- | --- | --- | --- |
| 1 | [Route Contract + Server Bootstrap](./phase-1-route-contract-and-server-bootstrap.md) | ✅ Implemented | Added feed query normalization, server fetch helper, and server wrapper page |
| 2 | [Client Shell + SWR Bootstrap](./phase-2-client-shell-and-swr-bootstrap.md) | ✅ Implemented | Extracted the feed UI into a client component seeded from SSR data |
| 3 | [URL-Backed Controls + Navigation](./phase-3-url-backed-controls-and-navigation.md) | ✅ Implemented | URL-backed feed state shipped; live filter transitions were later refined in the follow-up client-transition plan |
| 4 | [Verification + Cleanup](./phase-4-verification-and-cleanup.md) | ✅ Completed | Browser QA confirmed SSR bootstrap, deep-link behavior, and client recovery behavior |

## Dependencies

```text
Phase 1 (server route contract + bootstrap helper)
  -> Phase 2 (client shell seeded by SSR page-1 data)
    -> Phase 3 (URL-driven controls and route transitions)
      -> Phase 4 (verification and cleanup)
```

## Milestones

### Milestone 1: Server Bootstrap Ready
- `/` is a server page again.
- Route search params are parsed and normalized consistently.
- Page 1 of the feed can be fetched on the server via `NEXT_PUBLIC_API_URL`.

### Milestone 2: Interactive Feed Preserved
- Existing feed UI lives in a dedicated client shell.
- SSR page-1 data is reused by `useSWRInfinite(...)` without a duplicate hydration fetch.
- Intro, display mode, and slop mode continue to work.

### Milestone 3: Shareable Feed Views Ready
- `sort` and `window` are reflected in the URL.
- Reloading or sharing a non-default feed view preserves that view.
- Changing feed controls resets pagination to page 1 without stale data leaks.

### Milestone 4: Release Confidence
- Root feed renders real cards in SSR HTML.
- No immediate duplicate page-1 client request occurs after hydration.
- Invalid query params and SSR bootstrap failures degrade safely.

## Non-Goals

- URL-backed infinite pagination.
- A broader feed architecture rewrite outside the root page.
- Personalizing the SSR feed response by user/session in v1.
- Reworking intro/display-mode/slop-mode persistence beyond keeping them functional.

## Cross-Cutting Risks

1. `NEXT_PUBLIC_API_URL` must be present or fall back cleanly in the web runtime for both browser and SSR fetch paths.
2. URL state can become split-brain if search-param parsing and client URL generation do not share one normalization contract.
3. `useSWRInfinite(...)` can issue an unnecessary first-page refetch if seeded/configured incorrectly.
4. Route changes can leave stale paginated pages visible if the client shell is not reset cleanly per feed view.
5. Moving the root page back to SSR can surface dynamic-rendering assumptions that the current client-only page avoided.

## Recommended Order of Execution

1. Finish the server route contract first.
2. Move the existing feed UI into a client shell with minimal behavioral changes.
3. Only then wire feed controls to the URL.
4. End with SSR verification and runtime/env cleanup.

This keeps the highest-risk boundary changes small and easier to validate.

## Exit Criteria

- All phase docs are implementation-ready and reviewed.
- The first feed page is available in SSR HTML for default and non-default feed views.
- Client hydration does not immediately refetch page 1.
- Feed controls are URL-backed and reload-stable.
- Fallback behavior is defined and verified for API errors and invalid query params.
