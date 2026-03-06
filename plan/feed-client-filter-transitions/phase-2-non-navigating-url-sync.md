# Phase 2: Non-Navigating URL Sync

## Status

**Status:** ✅ Implemented (2026-03-06)  
**Owner:** Web  
**Depends On:** Phase 1

## Goal

Keep the URL synchronized with active feed filters without using App Router navigation for ordinary filter changes.

## Files To Change

- [/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/lib/feed-query.ts](/Users/adam/code/slop.haus/apps/web/src/lib/feed-query.ts)

## Tasks

1. Replace `router.replace(...)` in feed filter handlers with non-navigating URL synchronization.
2. Use shared `buildFeedHref(...)` helpers so URL normalization stays consistent.
3. Use `replaceState` so filter clicks keep the current history entry updated.
4. Ensure default params are still omitted from the visible URL.
5. Prevent accidental App Router navigations during ordinary filter interaction.

## Implementation Notes

- The key requirement is “URL sync without route navigation”.
- The URL write path should be isolated in one helper inside `FeedPageClient` or a small browser utility.
- If we want back/forward to rehydrate local filter state later, phase 2 should leave room for a `popstate` listener in phase 4 or a follow-up patch.
- Do not reintroduce `router.replace(...)` here unless we explicitly decide server navigation is acceptable.

## Conceptual Shape

```ts
function syncFeedUrl(nextState: FeedRouteState) {
  const href = buildFeedHref(nextState);
  window.history.replaceState(window.history.state, "", href);
}
```

## Verification Checklist

- [ ] Clicking `Hot`, `New`, and `Top` updates the address bar.
- [ ] Changing time window updates the address bar.
- [ ] Filter changes do not trigger a route navigation.
- [ ] Default state still canonicalizes to `/`.
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Risks / Watchpoints

1. History API writes do not automatically solve back/forward behavior; that remains an explicit follow-up if product wants it later.
2. Because v1 uses `replaceState`, users cannot step back through prior filter choices.

## Exit Criteria

- Feed controls update the URL without server navigation.
- URL normalization stays consistent with SSR bootstrap parsing.
