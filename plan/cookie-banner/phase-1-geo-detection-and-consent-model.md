# Phase 1: Geo Detection and Consent Model

**Status:** Completed (2026-02-27)  
**Owner:** Web  
**Depends On:** None

## Implementation Notes
- Added `apps/web/src/lib/privacy/geo.ts` with:
  - EEA + UK + CH consent-required country detection
  - country normalization and unknown handling
  - browser-like request detection (`sec-fetch-dest=document` primary, `GET+Accept:text/html` fallback)
  - `_rsc` and prefetch exclusions
- Added `apps/web/src/lib/privacy/consent.ts` with:
  - consent context cookie serialization/parsing
  - client-side consent state serialization/parsing
  - rollout flags (`enabled`, `force global`, `policy version`)
- Replaced temporary web middleware log-only behavior with:
  - browser-like request classification
  - geo consent-required evaluation
  - `slop_consent_context` cookie emission for client consumption
  - enriched temporary `[geo-debug]` log line including `consent-required`
- Added rollout env/docs entries:
  - `.env.example`
  - `README.md`

## Goal
Define and implement the deterministic decision model for:
- whether a request is browser-like,
- whether consent is required by geo,
- what initial analytics behavior should be,
- how consent state is persisted client-side.

## Files To Change
- `/Users/adam/code/slop.haus/apps/web/src/middleware.ts`
- `/Users/adam/code/slop.haus/apps/web/src/lib/privacy/geo.ts` (new)
- `/Users/adam/code/slop.haus/apps/web/src/lib/privacy/consent.ts` (new)
- `/Users/adam/code/slop.haus/.env.example`
- `/Users/adam/code/slop.haus/README.md`

## Tasks
1. Add geo/region helper module with:
   - consent-required country set (EEA + `GB` + `CH`),
   - `isConsentRequiredCountry(code)` helper,
   - normalization for unknown/missing values.
2. Add browser-like request helper with locked rule:
   - include if `sec-fetch-dest=document`,
   - fallback include if `GET` + `Accept` contains `text/html`,
   - exclude `_rsc` and prefetch requests.
3. Convert temporary middleware from logging-only into classification middleware that emits minimal client-consumable context (cookie and/or response header) for page requests.
4. Define client consent schema constants and parser/validator:
   - `analytics`, `timestamp`, `policyVersion`, optional `countryCodeAtDecision`, `decisionSource`.
5. Add runtime flags for safe rollout:
   - enable/disable banner,
   - force global banner mode (kill switch).

## Operational Notes
- Keep middleware behavior deterministic and side-effect light.
- No DB writes for this phase.
- Keep geo-debug logging temporarily, but rate-limit/scope it if noisy.

## Conceptual Snippet
```ts
if (isBrowserLikeRequest(req)) {
  const country = getCountry(req.headers.get("cf-ipcountry"));
  const required = isConsentRequiredCountry(country) || isUnknown(country);
  setConsentContext(required, country);
}
```

## Verification Checklist
- [x] Browser-like detection matches approved rule.
- [x] Missing/unknown geo is marked consent-required only for browser-like requests.
- [x] Non-browser/background requests bypass consent classification.
- [x] Consent schema parser handles invalid/old local values safely.
- [x] New flags documented in `.env.example` + README.
- [x] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria
- App has a single source of truth for geo-required consent decisions.
- Client code can read stable consent context without DB dependency.
