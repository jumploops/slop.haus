# Phase 2: Above-the-Fold LCP + Reflow Reduction

**Status:** Planned  
**Owner:** Web  
**Depends On:** Phase 1

## Goal

Remove or reduce the two strongest above-the-fold risks:

1. hydration-gated rendering of the mobile LCP candidate
2. first-paint layout measurement/reflow triggered by decorative effects

This phase should make the initial render path more deterministic and reduce CPU/layout pressure before the page settles.

## Files To Change

- [/Users/adam/code/slop.haus/apps/web/src/app/page.tsx](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx](/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/lib/slop/geometry.ts](/Users/adam/code/slop.haus/apps/web/src/lib/slop/geometry.ts)
- possible supporting touch if intro persistence becomes server-readable:
  - [/Users/adam/code/slop.haus/apps/web/src/lib/feed-query.ts](/Users/adam/code/slop.haus/apps/web/src/lib/feed-query.ts)
  - [/Users/adam/code/slop.haus/apps/web/src/middleware.ts](/Users/adam/code/slop.haus/apps/web/src/middleware.ts)

## Recommended Strategy

1. Make intro visibility server-readable so the initial HTML and hydrated tree agree.
2. Remove the current `showIntro = false` + post-mount reveal path as the default behavior.
3. Defer, simplify, or disable intro `SlopGoo` on the initial mobile paint if it is confirmed to be the forced-reflow source.
4. Keep decorative parity where practical, but performance takes precedence over first-paint goo fidelity on mobile.

## Tasks

1. Replace the current intro visibility reconciliation path with a server-readable initial state.
   - Preferred path: cookie-backed intro dismissal so SSR can render the correct state.
   - Fallback if product rejects cookie persistence: restructure the mobile layout so the LCP candidate is not gated by client intro state.
2. Pass the resolved intro visibility into `FeedPageClient` as initial data instead of computing it only after mount.
3. Remove `queueMicrotask(...)` as the normal path for making the intro appear.
4. Audit display-mode reconciliation so it does not trigger unnecessary above-the-fold churn on first paint.
5. Reduce `SlopGoo` first-load layout work:
   - skip/defer intro goo until after paint or idle on mobile
   - or simplify geometry measurement so it does not run during the most critical render window
6. Re-check whether `useLayoutEffect`, `ResizeObserver`, `MutationObserver`, and scroll listeners are all needed immediately for the intro instance.
7. Preserve reduced-motion behavior and keep any mobile-specific degradation explicit and documented.

## Design Notes

- Cookie-backed intro persistence is the cleanest way to align SSR and hydration without reintroducing mismatches.
- If `SlopGoo` remains above the fold, it should not synchronously read geometry until the target element is stable enough that the cost is small and predictable.
- Do not let this phase expand into card-hover goo optimization unless the trace proves card goo is also affecting the initial mobile load.

## Code Snippets

```ts
// apps/web/src/app/page.tsx (conceptual)
return (
  <FeedPageClient
    initialFeed={initialFeed}
    initialSort={sort}
    initialWindow={window}
    initialShowIntro={showIntroFromCookie}
  />
);
```

```ts
// apps/web/src/components/feed/FeedPageClient.tsx (conceptual)
const [showIntro, setShowIntro] = useState(initialShowIntro);
```

```ts
// apps/web/src/components/slop/SlopGoo.tsx (conceptual)
const shouldRenderImmediately = !isMobile || !isAboveTheFoldDecorativeInstance;
```

## Verification Checklist

- [ ] Intro visibility no longer depends on a post-hydration reveal for the normal first-load path.
- [ ] No hydration mismatch is introduced.
- [ ] The dominant mobile LCP candidate becomes available earlier in the timeline.
- [ ] Forced-reflow cost from the intro path is materially reduced in trace captures.
- [ ] Slop mode still behaves correctly after initial load.
- [ ] Intro dismissal/reset behavior remains correct for both fresh and returning users.

## Risks / Watchpoints

1. Cookie-backed intro persistence changes the storage model and must stay consistent with existing reset behavior.
2. If intro visibility is wrong on SSR, users may see flicker or state mismatch.
3. Aggressively deferring `SlopGoo` can accidentally regress the visual identity if not scoped to first paint/mobile-only behavior.

## Exit Criteria

- The main above-the-fold LCP path is deterministic and no longer obviously hydration-gated.
- The intro path is no longer the dominant source of avoidable reflow during initial load.
- Mobile first paint is visually correct without reintroducing previous hydration issues.

