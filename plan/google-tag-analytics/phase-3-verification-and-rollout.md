# Phase 3: Verification + Rollout

**Status:** Not Started  
**Owner:** Web  
**Depends On:** Phase 2

## Goal

Verify implementation quality end-to-end and complete deployment/runtime setup so GA4 data appears in production.

## Files To Change

- `/Users/adam/code/slop.haus/PROGRESS.md` (optional status note after implementation)
- `/Users/adam/code/slop.haus/TODO.md` (only if follow-up analytics work is intentionally deferred)

## Tasks

1. Run typecheck for web package.
2. Validate local behavior with and without `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
3. Deploy with production measurement ID set in hosting environment.
4. Verify in GA4 Realtime dashboard:
   - initial pageview recorded
   - navigation between multiple app routes recorded
5. Record any follow-up gaps (consent gating, custom events, UTM/campaign reporting) as explicit backlog items.

## Manual QA Checklist

- [ ] Load home page and one detail page; both pageviews appear in GA4 Realtime.
- [ ] Navigate using in-app links (no full reload) and confirm new pageview per route.
- [ ] Browser console has no `gtag` or hydration errors.
- [ ] Build/runtime behavior is unchanged for auth and visitor counter widgets.

## Exit Criteria

- Production environment is emitting pageviews to the intended GA4 property.
- Verification steps are documented and repeatable for future regressions.
