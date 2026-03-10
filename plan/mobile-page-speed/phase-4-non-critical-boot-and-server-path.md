# Phase 4: Non-Critical Boot + Server Path

**Status:** In Progress  
**Owner:** Web + API  
**Depends On:** Phase 3

## Goal

Reduce first-load contention from client systems that are not required for the initial feed paint, and revisit the SSR bootstrap path only if Phase 1 proves it is materially slow.

This phase is deliberately second-order. Phase 1 did not support the server/bootstrap path as the first fix target, so this phase should stay focused on non-critical client work unless later traces show a different production bottleneck.

## Files To Change

- [/Users/adam/code/slop.haus/apps/web/src/lib/api.ts](/Users/adam/code/slop.haus/apps/web/src/lib/api.ts)
- [/Users/adam/code/slop.haus/apps/web/src/hooks/useLike.ts](/Users/adam/code/slop.haus/apps/web/src/hooks/useLike.ts)
- [/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/app/providers.tsx](/Users/adam/code/slop.haus/apps/web/src/app/providers.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/components/auth/EnsureAnonymous.tsx](/Users/adam/code/slop.haus/apps/web/src/components/auth/EnsureAnonymous.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/components/layout/VisitorCounter.tsx](/Users/adam/code/slop.haus/apps/web/src/components/layout/VisitorCounter.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx](/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx)
- possible above-the-fold consumers of session/theme state:
  - [/Users/adam/code/slop.haus/apps/web/src/components/layout/Header.tsx](/Users/adam/code/slop.haus/apps/web/src/components/layout/Header.tsx)
  - [/Users/adam/code/slop.haus/apps/web/src/components/auth/AuthButtons.tsx](/Users/adam/code/slop.haus/apps/web/src/components/auth/AuthButtons.tsx)
  - [/Users/adam/code/slop.haus/apps/web/src/components/layout/MobileNav.tsx](/Users/adam/code/slop.haus/apps/web/src/components/layout/MobileNav.tsx)
- server fetch path only if justified by measurements:
  - [/Users/adam/code/slop.haus/apps/web/src/lib/server/feed.ts](/Users/adam/code/slop.haus/apps/web/src/lib/server/feed.ts)

## Recommended Strategy

1. Defer anonymous auth/session work until after first paint if product correctness allows it.
2. Lazy-mount footer-only and analytics work so it does not compete with above-the-fold rendering.
3. Reduce feed-card and feed-shell network fan-out that is not needed for initial paint, especially per-card `like-state` requests.
4. Remove unnecessary session-dependent logic from the feed shell if it only controls debug/admin affordances.
5. Only modify SSR feed caching/freshness if later traces prove the public feed bootstrap path is a meaningful bottleneck outside the current local Phase 1 evidence.

## Tasks

1. Audit `EnsureAnonymous` and decide whether anonymous sign-in can be delayed until:
   - `requestIdleCallback`
   - first user interaction
   - first action that actually requires a session
2. Audit `useSession()` usage in above-the-fold components and reduce it where the session value is not necessary for initial paint.
3. Rework per-card `like-state` fetching so first paint does not fan out into `21` `OPTIONS` plus `21` `GET` requests on the default `/` path.
   - preferred path: batch, inline, or defer until interaction/viewport
   - avoid paying CORS preflight cost per card during initial load
4. Defer or lazy-mount `VisitorCounter` since it lives in the footer and is not part of the critical path.
5. Keep analytics loading behind consent, but also ensure it does not introduce avoidable first-paint work.
6. Remove feed-shell session reads that only exist to show reset/debug affordances if they affect initial render cost.
7. If later timing proves the SSR bootstrap path is slow in a production-relevant environment:
   - test a short revalidate window for public feed bootstrap
   - or add upstream caching/CDN support
   - document freshness tradeoffs explicitly
8. Re-run trace/network comparisons after each change group so second-order optimizations are not guessed at blindly.

