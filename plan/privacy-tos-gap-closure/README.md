# Privacy/ToS Gap Closure Plan

**Status:** In Progress  
**Last Updated:** 2026-02-27  
**Owner:** Product + Web + API

## Goal
Close the highest-priority legal-policy implementation gaps identified in `POLICY_TOS_SOURCE_OF_TRUTH.md` so Privacy Policy and ToS can be finalized and kept aligned with production behavior.

## Scope
- Account/data deletion commitments and retention timelines.
- OAuth token security posture and auth-lifecycle handling.
- Public/private visibility consistency and legal-process runbooks.
- Consent-operations governance and regression safeguards.

## Phase Summary

| Phase | File | Status | Goal |
| --- | --- | --- | --- |
| 1 | `phase-1-deletion-retention-commitments.md` | In Progress | Define deletion behavior and enforceable retention schedule |
| 2 | `phase-2-token-security-auth-lifecycle.md` | Not Started | Lock token storage/revocation/security commitments |
| 3 | `phase-3-visibility-moderation-legal-process.md` | Not Started | Align product visibility behavior + moderation/legal operations |
| 4 | `phase-4-consent-ops-and-regression-guards.md` | Not Started | Operationalize consent-region governance and anti-regression checks |

## Launch-Blocking Checklist
- [ ] Account deletion behavior is documented and implemented.
- [ ] Retention durations are defined for DB/logs/storage/backups.
- [ ] OAuth token handling and revocation commitments are finalized.
- [ ] API/public visibility rules match legal text.
- [ ] Legal request + DMCA response process is documented.
- [ ] Consent-region/copy ownership and regression checks are in place.

## Execution Notes
- Keep this plan short and operational.  
- Update phase statuses as work lands.  
- If a decision cannot be made from code alone, record decision owner and due date in the relevant phase file.

