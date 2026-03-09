# Debug: Feed Mobile PageSpeed Discrepancy

## Status

- Type: investigation in progress
- Opened: 2026-03-06
- Updated: 2026-03-09
- Assumption: the PageSpeed run is targeting the root feed page at `/`
- Code changes: Phase 1 measurement tooling is in place; Phase 2 intro/consent/SlopGoo first-pass changes landed; Phase 3 feed-image and upload-cache first-pass changes landed; Phase 4 non-critical boot first-pass changes landed

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
7. Added repo-local Chrome measurement tooling:
   - [`scripts/open-project-chrome.mjs`](/Users/adam/code/slop.haus/scripts/open-project-chrome.mjs)
   - [`scripts/measure-mobile-feed.mjs`](/Users/adam/code/slop.haus/scripts/measure-mobile-feed.mjs)

## Confirmed Phase 1 Findings

### Local automated mobile baseline

Date: 2026-03-07  
Artifact: `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-2026-03-08T01-18-04-638Z.json`

Environment:

- Dedicated repo-local Chrome profile
- Headless Chrome via local binary
- Mobile emulation: `390x844`, DPR `2`
- CPU throttling: `4x`
- Network emulation: slow-ish 4G profile
- URL: `http://localhost:3000/`

Measured results from this run:

- Document TTFB (`navigation.responseStart`): `304.3 ms`
- First Contentful Paint: `1040 ms`
- Largest Contentful Paint: `20292 ms`
- Cumulative Layout Shift: `0`

Interpretation:

- The document itself is not slow enough to explain the LCP problem.
- The LCP delay is overwhelmingly a post-response/render-path problem in this run.

### Local rerun with a real featured S3 screenshot

Date: 2026-03-09  
Artifact: `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-2026-03-09T08-25-30-666Z.json`

Measured results from this run:

- Document TTFB (`navigation.responseStart`): `205.8 ms`
- First Contentful Paint: `1016 ms`
- Largest Contentful Paint: `21168 ms`
- Cumulative Layout Shift: `0`

Interpretation:

- The featured S3-backed screenshot did not change the identity of the mobile LCP candidate.
- The local mobile bottleneck is still overwhelmingly after the initial document response.

### Confirmed LCP element in this baseline

The final LCP element in this run was the intro paragraph:

- `p.relative.z-10.max-w-md | Not all slop is equal - share your best/funny/useful/useless vibecoded machinati`

This confirms that the current mobile LCP candidate is above the feed cards in the intro path, not a screenshot image.

### Hidden mobile images are definitely being requested

The automated run found:

- `20` hidden image nodes in the DOM
- `6` unique hidden placeholder image assets actually requested
- `8` total image requests during initial load

That confirms the current `hidden sm:block` list-thumbnail path is still costing mobile image bytes even when those screenshots are not visible.

The 2026-03-09 rerun raised that to:

- `21` hidden image nodes in the DOM
- `7` unique hidden image assets actually requested

That rerun included one live S3 screenshot URL:

- `https://s3.us-west-2.amazonaws.com/slop.haus-public/screenshots/1771926128984-aee914770f494692.png`

Interpretation:

- The featured S3 image is also being fetched while hidden in the mobile layout.
- This is no longer just a placeholder-only behavior.

### The first-page local baseline is using placeholders, not uploaded screenshots

The local `GET /api/v1/projects?page=1&limit=20` response returned `primaryMedia: null` for all 20 first-page projects in this baseline.

Interpretation:

- The measured image/cache behavior in this run is dominated by placeholder assets from [`apps/web/public`](/Users/adam/code/slop.haus/apps/web/public), not uploaded screenshots.
- Upload-cache validation is still incomplete for this specific baseline.

### Placeholder image cache headers are weak

The requested placeholder images returned:

- `Cache-Control: public, max-age=0`

Examples:

