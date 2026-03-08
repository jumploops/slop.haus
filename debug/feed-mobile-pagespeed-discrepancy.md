# Debug: Feed Mobile PageSpeed Discrepancy

## Status

- Type: investigation only
- Date: 2026-03-06
- Assumption: the PageSpeed run is targeting the root feed page at `/`
- Code changes: none in this step

## Problem Statement

Google PageSpeed Insights shows a large mobile vs desktop gap for the current page:

| Metric | Mobile | Desktop |
| --- | --- | --- |
| First Contentful Paint | 2.2 s | 0.3 s |
| Largest Contentful Paint | 7.2 s | 1.4 s |
| Total Blocking Time | 200 ms | 40 ms |
| Cumulative Layout Shift | 0 | 0.126 |
| Speed Index | 5.1 s | 0.9 s |

Additional mobile insights reported:

- Forced reflow: `114 ms` total, unattributed
- Use efficient cache lifetimes: estimated savings `758 KiB`
- Legacy JavaScript: estimated savings `11 KiB`

The main question for this pass is not "what should we change yet," but "what are the most plausible causes in the current implementation?"

## Investigation Steps

1. Reviewed the root route and feed bootstrap:
   - [`apps/web/src/app/page.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx)
   - [`apps/web/src/lib/server/feed.ts`](/Users/adam/code/slop.haus/apps/web/src/lib/server/feed.ts)
2. Reviewed the main client feed shell and above-the-fold intro:
   - [`apps/web/src/components/feed/FeedPageClient.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx)
3. Reviewed decorative/layout-measurement code that could match forced reflow:
   - [`apps/web/src/components/slop/SlopGoo.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx)
   - [`apps/web/src/lib/slop/geometry.ts`](/Users/adam/code/slop.haus/apps/web/src/lib/slop/geometry.ts)
4. Reviewed global layout chrome and app-wide client providers:
   - [`apps/web/src/app/layout.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/layout.tsx)
   - [`apps/web/src/app/providers.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/providers.tsx)
   - [`apps/web/src/components/auth/EnsureAnonymous.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/auth/EnsureAnonymous.tsx)
   - [`apps/web/src/components/analytics/GoogleAnalytics.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx)
   - [`apps/web/src/components/layout/VisitorCounter.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/layout/VisitorCounter.tsx)
