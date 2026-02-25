# Google Tag (GA4) Implementation Plan

**Status:** In Progress  
**Last Updated:** 2026-02-25  
**Owner:** Web

## Overview

Add Google tag (GA4) to the Next.js app so we can collect pageview analytics with proper App Router route-change tracking.

## Current Codebase Findings

- No Google Analytics / Google Tag Manager code is currently present in web runtime files.
- Root app shell lives in `/Users/adam/code/slop.haus/apps/web/src/app/layout.tsx`; this is the correct global insertion point for tag loading.
- Global client wrappers are centralized in `/Users/adam/code/slop.haus/apps/web/src/app/providers.tsx`; no analytics provider currently exists.
- The existing visitor counter is not GA-backed:
  - Read endpoint: `/Users/adam/code/slop.haus/apps/api/src/routes/visitorCount.ts`
  - Increment path: `/Users/adam/code/slop.haus/apps/api/src/lib/auth.ts` (`incrementUniqueVisitorCounter`)
- Existing env contract includes `APP_URL`, `API_URL`, and `NEXT_PUBLIC_API_URL` but no analytics measurement ID.
- No CSP header configuration exists in `apps/web/next.config.ts`, so Google tag loading is not currently blocked by explicit script policies in this repo.

## Decisions Locked For Implementation

1. Implement GA4 directly via Google tag (`gtag.js`) rather than GTM for the first version.
2. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` as the single public config flag (empty/unset disables analytics safely).
3. Use a dedicated web analytics utility module to centralize `pageview` and optional custom event helpers.
4. In App Router, disable automatic pageview in `gtag('config', ...)` and manually send pageviews on route changes to avoid duplicate counting.
5. Keep existing visitor counter behavior unchanged; GA is additive and independent.

## Phase Summary

| Phase | Name | Status | Description |
| --- | --- | --- | --- |
| 1 | [Env Contract + Analytics Utility](./phase-1-env-contract-and-analytics-utility.md) | Completed | Added GA measurement env contract and shared client-safe helper functions |
| 2 | [Tag Injection + SPA Pageview Tracking](./phase-2-tag-injection-and-route-tracking.md) | Implemented (Pending Runtime QA) | Google tag is wired globally and route tracking is implemented in App Router |
| 3 | [Verification + Rollout](./phase-3-verification-and-rollout.md) | Not Started | Validate local/prod behavior and complete deployment checklist |

## Dependency Graph

```text
Phase 1 (env + helper)
  -> Phase 2 (layout script + route tracking)
    -> Phase 3 (verification + rollout)
```

## Open Questions / Risks

- Consent requirements are not implemented in current web app. If policy/legal scope requires consent-gated analytics, Phase 2 must gate tag initialization behind consent state.
- GA4 real-time validation depends on deployment env var setup; local-only validation is not sufficient.

## Success Criteria

- Google tag only loads when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is configured.
- Initial page load and subsequent client-side navigations emit exactly one pageview each.
- No runtime errors occur when analytics env var is unset.
- Existing app behavior (auth, visitor counter, submit flows) remains unchanged.