## Design Notes

- Anonymous-session correctness matters, but first paint should not depend on it if the feed is public.
- Footer-only work is a good candidate for intersection- or idle-based loading.
- The `like-state` fan-out is now a measured first-load tax, not a hypothetical cleanup item.
- A server caching change should not be bundled in just because it might help. It should be justified by real timing measurements in a relevant environment.

## Code Snippets

```ts
// apps/web/src/components/auth/EnsureAnonymous.tsx (conceptual)
requestIdleCallback(() => {
  void signIn.anonymous();
});
```

```tsx
// apps/web/src/hooks/useLike.ts (conceptual)
const shouldFetchLikeState = hasInteracted || isInViewport;
```

```tsx
// apps/web/src/app/layout.tsx (conceptual)
<Suspense fallback={null}>
  <LazyVisitorCounter />
</Suspense>
```

```ts
// apps/web/src/lib/server/feed.ts (conceptual, only if Phase 1 justifies it)
fetch(url, { next: { revalidate: 30 } });
```

## Progress Notes

- 2026-03-09: Implemented a first Phase 4 pass that:
  - removes the unnecessary `Content-Type` header from client `GET` requests so simple cross-origin fetches no longer preflight
  - defers per-card `like-state` fetching until cards are featured, near the viewport, or interacted with
  - defers anonymous sign-in behind an idle window
  - defers visitor-count fetching until the footer approaches the viewport
  - avoids initializing favorite-button session logic on feed cards that do not render a favorite button
- 2026-03-09: Local mobile validation after that pass showed:
  - warm default artifact `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-default-2026-03-09T22-32-17-627Z.json`
  - warm intro-dismissed artifact `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-intro-dismissed-2026-03-09T22-32-15-440Z.json`
  - default-path total requests dropped from `69` to `26`
  - intro-dismissed total requests dropped from `69` to `27`
  - default-path `like-state` requests dropped from `21 GET + 21 OPTIONS` to `4 GET + 0 OPTIONS`
  - intro-dismissed `like-state` requests dropped from `21 GET + 21 OPTIONS` to `5 GET + 0 OPTIONS`
  - `visitor-count` requests dropped from `2` to `0` in both warm mobile paths
  - warm default-path LCP measured `1652 ms`
  - warm intro-dismissed-path LCP measured `1272 ms`
- 2026-03-09: Remaining Phase 4 signal after the first pass:
  - shared auth/session boot is still present at `3` `GET /api/auth/get-session` requests plus one anonymous sign-in `OPTIONS` and `POST`
  - the current local evidence still does not justify changing SSR feed caching semantics ahead of the remaining client-boot work

## Verification Checklist

- [ ] Above-the-fold paint no longer depends on non-critical auth or footer work.
- [x] First-load `like-state` fan-out is materially reduced or removed from the default feed path.
- [ ] Anonymous-session behavior still works correctly after deferral.
- [ ] Visitor counter and analytics still function, but no longer sit on the critical path.
- [ ] Any server caching change is backed by measured TTFB improvement and documented freshness tradeoffs.
- [ ] No admin/debug capability is silently removed without an intentional replacement.

## Risks / Watchpoints

1. Delaying anonymous sign-in could subtly affect features that assume a session exists immediately.
2. Deferring session reads in header/nav can create UX flicker if placeholders are not handled carefully.
3. Server-side feed caching can stale the `hot` feed if the revalidate window is too long.
4. Deferring `like-state` too aggressively can make vote affordances feel inconsistent if the loading state is not deliberate.
5. Removing unnecessary `GET` headers reduces preflights in the split-origin local setup, but deployed request behavior should still be rechecked in the real production host arrangement.

## Exit Criteria

- Non-critical client boot work is measurably less present in the initial mobile load.
- Any server-path optimization included in this phase is justified by real data.
- Public feed behavior and auth-dependent flows remain correct.