5. Reviewed feed card image behavior and media delivery:
   - [`apps/web/src/components/project/ProjectCard.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx)
   - [`apps/api/src/index.ts`](/Users/adam/code/slop.haus/apps/api/src/index.ts)
6. Attempted a production build for additional asset/bundle signals, but local build verification was blocked because `next/font` could not reach `fonts.googleapis.com` in the restricted environment.

## Current Implementation Notes

### 1. The feed itself is server-bootstrapped

The root page is no longer pure client fetch. `/` parses route params and fetches page 1 on the server before rendering the client shell:

- [`apps/web/src/app/page.tsx#L10`](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx#L10)
- [`apps/web/src/lib/server/feed.ts#L11`](/Users/adam/code/slop.haus/apps/web/src/lib/server/feed.ts#L11)

That makes a backend-only explanation less likely by itself, although the server fetch still matters because it is explicitly `cache: "no-store"`.

### 2. The intro is still client-reconciled after mount

`FeedPageClient` initializes `showIntro` to `false`, then reads `localStorage` in an effect and flips the intro on in a microtask:

- [`apps/web/src/components/feed/FeedPageClient.tsx#L69`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx#L69)
- [`apps/web/src/components/feed/FeedPageClient.tsx#L90`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx#L90)
- [`apps/web/src/components/feed/FeedPageClient.tsx#L238`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx#L238)

If the intro card or its heading becomes the LCP candidate on mobile, LCP is inherently delayed until hydration finishes and that effect runs.

### 3. The intro mounts `SlopGoo` above the fold

When slop mode is on, the intro also mounts a decorative `SlopGoo` instance:

- [`apps/web/src/components/feed/FeedPageClient.tsx#L269`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx#L269)

`SlopGoo` performs synchronous geometric reads in `useLayoutEffect` and tracks resize, mutation, scroll, and resize events:

- [`apps/web/src/components/slop/SlopGoo.tsx#L112`](/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx#L112)
- [`apps/web/src/components/slop/SlopGoo.tsx#L121`](/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx#L121)
- [`apps/web/src/lib/slop/geometry.ts#L24`](/Users/adam/code/slop.haus/apps/web/src/lib/slop/geometry.ts#L24)
- [`apps/web/src/lib/slop/geometry.ts#L37`](/Users/adam/code/slop.haus/apps/web/src/lib/slop/geometry.ts#L37)

This is a strong match for the "forced reflow" audit.

### 4. The page still does a fair amount of early client work

The root provider stack mounts anonymous auth, consent management, theme/slop state, login modal state, and SWR globally:

- [`apps/web/src/app/providers.tsx#L15`](/Users/adam/code/slop.haus/apps/web/src/app/providers.tsx#L15)

First-load anonymous auth can trigger sign-in, session refetch, and visitor-count revalidation:

- [`apps/web/src/components/auth/EnsureAnonymous.tsx#L11`](/Users/adam/code/slop.haus/apps/web/src/components/auth/EnsureAnonymous.tsx#L11)

There is also a footer visitor-count fetch and optional analytics boot:

- [`apps/web/src/components/layout/VisitorCounter.tsx#L12`](/Users/adam/code/slop.haus/apps/web/src/components/layout/VisitorCounter.tsx#L12)
- [`apps/web/src/components/analytics/GoogleAnalytics.tsx#L46`](/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx#L46)

### 5. Feed cards use raw `<img>` tags, not `next/image`

Card screenshots are rendered with plain `<img>` elements and no explicit lazy-loading or responsive sizing:

- [`apps/web/src/components/project/ProjectCard.tsx#L179`](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx#L179)
- [`apps/web/src/components/project/ProjectCard.tsx#L359`](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx#L359)

In list layouts, the screenshot wrapper is `hidden sm:block`, which hides the thumbnail on mobile visually, but the `<img>` still exists in the DOM:

- [`apps/web/src/components/project/ProjectCard.tsx#L353`](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx#L353)

That means mobile may still download feed screenshots that are not even visible.

### 6. Static uploads do not currently set an explicit long-lived cache header

The API server serves `/uploads/*` via `serveStatic(...)`, but unlike `visitor-count` it does not set `Cache-Control` headers in that path:

- [`apps/api/src/index.ts#L50`](/Users/adam/code/slop.haus/apps/api/src/index.ts#L50)
- [`apps/api/src/routes/visitorCount.ts`](/Users/adam/code/slop.haus/apps/api/src/routes/visitorCount.ts)

That is a plausible contributor to the "efficient cache lifetimes" warning if the audited page pulls uploaded screenshots.

## Hypotheses

### 1. Post-hydration intro rendering is delaying mobile LCP

Confidence: high

Why:

- The intro is not present on the initial client render because `showIntro` starts as `false`.
- It only appears after `localStorage` reconciliation in an effect and `queueMicrotask(...)`.
- The intro heading/card is a likely LCP candidate on mobile when it is visible above the feed.

Relevant code:

- [`apps/web/src/components/feed/FeedPageClient.tsx#L69`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx#L69)
- [`apps/web/src/components/feed/FeedPageClient.tsx#L90`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx#L90)
- [`apps/web/src/components/feed/FeedPageClient.tsx#L238`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx#L238)

Why it fits the reported metrics:

- It explains a much worse mobile LCP than desktop without requiring a huge TBT spike.
- It aligns with prior local debug work that already identified intro hydration as a source of slower first stable paint.

### 2. `SlopGoo` is likely responsible for the forced reflow signal

Confidence: high

Why:

- `SlopGoo` runs `useLayoutEffect(...)`.
- It reads `getComputedStyle`, `getBoundingClientRect`, `offsetWidth`, and `offsetHeight`.
- It attaches `ResizeObserver`, `MutationObserver`, `scroll`, and `resize` listeners around a filtered SVG effect.

Relevant code:

- [`apps/web/src/components/slop/SlopGoo.tsx#L112`](/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx#L112)
- [`apps/web/src/components/slop/SlopGoo.tsx#L121`](/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx#L121)
- [`apps/web/src/components/slop/SlopGoo.tsx#L228`](/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx#L228)
- [`apps/web/src/lib/slop/geometry.ts#L24`](/Users/adam/code/slop.haus/apps/web/src/lib/slop/geometry.ts#L24)
- [`apps/web/src/lib/slop/geometry.ts#L37`](/Users/adam/code/slop.haus/apps/web/src/lib/slop/geometry.ts#L37)

Why it fits the reported metrics:

- It is a direct code match for "forced reflow."
- It sits above the fold on the intro, so mobile pays its cost early.

### 3. Mobile is probably downloading screenshots that are hidden by CSS

Confidence: high

Why:

- Feed cards in list mode keep the image tag in the DOM.
- The wrapper is visually hidden on mobile with `hidden sm:block`.
- No `loading="lazy"` or `next/image` optimization is present.

Relevant code:

- [`apps/web/src/components/project/ProjectCard.tsx#L353`](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx#L353)
- [`apps/web/src/components/project/ProjectCard.tsx#L359`](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx#L359)

Why it fits the reported metrics:

- It can consume bandwidth on mobile for non-visible assets.
- It helps explain why PageSpeed reports large byte savings even if the visible mobile layout is mostly text-first.

### 4. Raw `<img>` usage is preventing image optimization, responsive sizing, and lazy loading

Confidence: medium-high

Why:

- Feed screenshots use raw `<img>` instead of `next/image`.
- There are no intrinsic dimensions, no `sizes`, and no loading strategy.

Relevant code:

- [`apps/web/src/components/project/ProjectCard.tsx#L179`](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx#L179)
- [`apps/web/src/components/project/ProjectCard.tsx#L359`](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx#L359)
- [`apps/web/next.config.ts#L3`](/Users/adam/code/slop.haus/apps/web/next.config.ts#L3)

Why it fits the reported metrics:

- Oversized screenshot downloads hurt mobile much more than desktop.
- Missing image dimensions are also a plausible contributor to the desktop CLS number.

### 5. Early app-wide client boot is adding mobile-only contention before the page settles

Confidence: medium

Why:

- Global providers mount several client systems immediately.
- `EnsureAnonymous` can trigger anonymous sign-in and then a session refetch.
- Visitor count and consent logic also run on startup.

Relevant code:

- [`apps/web/src/app/providers.tsx#L16`](/Users/adam/code/slop.haus/apps/web/src/app/providers.tsx#L16)
- [`apps/web/src/components/auth/EnsureAnonymous.tsx#L11`](/Users/adam/code/slop.haus/apps/web/src/components/auth/EnsureAnonymous.tsx#L11)
- [`apps/web/src/components/layout/VisitorCounter.tsx#L12`](/Users/adam/code/slop.haus/apps/web/src/components/layout/VisitorCounter.tsx#L12)
- [`apps/web/src/components/analytics/GoogleAnalytics.tsx#L52`](/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx#L52)

Why it fits the reported metrics:

- On slower CPUs and throttled networks, these extra tasks can push out first stable rendering without creating a catastrophic TBT number.

### 6. The feed SSR path may still have a real network latency problem because page 1 is always `no-store`

Confidence: medium

Why:

- The root page performs a server fetch for the feed on every request.
- That fetch is explicitly `cache: "no-store"`.
- Web and API are separate services, so the HTML path depends on an extra network hop.

Relevant code:

- [`apps/web/src/app/page.tsx#L15`](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx#L15)
- [`apps/web/src/lib/server/feed.ts#L14`](/Users/adam/code/slop.haus/apps/web/src/lib/server/feed.ts#L14)

Why it fits the reported metrics:

- If API latency, cold starts, or DB work are slower under PageSpeed’s mobile throttling assumptions, that would inflate both FCP and LCP.
- This is not yet proven because we have not measured TTFB/server timing separately.

### 7. Screenshot/upload responses may have weak cache headers, matching the `758 KiB` cache-lifetime warning

Confidence: medium

Why:

- `/uploads/*` static serving does not currently show an explicit long-term cache policy.
- That is the kind of issue Lighthouse typically flags in "Use efficient cache lifetimes."

Relevant code:

- [`apps/api/src/index.ts#L50`](/Users/adam/code/slop.haus/apps/api/src/index.ts#L50)

Why it fits the reported metrics:

- It directly matches the cache-lifetime audit category.
- It combines badly with hypothesis #3 if hidden screenshots are still being requested on mobile.

### 8. The global marquee and font setup may be adding avoidable above-the-fold cost

Confidence: low-medium

Why:

- The layout always renders an animated marquee before the main content.
- The layout also loads four Google fonts globally, including two decorative fonts used mainly for branding.

Relevant code:

- [`apps/web/src/app/layout.tsx#L12`](/Users/adam/code/slop.haus/apps/web/src/app/layout.tsx#L12)
- [`apps/web/src/app/layout.tsx#L53`](/Users/adam/code/slop.haus/apps/web/src/app/layout.tsx#L53)

Why it fits the reported metrics:

- Mobile is more sensitive to animation/compositor work and font transfer/render cost.
- This feels more like a secondary amplifier than the primary `7.2s` LCP cause.

### 9. The legacy-JS finding is probably real but not the main problem

Confidence: low

Why:

- The page ships a fairly large client shell above the fold.
- However, Lighthouse only estimates `11 KiB` savings from legacy JavaScript.

Interpretation:

- This is worth cleaning up eventually, but it is unlikely to explain the magnitude of the LCP gap by itself.

## Leading Suspects

If we need to rank where to look first before changing code:

1. Post-hydration intro rendering delaying the LCP candidate.
2. Above-the-fold `SlopGoo` measurement work causing forced reflow.
3. Hidden mobile screenshots still downloading because of raw `<img>` usage.
4. Extra first-load client work from anonymous auth/session/consent/visitor count.
5. Weak caching on screenshot assets.

## Root Cause Status

Unconfirmed.

Current best working theory:

- Mobile LCP is being delayed by a combination of post-hydration intro rendering and above-the-fold layout measurement work.
- In parallel, feed screenshots may be wasting bandwidth on mobile even when hidden, which would amplify the gap and help explain the cache-lifetime audit.

## Suggested Validation Checks Before Code Changes

1. In Chrome Performance, capture a fresh mobile-throttled load and confirm the LCP element identity:
   - intro heading/card vs feed card vs image
2. Check whether offscreen/hidden feed thumbnails are requested on mobile:
   - Network panel
   - compare visible layout vs requested image URLs
3. Inspect response headers for one real screenshot URL:
   - confirm whether `Cache-Control` is missing or too short
4. Compare TTFB/server timing for `/` vs the API feed request:
   - determine whether `cache: "no-store"` is materially hurting first paint
5. Record a trace around the intro mount:
   - verify whether `SlopGoo` or related geometry calls account for the unattributed forced reflow

## Solution Direction (Not Implemented Yet)

If the validation above confirms the current theory, the likely solution areas are:

- Make the LCP candidate available in initial HTML instead of post-hydration only.
- Reduce or defer above-the-fold layout-measurement effects.
- Stop requesting hidden/offscreen screenshots on mobile and adopt real image optimization/lazy loading.
- Add explicit cache headers for static uploaded media.
