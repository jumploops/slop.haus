# Phase 4: Consent Ops + Regression Guards

**Status:** Not Started  
**Owner:** Web + Product  
**Depends On:** Phase 3

## Goal
Operationalize ongoing consent governance so policy remains accurate as regions/copy/features evolve.

## Deliverables
1. Consent-ops ownership model (who approves geo scope and copy changes).
2. Policy-version bump procedure for consent text/material changes.
3. Regression checklist/test plan proving GA stays consent-gated in required regions.

## Checklist
- [ ] Assign owner for consent region list and review cadence.
- [ ] Define when to bump `NEXT_PUBLIC_COOKIE_BANNER_POLICY_VERSION`.
- [ ] Add release checklist items:
  - required-region flow (no GA before accept)
  - non-required flow (default GA ON unless rejected)
  - reject/revoke behavior
- [ ] Define fallback behavior for missing geo headers and monitor exceptions.
- [ ] Document emergency rollback/override usage (`NEXT_PUBLIC_COOKIE_BANNER_FORCE_GLOBAL`).

## Exit Criteria
- Consent governance is documented and repeatable.
- Pre-release checks prevent accidental analytics pre-consent regressions.