- `http://localhost:3000/chaotic-colorful-css-code-editor.jpg`
- `http://localhost:3000/pitch-deck-generator-with-money-and-rocket-emojis.jpg`

This confirms at least one real contributor to the cache-lifetime audit.

### Feed API caching is also weak in the current local path

Observed headers:

- `GET /` document: `Cache-Control: no-store, must-revalidate`
- `GET /api/v1/projects?...`: no explicit `Cache-Control` header observed in the local API response

Interpretation:

- The document cache policy is intentionally strict.
- The feed API response currently provides no cache guidance in this local path.
- This does not, by itself, justify treating server-side caching as the first performance fix.

### A new bottleneck surfaced: per-card like-state fan-out

The automated run observed:

- `1` feed fetch to `/api/v1/projects?...`
- `20` `OPTIONS` preflight requests for `like-state`
- `20` `GET` requests for per-project `like-state`

Relevant code:

- [`apps/web/src/components/project/ProjectCard.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx)
- [`apps/web/src/hooks/useLike.ts`](/Users/adam/code/slop.haus/apps/web/src/hooks/useLike.ts)

Interpretation:

- This was not called out strongly enough in the original hypothesis list.
- Even if it is not the single LCP root cause, it is a meaningful first-load network tax on mobile and should now be considered a leading suspect.

The 2026-03-09 rerun increased this to:

- `21` `OPTIONS` preflight requests for `like-state`
- `21` `GET` requests for per-project `like-state`

That aligns with one featured card plus twenty feed cards participating in the same first-load fan-out.

### Live screenshot cache validation is now confirmed

The 2026-03-09 rerun captured a real featured S3 screenshot response:

- URL: `https://s3.us-west-2.amazonaws.com/slop.haus-public/screenshots/1771926128984-aee914770f494692.png`
- Status: `200`
- Content-Type: `image/png`
- Content-Length: `141862`
- Date: `Mon, 09 Mar 2026 08:25:33 GMT`
- Last-Modified: `Tue, 24 Feb 2026 09:42:10 GMT`
- `Cache-Control`: missing

Interpretation:

- A live screenshot used by the default `/` experience currently ships without any explicit `Cache-Control` header.
- The cache-lifetime concern is now confirmed from a real media response, not just inferred from local placeholder assets or `/uploads/*` code paths.

### Screenshot URLs appear immutable enough for long-lived caching

The storage key generator currently produces screenshot paths in this shape:

- `screenshots/<timestamp>-<random>.<extension>`

Relevant code:

- [`apps/api/src/lib/storage.ts#L100`](/Users/adam/code/slop.haus/apps/api/src/lib/storage.ts#L100)

Interpretation:

- The generated screenshot URLs are effectively versioned by key.
- Unless a caller intentionally overwrites the same object key, the current path shape is compatible with a long-lived `immutable` cache policy.

### Server/bootstrap latency is not the dominant problem in the local path

Direct local timing checks on 2026-03-09:

- `GET /`: `starttransfer=0.204527`, `total=0.212783`
- `GET /api/v1/projects?sort=hot&window=all&page=1&limit=20`: `starttransfer=0.019303`, `total=0.019368`

Interpretation:

- The local feed API is fast enough that it does not explain a `~21s` LCP outcome.
- The strict `no-store` SSR path may still be worth revisiting later for freshness or resilience reasons, but it should not be treated as a first-order mobile bottleneck in the current local evidence set.

### Intro hydration timing is now directly confirmed

Date: 2026-03-09  
Artifact: `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-2026-03-09T08-43-50-850Z.json`

The instrumented rerun recorded these intro marks:

- `feed:intro:reconcile-start` at `21082.0 ms`
- `feed:intro:queue-apply-visible` at `21576.3 ms`
- `feed:intro:layout-mounted` at `21674.5 ms`
- `feed:intro:raf-visible` at `21733.7 ms`
- final LCP at `21808.0 ms`

Interpretation:

- The intro does not even begin reconciliation until very late in the page lifecycle in this local mobile run.
- The intro becomes layout-mounted only about `133.5 ms` before the final LCP.
- This is the strongest evidence so far that the hydration-gated intro path is the primary reason the mobile LCP candidate lands so late when the intro is visible.

### Intro-dismissed mobile still lands on a very late client-only LCP

Date: 2026-03-09  
Artifact: `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-intro-dismissed-2026-03-09T08-47-54-360Z.json`

Measured results from this scenario:

- Scenario: `intro-dismissed`
- Document TTFB (`navigation.responseStart`): `389.7 ms`
- First Contentful Paint: `1180 ms`
- Largest Contentful Paint: `21544 ms`
- Final LCP element:
  - `p.text-sm.text-foreground | We use necessary cookies for core site functionality and optional analytics cook`
- Intro marks:
  - `feed:intro:reconcile-start` at `20794.5 ms`
  - `feed:intro:queue-apply-dismissed` at `21337.6 ms`
- `SlopGoo` measures: `0`

Interpretation:

- Removing the intro does not solve the late mobile LCP in the current local path.
- The final LCP shifts to the cookie consent banner paragraph, which is another client-only, above-the-fold surface mounted after startup work.
- This means the broader Phase 2 target should be "late client reconciliation of above-the-fold UI," not only the intro card.

### `SlopGoo` is a direct forced-layout contributor right before LCP

The same instrumented rerun recorded:

- `10` `SlopGoo` measure calls
- `55.2 ms` total measured `SlopGoo` measurement time
- `37.5 ms` max single measurement
- first `SlopGoo` measure start at `21734.5 ms`
- last `SlopGoo` measure end at `24122.8 ms`
- trigger mix: `{"initial": 6, "resize-observer": 4}`

The hottest sample spent most of its time in synchronous layout/style reads:

- `positionReadMs`: `27.4 ms`
- `quadReadMs`: `8.9 ms`
- `borderStyleReadMs`: `0.1 ms`

Interpretation:

- `SlopGoo` begins its measurement work immediately after the intro becomes visible.
- The hottest `SlopGoo` sample lines up with exactly the style/geometry access pattern we suspected from the forced-reflow audit.
- This does not prove `SlopGoo` is the entire reflow problem, but it does move it from "strong suspect" to "confirmed contributor."

## Phase 2 First-Pass Result

### Implemented changes on 2026-03-09

The first Phase 2 implementation pass changed three things:

- intro visibility is now seeded from a server-readable dismissal cookie
- consent state is now seeded from cookies in the root layout/provider path so the banner does not appear only after client reconciliation
- intro `SlopGoo` no longer renders immediately on first paint and is deferred behind the critical window

Relevant files:

- [`apps/web/src/app/page.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx)
- [`apps/web/src/app/layout.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/layout.tsx)
- [`apps/web/src/app/providers.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/providers.tsx)
- [`apps/web/src/components/feed/FeedPageClient.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx)
- [`apps/web/src/components/privacy/ConsentManager.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/privacy/ConsentManager.tsx)
- [`apps/web/src/lib/feed-intro.ts`](/Users/adam/code/slop.haus/apps/web/src/lib/feed-intro.ts)
- [`apps/web/src/lib/privacy/consent.ts`](/Users/adam/code/slop.haus/apps/web/src/lib/privacy/consent.ts)

### Local validation after the first Phase 2 pass

Default path:

- Artifact: `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-default-2026-03-09T09-10-52-966Z.json`
- LCP: `1220 ms`
- FCP: `1220 ms`
- Document TTFB: `453.7 ms`
- Final LCP element:
  - `p.relative.z-10.max-w-md | Not all slop is equal - share your best/funny/useful/useless vibecoded machinati`

Intro-dismissed path:

- Artifact: `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-intro-dismissed-2026-03-09T09-14-33-579Z.json`
- LCP: `1024 ms`
- FCP: `1024 ms`
- Document TTFB: `251.4 ms`
- Final LCP element:
  - `p.text-sm.text-foreground | We use necessary cookies for core site functionality and optional analytics cook`

Interpretation:

- The late `~21s` client-only LCP behavior is gone in both measured local paths.
- The intro path is now present early enough that it no longer waits for post-hydration reconciliation.
- The consent banner can still be the final LCP element in the intro-dismissed case, but it now appears in the initial render window instead of becoming a very-late fallback.
- Hidden mobile image requests, weak screenshot caching, and `like-state` fan-out remain unchanged and now stand out more clearly as the next work items.

## Phase 3 First-Pass Result

### Implemented changes on 2026-03-09

The first Phase 3 implementation pass changed four things:

- feed card screenshots now use `next/image` instead of raw `<img>` tags
- list-mode thumbnails are no longer rendered until a desktop viewport is confirmed, so the mobile path does not download hidden screenshots
- `next.config.ts` now allows both local upload URLs and the configured S3 public URL for optimized loading
- new screenshot uploads now receive `Cache-Control: public, max-age=31536000, immutable` in both API and worker S3 upload paths, and local `/uploads/*` responses now set the same header

Relevant files:

- [`apps/web/src/components/feed/FeedPageClient.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx)
- [`apps/web/src/components/project/ProjectCard.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx)
- [`apps/web/next.config.ts`](/Users/adam/code/slop.haus/apps/web/next.config.ts)
- [`apps/api/src/index.ts`](/Users/adam/code/slop.haus/apps/api/src/index.ts)
- [`apps/api/src/lib/storage.ts`](/Users/adam/code/slop.haus/apps/api/src/lib/storage.ts)
- [`apps/worker/src/lib/storage.ts`](/Users/adam/code/slop.haus/apps/worker/src/lib/storage.ts)

### Local validation after the first Phase 3 pass

Warm default path:

- Artifact: `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-default-2026-03-09T09-42-03-271Z.json`
- LCP: `972 ms`
- FCP: `972 ms`
- Document TTFB: `254.4 ms`
- Image requests: `2`
- Hidden image nodes requested: `0`
- Unique hidden image assets requested: `0`

Warm intro-dismissed path:

- Artifact: `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-intro-dismissed-2026-03-09T09-43-27-575Z.json`
- LCP: `996 ms`
- FCP: `996 ms`
- Document TTFB: `280.5 ms`
- Image requests: `2`
- Hidden image nodes requested: `0`
- Unique hidden image assets requested: `0`

Interpretation:

- The mobile feed no longer requests hidden screenshots in either measured mobile path.
- The previously confirmed hidden featured S3 screenshot request is gone from the warm mobile route.
- The remaining image requests in these runs are inline SVG data URLs, not feed screenshot network requests.

### Cache-policy status after the first Phase 3 pass

What is now true in code:

- new S3 screenshot uploads receive `Cache-Control: public, max-age=31536000, immutable`
- local `/uploads/*` responses receive `Cache-Control: public, max-age=31536000, immutable`

Important limitation:

- existing S3 screenshot objects that were uploaded before this change do not automatically gain new metadata
- the previously measured featured S3 screenshot URL was not re-uploaded during this pass, so its historical missing `Cache-Control` header should be assumed unchanged until metadata is refreshed or the asset is replaced

## Phase 4 First-Pass Result

### Implemented changes on 2026-03-09

The first Phase 4 implementation pass changed four things:

- client `GET` requests no longer send `Content-Type: application/json`, eliminating avoidable CORS preflights on simple fetches
- per-card `like-state` requests now wait until a card is featured, near the viewport, or interacted with instead of firing for every card on first load
- anonymous sign-in is deferred behind an idle window instead of running immediately on mount
- the footer visitor counter no longer fetches until it approaches the viewport, and favorite-button session work no longer initializes on feed cards that do not render a favorite control

Relevant files:

- [`apps/web/src/lib/api.ts`](/Users/adam/code/slop.haus/apps/web/src/lib/api.ts)
- [`apps/web/src/hooks/useLike.ts`](/Users/adam/code/slop.haus/apps/web/src/hooks/useLike.ts)
- [`apps/web/src/components/project/ProjectCard.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx)
- [`apps/web/src/components/auth/EnsureAnonymous.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/auth/EnsureAnonymous.tsx)
- [`apps/web/src/components/layout/VisitorCounter.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/layout/VisitorCounter.tsx)

### Local validation after the first Phase 4 pass

Warm default path:

- Artifact: `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-default-2026-03-09T22-32-17-627Z.json`
- LCP: `1652 ms`
- FCP: `1652 ms`
- Document TTFB: `223.4 ms`
- Total requests: `26`
- `like-state` `GET` requests: `4`
- `like-state` `OPTIONS` requests: `0`
- `visitor-count` `GET` requests: `0`

Warm intro-dismissed path:

- Artifact: `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-intro-dismissed-2026-03-09T22-32-15-440Z.json`
- LCP: `1272 ms`
- FCP: `1272 ms`
- Document TTFB: `494.4 ms`
- Total requests: `27`
- `like-state` `GET` requests: `5`
- `like-state` `OPTIONS` requests: `0`
- `visitor-count` `GET` requests: `0`

For comparison, the Phase 3 warm mobile artifacts were still showing:

- `69` total requests
- `21` `like-state` `GET` requests
- `21` `like-state` `OPTIONS` requests
- `2` `visitor-count` `GET` requests

Interpretation:

- The measured first-load network tax is materially lower after the first Phase 4 pass.
- The biggest win is the complete removal of the old per-card `like-state` preflight storm.
- Viewport-gated `like-state` loading reduced the default-path first-load `like-state` fetches from `21` to `4`, and the intro-dismissed path from `21` to `5`.
- Footer-only visitor-count work is now off the critical path in the measured mobile runs.
- Shared auth/session boot is still present, with `3` `GET /api/auth/get-session` requests and one anonymous sign-in `OPTIONS` plus `POST` in both warm runs, so that remains the clearest unresolved Phase 4 target if we continue pushing this phase.

## Phase 5 Verification Snapshot

### Local comparison status on 2026-03-09

Current local evidence is strong enough to say the major mobile regression path is fixed:

- default-path LCP improved from `20292 ms` in the 2026-03-07 baseline artifact to `1652 ms` in `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-default-2026-03-09T22-32-17-627Z.json`
- intro-dismissed-path LCP improved from `21544 ms` in the 2026-03-09 baseline artifact to `1272 ms` in `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-intro-dismissed-2026-03-09T22-32-15-440Z.json`
- hidden mobile image requests remain at `0`
- first-load `like-state` fan-out is down to `4` or `5` `GET`s with `0` preflights instead of `21` `GET`s plus `21` `OPTIONS`

### What is still not verified

- no fresh Lighthouse or PageSpeed run is recorded yet for mobile or desktop
- no fresh desktop verification run is recorded yet
- no fresh forced-reflow trace is recorded yet after the intro/consent/boot changes
- no live S3 metadata refresh has been performed for older screenshot objects
- the manual QA matrix is still pending

## Historical Baseline Notes

The notes below describe the pre-fix implementation that informed the original hypotheses. They are no longer the current code path after the Phase 2, Phase 3, and Phase 4 changes above.

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

Consent UI is also client-reconciled after mount and only opens the banner from an effect:

- [`apps/web/src/components/privacy/ConsentManager.tsx#L31`](/Users/adam/code/slop.haus/apps/web/src/components/privacy/ConsentManager.tsx#L31)

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

### 7. Each feed card fetches like state on mount

Every rendered `ProjectCard` calls `useLike(project.slug)`, which triggers a per-card SWR fetch for `/projects/{slug}/like-state`:

- [`apps/web/src/components/project/ProjectCard.tsx#L53`](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx#L53)
- [`apps/web/src/hooks/useLike.ts`](/Users/adam/code/slop.haus/apps/web/src/hooks/useLike.ts)

In the current local baseline, that produced a large first-load API fan-out on mobile:

- `20` preflights
- `20` fetches

This is now a concrete suspect, not just a generic "client boot might be heavy" guess.

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

### 2. `SlopGoo` is a confirmed contributor to the forced reflow signal

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
- Instrumented measurement now shows `SlopGoo` doing synchronous style/geometry work immediately before final LCP.

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
- [`apps/web/src/components/privacy/ConsentManager.tsx#L31`](/Users/adam/code/slop.haus/apps/web/src/components/privacy/ConsentManager.tsx#L31)
- [`apps/web/src/components/layout/VisitorCounter.tsx#L12`](/Users/adam/code/slop.haus/apps/web/src/components/layout/VisitorCounter.tsx#L12)
- [`apps/web/src/components/analytics/GoogleAnalytics.tsx#L52`](/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx#L52)

Why it fits the reported metrics:

- On slower CPUs and throttled networks, these extra tasks can push out first stable rendering without creating a catastrophic TBT number.
- The intro-dismissed scenario confirms that another client-only above-the-fold surface, the cookie banner, can become the late final LCP instead.

### 6. The feed SSR path is probably not the primary mobile bottleneck in the current local path

Confidence: low-medium

Why:

- The root page performs a server fetch for the feed on every request.
- That fetch is explicitly `cache: "no-store"`.
- Web and API are separate services, so the HTML path depends on an extra network hop.
- Local timing checks on 2026-03-09 measured:
  - `GET /`: about `205 ms` to first byte
  - direct feed API request: about `19 ms` to first byte

Relevant code:

- [`apps/web/src/app/page.tsx#L15`](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx#L15)
- [`apps/web/src/lib/server/feed.ts#L14`](/Users/adam/code/slop.haus/apps/web/src/lib/server/feed.ts#L14)

Why it fits the reported metrics:

- It is still a possible secondary concern in production or on cold paths.
- In the local measurements so far, it is nowhere near large enough to explain the observed mobile LCP.

### 7. Screenshot/upload responses may have weak cache headers, matching the `758 KiB` cache-lifetime warning

Confidence: high

Why:

- `/uploads/*` static serving does not currently show an explicit long-term cache policy.
- A live featured S3 screenshot was captured without any `Cache-Control` header.
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

After the first Phase 2 pass, the remaining highest-value suspects are:

1. Per-card `like-state` request + preflight fan-out on first render.
2. Hidden mobile screenshots still downloading because of raw `<img>` usage.
3. Weak caching on placeholder and live screenshot assets.
4. Any residual above-the-fold `SlopGoo` cost that remains after the first-paint deferral.

## Root Cause Status

Primary late-LCP cause fixed in the current local validation pass.

Current best working theory:

- Very-late client reconciliation of above-the-fold UI was the dominant local Phase 1 cause, and the first Phase 2 pass appears to have removed that delay.
- Hidden mobile images, weak cache headers, and card-level API fan-out now stand out as the next concrete bottlenecks.
- The local SSR/bootstrap path is still not supported as the primary cause.

## Remaining Validation Checks

1. Capture a post-Phase-2 trace and confirm the residual forced-reflow cost after intro `SlopGoo` deferral.
2. Move to Phase 3 and verify that hidden mobile image requests and cache-lifetime findings fall materially once image delivery is corrected.
3. Move to Phase 4 and verify that reducing `like-state` fan-out materially reduces early network and main-thread churn.

## Solution Direction (Updated)

The next implementation areas are now:

- Stop requesting hidden/offscreen screenshots on mobile and adopt real image optimization/lazy loading.
- Add explicit cache headers for static uploaded media.
- Reduce early card-level `like-state` network fan-out after first paint.
