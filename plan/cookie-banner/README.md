# Cookie Banner Implementation Plan

**Status:** In Progress  
**Last Updated:** 2026-02-27  
**Owner:** Web + Product

## Overview
Implement a geo-based cookie consent system for GA4 that:
- requires opt-in in EEA/UK/CH,
- defaults GA ON in non-required regions,
- treats missing geo as consent-required for browser-like page requests,
- keeps strictly necessary cookies always enabled,
- stores launch consent state client-side only.

This plan implements the approved design in:
- `/Users/adam/code/slop.haus/design/geo-cookie-consent-banner.md`
- `/Users/adam/code/slop.haus/design/privacy-consent-launch-minimum.md`

## Locked Decisions
1. Region scope for consent-required: EEA + UK + Switzerland.
2. Geo source: `cf-ipcountry`.
3. Missing/unknown geo handling:
   - browser-like page requests -> consent-required,
   - non-browser/background requests -> skip consent workflow.
4. Non-required regions: GA ON by default.
5. Consent record: client-only for launch.
6. No new DB tables/migrations for consent.
7. Browser-like detection rule:
   - primary: `sec-fetch-dest=document`
   - fallback: `GET` + `Accept` includes `text/html`
   - exclusions: `_rsc`, prefetch requests.

## Phase Summary

| Phase | File | Status | Goal |
| --- | --- | --- | --- |
| 1 | `phase-1-geo-detection-and-consent-model.md` | Completed | Formalize geo + browser-like detection, feature flags, and client consent schema |
| 2 | `phase-2-banner-ui-and-preferences-entrypoint.md` | Completed | Implement banner/preferences UX and persistent `Privacy choices` entrypoint |
| 3 | `phase-3-ga-gating-and-consent-mode.md` | Completed | Gate GA loading/collection based on region + consent state |
| 4 | `phase-4-rollout-validation-and-cleanup.md` | Not Started | Validate production behavior and remove temporary geo debug logging |

## Dependency Graph

```text
Phase 1 (geo detection + consent model)
  -> Phase 2 (UI + preferences)
    -> Phase 3 (GA gating)
      -> Phase 4 (rollout + cleanup)
```

## Key Risks
- False positives/negatives in browser-like request detection.
- Missing geo headers on real user traffic causing over-prompting.
- GA accidentally firing before consent in required regions.
- Regressions from root-layout/provider wiring.

## Success Criteria
- Banner appears only when required by approved geo policy.
- GA does not initialize before consent in required/unknown-browser flows.
- GA initializes by default in non-required regions when no opt-out exists.
- `Privacy choices` is globally available and can revoke analytics.
- Necessary cookies continue functioning regardless of analytics choice.
- Temporary `[geo-debug]` logging is removed after verification window.

## Verification Checklist
- [ ] Region classification logic matches approved rule set.
- [ ] Browser-like detection excludes `_rsc` and prefetch requests.
- [ ] Consent UI blocks GA in required flows until opt-in.
- [ ] Non-required regions default to GA ON.
- [ ] Revocation path disables future analytics collection.
- [ ] Footer `Privacy choices` entrypoint is visible and functional.
- [ ] Temporary geo debug logger removed before completion.
