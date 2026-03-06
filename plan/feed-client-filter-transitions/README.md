# Feed Client Filter Transitions Implementation Plan

## Overview

Implement the follow-up architecture described in [feed-filter-route-navigation-rerender.md](/Users/adam/code/slop.haus/debug/feed-filter-route-navigation-rerender.md):

- keep SSR bootstrap for the initial page load
- keep deep-link support for non-default feed views
- move interactive `sort` / `window` transitions back to client-owned state after hydration
- keep the URL synchronized without causing a server navigation on every filter click

This plan is a targeted correction to the current feed SSR implementation. The goal is to preserve the benefits of SSR for first paint while restoring fast in-page filter transitions.

## Status: Complete

**Last Updated:** 2026-03-06  
**Owner:** Web

## Problem Summary

The current implementation made `sort` and `window` part of the server route contract for every interaction:

- filter changes call `router.replace(...)`
- the route server component re-runs on each change
- page-1 data is fetched again on the server with `cache: "no-store"`
- `FeedPageClient` is remounted via `key={`${sort}:${window}`}`

That is why feed filter changes now feel like full route transitions.

## Target Behavior

1. Hard refresh on `/` or a deep link like `/?sort=top&window=30d` should still SSR the correct first page.
2. After hydration, changing feed filters should:
   - update the visible URL
   - update the feed data client-side via SWR
   - avoid a server round-trip
   - avoid remounting the full feed client shell
3. Load-more pagination should remain client-side.

## Locked Direction

1. SSR remains responsible for the first render only.
2. After hydration, the client shell becomes the source of truth for active filter state.
3. URL sync should not use App Router navigation for ordinary filter clicks.
4. Deep links must still bootstrap correctly on first load.
5. We should minimize churn to intro/display-mode/slop-mode behavior.
6. Use `window.history.replaceState(...)` for v1 filter URL sync.
7. Do not create per-filter history entries in v1.
8. Preserve scroll position on filter changes in v1.

## Phase Summary

| Phase | Name | Status | Description |
| --- | --- | --- | --- |
| 1 | [State Ownership + Bootstrap Refactor](./phase-1-state-ownership-and-bootstrap-refactor.md) | ✅ Implemented | The client shell owns live filter state after SSR bootstrap |
| 2 | [Non-Navigating URL Sync](./phase-2-non-navigating-url-sync.md) | ✅ Implemented | Feed filters now update the URL with `replaceState` instead of App Router navigation |
| 3 | [SWR Reset + Interaction Preservation](./phase-3-swr-reset-and-interaction-preservation.md) | ✅ Implemented | Filter changes reset feed data through SWR without a full route-like remount |
| 4 | [Verification + Cleanup](./phase-4-verification-and-cleanup.md) | ✅ Completed | Browser QA confirmed SSR first load, client-side transitions, and transition performance behavior |

## Dependencies

```text
Phase 1 (bootstrap-only server route + client-owned filter state)
  -> Phase 2 (URL sync without navigation)
    -> Phase 3 (SWR reset and interaction preservation)
      -> Phase 4 (verification and cleanup)
```

## Milestones

### Milestone 1: Bootstrap-Only SSR
- `/` still SSRs page 1.
- Non-default deep links still SSR the correct first page.
- After hydration, `sort` and `window` no longer depend on route remounts.

### Milestone 2: Smooth Client Transitions
- Filter changes update data through SWR/client state.
- Filter changes no longer trigger server requests.
- The client feed shell does not remount on every filter click.

### Milestone 3: URL Integrity Preserved
- The address bar reflects active filter state.
- Shared/reloaded URLs still work.
- Canonical omission of default params remains intact.

### Milestone 4: Release Confidence
- Initial SSR payload is preserved.
- Interactive feed transitions feel local again.
- Edge cases like invalid params and back/forward behavior are understood and tested.

## Non-Goals

- Reverting the SSR bootstrap feature entirely.
- URL-backed infinite pagination.
- Reworking intro dismissal, display mode, or slop mode persistence.
- Broader routing changes outside the root feed route.

## Cross-Cutting Risks

1. URL sync without App Router navigation can drift from application state if normalization is not centralized.
2. If SWR keys and local filter state are not reset carefully, stale pages can bleed across views.
3. Back/forward behavior becomes an explicit product choice once we stop using route navigation for every filter click.
4. Removing the server remount can expose assumptions that currently rely on `key={`${sort}:${window}`}` resets.

## Decision Notes

1. V1 uses `replaceState`, not `pushState`, for filter clicks.
2. V1 does not create browser-history steps for each filter change.
3. V1 preserves the current scroll position during filter changes.

## Recommendation

Implement the smallest version that restores local-feeling transitions:

- keep the current server bootstrap path
- remove server ownership of live filter state after hydration
- synchronize the URL with the History API instead of App Router navigation
- let SWR react to local filter state changes directly

That preserves SSR for first paint while aligning interaction behavior with user expectations.

## Exit Criteria

- Initial page load still SSRs the correct feed view.
- Filter changes no longer trigger server route rerenders.
- URL and feed state remain synchronized.
- SWR pagination resets correctly on filter changes without a full client remount.
