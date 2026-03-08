# Mobile Page Speed Implementation Plan

**Status:** Planned  
**Last Updated:** 2026-03-07  
**Owner:** Web + API

## Overview

Improve mobile performance for the root feed page at `/` based on the investigation in [debug/feed-mobile-pagespeed-discrepancy.md](/Users/adam/code/slop.haus/debug/feed-mobile-pagespeed-discrepancy.md).

Current PageSpeed gap called out in the investigation:

| Metric | Mobile | Desktop |
| --- | --- | --- |
| First Contentful Paint | 2.2 s | 0.3 s |
| Largest Contentful Paint | 7.2 s | 1.4 s |
| Total Blocking Time | 200 ms | 40 ms |
| Cumulative Layout Shift | 0 | 0.126 |
| Speed Index | 5.1 s | 0.9 s |

The current working theory is:

1. The dominant mobile LCP candidate is likely gated by post-hydration intro rendering.
2. `SlopGoo` is the strongest forced-reflow suspect above the fold.
3. Feed screenshots may be downloading on mobile even when hidden by CSS.
4. Screenshot delivery and cache headers likely contribute to the `Use efficient cache lifetimes` warning.
5. Non-critical client boot work may be competing with initial paint on slower mobile devices.

This plan keeps scope centered on the root feed and shared feed-card surfaces first. It does not treat broad bundle modernization or whole-site redesign as part of this effort.

## Working Decisions

1. Treat `/` mobile performance as the primary optimization target for the first pass.
2. Start by confirming the actual LCP element, request waterfall, and cache/header behavior before locking implementation details.
3. Prefer SSR/HTML-first fixes for above-the-fold rendering over additional client-side timing workarounds.
4. Treat non-visible mobile image requests as bugs, not acceptable tradeoffs.
5. Decorative effects may be deferred, simplified, or disabled on initial mobile paint if they materially harm performance.
6. Add explicit cache policy for uploaded/static media if current headers are weak.
7. Defer non-critical auth, analytics, and visitor-counter work until after first paint whenever correctness allows it.
8. Only change server-side feed caching semantics if traces show the `web -> api` path is a meaningful contributor to first paint and the freshness tradeoff is acceptable.

## Phase Summary

| Phase | Name | Status | Description |
| --- | --- | --- | --- |
| 1 | [Baseline + Decision Gates](./phase-1-baseline-and-decision-gates.md) | In Progress | Confirm LCP element, reflow source, image requests, cache headers, and server timing before implementation |
| 2 | [Above-the-Fold LCP + Reflow Reduction](./phase-2-above-the-fold-lcp-and-reflow.md) | Planned | Remove hydration-gated LCP behavior and reduce or defer expensive above-the-fold measurement/effects |
| 3 | [Image Delivery + Cache Policy](./phase-3-image-delivery-and-cache-policy.md) | Planned | Stop hidden mobile image requests, optimize feed thumbnails, and harden screenshot caching |
| 4 | [Non-Critical Boot + Server Path](./phase-4-non-critical-boot-and-server-path.md) | Planned | Defer startup work that is not needed for first paint and revisit feed SSR fetch strategy if measured server latency warrants it |
| 5 | [Verification + Regression Guardrails](./phase-5-verification-and-regression-guardrails.md) | Planned | Re-run PSI/trace/network checks, complete QA matrix, and document final outcomes |

## Dependency Graph

```text
Phase 1 (Baseline + Decision Gates)
  -> Phase 2 (Above-the-Fold LCP + Reflow)
    -> Phase 3 (Image Delivery + Cache Policy)
      -> Phase 4 (Non-Critical Boot + Server Path)
        -> Phase 5 (Verification + Regression Guardrails)
```

## Non-Goals

- Rewriting the entire feed architecture beyond what is needed for performance.
- Broad JavaScript modernization work unrelated to measured root-cause findings.
- Whole-site image optimization outside the feed and directly shared components in the first pass.
- Large visual redesigns of the feed, header, or brand chrome.
- Trading correctness or product-critical auth behavior for synthetic benchmark gains.

## Success Criteria

- The dominant mobile LCP candidate is available in initial HTML or otherwise no longer hydration-gated.
- The current forced-reflow signal is materially reduced and the dominant source is understood.
- Hidden/non-visible mobile feed thumbnails are no longer requested during initial load.
- Screenshot/static media caching is improved enough to remove or significantly reduce the current cache-lifetime audit.
- Mobile FCP and LCP improve materially from the 2026-03-06 baseline without introducing new feed regressions.
- No new mobile or desktop CLS regressions are introduced.
- Final implementation passes:
  - `pnpm -F @slop/web run lint`
  - `pnpm -F @slop/web exec tsc --noEmit`
  - `pnpm -F @slop/api exec tsc --noEmit`

## Release Notes Target

The final implementation should leave behind:

1. Updated debug findings with confirmed causes.
2. A concise before/after performance summary with exact dates and metrics.
3. A clear statement of any intentional tradeoffs, especially around slop effects or cache freshness.
