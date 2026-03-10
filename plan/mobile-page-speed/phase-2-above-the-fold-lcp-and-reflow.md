# Phase 2: Above-the-Fold LCP + Reflow Reduction

**Status:** In Progress  
**Owner:** Web  
**Depends On:** Phase 1

## Goal

Remove or reduce the strongest above-the-fold risks confirmed in Phase 1:

1. very-late client reconciliation of above-the-fold UI, especially the intro and cookie-consent surfaces
2. first-paint layout measurement/reflow triggered by decorative effects when the intro is visible

This phase should make the initial render path more deterministic and reduce CPU/layout pressure before the page settles.

## Files To Change

- [/Users/adam/code/slop.haus/apps/web/src/app/layout.tsx](/Users/adam/code/slop.haus/apps/web/src/app/layout.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/app/page.tsx](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/app/providers.tsx](/Users/adam/code/slop.haus/apps/web/src/app/providers.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/components/privacy/ConsentManager.tsx](/Users/adam/code/slop.haus/apps/web/src/components/privacy/ConsentManager.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/components/privacy/CookieConsentBanner.tsx](/Users/adam/code/slop.haus/apps/web/src/components/privacy/CookieConsentBanner.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/lib/feed-intro.ts](/Users/adam/code/slop.haus/apps/web/src/lib/feed-intro.ts)
- [/Users/adam/code/slop.haus/apps/web/src/lib/privacy/consent.ts](/Users/adam/code/slop.haus/apps/web/src/lib/privacy/consent.ts)
- [/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx](/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx)
- [/Users/adam/code/slop.haus/apps/web/src/lib/slop/geometry.ts](/Users/adam/code/slop.haus/apps/web/src/lib/slop/geometry.ts)
- possible supporting touch if intro persistence becomes server-readable:
  - [/Users/adam/code/slop.haus/apps/web/src/lib/feed-query.ts](/Users/adam/code/slop.haus/apps/web/src/lib/feed-query.ts)
  - [/Users/adam/code/slop.haus/apps/web/src/middleware.ts](/Users/adam/code/slop.haus/apps/web/src/middleware.ts)

## Recommended Strategy

1. Make above-the-fold visibility decisions server-readable where practical so the initial HTML and hydrated tree agree.
2. Remove the current late client-only reveal path for intro and avoid letting consent UI become the fallback late LCP candidate.
3. Defer, simplify, or disable intro `SlopGoo` on the initial mobile paint because it is now a confirmed forced-layout contributor.
4. Keep decorative parity where practical, but performance takes precedence over first-paint goo fidelity on mobile.

## Tasks

1. Replace the current intro visibility reconciliation path with a server-readable initial state.
   - Preferred path: cookie-backed intro dismissal so SSR can render the correct state.
   - Fallback if product rejects cookie persistence: restructure the mobile layout so the LCP candidate is not gated by client intro state.
2. Pass the resolved intro visibility into `FeedPageClient` as initial data instead of computing it only after mount.
3. Resolve consent-banner state early enough that it does not become a late client-only LCP replacement when the intro is dismissed.
   - Preferred path: server-readable consent context and state for initial banner decision.
   - Acceptable fallback: delay banner mount until after the critical render window if legal/product constraints allow it.
4. Remove `queueMicrotask(...)` as the normal path for making above-the-fold UI appear.
5. Audit display-mode reconciliation so it does not trigger unnecessary above-the-fold churn on first paint.
6. Reduce `SlopGoo` first-load layout work:
   - skip/defer intro goo until after paint or idle on mobile
   - or simplify geometry measurement so it does not run during the most critical render window
7. Re-check whether `useLayoutEffect`, `ResizeObserver`, `MutationObserver`, and scroll listeners are all needed immediately for the intro instance.
8. Preserve reduced-motion behavior and keep any mobile-specific degradation explicit and documented.

## Design Notes

- Cookie-backed intro persistence is still the cleanest way to align SSR and hydration without reintroducing mismatches.
- Consent state now matters for LCP too, because the intro-dismissed trace showed the cookie banner text becoming the late final LCP candidate.
- If `SlopGoo` remains above the fold, it should not synchronously read geometry until the target element is stable enough that the cost is small and predictable.
- Do not let this phase expand into card-hover goo optimization unless a fresh trace proves card goo is also affecting the initial mobile load.

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
// apps/web/src/components/privacy/ConsentManager.tsx (conceptual)
const bannerOpen = initialBannerOpen;
```

```ts
// apps/web/src/components/slop/SlopGoo.tsx (conceptual)
const shouldRenderImmediately = !isMobile || !isAboveTheFoldDecorativeInstance;
```

## Verification Checklist

- [x] Intro visibility no longer depends on a post-hydration reveal for the normal first-load path.
- [x] Cookie-consent banner no longer becomes the late fallback LCP candidate when intro is dismissed.
- [ ] No hydration mismatch is introduced.
- [x] The dominant mobile LCP candidate becomes available earlier in the timeline for both intro-visible and intro-dismissed runs.
- [ ] Forced-reflow cost from the intro path is materially reduced in trace captures.
- [ ] Slop mode still behaves correctly after initial load.
- [ ] Intro dismissal/reset behavior remains correct for both fresh and returning users.
- [ ] Consent behavior remains correct for required and non-required geographies.

## Progress Notes

- 2026-03-09: Implemented a first Phase 2 pass that:
  - seeds intro visibility from a server-readable dismissal cookie
  - seeds consent state from cookies in the root layout/provider path
  - removes the late `queueMicrotask(...)` reveal path for intro and consent
  - defers intro `SlopGoo` behind the critical first-paint window
- 2026-03-09: Local mobile validation after that pass showed:
  - default-path artifact `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-default-2026-03-09T09-10-52-966Z.json`
  - intro-dismissed artifact `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-intro-dismissed-2026-03-09T09-14-33-579Z.json`
  - default-path LCP improved from ~`21.8s` to ~`1.22s`
  - intro-dismissed-path LCP improved from ~`21.5s` to ~`1.02s`
  - hidden image requests and cache-policy findings were unchanged, confirming those concerns belong to Phase 3

## Risks / Watchpoints

1. Cookie-backed intro persistence changes the storage model and must stay consistent with existing reset behavior.
2. If intro or consent visibility is wrong on SSR, users may see flicker or state mismatch.
3. Aggressively deferring `SlopGoo` can accidentally regress the visual identity if not scoped to first paint/mobile-only behavior.
4. Consent requirements may limit how much banner timing can be changed, so legal/product constraints need to stay explicit.

## Exit Criteria

- The main above-the-fold LCP path is deterministic and no longer obviously client-reconciled late.
- The intro path is no longer the dominant source of avoidable reflow during initial load.
- Dismissing the intro no longer shifts the same late-LCP problem onto the consent banner.
- Mobile first paint is visually correct without reintroducing previous hydration issues.
