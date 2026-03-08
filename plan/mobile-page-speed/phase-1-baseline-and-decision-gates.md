# Phase 1: Baseline + Decision Gates

**Status:** In Progress  
**Owner:** Web  
**Depends On:** None

## Goal

Turn the current hypotheses into confirmed constraints before changing runtime behavior. This phase should tell us:

1. What the actual mobile LCP element is.
2. Whether hidden feed thumbnails are really being requested on mobile.
3. Whether uploaded media headers are weak enough to explain the cache-lifetime audit.
4. Whether the `web -> api` SSR bootstrap path is materially contributing to first paint.
5. Which specific Phase 2 and Phase 3 strategies should be treated as locked.

## Files To Change

- [/Users/adam/code/slop.haus/debug/feed-mobile-pagespeed-discrepancy.md](/Users/adam/code/slop.haus/debug/feed-mobile-pagespeed-discrepancy.md)
- [/Users/adam/code/slop.haus/.env.example](/Users/adam/code/slop.haus/.env.example)
- [/Users/adam/code/slop.haus/.gitignore](/Users/adam/code/slop.haus/.gitignore)
- [/Users/adam/code/slop.haus/README.md](/Users/adam/code/slop.haus/README.md)
- [/Users/adam/code/slop.haus/package.json](/Users/adam/code/slop.haus/package.json)
- `/Users/adam/code/slop.haus/scripts/open-project-chrome.mjs` (new)
- possible temporary investigation-only touches in:
  - [/Users/adam/code/slop.haus/apps/web/src/app/page.tsx](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx)
  - [/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx)
  - [/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx)
  - [/Users/adam/code/slop.haus/apps/api/src/index.ts](/Users/adam/code/slop.haus/apps/api/src/index.ts)

## Tasks

1. Reproduce the current PSI/Lighthouse baseline for `/` and record exact run dates plus whether intro was visible or dismissed.
2. Capture a Chrome Performance trace under mobile throttling and identify:
   - the final LCP element
   - when that element first becomes eligible
   - whether hydration or layout-measurement work delays it
3. Use DevTools Network to confirm whether feed thumbnails that are hidden by `hidden sm:block` are still requested on mobile.
4. Inspect one or more real screenshot/upload responses and record actual `Cache-Control` behavior.
5. Compare timing for:
   - document request for `/`
   - server feed bootstrap request from `web` to `api`
   - image/media requests used by first-page cards
6. Add repo-local Chrome tooling so Phase 1 measurements always use a dedicated project browser profile and machine-local Chrome binary path from env.
7. Update the debug doc with confirmed findings and convert any disproven hypotheses into explicit non-causes.
8. Lock the implementation choices needed for later phases:
   - intro/LCP strategy
   - `SlopGoo` first-paint strategy
   - image optimization strategy
   - cache-header strategy
   - whether SSR feed caching needs to change in Phase 4

## Decision Gates

Before Phase 2 starts, we should be able to answer all of these:

1. Is the mobile LCP usually the intro heading/card, a feed card, or a feed image?
2. Does `SlopGoo` account for most of the current forced-reflow cost?
3. Are hidden list thumbnails actually requested on mobile?
4. Are screenshot/upload URLs immutable enough for `immutable` caching, or do they require shorter TTLs?
5. Is server/bootstrap latency large enough to justify rethinking `cache: "no-store"`?

## Design Notes

- Do not merge permanent instrumentation that changes feed behavior unless it is still useful after the investigation.
- If the LCP element changes materially depending on intro dismissed vs not dismissed, note both states explicitly because Phase 2 may need separate handling.
- Use absolute measurements and dates in the updated debug doc so later comparison is unambiguous.
- Phase 1 tooling should not depend on a developer's personal Chrome profile. A repo-local `user-data-dir` is the default.

## Code Snippets

```ts
// Example decision output from this phase (conceptual)
type MobileLcpStrategy =
  | "intro-cookie-backed-ssr"
  | "feed-first-mobile-layout"
  | "image-priority-optimization";
```

```ts
// Investigation-only performance marker example (conceptual)
performance.mark("feed-hydrated");
performance.mark("intro-mounted");
```

## Verification Checklist

- [ ] Mobile baseline is recorded with date, URL, and intro/slop state.
- [ ] LCP element identity is confirmed from a real trace.
- [ ] Hidden-thumbnail request behavior is confirmed from Network.
- [ ] Screenshot/upload cache headers are recorded from a real response.
- [ ] SSR bootstrap timing is measured well enough to decide whether Phase 4 should include caching changes.
- [x] Repo-local Chrome launcher is available and uses env-backed binary/profile configuration.
- [ ] Debug doc is updated from hypothesis-only to confirmed/ruled-out findings.

## Exit Criteria

- Phase 2 and Phase 3 have concrete inputs, not just hypotheses.
- The dominant mobile performance bottlenecks are narrowed to a small, defensible set.
- We can describe the intended implementation strategy without hand-waving around the actual LCP candidate.
- Phase 1 measurement tooling is reproducible on another machine with only `.env` changes.

## Progress Notes

- 2026-03-07: Began Phase 1 by standardizing Chrome launch configuration around env-backed binary resolution and a project-local user-data directory.
- 2026-03-07: Added `pnpm chrome:project`, `scripts/open-project-chrome.mjs`, `.env` / `.env.example` Chrome vars, and `.chrome/` gitignore coverage. Smoke-tested the launcher path with a non-GUI stub binary to verify env/profile resolution.
