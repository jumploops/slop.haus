# Phase 5: Verification + Regression Guardrails

**Status:** In Progress  
**Owner:** Web + API  
**Depends On:** Phase 4

## Goal

Verify that the implemented changes actually improved mobile performance, did not regress desktop behavior, and are documented well enough to avoid repeating the same investigation later.

## Files To Change

- [/Users/adam/code/slop.haus/debug/feed-mobile-pagespeed-discrepancy.md](/Users/adam/code/slop.haus/debug/feed-mobile-pagespeed-discrepancy.md)
- [/Users/adam/code/slop.haus/plan/mobile-page-speed/README.md](/Users/adam/code/slop.haus/plan/mobile-page-speed/README.md)
- [/Users/adam/code/slop.haus/plan/mobile-page-speed/deferred-work.md](/Users/adam/code/slop.haus/plan/mobile-page-speed/deferred-work.md)
- possible summary doc touch:
  - [/Users/adam/code/slop.haus/PR_SUMMARY.md](/Users/adam/code/slop.haus/PR_SUMMARY.md)
- any small cleanup in implementation files touched by earlier phases

## Tasks

1. Re-run PageSpeed/Lighthouse for `/` on mobile and desktop and record exact dates plus environment details.
2. Capture a new mobile performance trace and confirm:
   - actual LCP element and timestamp
   - reduced forced reflow
   - reduced first-load main-thread churn
   - no late fallback from intro to consent banner when intro is dismissed
3. Re-run Network validation and confirm:
   - hidden mobile thumbnails are not requested
   - screenshot/upload cache headers are present and correct for the asset generation path being validated
   - any historical S3 screenshot still used for verification has been refreshed or explicitly called out as pre-fix metadata
4. Compare before/after metrics against the baseline recorded in Phase 1.
5. Run manual QA for:
   - intro visible
   - intro dismissed
   - slop mode on/off
   - mobile list/grid modes
   - desktop feed behavior
6. Run static verification:
   - `pnpm -F @slop/web run lint`
   - `pnpm -F @slop/web exec tsc --noEmit`
   - `pnpm -F @slop/api exec tsc --noEmit`
7. Update docs with final confirmed outcomes, remaining limitations, and any follow-up work intentionally deferred.

## Progress Notes

- 2026-03-09: Local mobile before/after comparison is now strong enough to start Phase 5 documentation:
  - baseline default artifact `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-2026-03-08T01-18-04-638Z.json`
  - baseline intro-dismissed artifact `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-intro-dismissed-2026-03-09T08-47-54-360Z.json`
  - current default artifact `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-default-2026-03-09T22-32-17-627Z.json`
  - current intro-dismissed artifact `/Users/adam/code/slop.haus/.chrome/measurements/mobile-feed-intro-dismissed-2026-03-09T22-32-15-440Z.json`
- 2026-03-09: Current local mobile comparison:
  - default-path LCP improved from `20292 ms` to `1652 ms`
  - default-path FCP is now `1652 ms`, with the above-the-fold LCP candidate present in the initial render window instead of appearing as a very-late client-only reveal
  - intro-dismissed-path LCP improved from `21544 ms` to `1272 ms`
  - hidden mobile image requests remain at `0`
  - first-load `like-state` fan-out fell from `21 GET + 21 OPTIONS` to `4 GET + 0 OPTIONS` on the default path and `5 GET + 0 OPTIONS` on the intro-dismissed path
- 2026-03-09: Static verification status:
  - `pnpm -F @slop/web run lint` passes with `0` errors and warnings only
  - `pnpm -F @slop/web exec tsc --noEmit` passes
  - `pnpm -F @slop/api exec tsc --noEmit` passes
  - `pnpm -F @slop/worker exec tsc --noEmit` passes
- 2026-03-09: Remaining gaps before Phase 5 can be considered complete:
  - no fresh Lighthouse or PSI rerun is recorded yet
  - no desktop verification pass is recorded yet
  - no fresh forced-reflow trace is recorded yet
  - no live S3 metadata refresh has been performed for older screenshot objects
  - manual QA matrix is still pending

## Manual QA Matrix

- `/` on mobile viewport, intro visible
- `/` on mobile viewport, intro dismissed
- `/` on mobile viewport, intro dismissed and consent required
- `/` on mobile viewport, slop mode on
- `/` on mobile viewport, slop mode off
- `/` on desktop viewport
- slow 4G / CPU throttling
- real screenshot cards
- placeholder-image cards

## Performance Targets

These are guidance targets, not hard release gates:

1. Mobile LCP should improve materially from the 7.2 s baseline.
2. Mobile FCP should improve materially from the 2.2 s baseline.
3. Forced-reflow cost should be clearly reduced or eliminated as a top insight.
4. Cache-lifetime audit should be resolved or substantially reduced.
5. The final mobile LCP should no longer be an above-the-fold client-only paragraph that appears after startup reconciliation.
6. Desktop should not regress meaningfully while mobile improves.

## Design Notes

- Use exact dates in the final comparison table so future regressions are anchored to a known checkpoint.
- If one hypothesis turns out not to matter after implementation, record that explicitly instead of silently dropping it.
- Keep any known remaining issue separate from shipped improvements so follow-up work is easy to scope.

## Code Snippets

```md
| Metric | Baseline (2026-03-06) | After Phase 5 | Delta |
| --- | --- | --- | --- |
| Mobile LCP | 7.2 s | ... | ... |
```

## Verification Checklist

- [ ] Before/after PSI or Lighthouse results are recorded with dates.
- [ ] Trace confirms the intended LCP/reflow improvements actually occurred.
- [x] Trace confirms intro-visible and intro-dismissed flows both avoid the late client-only LCP path seen in Phase 1.
- [ ] Network validation confirms image-request and cache-header fixes.
- [ ] Desktop behavior remains acceptable.
- [x] Lint and typecheck pass.
- [ ] Plan and debug docs are updated with final outcomes and remaining risks.

## Exit Criteria

- The mobile performance work is validated end to end.
- Remaining issues, if any, are documented as explicit follow-ups rather than hidden unknowns.
- The repo has a durable paper trail for why the chosen changes were made and what they improved.
