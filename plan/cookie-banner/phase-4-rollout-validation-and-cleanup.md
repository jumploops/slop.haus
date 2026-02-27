# Phase 4: Rollout Validation and Cleanup

**Status:** Not Started  
**Owner:** Web + Product  
**Depends On:** Phases 1-3

## Goal
Validate production behavior end-to-end, then remove temporary debugging scaffolding and finalize launch readiness.

## Files To Change
- `/Users/adam/code/slop.haus/apps/web/src/middleware.ts`
- `/Users/adam/code/slop.haus/design/geo-cookie-consent-banner.md` (status update + any final clarifications)
- `/Users/adam/code/slop.haus/PROGRESS.md` (optional)

## Tasks
1. Run controlled validation in production-like environment:
   - required country simulation/check,
   - non-required country check,
   - missing-geo browser-like check,
   - missing-geo non-browser/background check.
2. Confirm no GA initialization pre-consent in required flows.
3. Confirm non-required default GA ON behavior.
4. Confirm `Privacy choices` can revoke and persist analytics preference.
5. Remove temporary `[geo-debug]` logging and any temporary instrumentation added for discovery.
6. Keep emergency global-banner flag available for early launch window.

## Validation Matrix
- Scenario A: `cf-ipcountry=US`, no consent -> no banner, GA ON.
- Scenario B: `cf-ipcountry=DE`, no consent -> banner shown, GA OFF.
- Scenario C: browser-like request with missing country -> banner shown, GA OFF.
- Scenario D: bot/healthcheck-like request with missing country -> no banner workflow.
- Scenario E: required region accept -> GA ON.
- Scenario F: required/non-required user revokes -> GA OFF going forward.

## Verification Checklist
- [ ] All matrix scenarios verified in logs/browser devtools.
- [ ] No unexpected console/runtime errors.
- [ ] Temporary geo-debug logging removed.
- [ ] Feature flags documented for operations handoff.

## Exit Criteria
- Launch-ready consent workflow with validated behavior and no temporary debug noise.
