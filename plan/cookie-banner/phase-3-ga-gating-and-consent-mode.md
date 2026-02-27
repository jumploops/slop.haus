# Phase 3: GA Gating and Consent Mode

**Status:** Completed (2026-02-27)  
**Owner:** Web  
**Depends On:** Phases 1 and 2

## Implementation Notes
- Updated analytics runtime in `apps/web/src/components/analytics/GoogleAnalytics.tsx`:
  - consent-aware initialization using geo context + client consent state
  - GA script rendered only when analytics is currently enabled
  - pageview dispatch blocked when analytics disabled
  - listeners for consent updates (`slop:cookie-consent-updated`) and cross-tab storage changes
- Extended `apps/web/src/lib/analytics/gtag.ts` with:
  - `setAnalyticsCollectionEnabled()` via `ga-disable-*` flag
  - `setAnalyticsConsent()` consent-mode update helper
  - `canTrack()` now respects runtime analytics disable flag
- Extended `apps/web/src/lib/privacy/consent.ts` with:
  - `resolveAnalyticsEnabled()` shared decision helper
  - consent update event constant and emitter for runtime sync
- Updated `ConsentManager` to emit consent change events immediately on commit.

## Goal
Enforce analytics runtime behavior from consent decisions:
- required regions/unknown-browser: GA OFF until explicit accept,
- non-required regions: GA ON by default,
- revocation path disables future analytics collection.

## Files To Change
- `/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/lib/analytics/gtag.ts`
- `/Users/adam/code/slop.haus/apps/web/src/components/privacy/ConsentManager.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/lib/privacy/consent.ts`

## Tasks
1. Add consent-aware gate around GA script initialization.
2. Integrate Google Consent Mode defaults and update calls:
   - initialize with denied analytics where required before consent,
   - update to granted on accept,
   - update to denied on revoke.
3. Ensure pageview dispatch happens only when analytics is enabled.
4. Preserve non-required region default (`GA ON`) unless user explicitly opts out through preferences.
5. Ensure GA env guard remains safe when measurement ID is unset.

## Implementation Notes
- Avoid duplicate script insertion or duplicate pageviews on route transitions.
- Keep behavior deterministic across hydration and client-side navigation.
- Ensure consent changes apply without full hard reload when possible.

## Conceptual Snippet
```ts
if (analyticsEnabled) {
  loadGtagScript();
  sendPageview(currentPath);
} else {
  disableAnalyticsCollection();
}
```

## Verification Checklist
- [x] In required/unknown-browser flows, GA does not initialize pre-consent.
- [x] Accept action enables analytics and route pageviews.
- [x] Reject/revoke action prevents future analytics events.
- [x] Non-required flows initialize GA by default.
- [x] No runtime errors when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset.
- [x] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria
- GA behavior exactly matches policy matrix across all consent states.
