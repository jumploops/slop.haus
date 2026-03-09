# Phase 4: Non-Critical Boot + Server Path

**Status:** Planned  
**Owner:** Web + API  
**Depends On:** Phase 3

## Goal

Reduce first-load contention from client systems that are not required for the initial feed paint, and revisit the SSR bootstrap path only if Phase 1 proves it is materially slow.

This phase is deliberately second-order. Phase 1 did not support the server/bootstrap path as the first fix target, so this phase should stay focused on non-critical client work unless later traces show a different production bottleneck.

## Files To Change

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

## Verification Checklist

- [ ] Above-the-fold paint no longer depends on non-critical auth or footer work.
- [ ] First-load `like-state` fan-out is materially reduced or removed from the default feed path.
- [ ] Anonymous-session behavior still works correctly after deferral.
- [ ] Visitor counter and analytics still function, but no longer sit on the critical path.
- [ ] Any server caching change is backed by measured TTFB improvement and documented freshness tradeoffs.
- [ ] No admin/debug capability is silently removed without an intentional replacement.

## Risks / Watchpoints

1. Delaying anonymous sign-in could subtly affect features that assume a session exists immediately.
2. Deferring session reads in header/nav can create UX flicker if placeholders are not handled carefully.
3. Server-side feed caching can stale the `hot` feed if the revalidate window is too long.
4. Deferring `like-state` too aggressively can make vote affordances feel inconsistent if the loading state is not deliberate.

## Exit Criteria

- Non-critical client boot work is measurably less present in the initial mobile load.
- Any server-path optimization included in this phase is justified by real data.
- Public feed behavior and auth-dependent flows remain correct.
